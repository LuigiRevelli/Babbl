# Babbl — Science & Taxonomie

Ce que le produit fait, et pourquoi. La démonstration complète (21 pistes,
399 sources, vérification adverse) est dans `SYMPTOMS.md` (version lisible)
et `SYMPTOMS-TECHNIQUE.md` (références, réglementaire, revue du code).
À lire avant de toucher au modèle, à la taxonomie ou au discours produit.

**Autre question, autre document :** est-ce que *utiliser* Babbl aide les parents, et
peut-il leur nuire ? Ce qu'on sait, ce que ça a changé dans le produit, et
comment le prouver (tests d'usage → essai randomisé) : `recherche/programme-recherche.md`.

Code associé :
- `backend/taxonomy.py` — taxonomie canonique (source unique de vérité backend)
- `frontend/src/lib/taxonomy.ts` — miroir frontend (mêmes clés, mêmes textes)
- `backend/triage_rules.py` — règles déterministes (porte d'entrée, observation, hypothèses, cartes)
- `backend/mistral_client.py` — LLM contraint + garde-fou
- `backend/tests/` — tests sans réseau

---

## Ce qu'un pleur porte — et ne porte pas

Un pleur de nourrisson porte de façon fiable **trois choses** : le niveau de
détresse à l'instant, l'âge approximatif du bébé, et son identité.
**Aucune cause. Aucune maladie.**

Les 21 pistes qu'une analyse de pleur pourrait prétendre détecter ont été
confrontées à la littérature puis attaquées par des relecteurs indépendants :
**0 livrable, 1 en recherche, 8 utilisables seulement en contexte, 12 à
retirer**. Chaque piste tombe dans un de trois tiroirs :

| Tiroir | Ce que ça veut dire | Exemples |
|---|---|---|
| **A. Le signal n'existe pas** | On a cherché, il n'y a rien | coliques, reflux, otite, dents, allergie, « langage » de Dunstan |
| **B. Le signal existe, mais pas chez nous** | Mesuré à l'hôpital, dans les premiers jours, avec du matériel fixe — avant le retour à la maison | asphyxie, atteinte neurologique, prématurité |
| **C. Le signal existe, mais la maladie est trop rare** | Même au meilleur résultat publié, une alerte à domicile serait fausse 225 fois sur 226 | drapeau neuro, surdité, cri-du-chat |

> **Un test peut être bon *et* inutilisable.**

---

## Ce que Babbl affiche : deux couches, rien d'autre

### Couche 1 — Observation sonore (ce que le micro a mesuré)

Sur les secondes enregistrées : continuité du pleur et hauteur moyenne,
rendues en **texte**, sur trois niveaux (faible / modéré / intense).

- Jamais chiffrée au parent, jamais stockée, jamais historisée : elle
  n'existe que sur l'écran de résultat, le temps de l'afficher.
- Jamais rassurante. Un pleur faible ou éteint n'est pas présenté comme
  normal : sepsis, méningite et hypertension intracrânienne se présentent par
  un nourrisson qui pleure peu.
- Ce n'est pas une échelle validée. C'est le maximum que la preuve autorise,
  en attendant les expériences 0 à 2 du plan de données.

### Couche 2 — Hypothèses contextuelles (ce que le parent a saisi)

`hunger · discomfort · fatigue · need_for_comfort`

Déduites de la dernière tétée, de la dernière couche, de la durée d'éveil et
de l'âge. **Jamais du son. Jamais en pourcentage.** Chaque hypothèse porte sa
raison en une phrase et la mention « Cette piste vient de ce que vous avez saisi, pas du son ».

### Cartes de sécurité (statiques)

Trois cartes à contenu fixe, **toujours affichées**, mises en avant selon
l'âge et ce que le parent saisit (fièvre mesurée), jamais selon le son :
fièvre avant 3 mois · respiration · nouveau-né de moins de 15 jours.
Identiques sur tous les écrans, pour que leur absence ne puisse jamais se
lire comme un feu vert. Formulation à faire relire par un professionnel de
santé français avant publication.

### Le LLM (Claude Sonnet)

Rédige le résumé chaleureux et les gestes à partir des deux couches. Il ne
reçoit ni descripteurs acoustiques ni score. Interdits : pourcentage, nom de
maladie, niveau d'alerte, « le son indique ». Sa sortie passe par un
garde-fou (`sanitize_llm_output`) ; au moindre écart, le résumé déterministe
prend le relais.

---

## Ce que Babbl ne prétendra jamais entendre

Une cause (faim, fatigue, gaz…) · une douleur · une maladie (colique,
reflux, otite, dents, allergie, infection) · un risque (neurologique,
auditif, autisme, mort subite) · un « profil normal » du bébé.

---

## État du modèle ML : débranché

`backend/ml_model.py` (XGBoost, Donate-a-Cry, 457 échantillons étiquetés par
les parents) n'est plus appelé. Accuracy 0,826 alors que répondre toujours
« faim » obtient 0,836 (382/457) ; rappel 0,000 sur quatre classes sur cinq.
**Il ne sépare rien.** Conservé uniquement pour l'expérience 6 (benchmark
d'honnêteté contre le plafond 36 % vs 33 % du corpus EnesBabyCries1).

Le profil acoustique par bébé (`backend/baseline.py`) continue de se
constituer **en silence** : aucune sortie « déviation » n'est défendable
(le score mesurait surtout la distance du téléphone). Suite connue : rattacher
la référence au bébé plutôt qu'au compte (schéma Supabase).

---

## Chaîne de capture

`frontend/src/lib/recorder.ts` : micro brut pour le pleur (réglage
automatique du volume, réduction de bruit et annulation d'écho désactivés),
clip fixe de 10 s, format choisi avec repli (iOS). Sans cette chaîne
contrainte, aucune science acoustique n'est possible. Le backend refuse un
enregistrement trop court ou sans pleur (422) plutôt que de répondre sur rien.

---

## Statut réglementaire

La destination d'un logiciel se fixe sur ses supports promotionnels
(MDR 2017/745, art. 2(12)). « Dépistage précoce par le cri » qualifiait déjà
Babbl comme dispositif médical, sans voie de marquage CE faute de preuve
clinique. Le produit ne diagnostique rien, n'alerte pas depuis le son et ne
rassure pas : c'est la seule position que la preuve autorise. À faire
confirmer par un conseil réglementaire (MDR, AI Act art. 6, directive (UE)
2024/2853 sur la responsabilité produit). Les lectures ci-dessus sont celles
de non-juristes.

---

## Plan de données (par ordre de coût)

0. **Chaîne de capture contrainte** — fait (`recorder.ts`).
1. **Étude de dégradation** : cris cliniques repassés par une chaîne téléphone réaliste.
2. **Test-retest du canal** : même pleur, 20 cm / 1 m, iOS / Android, deux téléphones, un week-end.
3. **Composantes de variance + résidu intra-bébé** sur EnesBabyCries1 (39 201 pleurs, 24 bébés, gratuit). Partenaire naturel : ENES / CNRS, Saint-Étienne.
4. **Taux de base de la « voix atypique »** chez les bébés sains du corpus Babbl.
5. **Expérience de sécurité** : un indicateur d'intensité rend-il le parent plus calme ou plus inquiet ? (le facteur de risque mesuré du bébé secoué est le *jugement* parental, pas la quantité de pleurs).
6. **Benchmark d'honnêteté** : le XGBoost contre le plafond 36 % vs 33 %.
7. **Cohorte APLV prospective**, uniquement si 1 est positif.

Impossible sans hôpital : toute donnée exigeant une étiquette clinique
(hémoculture, ponction lombaire, Sarnat, test auditif, bilirubine, caryotype).
Aucune échelle d'utilisateurs ne le résout.
