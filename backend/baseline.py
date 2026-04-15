"""
Babbl Baseline -- Apprentissage du profil acoustique unique de chaque bebe.

Ce module maintient une ligne de base (baseline) des caracteristiques acoustiques
des pleurs de chaque bebe. Apres chaque analyse, la baseline est mise a jour avec
une formule incrementale (moyenne courante). Quand suffisamment d'echantillons ont
ete collectes (>= 5), on peut detecter les deviations significatives par rapport
au profil normal du bebe.

Deviation elevee = "ce pleur est ANORMAL pour ce bebe en particulier".
"""

import json
import math
import os
from typing import Any, Dict, List, Optional, Tuple

from supabase import Client


# ---------------------------------------------------------------------------
# Feature mapping: extract_features() keys -> baseline column names
# ---------------------------------------------------------------------------

# Scalar features that are tracked as running averages + std
_SCALAR_FEATURES = {
    "pitch_mean_hz":            ("avg_pitch_mean",          "std_pitch_mean"),
    "energy_total":             ("avg_energy",              "std_energy"),
    "amplitude_mean":           ("avg_amplitude",           "std_amplitude"),
    "spectral_centroid_mean":   ("avg_spectral_centroid",   None),
    "spectral_bandwidth_mean":  ("avg_spectral_bandwidth",  None),
    "spectral_rolloff_mean":    ("avg_spectral_rolloff",    None),
    "zcr_mean":                 ("avg_zcr",                 None),
    "duration_seconds":         ("avg_duration",            None),
    "silence_ratio":            ("avg_silence_ratio",       None),
}

# Min / max tracking
_MINMAX_FEATURES = {
    "pitch_min_hz": "min_pitch",
    "pitch_max_hz": "max_pitch",
}

# How many standard deviations to flag as anomaly
_ANOMALY_THRESHOLD = 1.5

# Minimum samples before baseline deviation is meaningful
MIN_SAMPLES_FOR_DEVIATION = 5


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _incremental_mean(old_mean: float, new_value: float, n: int) -> float:
    """Welford-style incremental mean update: new_avg = old + (x - old) / n."""
    return old_mean + (new_value - old_mean) / n


def _incremental_std(old_std: float, old_mean: float, new_value: float, new_mean: float, n: int) -> float:
    """Approximate incremental standard deviation using Welford's online algorithm.

    We maintain S (sum of squared deviations) encoded as std * sqrt(n-1).
    For simplicity we use the approximation:
        new_std = sqrt( ((n-2)*old_std^2 + (x - new_mean)*(x - old_mean)) / (n-1) )
    which is exact for n >= 2.
    """
    if n < 2:
        return 0.0
    old_var = old_std ** 2 if old_std else 0.0
    new_var = ((n - 2) * old_var + (new_value - new_mean) * (new_value - old_mean)) / (n - 1)
    return math.sqrt(max(new_var, 0.0))


