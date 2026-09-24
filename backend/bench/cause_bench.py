"""
Banc « cause du pleur » : le son dit-il POURQUOI un bébé pleure ?

Corpus Donate-a-Cry (descripteurs acoustiques moyens, fichier à la racine du
dépôt), cause déclarée par le parent dans l'app de collecte. Deux évaluations :
  - clips mélangés (ce que font la plupart des articles : le même bébé, voire le
    même épisode découpé, se retrouve à la fois en entraînement et en test) ;
  - bébés jamais entendus (un appareil = un bébé, jamais des deux côtés).
Référence : répondre « faim » à chaque fois.

    cd backend && .venv/bin/python bench/cause_bench.py

Résultat du 24/09/2026 : recherche/pertinence-detection-cause.md.
"""
import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
import pandas as pd, numpy as np, warnings
warnings.filterwarnings("ignore")
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, StratifiedGroupKFold, cross_val_predict
from sklearn.metrics import accuracy_score, balanced_accuracy_score, recall_score

df = pd.read_csv('donateacry-corpus_features_final.csv')
df['reason'] = df.Cry_Audio_File.str.split('/').str[-2]
f = df.Cry_Audio_File.str.split('/').str[-1].str.lower()
m = f.str.extract(r'^([0-9a-f-]{36})-(\d+)-([\d.]+)-([mf])-(\d+)-(\w+)\.wav$')
df['dev'] = m[0]; df['ts'] = m[1].astype(float)
print("fichiers analysés :", df.dev.notna().sum(), "/", len(df), "| bébés (appareils) :", df.dev.nunique())
print("répartition :", df.reason.value_counts().to_dict(), f"→ « faim » = {100*(df.reason=='hungry').mean():.1f} %")
per_dev = df.groupby('dev').reason.nunique()
print(f"appareils avec 1 seule cause déclarée : {100*(per_dev==1).mean():.0f} % ({(per_dev==1).sum()}/{len(per_dev)})")
# épisodes : clips du même appareil à moins de 10 min d'écart
df = df.sort_values(['dev','ts'])
df['episode'] = (df.groupby('dev').ts.diff().fillna(1e9) > 600).cumsum()
print("épisodes distincts :", df.episode.nunique(), "pour", len(df), "clips")

X = df.drop(columns=['Cry_Audio_File','Cry_Reason','reason','dev','ts','episode']).values.astype(float)
y = df.reason.values
classes = sorted(set(y))
models = {
  "forêt aléatoire": RandomForestClassifier(n_estimators=400, class_weight='balanced', random_state=0),
  "régression logistique": make_pipeline(StandardScaler(), LogisticRegression(max_iter=3000, class_weight='balanced')),
}
maj = accuracy_score(y, ['hungry']*len(y))
print(f"\nRéférence « toujours faim » : justesse {100*maj:.1f} %, justesse équilibrée 20.0 % (hasard sur 5 causes)\n")
for name, mdl in models.items():
    for split_name, cv, groups in [
        ("clips mélangés (comme la plupart des articles)", StratifiedKFold(5, shuffle=True, random_state=0), None),
        ("bébés jamais entendus (honnête)", StratifiedGroupKFold(5, shuffle=True, random_state=0), df.dev.values),
    ]:
        pred = cross_val_predict(mdl, X, y, cv=cv, groups=groups)
        rec = recall_score(y, pred, labels=classes, average=None)
        print(f"{name:22s} | {split_name:46s} | justesse {100*accuracy_score(y,pred):5.1f} % | équilibrée {100*balanced_accuracy_score(y,pred):5.1f} % | rappel par cause "
              + ", ".join(f"{c}={100*r:.0f}%" for c, r in zip(classes, rec)))
# binaire faim / pas faim
yb = np.where(y=='hungry','faim','autre')
for split_name, cv, groups in [("mélangés", StratifiedKFold(5, shuffle=True, random_state=0), None),("bébés inconnus", StratifiedGroupKFold(5, shuffle=True, random_state=0), df.dev.values)]:
    pred = cross_val_predict(models["forêt aléatoire"], X, yb, cv=cv, groups=groups)
    print(f"\nfaim vs autre ({split_name}) : équilibrée {100*balanced_accuracy_score(yb,pred):.1f} % (hasard 50 %) | détecte « autre » {100*recall_score(yb,pred,pos_label='autre'):.0f} %")
