"""
Banc d'évaluation « cause du pleur » — le juge de paix de la R&D Babbl.

Il prend n'importe quel jeu de données au format :
    baby_id, label, f0..fN (descripteurs acoustiques), [ctx_* (contexte saisi)]
où `label` = ce qui a calmé le bébé (faim / inconfort / bras / sommeil…),
et répond à QUATRE questions, toujours sur des bébés ou des pleurs jamais vus :

  A. Modèle commun, bébés jamais entendus          → la promesse « universelle »
  B. Modèle PERSONNEL (k pleurs étiquetés du bébé)  → la promesse « apprend votre bébé »
  C. Contexte seul (délai tétée, éveil, heure)     → ce que Babbl fait déjà
  D. Contexte + son                                 → le son ajoute-t-il quelque chose ?

Critères décidés AVANT de voir les données (go / no-go) :
  GO_UNIVERSAL  : A, justesse équilibrée ≥ hasard + 15 points
  GO_PERSONAL   : B (k=10), justesse équilibrée ≥ hasard + 15 points,
                  significatif au niveau bébé (p < 0,05)
  GO_AUDIO_ADDS : D − C ≥ 5 points sur des bébés jamais vus

    cd backend && .venv/bin/python research/eval_harness.py --synthetic   # valide le banc
    cd backend && .venv/bin/python research/eval_harness.py data.csv      # vraies données
"""
from __future__ import annotations

import argparse
import sys
import warnings
from math import sqrt

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

GO_MARGIN = 0.15
AUDIO_ADDS_MARGIN = 0.05


def _balanced_acc(y, p):
    from sklearn.metrics import balanced_accuracy_score
    return balanced_accuracy_score(y, p)


def _model():
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    return make_pipeline(StandardScaler(), LogisticRegression(max_iter=3000, class_weight="balanced"))


def cross_baby(df, cols, folds=5):
    """Entraîné sur certains bébés, testé sur d'autres — jamais le même des deux côtés."""
    from sklearn.model_selection import StratifiedGroupKFold, cross_val_predict
    y = df.label.values
    n_groups = df.baby_id.nunique()
    cv = StratifiedGroupKFold(min(folds, n_groups), shuffle=True, random_state=0)
    pred = cross_val_predict(_model(), df[cols].values, y, cv=cv, groups=df.baby_id.values)
    return _balanced_acc(y, pred)


def personal(df, cols, k=10, seed=0):
    """Un modèle par bébé : k pleurs étiquetés par cause pour apprendre, le reste pour tester."""
    from scipy import stats
    rng = np.random.default_rng(seed)
    accs = []
    for _, g in df.groupby("baby_id"):
        counts = g.label.value_counts()
        causes = counts[counts > k].index
        if len(causes) < 2:
            continue
        g = g[g.label.isin(causes)]
        train_idx = np.concatenate([rng.choice(g.index[g.label == c], k, replace=False) for c in causes])
        tr, te = g.loc[train_idx], g.drop(index=train_idx)
        cent = np.stack([tr[tr.label == c][cols].values.mean(0) for c in causes])
        scale = tr[cols].values.std(0) + 1e-9
        d = (((te[cols].values[:, None, :] - cent[None]) / scale) ** 2).sum(-1)
        pred = np.array(causes)[d.argmin(1)]
        accs.append((_balanced_acc(te.label.values, pred), 1 / len(causes)))
    if not accs:
        return None
    gains = np.array([a - ch for a, ch in accs])
    t = stats.ttest_1samp(gains, 0, alternative="greater") if len(gains) > 1 else None
    return {
        "n_babies": len(accs),
        "mean_acc": float(np.mean([a for a, _ in accs])),
        "mean_chance": float(np.mean([ch for _, ch in accs])),
        "p": float(t.pvalue) if t is not None else float("nan"),
    }


