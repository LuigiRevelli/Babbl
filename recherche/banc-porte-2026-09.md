# Banc de la porte d'entrée — 23/09/2026

**Question.** Quand un parent enregistre un vrai pleur au téléphone, combien de fois Babbl répond-il à tort « pas de pleur net » ?

**Corpus.** Donate-a-Cry (github.com/gveres/donateacry-corpus) : clips de 7 s envoyés par des parents depuis une app iOS ou Android, le format le plus proche de Babbl qui existe publiquement. 457 pleurs retenus par les conservateurs du corpus, dont 366 de 0 à 6 mois, plus 1 128 fichiers bruts tels que les téléphones les ont envoyés (AMR 8 kHz 12 kb/s sur Android, IMA ADPCM 16 kHz sur iPhone). Les étiquettes de cause ne servent à rien ici.

**Reproduire.** `python backend/bench/gate_bench.py <chemin du corpus>`

## Résultats

| Porte | Vrais pleurs 0-6 mois rejetés à tort |
|---|---|
| Version 2 (≥ 20 % de trames voisées et hauteur médiane 250-800 Hz) | **77 / 366 = 21 %** |
| Version 3 (≥ 5 % du clip voisé dans la bande 255-1000 Hz) | **7 / 366 = 1,9 %** |

| Mêmes 366 pleurs, fichiers bruts compressés | Rejetés à tort |
|---|---|
| Android, AMR 12 kb/s (222 pleurs) | 1,4 % |
| iPhone, ADPCM (144 pleurs) | 2,1 % |

La mesure sur fichier compressé et sur fichier propre est quasi identique (corrélation 0,998).

**Toujours refusés** (signaux synthétiques, tests automatiques) : bruit blanc de télé, musique à 220 Hz, voix d'homme 120-130 Hz, voix de femme 210 Hz, silence.
**Toujours acceptés à tort** : babillage et voix adressée au bébé dans la bande d'un pleur (270-300 Hz), mélodie au-dessus de 255 Hz. Même comportement qu'avant. Deux tests « échec attendu » le reproduisent.

## Pourquoi la version 2 rejetait un pleur sur cinq

1. **Sous-multiples.** Le suivi de hauteur (pyin) lisse sa trajectoire sur tout le clip. Quand une voix plus grave est présente, il décode le pleur à la moitié ou au tiers de sa vraie hauteur. 23 pleurs rejetés avaient une hauteur collée au plancher de 200 Hz.
2. **Médiane du clip entier.** Un adulte qui parle par-dessus le pleur tirait la hauteur médiane sous 250 Hz, et tout le clip était rejeté.

La version 3 cherche la hauteur seulement dans la bande du pleur, jette les trames collées au plancher (voix plus graves), et demande que 5 % du clip soit un pleur, où qu'il soit dans le clip.

## Les trois mots de continuité

Seuils posés sur les tertiles des 359 pleurs acceptés : 0,355 et 0,578. Sur ce corpus, « presque continu », « coupé de pauses » et « entrecoupé de longues pauses » sortent chacun environ une fois sur trois (119, 124, 116). Ce sont des descriptions du clip, pas des niveaux de détresse.

## Limites

- Pas de vrais clips négatifs (babillage réel, voix réelles, télé réelle) : ils sont synthétiques. Le taux de faux pleurs acceptés n'est pas mesuré.
- Les 671 fichiers bruts que les conservateurs n'ont pas retenus sont rejetés à 21 %. On ne sait pas lesquels sont des pleurs, donc ce chiffre ne mesure rien.
- Le corpus date de 2015, clips de 7 s, sans distance connue. Il ne remplace pas un test sur l'app elle-même (Opus dans Chrome, AAC sur iPhone récent).
- Environ 20 % des clips du corpus viennent d'enfants de plus de 7 mois : ils sont exclus du chiffre principal (rejet 3,3 % sur eux).
