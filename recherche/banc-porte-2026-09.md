# Banc de la porte d'entrée — 23/09/2026

**Question.** Quand un parent enregistre un vrai pleur au téléphone, combien de fois Babbl répond-il à tort « pas de pleur net » ?

**Corpus.** Donate-a-Cry (github.com/gveres/donateacry-corpus) : clips de 7 s envoyés par des parents depuis une app iOS ou Android, le format le plus proche de Babbl qui existe publiquement. 457 pleurs retenus par les conservateurs du corpus, dont 366 de 0 à 6 mois, plus 1 128 fichiers bruts tels que les téléphones les ont envoyés (AMR 8 kHz 12 kb/s sur Android, IMA ADPCM 16 kHz sur iPhone). Les étiquettes de cause ne servent à rien ici.

**Reproduire.** `python backend/bench/gate_bench.py <chemin du corpus>`

## Résultats

Trois corpus. Positifs : 366 pleurs de 0-6 mois au téléphone (Donate-a-Cry) et 40 pleurs d'une autre source (ESC-50). Négatifs : 1 960 sons réels d'ESC-50 qui ne sont pas des pleurs, et 60 clips de voix d'hommes adultes (Free Spoken Digit Dataset).

| Porte | Vrais pleurs rejetés (téléphone / ESC-50) | Non-pleurs acceptés |
|---|---|---|
| v2 (≥ 20 % voisé, hauteur médiane 250-800 Hz) | 21 % / 12,5 % | 16,6 % |
| v3 sans critère de variation (poussée puis corrigée le même jour) | 1,9 % / 0 % | 49 % |
| **v3 actuelle** (≥ 5 % du clip dans la bande 255-1000 Hz, hauteur qui varie d'au moins 0,05 octave) | **2,2 % / 0 %** | **36,6 %** |

| Mêmes 366 pleurs, fichiers bruts compressés | Rejetés à tort |
|---|---|
| Android, AMR 12 kb/s (222 pleurs) | 1,4 % |
| iPhone, ADPCM (144 pleurs) | 2,1 % |

*(Chiffres de codec mesurés avant l'ajout du critère de variation.)*

**Ce qui passe encore :** chats, sirènes, coqs, rires, alarmes, et environ un tiers des bruits de la maison. Leur son ressemble à celui d'un pleur, ou pyin y trouve des trames voisées. Le babillage et la voix adressée au bébé passent aussi (tests « échec attendu »).

**Pourquoi pas mieux.** Un seuil de variation plus haut rejetterait plus de bruits, mais risquerait de refuser un pleur anormalement monotone, justement celui qui ne doit pas être refusé. Un classifieur appris (arbre de décision) atteignait 2,7 % / 7,6 % en validation croisée, mais entraîné sans les pleurs d'ESC-50, il en acceptait 0 % : il avait appris à reconnaître le micro du téléphone (platitude spectrale nulle après codec), pas le pleur. Il a été écarté.

**Reproduire :**

```
python backend/bench/gate_bench.py <donateacry-corpus>
python backend/bench/negatives_bench.py <ESC-50> <free-spoken-digit-dataset>
```

## Pourquoi la version 2 rejetait un pleur sur cinq

1. **Sous-multiples.** Le suivi de hauteur (pyin) lisse sa trajectoire sur tout le clip. Quand une voix plus grave est présente, il décode le pleur à la moitié ou au tiers de sa vraie hauteur. 23 pleurs rejetés avaient une hauteur collée au plancher de 200 Hz.
2. **Médiane du clip entier.** Un adulte qui parle par-dessus le pleur tirait la hauteur médiane sous 250 Hz, et tout le clip était rejeté.

La version 3 cherche la hauteur seulement dans la bande du pleur, jette les trames collées au plancher (voix plus graves), et demande que 5 % du clip soit un pleur, où qu'il soit dans le clip.

## Les trois mots de continuité

Seuils posés sur les tertiles des 359 pleurs acceptés : 0,355 et 0,578. Sur ce corpus, « presque continu », « coupé de pauses » et « entrecoupé de longues pauses » sortent chacun environ une fois sur trois (119, 124, 116). Ce sont des descriptions du clip, pas des niveaux de détresse.

## Limites

- Les négatifs ne sont pas enregistrés au téléphone dans une maison : ESC-50 vient de Freesound. Aucun babillage réel, aucune voix de femme réelle, aucune vraie télé. C'est la prochaine donnée à collecter.
- Les 671 fichiers bruts que les conservateurs n'ont pas retenus sont rejetés à 21 %. On ne sait pas lesquels sont des pleurs, donc ce chiffre ne mesure rien.
- Le corpus date de 2015, clips de 7 s, sans distance connue. Il ne remplace pas un test sur l'app elle-même (Opus dans Chrome, AAC sur iPhone récent).
- Environ 20 % des clips du corpus viennent d'enfants de plus de 7 mois : ils sont exclus du chiffre principal (rejet 3,3 % sur eux).