def evaluate(df: pd.DataFrame) -> dict:
    audio = [c for c in df.columns if c.startswith("f")]
    ctx = [c for c in df.columns if c.startswith("ctx_")]
    chance = 1 / df.label.nunique()
    out = {"n_cries": len(df), "n_babies": df.baby_id.nunique(), "n_causes": df.label.nunique(), "chance": chance}
    out["A_cross_baby_audio"] = cross_baby(df, audio)
    out["B_personal_audio"] = personal(df, audio)
    if ctx:
        out["C_cross_baby_context"] = cross_baby(df, ctx)
        out["D_cross_baby_context_audio"] = cross_baby(df, ctx + audio)
    b = out["B_personal_audio"]
    out["GO_UNIVERSAL"] = out["A_cross_baby_audio"] >= chance + GO_MARGIN
    out["GO_PERSONAL"] = bool(b and b["mean_acc"] >= b["mean_chance"] + GO_MARGIN and b["p"] < 0.05)
    out["GO_AUDIO_ADDS"] = bool(ctx and out["D_cross_baby_context_audio"] - out["C_cross_baby_context"] >= AUDIO_ADDS_MARGIN)
    return out


def synthetic(n_babies=30, per_cause=40, d_personal=3.0, d_universal=0.0, ctx_signal=1.5, seed=1) -> pd.DataFrame:
    """Données simulées où l'on CONNAÎT la vérité : sert à vérifier que le banc
    trouve un signal quand il existe, et n'en invente pas quand il n'existe pas."""
    rng = np.random.default_rng(seed)
    D, causes = 24, ["faim", "inconfort", "bras"]
    shared = rng.normal(0, 1, (3, D)); shared /= np.linalg.norm(shared, axis=1, keepdims=True)
    rows = []
    for b in range(n_babies):
        ident = rng.normal(0, 3, D)
        own = rng.normal(0, 1, (3, D)); own /= np.linalg.norm(own, axis=1, keepdims=True)
        for ci, c in enumerate(causes):
            for _ in range(per_cause):
                x = ident + d_personal * own[ci] + d_universal * shared[ci] + rng.normal(0, 1, D)
                ctx_meal = rng.normal(3.0 if c == "faim" else 1.5, 1.0) * (ctx_signal / 1.5)
                rows.append({"baby_id": f"b{b}", "label": c, **{f"f{i}": v for i, v in enumerate(x)},
                             "ctx_hours_since_meal": ctx_meal, "ctx_hour": rng.integers(0, 24)})
    return pd.DataFrame(rows)


def _print(res: dict) -> None:
    ch = res["chance"]
    print(f"{res['n_cries']} pleurs, {res['n_babies']} bébés, {res['n_causes']} causes (hasard {100*ch:.0f} %)")
    print(f"  A. modèle commun, bébés jamais entendus : {100*res['A_cross_baby_audio']:.0f} %")
    b = res["B_personal_audio"]
    print("  B. modèle personnel (k=10) : " + (f"{100*b['mean_acc']:.0f} % sur {b['n_babies']} bébés, p = {b['p']:.3g}" if b else "impossible (pas assez de pleurs étiquetés par bébé et par cause)"))
    if "C_cross_baby_context" in res:
        print(f"  C. contexte seul : {100*res['C_cross_baby_context']:.0f} %")
        print(f"  D. contexte + son : {100*res['D_cross_baby_context_audio']:.0f} %")
    print(f"  → GO universel : {res['GO_UNIVERSAL']} | GO personnel : {res['GO_PERSONAL']} | le son ajoute : {res['GO_AUDIO_ADDS']}")


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("csv", nargs="?")
    ap.add_argument("--synthetic", action="store_true")
    a = ap.parse_args(argv)
    if a.synthetic:
        for title, kw in [
            ("Monde 1 — aucun signal (ce que disent les études)", dict(d_personal=0.0, d_universal=0.0)),
            ("Monde 2 — signal PERSONNEL seulement", dict(d_personal=3.0, d_universal=0.0)),
            ("Monde 3 — signal universel", dict(d_personal=0.0, d_universal=3.0)),
        ]:
            print(f"\n{title}")
            _print(evaluate(synthetic(**kw)))
        return 0
    if not a.csv:
        ap.error("donner un CSV ou --synthetic")
    _print(evaluate(pd.read_csv(a.csv)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