def _incremental_mfcc_mean(old_mfcc: List[float], new_mfcc: List[float], n: int) -> List[float]:
    """Update running mean for each of the 13 MFCC coefficients."""
    if not old_mfcc:
        return list(new_mfcc)
    result = []
    for i in range(min(len(old_mfcc), len(new_mfcc))):
        result.append(round(_incremental_mean(old_mfcc[i], new_mfcc[i], n), 4))
    return result


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def update_baseline(sb: Client, user_id: str, features: Dict[str, Any]) -> Optional[Dict]:
    """Update the running acoustic baseline for a baby after each analysis.

    Uses incremental mean formula so we never need to re-read all past analyses.
    Creates the baseline row on first call.

    Returns the updated baseline row (or None on error).
    """
    try:
        # Fetch existing baseline
        resp = sb.table("baby_baselines").select("*").eq("user_id", user_id).execute()
        rows = resp.data or []

        if rows:
            row = rows[0]
            n = (row.get("sample_count") or 0) + 1
            updates: Dict[str, Any] = {"sample_count": n, "last_updated": "now()"}

            # Update scalar averages + std
            for feat_key, (avg_col, std_col) in _SCALAR_FEATURES.items():
                new_val = features.get(feat_key)
                if new_val is None:
                    continue
                old_avg = row.get(avg_col) or 0.0
                new_avg = _incremental_mean(old_avg, new_val, n)
                updates[avg_col] = round(new_avg, 6)

                if std_col:
                    old_std = row.get(std_col) or 0.0
                    new_std = _incremental_std(old_std, old_avg, new_val, new_avg, n)
                    updates[std_col] = round(new_std, 6)

            # Update MFCC running means
            old_mfcc = row.get("avg_mfcc") or []
            new_mfcc = features.get("mfcc_means") or []
            if new_mfcc:
                updates["avg_mfcc"] = _incremental_mfcc_mean(old_mfcc, new_mfcc, n)

            # Update pitch std (from extract_features)
            pitch_std_val = features.get("pitch_std_hz")
            if pitch_std_val is not None:
                old_ps = row.get("avg_pitch_std") or 0.0
                updates["avg_pitch_std"] = round(_incremental_mean(old_ps, pitch_std_val, n), 6)

            # Min / max tracking
            pitch_min = features.get("pitch_min_hz")
            if pitch_min is not None and pitch_min > 0:
                current_min = row.get("min_pitch")
                if current_min is None or pitch_min < current_min:
                    updates["min_pitch"] = round(pitch_min, 2)

            pitch_max = features.get("pitch_max_hz")
            if pitch_max is not None:
                current_max = row.get("max_pitch")
                if current_max is None or pitch_max > current_max:
                    updates["max_pitch"] = round(pitch_max, 2)

            resp = sb.table("baby_baselines").update(updates).eq("user_id", user_id).execute()
            return (resp.data[0] if resp.data else None)

        else:
            # First sample — create baseline row
            insert: Dict[str, Any] = {
                "user_id": user_id,
                "sample_count": 1,
            }
            for feat_key, (avg_col, std_col) in _SCALAR_FEATURES.items():
                val = features.get(feat_key)
                if val is not None:
                    insert[avg_col] = round(float(val), 6)
                if std_col:
                    insert[std_col] = 0.0

            insert["avg_pitch_std"] = round(float(features.get("pitch_std_hz", 0)), 6)
            insert["avg_mfcc"] = features.get("mfcc_means") or []

            pitch_min = features.get("pitch_min_hz")
            if pitch_min and pitch_min > 0:
                insert["min_pitch"] = round(pitch_min, 2)
            pitch_max = features.get("pitch_max_hz")
            if pitch_max:
                insert["max_pitch"] = round(pitch_max, 2)

            resp = sb.table("baby_baselines").insert(insert).execute()
            return (resp.data[0] if resp.data else None)

    except Exception as e:
        print(f"[baseline] update_baseline failed: {e}")
        return None


