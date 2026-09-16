# Babbl — SYMPTOMS.md

> Ce que Babbl peut, et ne peut pas, entendre dans un pleur.
> Document de décision produit. Aucune ligne ici n'est du marketing.
> À lire avec `SCIENCE.md` (dont il corrige plusieurs erreurs), `backend/taxonomy.py` et `frontend/src/lib/taxonomy.ts`.

---

## Verdict

Sur 21 candidats passés en revue puis soumis à une vérification adverse, **aucun n'atteint le palier « livrable maintenant »**. Un pleur de nourrisson ne porte de façon fiable que trois choses — un **niveau de détresse gradué**, l'**âge** du bébé et son **identité** — et aucune cause, aucune maladie. Tout ce que Babbl affiche aujourd'hui repose soit sur un modèle qui est **sous** la ligne de base de la classe majoritaire (0,826 contre 0,836 ; rappel 0,000 sur quatre classes sur cinq), soit sur des **constantes codées en dur** (« surstimulation » = `0.01` dans `ml_model.py`), soit sur des **propriétés de l'enregistrement** — la distance du téléphone, la durée du clip — présentées au parent comme des propriétés de son bébé. Le positionnement « stéthoscope acoustique » n'est pas seulement invalidé scientifiquement : il **qualifie déjà** Babbl comme dispositif médical au sens du MDR (la destination se fixe sur les supports promotionnels, art. 2(12)), à une classe IIa-III dont la voie de marquage CE est indisponible faute de preuve clinique. Ce qui reste est étroit mais réel et différenciant : une observation d'intensité en texte, un triage contextuel honnête à partir de ce que le parent saisit, des cartes de sécurité HAS inconditionnelles, l'âge gestationnel demandé à l'onboarding, et le débunkage sourcé des promesses concurrentes. **La position défendable de Babbl n'est pas « l'application qui entend la maladie », c'est « la seule application qui dit au parent ce que le son ne prouve pas ».**

---

## Liste finale

Paliers : **context_only** = livrable, mais jamais comme sortie audio · **rd_target** = recherche, pas fonctionnalité · **exclude** = à retirer du produit.
Notes de preuve : A = preuve solide (y compris solide **contre** le candidat) · D = aucune preuve en faveur.
Faisabilité maison : 0 = impossible · 5 = trivial.

### Palier 1 — Contexte uniquement (8 candidats) : ce que Babbl peut livrer

