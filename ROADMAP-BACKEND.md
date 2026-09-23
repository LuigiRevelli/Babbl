# Babbl — Feuille de route backend

> Comment rendre le backend le plus fiable et le plus unique possible.
> Méthode : 5 architectes (fiabilité, science acoustique, unicité produit, sécurité/réglementaire, données) ont proposé 39 améliorations en lisant le code ; chaque proposition a été attaquée par 2 sceptiques qui ont **reproduit les mesures sur le dépôt**. Ne restent que les items qui ont survécu aux deux. Date : 21/09/2026.

## Le verdict, en quatre phrases

**Fiable** veut dire : le même pleur donne le même mot à 20 cm et à 1 m, sur iPhone et Android, télé allumée ou non — et quand ce n'est pas possible, Babbl dit « je n'entends pas assez bien » au lieu de deviner. **Aujourd'hui ce n'est pas le cas** : les sceptiques ont mesuré qu'un bruit de télé passe la porte d'entrée et ressort « intense », et qu'éloigner le téléphone transforme un pleur soutenu en pleur « faible ».
**Unique** veut dire : Babbl est la seule app qui **mesure sa propre mesure** (taux de refus, répétabilité sur un corpus public) et dont les garde-fous sont des **invariants testés**, pas des disclaimers. Un concurrent qui prétend entendre une maladie ne peut pas publier ça sans s'exposer.
Avant toute amélioration, **sept défauts sont en production** — dont trois introduits ce matin. Ils passent en premier.

---

## Ce mois-ci — les défauts d'abord (~5 jours au total)

Ordre = gravité. Chaque item a été reproduit par au moins deux sceptiques.

