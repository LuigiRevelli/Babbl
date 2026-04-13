"""
Audio feature extraction for Babbl.

We extract a small set of objective acoustic descriptors from a baby's cry
using librosa. These features are not interpretation — interpretation is left
to the LLM (Mistral) downstream.
"""

import os
import shutil
import subprocess
import tempfile

from audioread.exceptions import NoBackendError
import librosa
import numpy as np


def _convert_to_wav_with_ffmpeg(audio_path: str) -> str:
    """Convert input audio to mono WAV@22050 using ffmpeg, return temp path."""
    ffmpeg_path = shutil.which("ffmpeg")
    if not ffmpeg_path:
        raise RuntimeError(
            "NoBackendError: unable to decode the audio file. "
            "Install ffmpeg (for example: sudo apt install ffmpeg) and restart the backend."
        )

    fd, wav_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)

    cmd = [
        ffmpeg_path,
        "-y",
        "-i",
        audio_path,
        "-ac",
        "1",
        "-ar",
        "22050",
        wav_path,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        try:
            os.remove(wav_path)
        except OSError:
            pass
        raise RuntimeError(
            "Audio conversion failed via ffmpeg. "
            "Check the input format (webm/ogg/wav) and the ffmpeg installation."
        )

    return wav_path


def _load_audio(audio_path: str):
    """Load audio robustly, with ffmpeg conversion fallback if decoder backend is missing."""
    try:
        return librosa.load(audio_path, sr=22050, mono=True)
    except NoBackendError:
        wav_path = _convert_to_wav_with_ffmpeg(audio_path)
        try:
            return librosa.load(wav_path, sr=22050, mono=True)
        finally:
            try:
                os.remove(wav_path)
            except OSError:
                pass


def extract_features(audio_path: str) -> dict:
    """Extract scientific acoustic features from a cry audio file.

    Returns a JSON-serializable dict ready to be sent to the LLM.
    """
    # Load mono at 22050 Hz (good tradeoff for voice / cry analysis)
    y, sr = _load_audio(audio_path)

    if len(y) == 0:
        raise ValueError("Empty audio file")

    # --- Pitch (fundamental frequency) ---
    # piptrack gives per-frame pitch candidates; we keep the strongest one per frame.
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    pitch_values = []
    for t in range(pitches.shape[1]):
        idx = magnitudes[:, t].argmax()
        p = pitches[idx, t]
        if p > 0:
            pitch_values.append(float(p))

    pitch_mean = float(np.mean(pitch_values)) if pitch_values else 0.0
    pitch_std = float(np.std(pitch_values)) if pitch_values else 0.0
    pitch_max = float(np.max(pitch_values)) if pitch_values else 0.0
    pitch_min = float(np.min(pitch_values)) if pitch_values else 0.0

    # --- Amplitude / energy ---
    rms = librosa.feature.rms(y=y)[0]

    # --- Temporal pattern ---
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    try:
        tempo = float(librosa.feature.tempo(onset_envelope=onset_env, sr=sr)[0])
    except Exception:
        tempo = 0.0

    # --- Spectral shape ---
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)

    # --- Roughness / harshness indicator ---
    zcr = librosa.feature.zero_crossing_rate(y)[0]

    duration = float(len(y) / sr)
    silence_ratio = float(np.sum(np.abs(y) < 0.01) / len(y))

    return {
        "pitch_mean_hz": round(pitch_mean, 2),
        "pitch_std_hz": round(pitch_std, 2),
        "pitch_max_hz": round(pitch_max, 2),
        "pitch_min_hz": round(pitch_min, 2),
        "amplitude_mean": round(float(np.mean(rms)), 5),
        "amplitude_max": round(float(np.max(rms)), 5),
        "amplitude_std": round(float(np.std(rms)), 5),
        "tempo_bpm": round(tempo, 2),
        "spectral_centroid_mean": round(float(np.mean(spectral_centroid)), 2),
        "spectral_bandwidth_mean": round(float(np.mean(spectral_bandwidth)), 2),
        "spectral_rolloff_mean": round(float(np.mean(spectral_rolloff)), 2),
        "zcr_mean": round(float(np.mean(zcr)), 5),
        "mfcc_means": [round(float(np.mean(m)), 3) for m in mfccs],
        "duration_seconds": round(duration, 2),
        "energy_total": round(float(np.sum(y ** 2)), 4),
        "silence_ratio": round(silence_ratio, 4),
    }