| # | Symptôme | Ce que le son prouve | Preuve | Faisab. maison | Fenêtre d'âge | Formulation autorisée | MDR |
|---|---|---|---|---|---|---|---|
| 1 | **Prématurité / pronostic neurodéveloppemental** | Le statut de prématuré (92,4 %) — inutile, le parent le sait. Le pronostic individuel : AUROC 0,546-0,576, quasi hasard | **A** (contre) | 1 | Preuve à l'âge équivalent au terme, donc **à l'hôpital** | « Votre bébé est né à 32 SA : Babbl utilise l'âge corrigé pour tous ses repères. Le cri ne permet pas de prédire son développement. » | Hors DM si simple champ d'onboarding. IIa/IIb dès qu'un pronostic est affiché |
| 2 | **États du quotidien** (fatigue, inconfort, surstimulation, réconfort) | **Rien.** Un seul axe d'éveil, quatre étiquettes | **B** | 1 | Nul démontré à 15 j-3,5 mois **et** à 5-10 mois | « D'après la durée d'éveil que vous avez indiquée (2 h 10), la fatigue est l'hypothèse la plus probable — le son ne permet pas de la confirmer. » | Hors DM en texte. Art. 7 MDR (signe figuratif trompeur) dès qu'une barre de % apparaît |
| 3 | **Niveau de détresse / intensité** | L'intensité de l'éveil **pendant** les 10 s enregistrées. Pas la douleur, pas la cause, pas comparable entre bébés | **C** | 2 | Preuve à 0-7 j en maternité ; rien entre 3 et 12 mois | « Sur ces 10 secondes, Babbl a entendu un pleur intense. Un pleur intense est très fréquent chez un bébé en bonne santé — et un pleur faible, geignard ou éteint n'est jamais rassurant. » | Hors DM en observation textuelle non stockée. **IIa** dès que le score est chiffré, stocké ou historisé (règle 11, volet surveillance) |
| 4 | **Faim** | **Rien.** 36 % contre 33 % de hasard ; auditeurs humains entraînés 34,8 % | **D** | 1 | Négatif sur toute la fenêtre 0-12 mois | « Dernière tétée il y a 4 h — les pleurs sont un signe **tardif** de faim, proposez le sein ou le biberon sans attendre une analyse. » | Hors règle 11 seule, mais interdit tant qu'elle partage le dénominateur normalisé avec « Douleur » (MDCG 2019-11 §7) |
| 5 | **Respiratoire / voies aériennes** | **Rien de captable.** Le stridor est inspiratoire et faible ; notre clip est dominé par l'expiration | **D** | 1 | Aucune tranche où maladie **et** preuve coïncident | Carte statique HAS bronchiolite, fermée par : « Ces signes s'observent avec les yeux, pas avec le micro. » | Nommer = règle 11, lecture honnête **classe III**. Compter des événements = IIb (sous-règle 11b, paramètre vital). Reproduire la fiche HAS sans inférence = hors DM |
| 7 | **« Cinq mots » de Dunstan** | **Rien.** Aucun gabarit acoustique n'a jamais été publié | **D** | 0 | Revendiquée 0-3 mois, donc inapplicable à la majorité des utilisateurs | Page de débunkage sourcée, sans condescendance : « les cinq mots ne sont pas réels, mais l'attention que vous avez apprise, elle, l'est. » | Hors MDR. Droit de la consommation + PI (marque vivante, audio du DVD protégé). Le débunkage : exposition **nulle** |
| 8 | **Surdité / déficience auditive** | **Rien.** La seule preuve moderne analyse du gazouillis et arrêtait l'enregistrement quand le bébé pleurait | **D** | 0 | Aucun signal néonatal ; 3-12 mois en longitudinal au mieux | « Le test auditif de la maternité a-t-il été fait, et le rendez-vous de contrôle a-t-il eu lieu ? Babbl ne peut rien dire de l'audition à partir du cri. » | IIa plancher, **IIb** réaliste. Demander et orienter = hors DM |
| 9 | **Dysfonction neurologique** | Différences de **groupe**, en hôpital, chez le nouveau-né. À domicile : VPP 0,44 % | **C** | 1 | Néonatale et hospitalière | « Ce pleur est plus aigu et plus monotone que d'habitude. C'est aussi ce qui arrive quand un bébé a très mal ou est épuisé. Babbl mesure un son et ne détecte aucune maladie. » | IIa minimum, **IIb-III** (l'exemple travaillé du MDCG classe l'imagerie d'AVC en III). Carte d'urgence non acoustique = hors DM |

### Palier 2 — Cible de R&D (1 candidat)

| # | Symptôme | Ce que le son prouve | Preuve | Faisab. maison | Fenêtre d'âge | Formulation autorisée | MDR |
|---|---|---|---|---|---|---|---|
| 6 | **Quantité, durée et rythme des pleurs** | Le pleur comme **événement** (présence, durée, répartition). Aucune cause. Le seul candidat où l'audio mesurerait le critère lui-même | **C** | 1 | 0-5 mois ; aucune norme publiée au-delà de ~3 mois | Version **journal saisi par le parent** uniquement : « Vous avez noté 2 h 10 sur les dernières 24 h. Babbl reporte uniquement ce que vous saisissez. » Interdits permanents : « excessif », « anormal », tout percentile, toute couleur | **IIa** par 11a **et** par 11b (surveiller un processus physiologique) — pas de sortie en classe I. L'écoute continue déclenche l'**art. 226-1 du code pénal**. Journal saisi = hors DM |

### Palier 3 — Exclus (12 candidats) : à retirer du produit

| # | Symptôme | Ce que le son prouve | Preuve | Faisab. | Fenêtre d'âge | Formulation autorisée | MDR |
|---|---|---|---|---|---|---|---|
| 10 | **Déviation vs baseline personnalisé** | La distance du téléphone et la durée du clip. −6 dB fait passer le score de 7 à 74 | D | 1 | 0-4 mois constructible en théorie | Aucune phrase de santé. Seule sortie : « Rapprochez le téléphone (20-30 cm) et recommencez. » | **IIb** (situation critique × oriente la prise en charge). Voie CE **fermée** en l'état : art. 7 MDR, aucune preuve clinique |
| 11 | **Sepsis / infection / fièvre** | Un signe d'altération de la conscience, sensibilité 47,2 % même à l'examen. Sa forme la plus grave est le cri **absent** | D | 0 | Aucune fenêtre validée | Carte inconditionnelle sur l'âge + température mesurée : « Moins de 3 mois et plus de 38 °C → médecin sans délai, quel que soit le son. » | IIb, plausiblement III : s'interpose dans un parcours d'urgence réglementé (NICE NG254, HAS) |
| 12 | **Coliques** | Rien. Quatre réfutations indépendantes, dont une intra-bébé | D | 0 | 2-12 semaines ; taux de base ~0 sur ⅔ de la fenêtre produit | **aucune** — le mot ne doit jamais être émis | IIa minimum, argument jusqu'à IIb (retard d'invagination, sepsis, APLV) |
| 13 | **Reflux, otite, poussée dentaire, APLV** | Rien. 4 requêtes PubMed : 0, 0, 0, et 4 résultats non acoustiques | D | 0 | Aucune | Deux messages de **dé-biaisage** seulement : « La poussée dentaire ne donne ni fièvre ni pleurs intenses » / « Sans vomissements fréquents, un reflux pathologique est très peu probable » | IIa par défaut, **III sur la sortie rassurante** (`teething` alert=`none`) si la vraie cause est une méningite ou une invagination |
| 14 | **Douleur aiguë** | Un niveau de détresse gradué. Rapport de vraisemblance du meilleur marqueur : **1,2** | C | 1 | 0-3 j et ~2 mois ; rien entre 6 et 12 mois | Aucune phrase contenant « douleur ». Au mieux : « Ce pleur est plus intense et plus rauque que d'habitude. Babbl mesure un son, il ne dit pas pourquoi. » | IIa → IIb/III si la finalité est « trouver une cause occulte ». Précédent CE existant pour la **cotation** (PainChek Infant, par le visage) |
| 15 | **Ictère / hyperbilirubinémie** | Rien. Taille d'effet plafonnant toute AUC à **0,596** | D | 0 | J2-J10 : < 3 % de l'usage de Babbl | Carte statique conditionnée à l'âge seul : « Avant 15 jours : si votre bébé jaunit, tète mal ou est très somnolent, appelez le jour même. » | **Classe III** sur les deux bras (ictère nucléaire irréversible). Seule la carte statique reste hors règle 11 |
| 16 | **Syndromes génétiques** | Un vrai signal pour le cri-du-chat. Mais 13 à 44 cas/an en France → **249 familles dévastées par vrai cas** | C | 2 | Cri-du-chat : tout le produit. Les 4 autres : aucune | Aucun nom de syndrome, jamais. Au mieux, en R&D sous `neuro_redflag` : « La voix de votre bébé a une sonorité inhabituelle sur plusieurs enregistrements. » | IIa+ · **et** Code de la santé publique sur l'examen des caractéristiques génétiques (prescription, consentement, conseil génétique) |
| 17 | **Asphyxie / EHI** | Rien chez un bébé rentré à la maison. Marqueurs interprétables : AUC 0,57-0,64 | D | 0 | Heures à J7, **en maternité** | **aucune.** Jetons interdits : asphyxie, EHI, encéphalopathie, lésion cérébrale, cerveau | **Classe III** · publicité grand public interdite pour IIb/III (ANSM) · art. L.5461-3 CSP (5 ans, 375 000 €) |
| 18 | **Risque d'autisme** | Rien. Effet groupé **non significatif** (p = 0,114, IC −0,24 à 1,60) | C | 1 | Aucune ; TSA non diagnosticable avant 18-24 mois | Une ligne de FAQ qui dit **non**, sourcée | IIa minimum. Seul précédent : FDA De Novo (Cognoa), **sur prescription**, 18-72 mois |
| 19 | **Mort subite du nourrisson** | Rien d'utilisable. Une seule étude prospective, 12 décès, IC 1,1-12 | D | 1 | Décalage total (marqueur à J2-J7, pic de MSN à 2-4 mois) | **aucune**, y compris comme réassurance. Les repères de couchage SpF restent republiables s'ils ne sont rattachés à **aucune** mesure | **Classe III** par définition (art. 2(1) : « prédiction, pronostic »). Preuve clinique **arithmétiquement impossible** |
| 20 | **Sevrage néonatal / exposition prénatale** | Rien d'atteignable : 775 h d'enregistrement fixe pour 2,5 h exploitables | D | 1 | 40-72 h de vie, **avant** le premier usage de Babbl | **aucune** | IIa minimum · RGPD art. 9 sur un **tiers** (la mère), frôle l'art. 10 · chaîne information préoccupante / CRIP |
| 21 | **Hypoglycémie et troubles métaboliques** | Rien. Un résumé de congrès non publié de 1974, jamais répliqué en 52 ans | D | 1 | Heures 2 à 72, en maternité | **aucune** | IIa/IIb · et contredit le programme d'État de dépistage néonatal (arrêté du 22 février 2018) |

---

