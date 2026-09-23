"""
Descripteurs acoustiques d'un pleur — mesures, pas interprétation.

FEATURE_VERSION 2 (21/09/2026) — changements mesurés, voir ROADMAP-BACKEND.md :

- Hauteur : `librosa.pyin` (fmin 200, fmax 1000 Hz) sur les trames voisées.
  `piptrack` prenait la raie la plus forte du spectre — souvent une
  harmonique : sur de vrais pleurs, 750-842 Hz là où pyin donne 232-398 Hz.
- Continuité : `voiced_fraction` = part des trames où des cordes vocales
  vibrent. Invariant au volume capté (0,81 à 0 / −12 / −26 dB sur un cri
  synthétique), là où `silence_ratio` (seuil absolu 0,01) passait de 0,24 à
  0,80 et s'inversait avec du bruit de fond. `silence_ratio` est conservé
  pour information, plus jamais pour décider.

FEATURE_VERSION 3 (23/09/2026) — mesuré sur 366 vrais pleurs de 0-6 mois
enregistrés au téléphone (Donate-a-Cry, `bench/gate_bench.py`) :

- pyin cherche la hauteur DANS la bande d'un pleur (250-1000 Hz). Avec un
  plancher plus bas, le lissage de pyin décode un pleur à 450 Hz comme son
  sous-multiple (150 ou 225 Hz) dès qu'une voix grave est dans le clip : la
  médiane tombait sous la bande et la porte rejetait 21 % de vrais pleurs.
- Une voix plus grave que la bande (adulte, musique) se colle au plancher de
  250 Hz : ces trames sont exclues (hauteur < 255 Hz).
- `cry_band_fraction` = part de TOUTES les trames du clip qui sont voisées
  avec une hauteur réellement dans la bande. Un adulte qui parle par-dessus
  un pleur ne retire pas les trames du pleur. La porte et les trois mots de
  continuité reposent sur elle.
- `cry_pitch_spread` = écart-type de la hauteur en octaves sur ces trames.
  Un pleur module sa hauteur ; un bruit (vent, eau, aspirateur) presque pas.

Les valeurs d'amplitude (`amplitude_*`, `energy_total`) sont des propriétés de
l'enregistrement — distance, gain — pas du bébé. Elles ne servent à rien en
aval et ne quittent jamais le serveur.
"""

import os
import shutil
import subprocess
import tempfile

from audioread.exceptions import NoBackendError
import librosa
import numpy as np

FEATURE_VERSION = 3
SR = 22050
F0_MIN = 250.0
F0_MAX = 1000.0
# Trames collées au plancher de pyin = voix plus grave que la bande : exclues.
F0_FLOOR_GUARD = 255.0


def _convert_to_wav_with_ffmpeg(audio_path: str) -> str:
    """Convert input audio to mono WAV@22050 using ffmpeg, return temp path."""
    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        raise RuntimeError("decoder_unavailable")

    fd, wav_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)

    cmd = [ffmpeg_path, "-y", "-i", audio_path, "-ac", "1", "-ar", str(SR), wav_path]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        try:
            os.remove(wav_path)
        except OSError:
            pass
        raise RuntimeError("decode_failed")

    return wav_path


def _load_audio(audio_path: str):
    """Load audio robustly, with ffmpeg conversion fallback if decoder backend is missing."""
    try:
        return librosa.load(audio_path, sr=SR, mono=True)
    except NoBackendError:
        wav_path = _convert_to_wav_with_ffmpeg(audio_path)
        try:
            return librosa.load(wav_path, sr=SR, mono=True)
        finally:
            try:
                os.remove(wav_path)
            except OSError:
                pass


def extract_features(audio_path: str) -> dict:
    """Extract objective acoustic descriptors from a cry audio file.

    Returns a JSON-serializable dict. Nothing here is a claim about the baby.
    """
    y, sr = _load_audio(audio_path)

    if len(y) == 0:
        raise ValueError("Empty audio file")

    # --- Fundamental frequency, voiced frames only (pyin) ---
    f0, voiced_flag, _ = librosa.pyin(y, fmin=F0_MIN, fmax=F0_MAX, sr=sr, frame_length=2048)
    voiced_flag = np.asarray(voiced_flag, dtype=bool)
    voiced_fraction = float(np.mean(voiced_flag)) if len(voiced_flag) else 0.0
    in_band = voiced_flag & (np.nan_to_num(f0) >= F0_FLOOR_GUARD)
    cry_band_fraction = float(np.mean(in_band)) if len(in_band) else 0.0
    voiced_f0 = f0[in_band] if in_band.any() else np.array([])
    # Variation de hauteur (écart-type en octaves) : un pleur module sa hauteur,
    # un bruit stationnaire, un moteur ou une alarme très peu.
    cry_pitch_spread = float(np.std(np.log2(voiced_f0))) if len(voiced_f0) > 2 else 0.0

    if len(voiced_f0):
        pitch_median = float(np.median(voiced_f0))
        pitch_mean = float(np.mean(voiced_f0))
        pitch_std = float(np.std(voiced_f0))
        pitch_max = float(np.max(voiced_f0))
        pitch_min = float(np.min(voiced_f0))
    else:
        pitch_median = pitch_mean = pitch_std = pitch_max = pitch_min = 0.0

    # --- Amplitude (propriété de l'enregistrement, jamais décisionnelle) ---
    rms = librosa.feature.rms(y=y)[0]

    # --- Spectral shape ---
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    zcr = librosa.feature.zero_crossing_rate(y)[0]

    duration = float(len(y) / sr)
    silence_ratio = float(np.sum(np.abs(y) < 0.01) / len(y))  # information seulement

    return {
        "feature_version": FEATURE_VERSION,
        "duration_seconds": round(duration, 2),
        "voiced_fraction": round(voiced_fraction, 4),
        "cry_band_fraction": round(cry_band_fraction, 4),
        "cry_pitch_spread": round(cry_pitch_spread, 4),
        "pitch_median_hz": round(pitch_median, 2),
        "pitch_mean_hz": round(pitch_mean, 2),
        "pitch_std_hz": round(pitch_std, 2),
        "pitch_max_hz": round(pitch_max, 2),
        "pitch_min_hz": round(pitch_min, 2),
        "spectral_centroid_mean": round(float(np.mean(spectral_centroid)), 2),
        "spectral_bandwidth_mean": round(float(np.mean(spectral_bandwidth)), 2),
        "spectral_rolloff_mean": round(float(np.mean(spectral_rolloff)), 2),
        "zcr_mean": round(float(np.mean(zcr)), 5),
        "mfcc_means": [round(float(np.mean(m)), 3) for m in mfccs],
        "silence_ratio": round(silence_ratio, 4),
        "amplitude_mean": round(float(np.mean(rms)), 5),
        "amplitude_max": round(float(np.max(rms)), 5),
        "energy_total": round(float(np.sum(y ** 2)), 4),
    }


def warmup() -> float:
    """Compile les fonctions numba de pyin avant la première vraie requête.
    Sans ça, le premier parent de chaque processus attendait ~3 s de plus.
    Retourne la durée du préchauffage en secondes."""
    import time
    t0 = time.monotonic()
    t = np.arange(SR) / SR
    y = (0.3 * np.sin(2 * np.pi * 450 * t)).astype(np.float32)
    librosa.pyin(y, fmin=F0_MIN, fmax=F0_MAX, sr=SR, frame_length=2048)
    librosa.feature.mfcc(y=y, sr=SR, n_mfcc=13)
    return time.monotonic() - t0
