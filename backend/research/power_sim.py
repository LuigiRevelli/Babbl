"""
Simulation de puissance : combien de bébés et de pleurs faut-il pour PROUVER
qu'un modèle personnalisé (un modèle par bébé) reconnaît la cause d'un pleur ?

Modèle génératif (hypothèse « personnelle », la seule encore ouverte) :
  x = identité du bébé  +  signature de la cause PROPRE à ce bébé × d  +  bruit
  - identité : grande (le cri code fortement le bébé, Lockhart-Bouron 2023) ;
  - signature : direction aléatoire, différente pour chaque bébé (sinon un
    modèle commun aurait marché, ce qui a été réfuté) ;
  - d : force du signal = écart entre causes, en unités de bruit intra-bébé.
    d = 0 → aucune information (ce que trouvent les études inter-bébés).

Classifieur personnel : centroïdes par cause appris sur k pleurs étiquetés par
cause chez CE bébé (étiquette = ce qui l'a calmé), testé sur ses autres pleurs.
Étude : N bébés ; test unilatéral « justesse moyenne > hasard » au niveau bébé.

    cd backend && .venv/bin/python research/power_sim.py
"""
import numpy as np

rng = np.random.default_rng(7)
D, C = 24, 3            # descripteurs acoustiques, causes (faim / inconfort / besoin de bras)
TEST_PER_CAUSE = 10


# Réalisme : une part des épisodes sans besoin identifiable (maturation ; part
# non chiffrée de façon fiable, Aldrich 1945 est trop ancien) et
# ~25 % d'étiquettes fausses (le geste qui calme ≠ la cause, Lockhart-Bouron
# 2023) → une étiquette sur deux environ n'est pas « la bonne cause ».
LABEL_NOISE = 0.0
FRAC_WITH_SIGNAL = 1.0  # part des bébés dont les pleurs diffèrent vraiment selon la cause


def baby_accuracy(d: float, k: int) -> float:
    if rng.random() > FRAC_WITH_SIGNAL:
        d = 0.0
    ident = rng.normal(0, 3.0, D)
    sig = rng.normal(0, 1, (C, D)); sig /= np.linalg.norm(sig, axis=1, keepdims=True)
    def draw(c, n):
        return ident + d * sig[c] + rng.normal(0, 1, (n, D)) / np.sqrt(D) * np.sqrt(D)
    def draw_labeled(c, n):
        # avec proba LABEL_NOISE, le pleur étiqueté « c » vient d'une autre cause
        true = np.where(rng.random(n) < LABEL_NOISE, rng.integers(0, C, n), c)
        return np.stack([draw(t, 1)[0] for t in true])
    cent = np.stack([draw_labeled(c, k).mean(0) for c in range(C)])
    correct = 0
    for c in range(C):
        xt = draw_labeled(c, TEST_PER_CAUSE)
        pred = np.argmin(((xt[:, None, :] - cent[None]) ** 2).sum(-1), axis=1)
        correct += (pred == c).sum()
    return correct / (C * TEST_PER_CAUSE)


def power(d, k, n_babies, sims=300):
    from math import sqrt
    hits = 0
    for _ in range(sims):
        acc = np.array([baby_accuracy(d, k) for _ in range(n_babies)])
        t = (acc.mean() - 1 / C) / (acc.std(ddof=1) / sqrt(n_babies) + 1e-12)
        hits += t > 1.66  # unilatéral, α = 5 %
    return hits / sims


if __name__ == "__main__":
    import sys
    global_scenarios = [
        ("Idéal (étiquettes parfaites, tous les bébés ont un signal)", 0.0, 1.0),
        ("Réaliste (1 étiquette sur 2 fausse, 1 bébé sur 2 avec signal)", 0.5, 0.5),
    ]
    for title, noise, frac in global_scenarios:
        LABEL_NOISE, FRAC_WITH_SIGNAL = noise, frac
        globals().update(LABEL_NOISE=noise, FRAC_WITH_SIGNAL=frac)
        print(f"\n=== {title} ===")
        print("Justesse MESURÉE d'un modèle personnel (3 causes, hasard = 33 %)")
        ds = [0.0, 1.0, 2.0, 3.0, 4.0]
        print("        " + "".join(f"d={d:<5}" for d in ds))
        for k in (5, 10, 20):
            row = [np.mean([baby_accuracy(d, k) for _ in range(300)]) for d in ds]
            print(f"k={k:<3}   " + "".join(f"{100*a:4.0f}% " for a in row))
        print("Puissance pour PROUVER l'effet (k = 10 pleurs étiquetés par cause et par bébé)")
        for d in (0.5, 1.0, 2.0):
            print(f"  d={d}: " + "  ".join(f"N={n}: {100*power(d, 10, n, sims=200):3.0f}%" for n in (10, 20, 40, 80)))