### 1. L'écran de refus n'a aucune carte de sécurité (~3 h)
- **Constat** : si Babbl refuse l'enregistrement (422 « pas de pleur »), le parent voit une popup `alert()` et rien d'autre — ni carte, ni bouton 15. Or « pas de pleur » est **le cas dangereux** (bébé léthargique = présentation d'un sepsis). Le message « rapprochez le téléphone » impute en plus le silence à un défaut de micro.
- **Faire** : toute réponse 422 embarque les 3 cartes + la phrase « un bébé qui pleure peu n'est jamais rassurant en soi » ; le frontend (`babbl/Home.tsx`) les affiche à la place de la popup ; message reformulé.
- **Fichiers** : `app.py`, `triage_rules.py`, `pages/babbl/Home.tsx`, `tests/test_api.py`.
- **1er pas** : le test qui poste un WAV silencieux et exige `safety.cards` dans le 422. Il échoue aujourd'hui.

### 2. Les pleurs des bébés restent sur le serveur, et le serveur est ouvert (~4 h)
- **Constat** : `backend/tmp/` contient 22 fichiers depuis avril — pleurs, échantillons de voix de parents, mp3 en voix clonée. Aucun `os.remove`. `/api/audio/<fichier>` sert n'importe quel fichier sans mot de passe. `/api/voice/clone` est ouvert à Internet : **n'importe qui peut cloner n'importe quelle voix avec la clé ElevenLabs de Babbl**. Le jeton d'identité est décodé sans vérifier sa signature.
- **Faire** : `finally: os.remove(audio_path)` après l'extraction (pleurs **et** voix) ; purge de `tmp/` ; balai 24 h sur les mp3 ; `/api/audio` limité aux mp3 du jour ; authentification obligatoire + limite de débit sur `/api/analyze` et `/api/voice/clone` ; signature du jeton vérifiée (PyJWT), 401 sans écriture si invalide.
- **Décision à prendre** : le frontend n'envoie jamais de jeton → l'étape 8 du backend (profil + insert) **ne tourne jamais en production**, et le frontend écrit lui-même dans Supabase avec la clé publique. Un seul écrivain : le backend, avec jeton vérifié. Supprimer l'insert côté frontend.
- **Fichiers** : `app.py`, `elevenlabs_client.py`, `lib/api.ts`, `pages/babbl/Home.tsx`, `requirements.txt`.

### 3. Le garde-fou laisse passer la fausse réassurance (~3 h)
- **Constat** (script exécuté sur `_FORBIDDEN`) : « tout est normal, ton bébé va très bien », « rien d'inquiétant », « huit chances sur dix », « consulte un médecin dès ce soir » **passent**. « les signes sont évidents » est bloqué (par « dents »). Pire : `taxonomy.py` dit lui-même « très fréquent chez un bébé **en bonne santé** » — une réassurance sur la santé déduite du son, en production. `comfort_messages.py` garde « Je sais que ça fait mal » et « Tout va bien » ×5.
- **Faire** : étendre le regex à la réassurance (normal, habituel, tout va bien, rassur, rien d'inquiétant, en bonne santé, en pleine forme, chances sur, consulte) ; retirer « en bonne santé » de l'observation ; supprimer les 4 clés mortes et réécrire « Tout va bien » ; `tests/test_honesty.py` passe **toutes** les phrases destinées au parent (taxonomy, comfort_messages, repli, i18n) au crible ; `test_redteam.py` avec les 7 phrases mesurées.
- **Fichiers** : `mistral_client.py`, `taxonomy.py`, `taxonomy.ts`, `comfort_messages.py`, `tests/`.

### 4. La porte d'entrée reconnaît un volume, pas un pleur (~3 jours)
- **Constat** : un bruit blanc de niveau 0,02 passe la porte et ressort « intense » (hauteur mesurée : 2 033 Hz) ; une musique à 220 Hz passe « modéré » ; une voix d'adulte passe. La hauteur vient de `piptrack`, qui prend le pic le plus fort — souvent une **harmonique** : sur 4 vrais pleurs du dépôt, 750/683/783/842 Hz contre 398/300/332/232 Hz avec pYIN (facteur 2 à 3,6). Le seuil « intense ≥ 450 Hz » a donc été posé sur des chiffres faux. Et `silence_ratio` dépend du volume capté : −26 dB fait basculer « intense » → « modéré », et du bruit de fond fait l'inverse (le pleur devient *plus* intense).
- **Faire** : `librosa.pyin(fmin=200, fmax=1000)`, médiane des trames voisées ; porte = ≥ 20 % de trames voisées **et** hauteur médiane dans 250-800 Hz ; continuité = fraction voisée (indépendante du gain) ; retirer la hauteur absolue de la règle de niveau ; test d'invariance au gain (0 / −12 / −26 dB → même mot) ; `feature_version` dans les descripteurs et remise à zéro des profils existants (les anciennes lignes sont incompatibles).
- **Fichiers** : `audio_analysis.py`, `triage_rules.py`, `baseline.py`, `tests/`.
- **1er pas** : trois tests qui échouent aujourd'hui (bruit blanc, 220 Hz, pleur à −24 dB → 422).

### 5. Le bébé, pas la tranche d'âge (~2 jours)
- **Constat** : le frontend envoie `babyAgeMonths = 2` pour toute la tranche « 0-3 » et jamais `babyAgeDays` → la carte « nouveau-né de moins de 15 jours » **ne peut jamais s'allumer** en production. La règle « fièvre ≥ 38 °C » dans `safety_cards()` est une règle de décision sur une mesure physiologique → exactement ce que le MDCG 2019-11 décrit comme triage.
- **Faire** : date de naissance obligatoire à l'onboarding, `age_days` calculé côté backend ; cartes mises en avant **par l'âge seul** ; retirer la règle fièvre et ne pas collecter la température (le texte HAS « 38 °C » reste, il est statique). Semaines de gestation : plus tard, avec le conseil (données de santé → hébergement HDS).
- **Fichiers** : `triage_rules.py`, `pages/Welcome.tsx`, `lib/userData.ts`, `pages/babbl/Home.tsx`.

**Aussi ce mois, en quelques heures chacun** : délais réseau (LLM 8 s, voix 6 s, message de réconfort dans un second appel ; config gunicorn — aujourd'hui 3 × 60 s en série, worker tué à 30 s) · AI Act art. 50, en vigueur depuis le 2 août 2026 : afficher « résumé rédigé par une IA » et « voix synthétique » (`guidance_source` existe, jamais affiché) · verrouiller les versions (`uv pip compile`, numba/scipy non fixés) et une CI qui lance les 10 tests · envoyer `awakeSinceAt` depuis le frontend (le backend le lit déjà).

---

## Ce trimestre — mesurer avant d'affirmer

### 6. Le banc d'essai sur EnesBabyCries1 (~3 semaines)
- 39 201 pleurs, 24 bébés, enregistrés à domicile — le seul corpus au monde dans nos conditions. **Licence : « No License » sur OSF** → écrire à l'équipe ENES (Mathevon, Saint-Étienne) **avant** tout téléchargement.
- Faire passer chaque pleur par la chaîne réelle, puis dégradé : Opus 32 kb/s et AAC (ce que font Chrome et iPhone), −6/−12/−20 dB, bruit rose à 20/10/5 dB, réverbération. Publier en interne : « à −12 dB, le mot d'intensité est stable X fois sur 10 ». Recalibrer les 3 niveaux sur des tertiles réels.
- C'est **le chiffre unique de Babbl**. Interne jusqu'à l'avis du conseil.
- **1er pas** : le mail d'une page à l'ENES.

### 7. « Qu'est-ce qui l'a calmé ? » — la seule étiquette honnête (~3 jours)
- Remplacer le pouce haut/bas (stocké seulement dans le téléphone) par une question posée **à la réouverture de l'app**, jamais par notification sonore la nuit : tétée / couche ou position / sommeil / bras et voix / votre voix Babbl / rien encore / je ne sais pas. Liste fermée dans `taxonomy.py`, aucune clé de maladie.
- C'est exactement l'étiquette du corpus ENES (l'action qui a fait cesser le pleur). Un traducteur de pleurs qui pose cette question **fabrique son propre taux d'erreur**.
- Réserve du sceptique : cette étiquette vaut à peine mieux que l'avis du parent (35 % vs 36 % dans l'article). Elle sert à la comparabilité et au rapport médecin, pas à entraîner quoi que ce soit.

### 8. Syllabes et pauses — une intensité faite de durées (~4 jours, après le banc)
- Découper les trames voisées en syllabes (pauses ≥ 150 ms) ; nombre, durée médiane, rapport son/pause. Des durées ne dépendent ni du micro, ni de la distance, ni du codec — c'est le marqueur d'intensité le plus robuste au téléphone (Corvin 2025 : 2,1 s en douleur aiguë vs 1,3 s en inconfort).
- **Garde-fous** : trois mots seulement ; jamais renvoyé au client, jamais stocké, jamais « pleur de douleur ». Ne remplace la continuité qu'après la mesure de répétabilité du banc.

### 9. Observabilité sans fuite, versions dans la réponse (~3 jours)
- Journaux JSON sur la sortie standard, `request_id` seul (jamais d'identifiant utilisateur), durée par étape, code de porte, source du résumé, **motif** du garde-fou (jamais le texte). Constantes `VERSION` (taxonomie, règles, prompt) renvoyées dans chaque réponse. Compteurs agrégés sans `user_id`. Test : un prénom rare dans le contexte n'apparaît jamais dans les logs.
- Aujourd'hui : uniquement des `print()`, et `str(e)` peut recopier le contexte (donc le prénom) dans un message d'erreur.

### 10. Le rapport médecin depuis les données du parent (~3 jours, après 2 et 5)
- Côté serveur, 7 jours : âge exact, tétées, couches, ce qui a calmé, hypothèses et cartes affichées. **Aucune mesure sonore.** Phrase fixe en tête. Contrôle que le bébé appartient au compte.
- Un pédiatre jette « douleur 62 % » ; il lit « 11 épisodes, surtout 18 h-22 h, la tétée a calmé 7 fois » — c'est l'anamnèse qu'il reconstitue lui-même.
- Aujourd'hui `BabblReport.tsx` affiche « Aucune saisie » après rechargement : les hypothèses ne sont pas persistées.

---

## Cette année — recherche et cadre légal

11. **Le résidu intra-bébé sur ENES** (recherche, ~1 an) : une fois retirés l'effet bébé, l'âge, la position dans la crise et la cause, reste-t-il quelque chose dans le son ? Verdict binaire pré-enregistré. Première livraison : le mail à l'ENES. Question inoccupée dans la littérature.
12. **Catalogue de phrases relues** (~4 semaines + relecture santé) : le LLM ne compose plus, il **choisit** dans un catalogue relu par un professionnel de santé, variables calculées côté serveur. Le modèle ne peut physiquement produire qu'une phrase déjà validée. Après un A/B interne sur la chaleur perçue.
13. **Consentement et « don de pleurs »** (~4 semaines + conseil) : consentement séparé et révocable pour donner l'audio, AIPD (analyse d'impact CNIL — obligatoire : mineurs + usage innovant), durées de rétention écrites, `DELETE /api/me` qui efface tout, voix ElevenLabs comprises.
14. **Journal des pleurs saisi par le parent** — **conditionnel** : seulement si l'expérience « un indicateur calme-t-il ou inquiète-t-il ? » est positive et qu'un professionnel de santé a relu l'écran. Version parent = liste d'épisodes **sans total de minutes** ; les totaux n'apparaissent que dans le rapport médecin.
15. **Métriques d'honnêteté publiées** (`GET /api/honesty`) : après l'avis du conseil. Les compteurs existent dès l'item 9.

---

## Le fossé — ce qu'un traducteur de pleurs ne peut pas copier

1. **Le contexte saisi par le parent au centre** : le mettre au centre, c'est avouer que le micro n'entend pas la cause.
2. **L'étiquette « ce qui a calmé »** : un concurrent qui la pose fabrique son propre taux d'erreur.
3. **La répétabilité publiée sur un corpus public** : un concurrent qui prétend entendre une maladie ne peut pas publier la sienne.
4. **Des invariants testés** (cartes toujours présentes, phrases issues d'un catalogue relu, versions dans chaque réponse), pas des disclaimers.
5. **La voix clonée rattachée à l'hypothèse, à l'âge et au prénom** — jamais à un « état détecté ».

---

## À ne pas faire

1. **Écoute continue** (Babbl Nuit, Babbl Monitor, compter les pleurs au micro) : art. 226-1 du code pénal, règle 11b du MDR.
2. **Réafficher une déviation, un « profil habituel », une jauge, un score, une couleur ou une courbe d'intensité** : c'est le chemin direct vers la règle 11 et vers le jugement « il pleure trop » (×2,6 de risque de secouement).
3. **Un détecteur de rugosité/chaos pour afficher « pleur de douleur »** ; **une empreinte vocale par bébé** (donnée biométrique, art. 9 RGPD).
4. **Réentraîner un classifieur son → cause**, même sur « ce qui a calmé » (plafond 36 % vs 33 %) ; rebrancher le XGBoost ; un gros modèle audio « pour voir ».
5. **Babbl Alert** (triage à 4 niveaux, pédiatre selon la cause) et la voie dispositif médical maintenant : classe IIa au minimum, organisme notifié, 12-24 mois, budget à six chiffres (ordre de grandeur).

Aussi : pas de fièvre ni d'autre mesure physiologique collectée ; pas de « qualité d'enregistrement 72 % » ; pas de second LLM comme barrière principale (il se trompe aussi, en silence) ; pas de normes de pleurs, percentiles ou « excessif » ; pas de récompense à enregistrer plus (XP, badge « night_owl », « votre temps de réponse s'améliore »).

---

## Écarté par les sceptiques

- **HNR / jitter / shimmer affichés** (« pleur rauque et instable ») — détection de douleur par la porte de derrière ; acceptable uniquement comme colonnes silencieuses du banc d'essai.
- **Vérification du locuteur** — résout le mauvais problème (la clé est le compte, pas le bébé) avec une biométrie.
- **Format d'export partenaire** — cérémonie : ni corpus, ni partenaire, ni accord ; et « anonymisation par construction » est faux, l'identité est dans le cri.
- **Journal avec boutons « ça commence / c'est fini »** — réintroduit le mécanisme de risque nommé par l'étude ; reporté sous conditions (item 14).
- **Table scellée par utilisateur du niveau d'intensité et de la sortie brute du LLM sur 10 ans** — contredit la doctrine « jamais historisé » ; réduit à versions + compteurs agrégés (item 9).
- **Test des allégations sur FEATURES/BUSINESS_MODEL** — prémisse fausse : le dépôt est **privé**, ces fichiers ne sont pas des supports promotionnels. Le test reste utile sur `i18n.ts` et les pages `/legacy/*` encore montées, qui portent encore « alerte », « détecté au son ».

---

## Réserves

- **Trafic réel** : 21 fichiers en cinq mois, presque tous des tests. Toute stratégie « corpus Babbl » suppose des utilisateurs qui n'existent pas encore → le banc public (item 6) passe avant.
- **Le conseil réglementaire** (point 10 de SYMPTOMS.md) n'est planifié nulle part ; trois items en dépendent pour être publiés (rapport médecin, métriques, catalogue). L'appel reste à passer (Luigi).
- **Désaccord fièvre** : l'angle produit voulait la fièvre dans la fiche contexte avec carte immédiate ; l'angle sécurité la refuse (règle de triage, données de santé → HDS). Tranché : âge seul, pas de collecte. À confirmer par le conseil.
- **Désaccord journal** : science « conditionnel », sécurité « non » ; tranché en « cette année, sous conditions ».
- **Semaines de gestation** = donnée de santé de l'enfant → hébergement certifié HDS. Reporté.
- Toutes les durées sont des estimations d'ingénierie, pas des résultats d'étude.
