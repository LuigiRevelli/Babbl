"""
Banc négatif de la porte d'entrée : combien de sons qui ne sont PAS des pleurs
passent la porte ?

Corpus (clonables avec git, sans compte) :
  ESC-50  https://github.com/karolpiczak/ESC-50  — 2 000 sons réels de 5 s,
          50 catégories dont 40 pleurs de bébé (positifs d'une autre source).
  FSDD    https://github.com/Jakobovski/free-spoken-digit-dataset — voix
          d'hommes adultes ; 12 chiffres enchaînés par clip.

Usage :
  python bench/negatives_bench.py /chemin/ESC-50 /chemin/free-spoken-digit-dataset
"""

from __future__ import annotations

import glob
import os
import sys
import tempfile
from concurrent.futures import ProcessPoolExecutor

import numpy as np
import pandas as pd
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from audio_analysis import SR, _load_audio, extract_features  # noqa: E402
from triage_rules import recording_gate  # noqa: E402


def _run(item):
    path, cat = item
    ok, _, _ = recording_gate(extract_features(path))
    return {"cat": cat, "ok": ok}


def _speech_clips(fsdd: str, out_dir: str) -> list[tuple[str, str]]:
    out = []
    for spk in ("george", "jackson", "lucas", "nicolas", "theo", "yweweler"):
        files = sorted(glob.glob(os.path.join(fsdd, "recordings", f"*_{spk}_*.wav")))
        for k in range(10):
            parts = [np.concatenate([_load_audio(f)[0], np.zeros(int(0.15 * SR), np.float32)]) for f in files[k * 12:(k + 1) * 12]]
            path = os.path.join(out_dir, f"{spk}_{k}.wav")
            sf.write(path, np.concatenate(parts), SR)
            out.append((path, "adult_speech_male"))
    return out


def main() -> None:
    esc, fsdd = sys.argv[1], sys.argv[2]
    meta = pd.read_csv(os.path.join(esc, "meta", "esc50.csv"))
    items = [(os.path.join(esc, "audio", r.filename), r.category) for r in meta.itertuples()]
    with tempfile.TemporaryDirectory() as tmp:
        items += _speech_clips(fsdd, tmp)
        with ProcessPoolExecutor(os.cpu_count() or 2) as ex:
            rows = pd.DataFrame(list(ex.map(_run, items, chunksize=16)))
    neg = rows[rows.cat != "crying_baby"]
    print(f"Pleurs ESC-50 acceptés : {100 * rows[rows.cat == 'crying_baby'].ok.mean():.1f} %")
    print(f"Non-pleurs acceptés : {100 * neg.ok.mean():.1f} % sur {len(neg)}")
    print((neg.groupby("cat").ok.mean() * 100).round(0).sort_values(ascending=False).head(15).to_string())


if __name__ == "__main__":
    main()