def compute_deviation(sb: Client, user_id: str, features: Dict[str, Any]) -> Dict[str, Any]:
    """Compare current cry features against the baby's learned baseline.

    Returns:
        {
            "deviation_score": int (0-100),
            "anomalies": [{"feature": str, "current": float, "baseline": float, "std": float, "z_score": float}],
            "sample_count": int,
            "baseline_active": bool,  # True if sample_count >= MIN_SAMPLES_FOR_DEVIATION
            "message": str,           # French user-facing message
        }
    """
    result: Dict[str, Any] = {
        "deviation_score": 0,
        "anomalies": [],
        "sample_count": 0,
        "baseline_active": False,
        "message": "",
    }

    try:
        resp = sb.table("baby_baselines").select("*").eq("user_id", user_id).execute()
        rows = resp.data or []
        if not rows:
            result["message"] = "Profil acoustique en cours de construction (premiere analyse)."
            return result

        row = rows[0]
        sample_count = row.get("sample_count") or 0
        result["sample_count"] = sample_count

        if sample_count < MIN_SAMPLES_FOR_DEVIATION:
            remaining = MIN_SAMPLES_FOR_DEVIATION - sample_count
            result["message"] = (
                f"Profil acoustique en cours d'apprentissage "
                f"({sample_count}/{MIN_SAMPLES_FOR_DEVIATION} echantillons). "
                f"Encore {remaining} analyse(s) avant activation."
            )
            return result

        # Baseline is active
        result["baseline_active"] = True

        anomalies: List[Dict[str, Any]] = []
        z_scores: List[float] = []

        # Check each scalar feature with known std
        for feat_key, (avg_col, std_col) in _SCALAR_FEATURES.items():
            if std_col is None:
                continue  # no std tracked for this feature
            current = features.get(feat_key)
            if current is None:
                continue
            baseline_avg = row.get(avg_col)
            baseline_std = row.get(std_col)
            if baseline_avg is None or baseline_std is None:
                continue
            if baseline_std < 1e-9:
                # Std is essentially zero — skip to avoid division by zero
                continue

            z = abs(current - baseline_avg) / baseline_std
            z_scores.append(z)

            if z > _ANOMALY_THRESHOLD:
                # Feature name mapping for user-facing labels
                feature_labels = {
                    "pitch_mean_hz": "Hauteur du cri (pitch)",
                    "energy_total": "Energie totale",
                    "amplitude_mean": "Amplitude moyenne",
                }
                anomalies.append({
                    "feature": feature_labels.get(feat_key, feat_key),
                    "feature_key": feat_key,
                    "current": round(current, 4),
                    "baseline": round(baseline_avg, 4),
                    "std": round(baseline_std, 4),
                    "z_score": round(z, 2),
                })

        # Check MFCC deviations (compare each coefficient)
        baseline_mfcc = row.get("avg_mfcc") or []
        current_mfcc = features.get("mfcc_means") or []
        if baseline_mfcc and current_mfcc and sample_count >= MIN_SAMPLES_FOR_DEVIATION:
            mfcc_diffs = []
            for i in range(min(len(baseline_mfcc), len(current_mfcc))):
                diff = abs(current_mfcc[i] - baseline_mfcc[i])
                mfcc_diffs.append(diff)
            if mfcc_diffs:
                avg_mfcc_diff = sum(mfcc_diffs) / len(mfcc_diffs)
                # MFCC values typically range -50 to 50; a diff > 10 is significant
                if avg_mfcc_diff > 10:
                    anomalies.append({
                        "feature": "Timbre vocal (MFCC)",
                        "feature_key": "mfcc_means",
                        "current": round(avg_mfcc_diff, 2),
                        "baseline": 0.0,
                        "std": 0.0,
                        "z_score": round(avg_mfcc_diff / 5.0, 2),  # normalized
                    })
                    z_scores.append(avg_mfcc_diff / 5.0)

        # Compute deviation score (0-100)
        if z_scores:
            # Use the max z-score, clamped to 0-100
            max_z = max(z_scores)
            avg_z = sum(z_scores) / len(z_scores)
            # Weighted: 60% max anomaly + 40% average anomaly
            raw_score = (0.6 * max_z + 0.4 * avg_z) * 20  # scale so z=5 -> 100
            deviation_score = int(min(max(raw_score, 0), 100))
        else:
            deviation_score = 0

        result["deviation_score"] = deviation_score
        result["anomalies"] = anomalies

        # Generate French message
        if deviation_score == 0:
            result["message"] = "Ce pleur correspond au profil acoustique habituel de votre bebe."
        elif deviation_score < 30:
            result["message"] = "Ce pleur est globalement normal pour votre bebe, avec de legeres variations."
        elif deviation_score < 70:
            result["message"] = (
                "Ce pleur presente des variations notables par rapport au profil habituel de votre bebe. "
                "Surveillez l'evolution."
            )
        else:
            n_anomalies = len(anomalies)
            result["message"] = (
                f"Ce pleur devie significativement du profil habituel de votre bebe "
                f"({n_anomalies} caracteristique(s) anormale(s)). "
                "Attention recommandee."
            )

        return result

    except Exception as e:
        print(f"[baseline] compute_deviation failed: {e}")
        result["message"] = "Impossible de calculer la deviation (erreur interne)."
        return result