## Première cible

**Aucune. Aucun des 21 candidats n'est viable comme dépistage à domicile**, et l'étape 3 du plan de `SCIENCE.md` (« cibler un dépistage accessible en premier, ex. drapeau neuro / auditif ») doit être réécrite : ses deux exemples sont réfutés — VPP 0,44 % pour le neuro à domicile, 0,2 % pour l'auditif, dont la base de preuve sur le **cri** est absente.

Le verrou n'est pas le modèle, c'est **l'étiquette** : hémoculture, ponction lombaire, examen de Sarnat, ABR, caryotype ne se produisent qu'à l'hôpital. Babbl ne peut pas étiqueter ses propres données à domicile, donc **aucune échelle d'utilisateurs ne résout ce problème**. Un partenariat CHU est possible (cohorte NCT06332521, CHU de Saint-Étienne, 1 100 nourrissons enregistrés à ≤ 4 jours, Bayley-4 à 2 ans) mais ses résultats ne tombent pas avant ~2028, et ce serait un **produit clinicien, en maternité** : un autre utilisateur, un autre modèle économique, une autre entreprise. Côté concurrence, Ubenwa est la démonstration que ce chemin ne se convertit pas — aucune autorisation, détecteur neuro jamais déployé, application grand public déclarant explicitement n'être ni un test diagnostique ni un test de dépistage, pivot en 2025 vers un agent vocal de secrétariat.

**La direction alternative, dans cet ordre :**

