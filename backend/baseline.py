"""
Babbl Baseline -- profil acoustique de chaque bebe, constitue EN SILENCE.

Apres chaque analyse exploitable, la ligne de base est mise a jour (moyenne et
ecart-type incrementaux, Welford). Rien n'est affiche au parent : l'etude
SYMPTOMS.md a etabli qu'aucune sortie « deviation » n'est defendable
aujourd'hui (le score mesurait surtout la distance du telephone, et un
message rassurant n'a aucune base probante). Le corpus continue de se
constituer pour les experiences 3-4 du plan de donnees (composantes de
variance, residu intra-bebe).

Ne sont PAS suivies : energy_total et amplitude_mean (proprietes de
l'enregistrement, pas du bebe) ni le coefficient MFCC 0 (reagit au volume
capte). Le stockage garde 13 coefficients pour rester aligne avec les lignes
existantes ; le coefficient 0 est ecrit a 0.0.

Suite connue (schema Supabase) : la reference est attachee a user_id, pas au
bebe -- jumeaux, deuxieme enfant et comptes partages sont fondus. A migrer
vers une cle bebe + champ d'age.
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
    # energy_total / amplitude_mean volontairement absents : ce sont des
    # proprietes de l'enregistrement (distance, gain), pas du bebe.
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


def _without_c0(mfcc: List[float]) -> List[float]:
    """Neutralise le coefficient 0 (sensible au volume capte) en gardant 13 valeurs."""
    if not mfcc:
        return []
    out = [float(v) for v in mfcc]
    out[0] = 0.0
    return out


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
            new_mfcc = _without_c0(features.get("mfcc_means") or [])
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
            insert["avg_mfcc"] = _without_c0(features.get("mfcc_means") or [])

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
