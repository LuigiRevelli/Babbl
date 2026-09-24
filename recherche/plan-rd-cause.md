# Plan R&D : reconnaître la cause des pleurs de CHAQUE bébé

*24/09/2026. Fait suite à `pertinence-detection-cause.md`. Code : `backend/research/`.*

## Où en est la science, exactement

| Approche | Statut | Preuve |
|---|---|---|
| **Un modèle pour tous les bébés** (faim / inconfort / besoin de bras) | **Réfuté** | Lockhart-Bouron 2023 : 36 % contre 33 % au hasard. Notre test sur Donate-a-Cry : 19 % contre 20 % au hasard (5 causes). Parents et auditeurs entraînés : au hasard. |
| **Un modèle par bébé** (appris sur SES pleurs) | **Ouvert** | Testé une seule fois (Lockhart-Bouron 2023), avec 676 séquences étiquetées pour 24 bébés, soit environ 28 par bébé. Au-dessus du hasard pour quelques bébés seulement, meilleur rapport de cotes 2,2, IC95 [0,9 ; 4,8]. Ni démontré, ni réfuté : **trop peu de données par bébé**. |
| **Douleur contre inconfort** | **Signal établi** (en situation contrôlée) | Corvin 2024 : 22 bébés, bain contre vaccin, la rugosité de la voix change. Koutseff 2018. Jamais testé comme alerte à la maison. |
| **Contexte (tétée, éveil, heure) + son → ce qui va calmer** | **Jamais testé** | Aucune publication. Huckleberry SweetSpot n'a aucune validation publiée. |

## Ce que dit notre simulation (`research/power_sim.py`)

On y fait varier deux choses :
- **d**, la force réelle du signal, c'est-à-dire l'écart entre les pleurs de causes différentes chez un même bébé ;
- la **qualité des étiquettes**.

| Scénario | Justesse mesurée (d = 3, k = 10 pleurs par cause) | Bébés nécessaires pour prouver d = 1 (puissance 80 %) |
|---|---|---|
| Étiquettes propres, tous les bébés ont un signal | 93 % | ≤ 10 |
| Réaliste : 1 étiquette sur 2 fausse, 1 bébé sur 2 avec signal | 45 % | > 80 |

**Le goulot n'est pas l'algorithme, c'est la vérité terrain.** Avec les étiquettes habituelles (« ce que le parent pense »), même un vrai signal fort passe inaperçu. C'est probablement pour ça que tout le monde échoue. L'innovation porte donc sur la **collecte d'étiquettes propres**, au moins autant que sur le modèle.

## Le banc de décision (`research/eval_harness.py`)

Pour tout jeu de données au format (bébé, cause, descripteurs, contexte), il mesure quatre choses, toujours sur des bébés ou des pleurs jamais vus :

| Test | Question |
|---|---|
| A | Un modèle commun marche-t-il sur des bébés nouveaux ? |
| B | Un modèle personnel marche-t-il avec k = 10 pleurs étiquetés par cause ? |
| C | Que prédit le contexte seul ? |
| D | Le son ajoute-t-il quelque chose au contexte ? |

Les seuils de décision (go / no-go) sont **fixés à l'avance** : +15 points au-dessus du hasard, significatif au niveau bébé, et +5 points pour « le son ajoute ».

Le banc a été validé sur trois mondes simulés, et ne voit un signal que là où il en existe un. Le **monde 2** (chaque bébé a sa propre signature) donne un modèle commun au hasard (34 %) et un modèle personnel à 91 %. **Les échecs publiés n'excluent donc pas l'approche personnelle.** Sur Donate-a-Cry, le test B est impossible : 89 % des bébés n'y ont qu'une seule cause déclarée.

## Le plan, en 4 étages avec décision à chaque étage

| Étage | Quoi | Coût | Durée | Décision |
|---|---|---|---|---|
| **0** | Passer le banc sur les deux jeux publics avec identifiant de bébé : EnesBabyCries (osf.io/ru7na, 24 bébés) et Corvin 2024 (Zenodo 11061909, 22 bébés, douleur / inconfort). | 0 € | 1 à 2 jours d'ingénieur | Le test B dépasse-t-il le hasard chez des bébés bien fournis ? Quelle force d réelle ? |
| **1** | **Babbl devient le collecteur.** Mode recherche avec consentement : pour chaque pleur, descripteurs acoustiques, contexte, puis « qu'est-ce qui l'a calmé ? », le temps d'apaisement et un « sûr / pas sûr ». Objectif : 50 familles × 60 épisodes. | 5 à 20 k€ | 3 à 6 mois | Le test B est-il en « GO » sur de vraies données ? Le test D ajoute-t-il au test C ? |
| **2** | **Étiquettes propres** avec le laboratoire de Saint-Étienne (Mathevon, Reby) : 20 à 30 familles filmées à domicile, causes annotées à l'aveugle par deux personnes, avec une référence douleur au moment d'un vaccin. | 50 à 150 k€ (Bourse French Tech, i-Nov, ANR) | 12 mois | Précision personnelle réelle ; seuil d'au moins 0,70 d'AUC par cause. Publication. |
| **3** | Produit « **Babbl apprend votre bébé** ». Si c'est la douleur ou une détresse inhabituelle : parcours dispositif médical (classe IIa, étude clinique). | selon le résultat | — | — |

En parallèle, et sans risque : **« ce qui calme votre bébé »**, à partir du contexte et des réponses du parent, sans le son. C'est une recommandation personnalisée, mesurable par le temps d'apaisement, jamais publiée ailleurs, et faisable avec les données que Babbl collecte déjà.

## Le marché, en chiffres (ordres de grandeur)

**Naissances par an :**
- France : environ 663 000 (INSEE, 2024) ;
- Union européenne : environ 3,67 M (Eurostat, 2023) ;
- États-Unis : environ 3,6 M (CDC, 2023).

**Chiffre d'affaires annuel, à 9,99 €/mois pendant environ 6 mois par famille :**

| Part des familles qui paient | France | UE + États-Unis |
|---|---|---|
| 5 % | ≈ 2 M€ | ≈ 22 M€ |
| 20 % | ≈ 8 M€ | ≈ 87 M€ |

Une valorisation d'un milliard demande typiquement environ 100 M€ de revenus récurrents, soit **environ 23 % des familles d'Europe et des États-Unis qui paient**. C'est très ambitieux en abonnement grand public. Deux autres voies :
- une **licence aux fabricants** de babyphones (modèle Zoundream → Philips) ;
- un **dispositif médical** (douleur, détresse inhabituelle).

**Probabilités de réussite (estimations personnelles, pas des calculs) :**
- un modèle commun : moins de 5 % ;
- un modèle personnel qui atteint le « GO » : 10 à 25 % ;
- la recommandation « ce qui calme », par le contexte : plus de 70 %.

**Chaque étage coûte peu par rapport à ce qu'il permet de trancher.**