0. **Réparer la chaîne de capture, aujourd'hui.** `autoGainControl`, `noiseSuppression` et `echoCancellation` à `false` aux trois points d'appel (`Record.tsx:27`, `VoiceSetup.tsx:59`, `babbl/Home.tsx:56`), durée de clip fixe, conteneur avec repli `isTypeSupported` pour iOS. Une ligne de code, et elle conditionne **toute** R&D acoustique ultérieure.
1. **L'étude de dégradation** — l'expérience la plus rentable du dossier. Reprendre des cris cliniques enregistrés en PCM non compressé et remesurer f0 minimale, hyperphonation, biphonation, chaos et micro-structure d'attaque **après** passage par une chaîne téléphone réaliste (Opus, AGC, 1-3 m, réverbération domestique). Aucun recrutement, aucun partenariat, aucune autorisation. Elle tranche d'un coup si une quelconque ambition de Couche A est physiquement viable sur notre matériel — et une réponse négative vaut plus qu'un an de développement.
2. **Le test-retest du canal.** Même pleur rejoué à 20 cm et 1 m, iOS et Android, AGC on/off, avec et sans télévision. Deux téléphones et une enceinte, un week-end. Si la variance du canal dépasse la variance inter-état, rien n'est livrable.
3. **Le résidu intra-bébé** — la seule position de recherche réellement inoccupée. Sur `EnesBabyCries1` (39 201 pleurs, 24 bébés, 15 j à 3,5 mois, gratuit, OSF) : décomposer la variance (bébé / âge / position dans l'épisode / éveil / appareil) et répondre à la question à un million — **une fois tout cela retiré, reste-t-il quoi que ce soit ?** Personne ne l'a mesuré. Partenaire nommé et joignable à coût nul : équipe **ENES / CNRS** (Mathevon, Reby), Saint-Étienne. Aucune revendication de dispositif tant que cela ne sort pas du laboratoire.
4. **L'expérience de sécurité que personne n'a jamais faite** : afficher un indicateur d'intensité ou un percentile rend-il le parent plus calme ou plus agité ? C'est le facteur de risque **mesuré** du bébé secoué (OR 2,63 pour « juge les pleurs excessifs », 3,05 pour « s'en inquiète »), donc la question pivot du produit entier. Randomisable en interne.
5. **Seulement ensuite, et seulement si (1) est positif** : une cohorte **APLV** prospective avec un service de pédiatrie. C'est le meilleur partenariat clinique disponible — l'allergie aux protéines de lait représente 39 des 52 causes organiques trouvées chez les pleureurs excessifs adressés, elle est confirmable par test de provocation, et elle a un délai diagnostique réel à réduire.

En une phrase pour un investisseur : **nous ne cherchons plus quelle maladie entendre, nous mesurons d'abord si notre microphone entend quoi que ce soit** — et nous vendons entre-temps la seule chose que la preuve autorise, l'honnêteté outillée.

---

## Ce que Babbl ne prétendra jamais entendre

- **La cause** d'un pleur : faim, fatigue, gaz, inconfort, surstimulation, besoin de réconfort.
- **La douleur** — jamais le mot comme conclusion, jamais une barre, jamais un score.
- **Les coliques** — la chaîne ne doit jamais être émise, sous aucune forme.
- **Une atteinte neurologique**, une asphyxie, une encéphalopathie, une lésion cérébrale, « le cerveau ».
- **Une infection, un sepsis, une méningite, une fièvre** — Babbl n'a pas de thermomètre.
- **Un problème respiratoire** — et surtout jamais le **négatif** : « respiration normale », « rien d'inhabituel détecté », « aucun signe d'alerte » sont les sorties les plus dangereuses du produit.
- **Un reflux, une otite, une poussée dentaire, une APLV.**
- **Une surdité** ou quoi que ce soit sur l'audition.
- **Un ictère, une hypoglycémie, une maladie métabolique.**
- **Un risque d'autisme** ou un pronostic neurodéveloppemental.
- **Un risque de mort subite** — ni en positif, ni en réassurance.
- **Un syndrome génétique** — aucun nom, dans aucune chaîne, aucun log, aucun support marketing.
- **Une exposition prénatale** ou un sevrage néonatal — un faux positif y est une accusation contre la mère.
- **Les « cinq mots » de Dunstan.**
- **Que le pleur est normal, habituel, ou que « tout va bien ».** La fausse réassurance est le mode d'échec dominant du produit actuel, et le plus grave. Chaînes interdites : *normal, habituel, rien d'inquiétant, profil acoustique habituel, globalement normal.*
- **Que Babbl mesure la quantité de pleurs sur 24 h** ou peut la comparer à une norme. Aucun percentile, aucun classement, jamais les mots *excessif, anormal, au-dessus de la moyenne.*
- **Qu'un chiffre affiché est une probabilité ou une fiabilité** : pas de pourcentage de cause, pas de score 0-100, pas de score de fiabilité, pas de jauge, pas d'historique.
- **Que Babbl est un « stéthoscope acoustique »** ou fait du « dépistage précoce par le cri » — ces deux expressions suffisent à qualifier le logiciel comme dispositif médical (art. 2(12) MDR).
- **Que le dépistage par le cri est « prouvé en business »** — l'entreprise citée en exemple n'a aucune autorisation et a abandonné la revendication.

---

## Changements de taxonomie

### `backend/taxonomy.py` + miroir `frontend/src/lib/taxonomy.ts`

**Ajouter au vocabulaire `audio_evidence` : `"refuted"`**, distinct de `"none"`. Aujourd'hui rien ne distingue « pas de preuve » de « preuve existante qui pointe dans l'autre sens », et un lecteur pressé lit « D » comme *à approfondir* — une invitation à financer — au lieu de *réfuté, ne pas construire*.

| Clé | Ligne | Aujourd'hui | Doit devenir |
|---|---|---|---|
| `pain` | 45-53 | `acoustic` / **`strong`** / « f0 élevé (>600 Hz) … la mieux validée (Porter 1986) » | **Retirée des barres.** `context` / `refuted`. Supprimer le seuil 600 Hz (f0 saine 496 ± 95 Hz, point le plus haut 583 ± 151 Hz) et « blocage respiratoire » (Johnston & Strada 1986, pas Porter) |
| `hunger` | 54-62 | `acoustic` / **`moderate`** / « Reconnu en labo (Wasz-Höckert) » | `context` / `none`. Supprimer la citation : classe « faim » définie **par le contexte** dans la source = circularité. Sortir de la distribution normalisée |
| `fatigue` | 63-70 | `weak` | `none` — alimentée par un classifieur au rappel **0,000** |
| `discomfort` | 71-78 | `weak` | `none` — idem |
| `gas` | 79-86 | `weak` / « jambes repliées » | `none`. Retirer « jambes repliées » : observation **visuelle**, inaccessible à l'audio |
| `overstimulation` | 87-94 | `none`, affichée | **Retirée des barres.** Zéro étude PubMed sur le sujet ; sa valeur est la constante `0.01` |
| `stress` | 95-102 | `none`, affichée | Texte contextuel uniquement. Constante `0.01` |
| `need_for_comfort` | 103-110 | `none`, affichée | Texte contextuel uniquement. Constante `0.02` |

**`MEDICAL_CONSIDERATIONS` — supprimer les sept entrées, puis le dictionnaire :**

| Clé | Ligne | Alerte livrée | Pourquoi |
|---|---|---|---|
| `colic` | 122 | `monitor` | **Un cran sous `allergy_cmpa`**, alors que l'APLV est son principal imitateur organique : les alertes sont inversées par rapport à la preuve. Définition périmée (Rome IV a supprimé les 3 semaines) |
| `reflux` | 128 | `consult_recommended` | « Cambrure du dos » contredit par Heine 1995 |
| `teething` | 133 | **`none`** | **Priorité absolue.** Seul feu vert affirmatif du dépôt attaché à un nom de maladie. « Joues rouges » explicitement testé sans association (Wake 2000). Sous la règle 11, la sortie **rassurante** porte l'exposition maximale |
| `ear_infection` | 138 | `consult_recommended` | « Pleurs aggravés en position couchée » : **aucune source**, nulle part. Folklore livré en production |
| `fever_illness` | 143 | `consult_recommended` | **Sous-escalade** vs HAS et NICE NG143. Descripteur « aigu et monotone » identique mot pour mot à `neuro_redflag` (`urgent`) : le même son mappe deux niveaux |
| `allergy_cmpa` | 148 | `consult_recommended` | Triptyque exact du **surdiagnostic** (ESPGHAN 2024). ~1 % d'APLV confirmée contre 15-20 % de pleurs problématiques |
| `neuro_redflag` | 153 | **`urgent`** | Conclusion neurologique nommée + escalade d'urgence = règle 11 classe IIb/III, **expédiée aujourd'hui** sur un modèle à macro-F1 0,181 |

**Remplacer par `SAFETY_CARDS`** : contenu **statique**, jamais inféré de l'audio, déclenché uniquement sur l'âge du bébé et sur des données saisies par le parent, **identique sur tous les écrans** — pour que son absence ne puisse jamais se lire comme un feu vert. Trois cartes : fièvre/gravité chez le moins de 3 mois (formulation HAS) · respiration (fiche parents HAS bronchiolite) · nouveau-né de moins de 15 jours (ictère, tétée, somnolence).

**Frontend** : `CAUSE_META` (l. 24-72) aligné clé par clé ; `MEDICAL_META` (l. 73-84) et ses fallbacks dans `causeFr`/`causeDesc` supprimés ; `layerLabel` (l. 97-110) perd « détecté au son » et « à surveiller ».

**Règle structurelle, à inscrire dans les deux docstrings :** *aucune clé ne doit porter un nom de maladie*, parce qu'une clé qui porte ce nom finit toujours par produire une chaîne qui porte ce nom — c'est ainsi que `neuro_redflag` a survécu jusqu'en production.

---

## Corrections à SCIENCE.md et au code

### `SCIENCE.md`

| Ligne | Erreur | Correction |
|---|---|---|
| 18-21 | « validé en recherche et **prouvé en business (cf. Ubenwa)** » | Faux sur les deux moitiés. Ubenwa : aucune autorisation, détecteur neuro jamais déployé, application grand public déclarant n'être ni diagnostique ni de dépistage, pivot 2025. Et « validé » : marqueurs EHI à AUC 0,57-0,64, surdité sans **aucun** cri dans la preuve, ictère = un résumé de 1984 |
| 33 | Douleur, preuve « **forte** », « f0 >600 Hz, blocage respiratoire, Porter 1986 » | Porter ne contient **aucun** seuil ; 600 Hz tombe dans la plage normale ; « blocage respiratoire » = Johnston & Strada 1986 ; Lehr 2007 trouve la relation **inverse**. → preuve **faible**, couche contextuelle |
| 34 | Détresse 0-100, preuve « **robuste** » | **Seule ligne du tableau sans citation.** Sa source primaire est un phénomène de **seuil** : sous le seuil d'alarme, r² = 1,4 %, p = 0,94 — soit toute la plage d'usage domestique |
| 35 | Drapeau neuro, « littérature clinique » | **À supprimer de la Couche A.** Aucune étude ne donne la moindre exactitude diagnostique pour un drapeau neuro acoustique, à aucun âge, aucune à domicile |
| 36 | Faim (modéré), Wasz-Höckert | Choix forcé à 4 catégories sur 24 vocalisations choisies à la main ; précision sur la faim **jamais rapportée** ; étiquette « faim » **définie par le contexte** = circulaire. → Couche B, preuve nulle |
| « État du modèle » | « accuracy 0.83 mais macro-F1 0.18 : **ne sépare fiablement que la faim** » | Inverse : 0,826 < 0,836 (classe majoritaire). Prédicteur quasi constant **sous** la ligne de base, rappel 0,000 sur 4 classes sur 5. La phrase correcte est « **ne sépare rien** » |
| Couche B | « Le `key_signal` porte toujours `source: "context"` » | Faux : `ml_model.py:113-114` alimente `fatigue` et `discomfort` depuis le XGBoost, et la branche de repli d'`app.py` publie un `key_signal` de source « audio ». La garantie n'existe que comme instruction en langage naturel dans `mistral_client.py` |
| Couche C | « outil de triage, pas dispositif de diagnostic » | Le triage **est** une décision à finalité diagnostique (règle 11) ; un avertissement ne change pas la destination prévue, fixée par les supports promotionnels (art. 2(12)) |
| Plan, pt 3 | « drapeau neuro / auditif » | Les deux exemples réfutés. Remplacer par la séquence capture → dégradation → test-retest → résidu intra-bébé |
| Plan, pt 4 | « **Anticiper** le statut dispositif médical » | Erreur de temps : la revendication est **déjà faite, en production**. Ajouter : AI Act art. 6(1) (haut risque dès IIa) et directive (UE) 2024/2853 (responsabilité **sans faute**, applicable après le 9 décembre 2026) |
| Plan, pt 5 | Baseline « fort et achievable » | Trois des quatre entrées sont des propriétés de l'enregistrement ; −6 dB fait passer le score de 7 à 74 |
| + `README.md:15` | Cadrage bébé secoué | Le prédicteur n'est **pas** la quantité de pleurs (OR 1,24 ; 0,49-3,12, nul) mais le **jugement** parental (2,63) et l'**inquiétude** (3,05), ajustés sur l'âge seulement, et sur un **rappel parental**, pas une mesure. Pour la fenêtre critique, citer Parks 2012 (CDC, 780 TCI mortels) : **pic à 1-2 mois**. Ne jamais réutiliser « 2,2 mois, 84 % avant 4 mois, cité dans Reijneveld » — cette phrase n'est pas dans ce papier |

### Code

| Fichier / ligne | Problème | Action |
|---|---|---|
| `baseline.py` ≈296-311 | Les quatre messages. Le score 0 n'est en pratique atteignable que par la **branche d'échec** (`else: deviation_score = 0`) : un échec de calcul affiché comme un certificat de bonne santé, **par défaut** à une primo-utilisatrice. Le message « globalement normal » sort sur 80-97 % des pleurs normaux | **Supprimer les quatre.** Remplacer par une phrase permanente : « Babbl ne peut pas dire si votre bébé va bien ou non. » |
| `app.py:294-306` | **Défaut de sécurité.** `alert_priority` ignore `'consult_recommended'` (défini `triage_rules.py:190`) : la garde passe, la ligne suivante écrase par `'consult'`, que `AnalysisResult.tsx:104` ne sait pas afficher. **La fonctionnalité baseline efface le bandeau orange et le bouton pédiatre, sur les pleurs jugés les plus anormaux** | Supprimer le bloc. Corriger le dictionnaire même en cas de suppression |
| `app.py` ≈250-266 vs 294-306 | L'analyse est **écrite en base avant** l'escalade : l'historique et le rapport partageable au médecin contredisent l'écran du parent | Écrire après toute modification d'alerte |
| `app.py:282` vs `287` | `update_baseline` **avant** `compute_deviation` : le pleur courant est dans sa propre référence, z borné par (n−1)/√n → biais massif vers la **fausse réassurance** | Inverser, ou leave-one-out |
| `app.py` | `baseline_deviation_score` / `_anomalies` / `_message` dans la réponse `/analyze` | Retirer de la réponse, laisser `update_baseline` écrire **silencieusement** (le corpus continue de se constituer) |
| `baseline.py:277` | `z_score = avg_mfcc_diff / 5.0` avec `baseline: 0.0`, `std: 0.0` : une constante arbitraire affichée dans la même colonne que les vrais z, déclenchée par un seuil **absolu** codé en dur (`diff > 10`) à l'intérieur d'une fonctionnalité vendue comme personnalisée | Supprimer |
| `baseline.py` / `audio_analysis.py` | `energy_total = np.sum(y**2)` est une **somme** (CV ~29 % dû à la seule durée du clip) ; `amplitude_mean` lui est quasi lié ; `MFCC[0]` varie de ~11,3 unités **par dB** alors que le commentaire annonce « −50 à 50 ». Sur le corpus du dépôt, c0 fournit **42,7 %** de la statistique et triple le taux de déclenchement | Retirer les trois du calcul |
| `baseline.py` | Référence attachée à `user_id`, pas au bébé : jumeaux, deuxième enfant et comptes partagés fondus dans une même moyenne | Clé bébé + champ d'âge (la signature dérive ; Welford ne décroît jamais) |
| `ml_model.py:111` | `"pain" ← belly_pain` : précision 0,0 / rappel 0,0 / F1 0,0 (support 3) — et mauvais construit (gaz/coliques auto-déclarés) | Débrancher |
| `ml_model.py:113-115` | `fatigue ← tired`, `discomfort ← discomfort`, `gas ← burping` : rappel 0,000 | Débrancher |
| `ml_model.py:116-118` | Priors codés en dur `0.01 / 0.01 / 0.02` → deviennent des pourcentages affichés après normalisation | Supprimer |
| `triage_rules.py:79-92` | Multiplicateurs de faim (jusqu'à ×1,35) **à l'intérieur** d'une distribution renormalisée → coupent mécaniquement la barre « Douleur » (~26 %). Entrée non médicale dégradant une sortie médicale = couplage interdit (MDCG 2019-11 §7) | Sortir `hunger` de la distribution normalisée |
| `triage_rules.py:167` | Fiabilité = `0.48·top + 0.27·margin + 0.15·audio_quality + 0.10·context_quality` : aucun terme ne teste la justesse, un prédicteur **constant** maximise `top` **et** `margin`, et `RECORD_MS` fige `audio_quality` à 1,0. **Plus le modèle se dégrade, plus la fiabilité affichée monte** | Retirer le pourcentage |
| `Record.tsx:27`, `VoiceSetup.tsx:59`, `babbl/Home.tsx:56` | `getUserMedia({ audio: true })` → AGC, suppression de bruit et annulation d'écho **actifs par défaut**. L'AGC comprime la dynamique dont dépend le meilleur prédicteur d'intensité (mesure **relative**, donc sans calibration nécessaire) ; la suppression de bruit efface les composantes apériodiques qui portent le signal | **Correction la plus rentable du dépôt.** Les trois à `false` |
| frontend | `audio/webm;codecs=opus` codé en dur, sans repli `isTypeSupported` (échec iOS Safari < 18.4, affiché « Micro inaccessible »). Opus supprime délibérément ce qui est masqué par un son plus fort simultané | Repli MP4/AAC ; ne jamais mélanger deux codecs dans une même famille de baseline |
| `AnalysisResult.tsx` | Huit causes en barres **identiques**, `Math.round(prob*100)%`, sans marqueur de couche : la Couche B est rendue dans la grammaire visuelle de la Couche A | Pas de pourcentage pour le contextuel ; provenance affichée |
| frontend | Le produit répond **toujours**, même sur un clip bruité | Refuser de répondre. Dans l'étude de référence, **79,6 %** des séquences ont été écartées pour bruit avant analyse — avec un enregistreur professionnel fixe |

---

## Données nécessaires

| # | Expérience | Coût | Ce qu'elle décide |
|---|---|---|---|
| 0 | **Chaîne de capture contrainte** (AGC/NS/EC `false`, durée fixe, conteneur + repli) | Une ligne × 3 | Prérequis de toute science acoustique. Sans elle, rien ne peut commencer |
| 1 | **Étude de dégradation** : cris cliniques PCM repassés par une chaîne téléphone réaliste (Opus, AGC, 1-3 m, réverbération) | Aucun recrutement | Si **toute** ambition de Couche A au-delà de l'intensité est viable sur notre matériel |
| 2 | **Test-retest du canal** : même pleur, 20 cm / 1 m, iOS / Android, AGC on/off, TV on/off | 2 téléphones + 1 enceinte, un week-end | Si la variance du canal dépasse la variance inter-état → rien n'est livrable |
| 3 | **Composantes de variance + résidu intra-bébé** sur `EnesBabyCries1` (39 201 pleurs, 24 bébés, gratuit, OSF) | Interne. Partenaire : **ENES / CNRS**, Saint-Étienne | La seule direction de recherche inoccupée. Réserve : ce corpus ne peut **pas** estimer la composante appareil/distance (les auteurs écrivent que l'amplitude n'a pas pu être calculée, distance non standardisée) |
| 4 | **Taux de base de la « voix atypique » chez les bébés sains** du corpus Babbl (dysphonie néonatale bénigne transitoire — prévalence quantifiée **nulle part** dans la littérature) | Sur données existantes | Décide à elle seule si un drapeau de persistance vocale est shippable |
| 5 | **Expérience de sécurité** : afficher un indicateur d'intensité ou un percentile rend-il le parent plus calme ou plus agité ? | A/B randomisé interne | La question pivot du produit entier — c'est le facteur de risque **mesuré** (OR 2,63-3,05) |
| 6 | **Benchmark d'honnêteté** : évaluer le XGBoost de Babbl contre le plafond 36 % vs 33 % d'`EnesBabyCries1` | Interne | Transforme l'honnêteté sur la Couche B en **chiffre vérifiable** plutôt qu'en argument |
| 7 | **Cohorte APLV prospective** (uniquement si 1 est positif) | Partenariat pédiatrie | L'APLV = 39/52 des causes organiques chez les pleureurs excessifs adressés. Seul critère fréquent, confirmable, avec un délai diagnostique à réduire |
| — | **Impossible** : toute donnée qui exigerait une étiquette clinique (hémoculture, PL, Sarnat, ABR, bilirubine, caryotype, toxicologie maternelle) | — | Ne s'obtient qu'à l'hôpital. Aucune échelle d'utilisateurs ne le résout |

---

## Méthode

- **21 candidats** évalués, correspondant à tout ce qu'une analyse de pleur pourrait prétendre détecter chez un nourrisson de 0 à 12 mois.
- **399 sources**, dont **381 ouvertes** (résumé ou texte intégral). Les sources qui n'ont pas pu être ouvertes sont nommées et signalées comme non vérifiées ci-dessous.
- Chaque candidat a été soumis à **2 ou 3 lentilles adverses indépendantes** — science, faisabilité à domicile, sécurité — puis à un **arbitre** qui a rouvert les sources contestées. Sur le premier groupe de 8 candidats : **21 verdicts de vérificateurs, 17 réfutations, 90 erreurs factuelles ou omissions documentées**.
- Résultat : **0 candidat en `ship_now`**, 1 en `rd_target`, 8 en `context_only`, **12 exclus**. Deux candidats qui se réclamaient de `ship_now` ont été réfutés 3 fois sur 3.
- Le dépôt lui-même a été relu ligne à ligne : `SCIENCE.md`, `backend/taxonomy.py`, `backend/baseline.py`, `backend/app.py`, `backend/ml_model.py`, `backend/triage_rules.py`, `frontend/src/lib/taxonomy.ts`, `frontend/src/pages/AnalysisResult.tsx` et les trois enregistreurs.

**Incertitudes assumées et désaccords entre vérificateurs :**

- Le taux de fausse alerte du baseline a fait l'objet d'un désaccord (83,1 % contre 2,8 %), arbitré par lecture du code : le pleur courant est inclus dans sa propre référence, donc le défaut dominant est la **fausse réassurance**, pas l'alarme excessive.
- Une objection de vérificateur s'est révélée fausse et a changé la feuille de route technique : le meilleur prédicteur d'intensité est une mesure **relative**, pas une pression absolue — aucune calibration n'est nécessaire, mais l'AGC doit être désactivé.
- L'absolutisme « aucune formulation contenant *douleur* ne reste hors classe III » est contredit par un précédent CE existant : ce n'est pas le mot qui fait la classe, c'est la **finalité**.
- La prémisse de personnalisation intra-bébé n'a jamais été **correctement testée** — ce n'est pas qu'elle a été testée et a échoué.
- Toute l'arithmétique de valeur prédictive positive repose sur des taux de base **supposés** dans une population auto-sélectionnée que personne n'a mesurée.
- **Aucune étude au monde ne correspond au format de Babbl** — smartphone non calibré, 5-15 s, bruit de salon, 0-12 mois, étiquette parentale ou aucune. Zéro étude, même pour les six conditions qui ont une littérature.
- Les lectures MDR, AI Act, RGPD et Code pénal de ce document sont des **lectures de texte par des non-juristes**, à faire confirmer par un conseil réglementaire. Les formulations produit doivent être relues par un professionnel de santé français avant publication.
- **Sources à ne jamais citer** (non vérifiables) : Michelsson 1977 méningite (PMID 18378), Michelsson 1984 « cry score » (PMID 6510846), Koivisto 1974, Michelsson & Sirviö 1976, Thodén & Michelsson 1979, la citation UPI 1995 attribuée à Corwin, le « n=17 » de Hasasneh 2025, l'affirmation d'un avertissement FDA à Owlet « depuis 2016 » (la lettre est du 1er octobre 2021), et tout chiffre d'incidence **nationale** française du sevrage néonatal.

**Lacunes de couverture connues** : l'**asthme** du nourrisson figure parmi les six cibles pathologiques de la revue systématique 2026 et n'est couvert par aucun des 21 candidats. Non couverts non plus : dénutrition, maladie de Krabbe et leucodystrophies, incompatibilité rhésus, hypothyroïdie congénitale (littérature acoustique non évaluée). Non couvert comme **niveau d'analyse** : la structure temporelle et mélodique des **salves** de pleurs, par opposition au pleur isolé — c'est la limite que les auteurs de l'étude de référence nomment eux-mêmes, et le corpus public existe. Non couvert comme **capacité** : la vérification du locuteur (identifier de quel bébé provient un enregistrement), la seule chose que le cri porte de façon robuste avec l'âge et la détresse.

---

## Références

**Quantité, normes et sécurité des pleurs**
- Wolke D, Bilgin A, Samara M, 2017 — *Fussing and Crying Durations and Prevalence of Colic in Infants* (J Pediatr 185:55-61.e4) — 8 690 nourrissons, 28 études. https://pubmed.ncbi.nlm.nih.gov/28385295/
- Reijneveld SA et al., 2004 — *Infant crying and abuse* (Lancet 364:1340-2). https://pubmed.ncbi.nlm.nih.gov/15474137/
- Parks SE, Kegler SR, Annest JL, Mercy JA, 2012 — *Characteristics of fatal abusive head trauma among children in the USA: 2003-2007* (Inj Prev 18:193-9) — pic d'incidence à 1-2 mois. https://pubmed.ncbi.nlm.nih.gov/22015935/
- Micheletti M, Yao X, Johnson M, de Barbaro K, 2023 — *Validating a model to detect infant crying from naturalistic audio* (Behav Res Methods 55:3187-97). https://pubmed.ncbi.nlm.nih.gov/36085547/

**Ce que le cri porte réellement**
- Lockhart-Bouron M, Anikin A, Pisanski K, … Patural H, Reby D, Mathevon N, 2023 — *Infant cries convey both stable and dynamic information about age and identity* (Commun Psychol 1:26) — 39 201 pleurs, 24 bébés, à domicile ; corpus public `EnesBabyCries1`. https://www.nature.com/articles/s44271-023-00022-z
- Lindová J et al., 2015 — *Human Infant Crying and Adult Listeners* (PLoS ONE). https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0124317
- Budaghyan D, Onu CC, Gorin A, Subakan C, Precup D, 2024 — *CryCeleb: A Speaker Verification Dataset Based on Infant Cry Sounds* (ICASSP). https://arxiv.org/abs/2305.00969
- Michelsson K et al., 2002 — normes de f0 du pleur sain (172 bébés, 1 836 pleurs) : moyenne 496 ± 95 Hz, point le plus haut 583 ± 151 Hz.

**Détresse, douleur**
- Bellieni CV, Sisto R, Cordelli DM, Buonocore G, 2004 — *Cry features reflect pain intensity in term newborns: an alarm threshold* (Pediatr Res 55:142-6). https://pubmed.ncbi.nlm.nih.gov/14605260/
- Maitre NL et al., 2017 — *Cry presence and amplitude do not reflect cortical processing of painful stimuli in newborns* (Arch Dis Child Fetal Neonatal Ed 102:F428-33). https://pubmed.ncbi.nlm.nih.gov/28500064/
- Corvin S, Massenet M, Hardy A et al., 2024 — *Pain cues override identity cues in baby cries* (iScience). https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11269312/
- Corvin S et al., 2025 — *Nonlinear acoustic phenomena affect the perception of pain in human baby cries* (Phil Trans R Soc B). https://pmc.ncbi.nlm.nih.gov/articles/PMC11966150/
- Out D, Pieper S, Bakermans-Kranenburg MJ, Zeskind PS, van IJzendoorn MH, 2010 — *Intended sensitive and harsh caregiving responses to infant crying* (Child Abuse Negl 34:863-73). https://pubmed.ncbi.nlm.nih.gov/20889206/
- Parga JJ et al., 2020 — *Defining and distinguishing infant behavioral states using acoustic cry analysis: is colic painful?* (Pediatr Res). https://pmc.ncbi.nlm.nih.gov/articles/PMC7033040/
- PainChek Ltd, 2021 — *PainChek Infant achieves regulatory clearance in multiple jurisdictions* (CE, MHRA ; 1-12 mois). https://www.painchek.com/wp-content/uploads/2021/05/2213589.pdf

**Neurologie, prématurité, pronostic**
- Lawford HLS et al., 2022 — *Acoustic cry characteristics in infants with or at risk of neurological dysfunction: systematic review and meta-analysis* (Pediatr Neurol 129:72-79). https://pubmed.ncbi.nlm.nih.gov/35245810/
- Mannarino GV et al., 2026 — *Acoustic features of preterm vs full-term infant cry: a meta-analysis* (Infancy 31(4):e70106) — 53 études, g = 0,32 [−0,27 ; 0,91], **nul**. https://pubmed.ncbi.nlm.nih.gov/42435426/
- Manigault AW et al., 2023 — *Newborn cry acoustics and neurodevelopmental outcomes at 2 years* (JAMA Netw Open 6(2):e2254151) — AUROC 0,546-0,576. https://pmc.ncbi.nlm.nih.gov/articles/PMC9892956/
- Shinya Y et al., 2025 — *Deep learning estimation of gestational age from infant cry* (Sci Rep 15:23204). https://pmc.ncbi.nlm.nih.gov/articles/PMC12222782/
- Onu CC et al., 2023 — *A cry for help: early detection of brain injury in newborns* (préprint Ubenwa, jamais revu par les pairs ; biomarqueurs interprétables AUC 0,57-0,64). https://arxiv.org/abs/2310.08338
- Michelsson K, Sirviö P, Wasz-Höckert O, 1977 — *Pain cry in full-term asphyxiated newborn infants* (Acta Paediatr Scand). https://pubmed.ncbi.nlm.nih.gov/899780/
- CHU Saint-Étienne — NCT06332521, *Baby's cry 1000/100*, 1 100 nourrissons, Bayley-4 à 2 ans. https://clinicaltrials.gov/study/NCT06332521

**Maladie grave du nourrisson, triage clinique**
- Driker S et al., 2026 — *Clinical signs of possible serious infection in young infants: systematic review and meta-analysis* (JAMA Pediatr 180(4):384-393) — 52 études, n = 140 885. https://pmc.ncbi.nlm.nih.gov/articles/PMC12865698/
- Van den Bruel A, Haj-Hassan T, Thompson M, Buntinx F, Mant D, 2010 — *Diagnostic value of clinical features at presentation to identify serious infection in children* (Lancet 375:834-45). https://pubmed.ncbi.nlm.nih.gov/20132979/
- Nigrovic LE et al., 2017 — *The Yale Observation Scale Score and the Risk of Serious Bacterial Infections in Febrile Infants* (Pediatrics 140:e20170695). https://pubmed.ncbi.nlm.nih.gov/28759413/
- NICE NG254, 2024 — *Suspected sepsis in under 16s: evaluating risk level*. https://www.nice.org.uk/guidance/ng254/chapter/Evaluating-risk-level
- Freedman SB et al., 2009 — *The crying infant: diagnostic testing and frequency of serious underlying disease* (Pediatrics). https://pubmed.ncbi.nlm.nih.gov/19255012/
- Gaillot C, 2023 — *Pleurs du nourrisson de moins de 5 mois : recherche de pathologie organique* (thèse, CHU Grenoble, 203 nourrissons). https://dumas.ccsd.cnrs.fr/dumas-04248611
- HAS / CNPP, 2019 — *Conseils aux parents, 1er épisode de bronchiolite aiguë du nourrisson de moins de 12 mois*. https://www.has-sante.fr/jcms/p_3118113/

**Coliques, digestif, dents**
- St James-Roberts I et al., 1999 — *Links between maternal care and persistent infant crying* — comparaison **intra-bébé**, aucune différence de hauteur ni de dysphonation. https://pubmed.ncbi.nlm.nih.gov/10325760/
- Laguna A et al., 2026 — *Infant colic characterization through acoustic and behavioural analysis* — effets f0 de signe **opposé**. https://pmc.ncbi.nlm.nih.gov/articles/PMC13051152/
- Heine RG et al., 1995 — *Gastro-oesophageal reflux and irritable infants* (Arch Dis Child 73(2):121-5). https://pubmed.ncbi.nlm.nih.gov/7574854/
- Macknin ML et al., 2000 — *Symptoms associated with infant teething: a prospective study* (Pediatrics 105(4):747-52). https://pubmed.ncbi.nlm.nih.gov/10742315/
- Munblit D et al., 2020 — *Assessment of evidence about common infant symptoms and cow's milk allergy* (JAMA Pediatr 174(6):599-608). https://pubmed.ncbi.nlm.nih.gov/32282040/
- Uitti JM et al., 2018 — *Close follow-up in children with acute otitis media / symptom assessment* (BMC Pediatr 18:392). https://pubmed.ncbi.nlm.nih.gov/30572868/

**Respiratoire**
- Goberman AM, Robb MP, 2005 — *Acoustic characteristics of crying in infantile laryngomalacia* (n = 1, jamais répliqué). https://pubmed.ncbi.nlm.nih.gov/16147227/
- Elphick HE et al., 2004 — *Validity of acoustic analysis of respiratory sounds in infants* (Arch Dis Child ; kappa 0,07 pour le sifflement). https://pubmed.ncbi.nlm.nih.gov/15499065/
- Liu BY, Varier I, Ongkasuwan J, 2017 — *Crying, Stridor, and Aspiration in Infants with Vocal Fold Motion Impairment* (AUC 0,721 ; IC 0,565-0,877). https://pubmed.ncbi.nlm.nih.gov/28662238/

**Audition, ictère, métabolique, génétique**
- Wermke K et al., 2025 — *Melodic complexity in infants with hearing impairment* — analyse du **gazouillis** ; le pleur était un critère d'arrêt. https://doi.org/10.1038/s41598-025-16820-w
- Ali N, Chan J, Gallagher ER et al., 2025 — *Smartphone-based otoacoustic emission screening in infants* (Pediatrics ; Se 100 % / Sp 88 %). https://pubmed.ncbi.nlm.nih.gov/39909065/
- Santé publique France, 2021 — *Dépistage de la surdité permanente néonatale* (BEH 2021;10:177-183). https://beh.santepubliquefrance.fr/
- Corwin MJ, Golub HL, 1984 — *Cry analysis in hyperbilirubinemic infants* (Pediatr Res 18(Suppl 4):102 — résumé de congrès, jamais publié en version longue). https://www.nature.com/articles/pr1984134
- AAP, 2022 — *Management of Hyperbilirubinemia in the Newborn Infant 35 or More Weeks of Gestation* (Pediatrics 150(3):e2022058859). https://publications.aap.org/pediatrics/article/150/3/e2022058859
- Aune A et al., 2023 — *Picterus Jaundice Pro smartphone screening validation* (JMIR ; CE classe IIa, usage parental). https://pmc.ncbi.nlm.nih.gov/articles/PMC10015352/
- Johnson L et al., 2009 — *Clinical report from the pilot USA Kernicterus Registry* (J Perinatol 29(S1):S25-45). https://pubmed.ncbi.nlm.nih.gov/19177057/
- Virbalas J et al., 2012 — *Cri du chat: persistent high-pitched voice unchanged since birth* (J Voice). https://pubmed.ncbi.nlm.nih.gov/22921333/

**Autisme, mort subite, sevrage néonatal**
- Pusil S, Laguna A, Chino B, Zegarra JA, Orlandi S, 2025 (numéro 2026) — *Early Identification of Autism Using Cry Analysis: A Systematic Review and Meta-analysis* (J Autism Dev Disord 56(8):2950-2968) — effet groupé **non significatif** (p = 0,114) ; **auteurs salariés et actionnaires de Zoundream**. https://pubmed.ncbi.nlm.nih.gov/40032758/
- Corwin MJ, Lester BM, Sepkoski C, Peucker M, Kayne H, Golub HL, 1995 — *Newborn acoustic cry characteristics of infants subsequently dying of sudden infant death syndrome* (Pediatrics 96(1):73-7) — 12 décès ; RR 3,5 [1,1-12]. https://pubmed.ncbi.nlm.nih.gov/7596727/
- Manigault AW, Sheinkopf SJ, Silverman HF, Lester BM, 2022 — *Newborn Cry Acoustics in the Assessment of Neonatal Opioid Withdrawal Syndrome Using Machine Learning* (JAMA Netw Open). https://pubmed.ncbi.nlm.nih.gov/36301544/

**Apprentissage automatique appliqué au cri — revues et corpus**
- Sirithepmontree S et al., 2026 — *Machine learning for infant cry classification: a systematic review* — six cibles pathologiques, dont l'asthme, non couvert ici. https://pmc.ncbi.nlm.nih.gov/articles/PMC12804663/
- Laguna A, Pusil S et al., 2023 — *Multi-modal analysis of infant cry types characterization* (Comput Biol Med 167:107626 — auto-validation Zoundream). https://pubmed.ncbi.nlm.nih.gov/37918262/
- Khalilzad Z et al., 2022 — *Newborn cry-based diagnostic system to distinguish between sepsis and RDS* (Entropy 24(9):1194 — septiques en réanimation, sains en maternité). https://www.mdpi.com/1099-4300/24/9/1194
- Binet É, Serres J, 2022 — *La méthode Dunstan, une nouvelle croyance populaire pour reconnaître les pleurs des bébés* (Métiers de la petite enfance, Elsevier Masson). https://www.em-consulte.com/article/1514447/

**Ressources françaises et associatives**
- Valentin APAC — site francophone cri-du-chat. http://cri-du-chat.valentin-apac.org/
