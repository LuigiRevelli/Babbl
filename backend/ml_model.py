"""
Machine-learning inference utilities for infant cry classification.

This module loads a trained model artifact and predicts class probabilities
from live audio features extracted with librosa.
"""

import json
import os
from typing import Dict

import joblib
import numpy as np


# Order must match training feature matrix columns.
MODEL_FEATURES = [
    "RMS_Mean",
    "ZCR_Mean",
    "SC_Mean",
    "SBAN_Mean",
    "SCON_Mean",
    "MFCCs13Mean",
    "MFCCs1",
    "MFCCs2",
    "MFCCs3",
    "MFCCs4",
    "MFCCs5",
    "MFCCs6",
    "MFCCs7",
    "MFCCs8",
    "MFCCs9",
    "MFCCs10",
    "MFCCs11",
    "MFCCs12",
    "MFCCs13",
]

_MODEL_CACHE = None
_MODEL_META_CACHE = None


def _default_artifact_path() -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, "models", "cry_xgb_model.joblib")


def _default_meta_path() -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, "models", "cry_xgb_model_meta.json")


def _load_model():
    global _MODEL_CACHE
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE

    model_path = os.environ.get("CRY_ML_MODEL_PATH", _default_artifact_path())
    if not os.path.exists(model_path):
        return None

    _MODEL_CACHE = joblib.load(model_path)
    return _MODEL_CACHE


def _load_meta() -> dict:
    global _MODEL_META_CACHE
    if _MODEL_META_CACHE is not None:
        return _MODEL_META_CACHE

    meta_path = os.environ.get("CRY_ML_MODEL_META_PATH", _default_meta_path())
    if not os.path.exists(meta_path):
        return {}

    with open(meta_path, "r", encoding="utf-8") as f:
        _MODEL_META_CACHE = json.load(f)
    return _MODEL_META_CACHE


def _to_model_vector(live_features: dict) -> np.ndarray:
    """Project live features from audio_analysis.py to training feature schema."""
    mfcc_means = live_features.get("mfcc_means") or [0.0] * 13
    mfcc_means = list(mfcc_means)[:13] + [0.0] * max(0, 13 - len(mfcc_means))

    vec = {
        "RMS_Mean": float(live_features.get("amplitude_mean", 0.0)),
        "ZCR_Mean": float(live_features.get("zcr_mean", 0.0)),
        "SC_Mean": float(live_features.get("spectral_centroid_mean", 0.0)),
        "SBAN_Mean": float(live_features.get("spectral_bandwidth_mean", 0.0)),
        # We currently do not extract spectral contrast live; keep neutral default.
        "SCON_Mean": 0.0,
        "MFCCs13Mean": float(mfcc_means[12]),
    }

    for i in range(13):
        vec[f"MFCCs{i + 1}"] = float(mfcc_means[i])

    return np.array([[vec[col] for col in MODEL_FEATURES]], dtype=np.float32)


def _map_dataset_to_app_probs(dataset_probs: Dict[str, float]) -> Dict[str, float]:
    """Map Donate-a-Cry classes to the product taxonomy used in the frontend."""
    out = {
        "hunger": float(dataset_probs.get("hungry", 0.0)),
        "fatigue": float(dataset_probs.get("tired", 0.0)),
        "discomfort": float(dataset_probs.get("discomfort", 0.0)),
        "pain": float(dataset_probs.get("belly_pain", 0.0)),
        "overstimulation": 0.01,
        "need_for_comfort": float(dataset_probs.get("burping", 0.0)),
    }

    total = sum(out.values())
    if total <= 0:
        return {
            "hunger": 0.2,
            "fatigue": 0.2,
            "discomfort": 0.2,
            "pain": 0.2,
            "overstimulation": 0.1,
            "need_for_comfort": 0.1,
        }

    return {k: float(v / total) for k, v in out.items()}


def predict_probabilities(live_features: dict) -> dict:
    """Predict probabilities in the app's taxonomy using the trained ML model.

    Returns None if no model artifact is found.
    """
    model = _load_model()
    if model is None:
        return None

    meta = _load_meta()
    class_names = meta.get("class_names", [])
    x = _to_model_vector(live_features)
    probs = model.predict_proba(x)[0]

    if class_names and len(class_names) == len(probs):
        dataset_probs = {name: float(p) for name, p in zip(class_names, probs)}
    else:
        dataset_probs = {str(i): float(p) for i, p in enumerate(probs)}

    return {
        "app_probabilities": _map_dataset_to_app_probs(dataset_probs),
        "raw_model_probabilities": dataset_probs,
        "model_name": meta.get("model_name", "unknown"),
        "train_metrics": meta.get("metrics", {}),
        "classes": class_names,
    }
