"""
Banc de la porte d'entrée sur de vrais pleurs enregistrés au téléphone.

Corpus : Donate-a-Cry (https://github.com/gveres/donateacry-corpus), clips
envoyés par des parents depuis l'app iOS/Android — le format le plus proche
de Babbl qui existe. Les étiquettes de cause ne servent à rien ici ; on ne
regarde que le code d'âge du nom de fichier (04 = 0-4 sem., 48 = 4-8 sem.,
26 = 2-6 mois, 72 = 7 mois-2 ans, 22 = plus de 2 ans).

Critère de SÉCURITÉ : la part de vrais pleurs que la porte rejette
(« pas de pleur net »). Un rejet à tort n'est pas neutre : le parent ne reçoit
que le rappel et les cartes, et peut conclure que le micro a mal marché.

Usage :
  python bench/gate_bench.py /chemin/vers/donateacry-corpus  [--out mesures.csv]
"""

from __future__ import annotations

import argparse
import csv
import glob
import os
import sys
from concurrent.futures import ProcessPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from audio_analysis import extract_features  # noqa: E402
from triage_rules import intensity_observation, recording_gate  # noqa: E402

AGE_CODES = {"04": "0-4 sem", "48": "4-8 sem", "26": "2-6 mois", "72": "7-24 mois", "22": "> 2 ans"}
KEEP = ("cry_band_fraction", "voiced_fraction", "pitch_median_hz", "pitch_std_hz", "duration_seconds",
        "spectral_centroid_mean", "zcr_mean")


def _age(path: str) -> str:
    code = os.path.basename(path).rsplit(".", 1)[0].split("-")[-2]
    return AGE_CODES.get(code, "?")


def measure(path: str) -> dict:
    try:
        f = extract_features(path)
    except Exception as exc:  # un fichier illisible est compté, pas ignoré
        return {"file": os.path.basename(path), "age": _age(path), "error": type(exc).__name__}
    ok, code, _ = recording_gate(f)
    row = {"file": os.path.basename(path), "age": _age(path), "gate_ok": ok, "gate_code": code or "",
           "level": intensity_observation(f)["level"] if ok else ""}
    row.update({k: f.get(k) for k in KEEP})
    return row


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("corpus")
    ap.add_argument("--out", default="gate_bench.csv")
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 2)
    args = ap.parse_args()

    files = sorted(glob.glob(os.path.join(args.corpus, "donateacry_corpus_cleaned_and_updated_data", "*", "*.wav")))
    with ProcessPoolExecutor(args.workers) as ex:
        rows = list(ex.map(measure, files, chunksize=8))

    cols = ["file", "age", "gate_ok", "gate_code", "level", "error", *KEEP]
    with open(args.out, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols); w.writeheader(); w.writerows(rows)

    infant = [r for r in rows if r["age"] in ("0-4 sem", "4-8 sem", "2-6 mois") and "error" not in r]
    errors = [r for r in rows if "error" in r]
    rejected = [r for r in infant if not r["gate_ok"]]
    print(f"{len(files)} fichiers, {len(errors)} illisibles, {len(infant)} pleurs de 0-6 mois")
    print(f"Rejet à tort (0-6 mois) : {len(rejected)}/{len(infant)} = {100 * len(rejected) / max(len(infant), 1):.1f} %")
    for r in rejected:
        print(f"  {r['file'][:12]}…  {r['age']:9}  bande {r['cry_band_fraction']:.2f}  f0 {r['pitch_median_hz']:.0f} Hz  {r['duration_seconds']} s  {r['gate_code']}")


if __name__ == "__main__":
    main()
