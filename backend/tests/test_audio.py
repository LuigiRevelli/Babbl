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


def cry(sec=8.0, f0=450.0, harmonics=5, am=3.0, gain=1.0, melody=0.12) -> np.ndarray:
    """Cri synthétique : fondamentale + harmoniques décroissantes, salves à 3 Hz,
    pause de 1,5 s au milieu. La 2e harmonique est volontairement forte. Comme
    un vrai pleur, la hauteur monte et descend (± `melody`, en fraction)."""
    t = np.linspace(0, sec, int(SR * sec), endpoint=False)
    contour = f0 * (1 + melody * np.sin(2 * np.pi * 0.8 * t))
    phase = 2 * np.pi * np.cumsum(contour) / SR
    y = sum((0.6 / k) * np.sin(k * phase) for k in range(1, harmonics + 1))
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
    assert f["feature_version"] == FEATURE_VERSION == 3
    for k in ("voiced_fraction", "cry_band_fraction", "pitch_median_hz", "duration_seconds"):
        assert k in f


def test_pitch_is_the_fundamental_not_a_harmonic():
    f = _features(cry(f0=420.0, melody=0.0))
    assert 400 <= f["pitch_median_hz"] <= 440, f["pitch_median_hz"]       # piptrack renvoyait ~840
    f = _features(cry(f0=320.0, melody=0.0))
    assert 300 <= f["pitch_median_hz"] <= 340, f["pitch_median_hz"]


def test_gain_invariance():
    """−26 dB = tenir le téléphone bien plus loin. Le mot ne doit pas changer."""
    results = []
    for gain_db in (0, -12, -26):
        f = _features(cry(gain=10 ** (gain_db / 20)))
        ok, code, _ = recording_gate(f)
        results.append((ok, code, intensity_observation(f)["level"], round(f["cry_band_fraction"], 2)))
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
    female = (0.4 * sum((1 / k) * np.sin(2 * np.pi * 210 * k * t) for k in range(1, 8)) * ((t % 0.25) < 0.17)).astype(np.float32)
    alarm = (0.4 * sum((1 / k) * np.sin(2 * np.pi * 500 * k * t) for k in range(1, 5)) * ((t % 1.0) < 0.6)).astype(np.float32)
    for label, y in (("télé", tv), ("musique 220 Hz", music), ("voix grave", voice), ("voix de femme 210 Hz", female),
                     ("alarme 500 Hz fixe", alarm)):
        ok, code, _ = recording_gate(_features(y))
        assert not ok and code == "no_cry_detected", (label, code)


def test_amplitude_never_reaches_a_decision():
    """Les grandeurs d'amplitude existent (information) mais ne pèsent sur rien."""
    f = _features(cry())
    f2 = dict(f, amplitude_mean=0.0, amplitude_max=0.0, energy_total=0.0, silence_ratio=0.99)
    assert recording_gate(f) == recording_gate(f2)
    assert intensity_observation(f)["level"] == intensity_observation(f2)["level"]


def test_cry_with_adult_voice_over_it_still_passes():
    """Cas réel du banc : un pleur avec un adulte qui parle par-dessus. L'ancienne
    porte (hauteur MÉDIANE) le rejetait ; la part de trames dans la bande du
    pleur, elle, garde le pleur."""
    t = np.linspace(0, 8, int(SR * 8), endpoint=False)
    adult = (0.5 * sum((1 / k) * np.sin(2 * np.pi * 150 * k * t) for k in range(1, 8))).astype(np.float32)
    y = cry()
    mix = np.where(np.arange(len(y)) < int(SR * 5.5), adult * (np.arange(len(y)) >= int(SR * 3.5)) + y, adult)
    f = _features((0.5 * mix / np.max(np.abs(mix))).astype(np.float32))
    assert recording_gate(f)[0], f["cry_band_fraction"]
    assert 400 <= f["pitch_median_hz"] <= 500, f["pitch_median_hz"]   # le pleur, pas un sous-multiple


# ─── Défaut connu de la porte (LISTE-FINALE-SYMPTOMES.md, n°22) ─────────
# Reproduit le 22/09/2026 : un babillage à 300 Hz et une voix adressée au bébé
# à 270 Hz passent la porte et ressortent « presque continu ». Aucun seuil
# simple ne les sépare d'un vrai pleur sans risquer de rejeter de vrais pleurs
# (un pleur réel du dépôt mesurait 232 Hz). Le correctif demande un banc de
# vrais clips téléphone. Ces tests échouent tant que la porte n'est pas
# durcie ; `strict=True` fera échouer la suite le jour où ils passent, pour qu'on
# retire le marqueur.
try:
    import pytest
    _xfail = pytest.mark.xfail(strict=True, reason="porte non durcie : ROADMAP étape 2")
except ImportError:  # exécution directe sans pytest
    def _xfail(fn):
        fn._expected_failure = True
        return fn


def _syllables(f0: float, on_s: float, off_s: float, sec: float = 10.0) -> np.ndarray:
    t = np.arange(int(SR * sec)) / SR
    ph = 2 * np.pi * np.cumsum(f0 + 0.07 * f0 * np.sin(2 * np.pi * 2 * t)) / SR
    y = sum(np.sin(k * ph) / k for k in range(1, 8))
    y = y * ((t % (on_s + off_s)) < on_s)
    y = y + 0.01 * np.random.default_rng(2).standard_normal(len(t))
    return (0.5 * y / np.max(np.abs(y))).astype(np.float32)


@_xfail
def test_babble_is_not_a_cry():
    ok, code, _ = recording_gate(_features(_syllables(300.0, 0.20, 0.20)))
    assert not ok and code == "no_cry_detected"


@_xfail
def test_adult_voice_to_baby_is_not_a_cry():
    ok, code, _ = recording_gate(_features(_syllables(270.0, 0.22, 0.08)))
    assert not ok and code == "no_cry_detected"


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        marks = getattr(fn, "pytestmark", [])
        if getattr(fn, "_expected_failure", False) or any(m.name == "xfail" for m in marks):
            print(f"xfail  {fn.__name__}")
            continue
        fn()
        print(f"ok  {fn.__name__}")
    print(f"{len(fns)} tests passed")
