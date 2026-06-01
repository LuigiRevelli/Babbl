# Babbl — Science & Taxonomie

Source de vérité scientifique du produit. À lire avant de toucher au modèle,
à la taxonomie ou au discours produit.

Code associé :
- `backend/taxonomy.py` — taxonomie canonique (source unique de vérité backend)
- `frontend/src/lib/taxonomy.ts` — miroir frontend (libellés FR + couches)

---

## Le pivot : du « traducteur de pleurs » au « stéthoscope acoustique »

Deviner la cause d'un pleur *normal* (faim / fatigue / gaz) a un **plafond
scientifique bas** : l'information n'est pas dans le signal, même avec un ML de
pointe et des données parfaites. Le marché y est encombré et peu défendable.

La vraie valeur, rare et brevetable, est le **dépistage médical par le cri**
(asphyxie, atteinte neurologique, surdité, ictère, douleur quantifiée…), validé
en recherche et prouvé en business (cf. Ubenwa). C'est la direction de R&D de
Babbl. Positionnement cible : **dépistage précoce par le cri**, pas gadget.

---

## Les 3 couches (honnêteté scientifique = crédibilité)

On ne prétend jamais deviner 15 causes au son. On sépare ce que chaque couche
prouve. Le frontend affiche la provenance de chaque conclusion au parent.

### Couche A — Acoustique (ce que le SON prouve)
| Sortie | Preuve | Référence |
|---|---|---|
| **Douleur** oui/non | Début soudain, f0 >600 Hz, blocage respiratoire | Porter 1986, Wasz-Höckert |
| **Niveau de détresse** 0–100 | Intensité + hauteur, indépendant de la cause | robuste |
| **Drapeau neuro** | Cri aigu, monotone, perçant → avis médical | littérature clinique |
| **Faim** (modéré) | Pleur rythmé, montée progressive — à confirmer par le contexte | Wasz-Höckert |

### Couche B — Contextuelle (DÉDUIT, pas entendu)
`fatigue · inconfort · gaz · surstimulation · stress · besoin de réconfort`
→ aucune signature acoustique propre. Probabilité estimée par le LLM à partir
du contexte (heure du repas, âge, couche, position). Le `key_signal` porte
toujours `source: "context"`.

### Couche C — Triage médical (SIGNALÉ, jamais diagnostiqué)
`coliques · reflux · poussée dentaire · otite · fièvre/maladie · allergie · cri neuro`
→ remontées comme pistes à évoquer avec un pédiatre, avec un niveau d'alerte.
Jamais dans les barres de probabilité. Babbl est un outil de triage, pas un
dispositif de diagnostic.

---

## Taxonomie quotidienne (barres de probabilité)

8 causes canoniques, clés snake_case partagées front/back :

| clé | FR | couche | preuve audio |
|---|---|---|---|
| `pain` | Douleur | acoustique | forte |
| `hunger` | Faim | acoustique | modérée |
| `fatigue` | Fatigue | contexte | faible |
| `discomfort` | Inconfort | contexte | faible |
| `gas` | Gaz / besoin de roter | contexte | faible |
| `overstimulation` | Surstimulation | contexte | nulle |
| `stress` | Stress / tension | contexte | nulle |
| `need_for_comfort` | Besoin de réconfort | contexte | nulle |

---

## État du modèle (à améliorer)

`backend/models/cry_xgb_model_meta.json` — XGBoost sur Donate-a-Cry (457
échantillons, étiquetés par les parents, non vérifiés acoustiquement).
- accuracy 0.83 mais **macro-F1 0.18** : ne sépare fiablement que la faim.
- Limite = la **donnée**, pas l'algo.

### Plan de données pour passer à la Couche C
1. Collecter des cris **étiquetés par diagnostic clinique vérifié** (≠ parent).
2. Partenariats maternités / CHU / recherche.
3. Cibler **un** dépistage accessible en premier (ex. drapeau neuro / auditif).
4. Anticiper le statut **dispositif médical** (marquage CE, RGPD/HDS).
5. Exploiter le **baseline personnalisé** (`backend/baseline.py`) : déviation
   par rapport au normal du bébé — fort et achievable sans gros dataset.
