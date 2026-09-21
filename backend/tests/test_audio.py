"""
Tests sur la VRAIE chaîne d'extraction (librosa + pyin), avec des signaux
synthétiques construits ici. C'est le test que le bug de `piptrack` n'a
jamais eu : les anciens tests fabriquaient un sinus et ne vérifiaient rien
de la hauteur.

Invariants mesurés le 21/09/2026 et gardés ici :
  - même cri à 0 / −12 / −26 dB → même porte, même mot ;
  - bruit blanc (télé), musique 220 Hz, voix grave → refusés ;
  - bruit rose à 10 dB de rapport signal/bruit → toujours accepté, même mot ;
  - la hauteur mesurée est la fondamentale, pas une harmonique.

Lancer :  cd backend && .venv/bin/python tests/test_audio.py
"""

import os
import sys
import tempfile
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from audio_analysis import FEATURE_VERSION, extract_features  # noqa: E402
from triage_rules import intensity_observation, recording_gate  # noqa: E402

SR = 22050


def _write_wav(y: np.ndarray) -> str:
    fd, path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    pcm = (np.clip(y, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return path


def _features(y: np.ndarray) -> dict:
    path = _write_wav(y)
    try:
        return extract_features(path)
    finally:
        os.remove(path)


def cry(sec=8.0, f0=450.0, harmonics=5, am=3.0, gain=1.0) -> np.ndarray:
    """Cri synthétique : fondamentale + harmoniques décroissantes, salves à 3 Hz,
    pause de 1,5 s au milieu. La 2e harmonique est volontairement forte."""
    t = np.linspace(0, sec, int(SR * sec), endpoint=False)
    y = sum((0.6 / k) * np.sin(2 * np.pi * f0 * k * t) for k in range(1, harmonics + 1))
    y = y * np.clip(0.55 + 0.45 * np.sin(2 * np.pi * am * t), 0, 1)
    s, n = int(SR * 3.5), int(SR * 1.5)
    y[s:s + n] = 0
    return (gain * 0.5 * y / np.max(np.abs(y))).astype(np.float32)


def pink(n: int, seed=0) -> np.ndarray:
    x = np.random.default_rng(seed).standard_normal(n)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(n); f[0] = 1
    return np.fft.irfft(X / np.sqrt(f), n).astype(np.float32)


def with_snr(y: np.ndarray, noise: np.ndarray, snr_db: float) -> np.ndarray:
    k = np.sqrt(np.mean(y ** 2) / (np.mean(noise ** 2) * 10 ** (snr_db / 10)))
    return (y + k * noise).astype(np.float32)


def test_feature_version_and_keys():
    f = _features(cry())
    assert f["feature_version"] == FEATURE_VERSION == 2
    for k in ("voiced_fraction", "pitch_median_hz", "duration_seconds"):
        assert k in f


def test_pitch_is_the_fundamental_not_a_harmonic():
    f = _features(cry(f0=420.0))
    assert 400 <= f["pitch_median_hz"] <= 440, f["pitch_median_hz"]       # piptrack renvoyait ~840
    f = _features(cry(f0=320.0))
    assert 300 <= f["pitch_median_hz"] <= 340, f["pitch_median_hz"]


def test_gain_invariance():
    """−26 dB = tenir le téléphone bien plus loin. Le mot ne doit pas changer."""
    results = []
    for gain_db in (0, -12, -26):
        f = _features(cry(gain=10 ** (gain_db / 20)))
        ok, code, _ = recording_gate(f)
        results.append((ok, code, intensity_observation(f)["level"], round(f["voiced_fraction"], 2)))
    assert all(ok for ok, _, _, _ in results), results
    assert len({lvl for _, _, lvl, _ in results}) == 1, results
    assert max(v for *_, v in results) - min(v for *_, v in results) < 0.05, results


def test_background_noise_does_not_inflate_intensity():
    base = _features(cry())
    noisy = _features(with_snr(cry(), pink(int(SR * 8.0)), 10))
    assert recording_gate(noisy)[0]
    assert intensity_observation(noisy)["level"] == intensity_observation(base)["level"]


def test_non_cries_are_refused():
    t = np.linspace(0, 8, int(SR * 8), endpoint=False)
    tv = (0.02 * np.random.default_rng(1).standard_normal(int(SR * 10))).astype(np.float32)
    music = (0.4 * (np.sin(2 * np.pi * 220 * t) + 0.5 * np.sin(2 * np.pi * 440 * t) + 0.3 * np.sin(2 * np.pi * 660 * t))).astype(np.float32)
    voice = (0.4 * sum((1 / k) * np.sin(2 * np.pi * 120 * k * t) for k in range(1, 8)) * (0.6 + 0.4 * np.sin(2 * np.pi * 4 * t))).astype(np.float32)
    for label, y in (("télé", tv), ("musique 220 Hz", music), ("voix grave", voice)):
        ok, code, _ = recording_gate(_features(y))
        assert not ok and code == "no_cry_detected", (label, code)


def test_amplitude_never_reaches_a_decision():
    """Les grandeurs d'amplitude existent (information) mais ne pèsent sur rien."""
    f = _features(cry())
    f2 = dict(f, amplitude_mean=0.0, amplitude_max=0.0, energy_total=0.0, silence_ratio=0.99)
    assert recording_gate(f) == recording_gate(f2)
    assert intensity_observation(f)["level"] == intensity_observation(f2)["level"]


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"ok  {fn.__name__}")
    print(f"{len(fns)} tests passed")
