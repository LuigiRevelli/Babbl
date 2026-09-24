# Babbl — Ce que le cri dit vraiment

> Mise à jour 24/09/2026 : combien de pleurs ont une cause, test par bébés jamais entendus, marché → `recherche/pertinence-detection-cause.md`.

> Le résultat de l'étude, en français simple. Le détail technique (références, analyse réglementaire, revue du code ligne à ligne) est dans `SYMPTOMS-TECHNIQUE.md`.
>
> **Mise à jour 22/09/2026 :** la liste finale élargie à toute la voix du bébé (toux, babillage, respiration…) est dans `LISTE-FINALE-SYMPTOMES.md`. Elle remplace les tableaux de paliers ci-dessous.

## Le verdict, en cinq phrases

> **Un pleur de bébé ne porte que trois informations fiables : à quel point le bébé est en détresse à cet instant, environ quel âge il a, et de quel bébé il s'agit. Aucune cause, aucune maladie.**
> Sur les 21 pistes testées : **0 est livrable aujourd'hui**, 1 est un sujet de recherche, 8 sont affichables mais jamais déduites du son, **12 doivent sortir du produit**.
> Ce que Babbl montre aujourd'hui — les 8 barres de pourcentage, les 7 alertes médicales, le score de déviation 0-100 — n'est adossé à rien de solide.
> **Ce n'est pas un problème de modèle ou de données : c'est que l'information n'est pas dans le son.**
> Il reste une position, et elle est bonne : Babbl n'est pas « l'app qui entend la maladie », c'est **la seule app qui dit au parent ce que le son ne prouve pas** — aucun concurrent ne peut copier ça sans se contredire lui-même.

| Résultat | Nombre | Ce que ça veut dire |
|---|---|---|
| Livrable maintenant | **0** | Rien de ce que l'app affiche à partir du son n'est soutenu par la preuve |
| Piste de recherche | **1** | Compter les pleurs — et seulement si c'est le parent qui les saisit |
| Utilisable en contexte | **8** | Babbl peut en parler, jamais en le déduisant du son |
| À retirer du produit | **12** | Réfuté, ou dangereux, ou les deux |

*Et même ces trois informations sont étroites : la détresse est prouvée surtout en maternité à 0-7 jours et n'a rien de démontré entre 3 et 12 mois ; l'âge, le parent le connaît déjà ; l'identité du bébé n'est pas exploitée aujourd'hui. Méthode : 21 pistes confrontées à la littérature (399 sources, dont 381 réellement ouvertes — résumé ou texte intégral), puis chacune attaquée par 2 ou 3 relecteurs indépendants chargés de la démolir, puis arbitrée en rouvrant les sources contestées. Sur le premier groupe de 8 pistes : 21 verdicts, 17 réfutations, 90 erreurs de fait ou omissions documentées. Deux pistes qui se présentaient comme « prêtes à livrer » ont été réfutées 3 fois sur 3.*

## Pourquoi ce résultat (ce que tu réponds à un investisseur)

**Trois raisons, et chaque piste tombe dans l'une des trois.** C'est la colonne vertébrale à retenir.

**A. Le signal n'existe pas.** Pas « on n'a pas encore trouvé » : on a cherché, et il n'y a rien. Les coliques ont été réfutées quatre fois, dont une étude qui compare **le même bébé** avec et sans crise : aucune différence. Reflux, otite, poussée dentaire, allergie au lait : quatre recherches dans la base médicale PubMed donnent 0, 0, 0 et 4 résultats — les 4 n'étant pas acoustiques. Les « cinq mots » de Dunstan : aucun gabarit sonore n'a jamais été publié. L'ictère repose sur un résumé de congrès de 1984 ; l'hypoglycémie sur un résumé de 1974 jamais publié en entier et jamais reproduit en 52 ans.

**B. Le signal existe, mais pas chez nous.** L'asphyxie à la naissance, l'atteinte neurologique, la prématurité : quand il y a un signal, il a été mesuré **à l'hôpital, dans les premières heures ou premiers jours**, avec du matériel fixe. C'est exactement la fenêtre où le bébé n'est pas encore rentré à la maison — le séjour en maternité française (72-96 h) la recouvre entièrement.

**C. Le signal existe, mais la maladie est trop rare pour qu'une alerte veuille dire quelque chose.** C'est le point le plus contre-intuitif et le plus important. Le drapeau neurologique — l'alerte « problème au cerveau » que l'app envoie aujourd'hui — au **meilleur résultat jamais publié** (il repère 88,7 % des malades et se trompe sur 20 % des bien-portants), à domicile : **sur 226 alertes, une seule serait vraie**. Les 225 autres familles ont passé une nuit blanche pour rien. Et un parent qui enregistre 3 fois par jour a **99 % de chances** de voir passer un drapeau neuro dans la semaine. Pour l'asphyxie : ~140 fausses alertes « lésion cérébrale » par vrai cas. Pour la surdité : sur 100 000 utilisateurs, **~23 vrais cas contre ~12 000 fausses alertes**. Pour le cri-du-chat, le seul syndrome génétique avec un vrai signal sonore : 13 à 44 cas par an dans toute la France, soit **249 familles dévastées pour un vrai cas trouvé**.

> **Un test peut être bon *et* inutilisable.** C'est la phrase à retenir pour un investisseur.

**Et sept faits vérifiés — quatre dans le code, trois autour :**

1. **Le modèle ne sépare rien.** Il a raison 82,6 % du temps. Un programme d'une ligne qui répondrait toujours « faim » aurait raison **83,6 %** du temps sur le même jeu de données — le modèle fait donc *moins bien* que ne rien faire. Sur 4 des 5 causes qu'il est censé distinguer, il n'en repère **aucune** : pas « peu », zéro. C'est une appli météo qui dit « soleil » tous les jours dans une région où il fait beau 84 % du temps : elle affichera 84 % de justesse et elle ne sait strictement rien.
2. **Trois barres sur huit sont des constantes écrites à la main.** « Surstimulation » = `0.01`, « stress » = `0.01`, « besoin de réconfort » = `0.02` dans `ml_model.py` (l. 116-118). Après mise à l'échelle, ces constantes deviennent les pourcentages que voit le parent.
3. **Le score de déviation mesure le téléphone, pas le bébé.** Sur le même pleur, éloigner le téléphone (son deux fois moins fort, −6 décibels) fait passer le score de **7 à 74** sur 100. Trois des quatre ingrédients du calcul sont des propriétés de l'enregistrement, pas du bébé — et l'un d'eux réagit surtout au volume capté et pèse à lui seul près de la moitié (**42,7 %**) du résultat final (c'est le descripteur `MFCC[0]`, qui bouge de 11,3 unités par décibel).
4. **L'étiquette est le vrai verrou, pas le modèle.** Pour apprendre à reconnaître une maladie, il faut des pleurs étiquetés par une prise de sang, une ponction lombaire, un test auditif ou un caryotype. Ça ne s'obtient qu'à l'hôpital. **Donc aucun nombre d'utilisateurs ne résout ce problème** — ce n'est pas un problème d'échelle.
5. **Le concurrent cité en preuve ne prouve rien.** Ubenwa : aucune autorisation obtenue, détecteur neuro jamais mis en service, app grand public qui déclare elle-même n'être ni un diagnostic ni un dépistage, pivot en 2025 vers un agent vocal de secrétariat médical.
6. **Le positionnement actuel est déjà un problème légal.** En Europe, c'est la **promesse marketing** qui décide du statut d'un logiciel, pas l'avertissement en bas de page (c'est le règlement européen sur les dispositifs médicaux, le « MDR », art. 2(12)). Les dispositifs médicaux sont classés par risque, de I (le plus bénin) à III (le plus lourd). Les mots « stéthoscope acoustique » et « dépistage précoce par le cri », écrits aujourd'hui dans `SCIENCE.md`, suffisent à eux seuls à faire de Babbl un dispositif médical, quelque part entre IIa et III — une catégorie dont l'autorisation exige une preuve clinique que personne n'a. Ce n'est pas un risque à anticiper : **la revendication est déjà en production**.
7. **Ce que coûte le fait de ne rien faire.** Mettre sur le marché un dispositif médical sans autorisation est puni de 5 ans de prison et 375 000 € (art. L.5461-3 du code de la santé publique) ; la publicité grand public est interdite pour les classes IIb et III (ANSM) ; et à partir du 9 décembre 2026, une famille n'aura plus besoin de prouver une faute pour engager la responsabilité du produit (directive UE 2024/2853).

## Les 21 pistes, une ligne chacune

### A. Les 8 que Babbl peut garder — mais jamais déduites du son

| Sujet | Ce que le son en dit | Ce que Babbl fait à la place |
|---|---|---|
| Prématurité / développement futur | Il dit que le bébé est prématuré (92,4 %) — le parent le sait déjà. Prédire son développement : 0,546-0,576 sur une échelle où 0,50 = pile ou face et 1,00 = parfait | Demander les semaines de grossesse à l'inscription et utiliser l'âge corrigé partout |
| Fatigue, inconfort, surstimulation, besoin de réconfort | **Rien.** Un seul axe (calme ↔ agité) déguisé en quatre étiquettes | Une phrase à partir de la durée d'éveil que le parent a saisie, sans pourcentage |
| Niveau de détresse / intensité | L'intensité **pendant les 10 secondes enregistrées**. Pas la douleur, pas la cause, pas comparable d'un bébé à l'autre | Une observation en texte — jamais un score, jamais un historique |
| Faim | **Rien.** 36 % de réussite contre 33 % en tirant au hasard ; des adultes entraînés font 34,8 % | Piste tirée du délai depuis la dernière tétée ; proposer une tétée **si le bébé en montre les signes**, et toujours un geste sans tétée (nourrir pour consoler : voir `recherche/programme-recherche.md`) |
| Respiration / voies aériennes | **Rien de captable.** Le bruit respiratoire qui compte s'entend quand le bébé **inspire** et il est très faible ; or un enregistrement de pleur est fait presque entièrement de souffle **expiré** | Recopier la fiche parents HAS bronchiolite telle quelle, et conclure : « ces signes s'observent avec les yeux, pas avec le micro » |
| « Cinq mots » de Dunstan | **Rien.** Aucun gabarit sonore n'a jamais été publié, nulle part | Une page de débunkage sourcée, sans condescendance — c'est du contenu, pas du risque |
| Surdité | **Rien.** La seule étude moderne analyse le **gazouillis** et coupait l'enregistrement dès que le bébé pleurait | Demander si le test auditif de la maternité a été fait et si le rendez-vous de contrôle a eu lieu |
| Atteinte neurologique | Des différences **entre groupes**, à l'hôpital, chez le nouveau-né. À domicile : sur 226 alertes, une seule serait vraie | Une carte d'urgence déclenchée par l'âge et par ce que le parent saisit — jamais par le son |

### B. La seule piste de recherche

| Sujet | Ce que le son en dit | Ce que Babbl fait |
|---|---|---|
| Quantité et rythme des pleurs sur 24 h | Le pleur comme **événement** (présent, combien de temps, à quels moments). Aucune cause. Seul cas où l'audio mesurerait directement ce qu'on veut mesurer | **Journal saisi par le parent uniquement** : enregistrer en continu dans une pièce est une atteinte à la vie privée punie par le code pénal (art. 226-1). Interdits à vie : « excessif », « anormal », tout classement du bébé par rapport aux autres bébés, toute couleur |

### C. Les 12 à retirer du produit

| Sujet | Pourquoi c'est retiré | Conséquence si on le garde |
|---|---|---|
| Score de déviation personnalisé | Mesure la distance du téléphone et la durée du clip : même pleur, score 7 → 74 selon la distance | Classe IIb, voie d'autorisation fermée |
| Fièvre / infection / sepsis | Le signe du cri anormal, **quand c'est un soignant qui examine le bébé**, ne repère que 47,2 % des cas — et sa forme la plus grave est le cri **absent**, que le micro ne peut pas capter | Babbl n'a pas de thermomètre ; s'interpose dans un parcours d'urgence encadré |
| Coliques | Quatre réfutations indépendantes, dont une comparant **le même bébé** avec et sans crise | Le mot ne doit jamais sortir, sous aucune forme |
| Reflux, otite, poussée dentaire, allergie au lait (un seul candidat) | 4 recherches PubMed : 0, 0, 0 et 4 résultats, dont aucun acoustique. « Joues rouges » a été testé : aucune association | Le feu vert `teething` est la sortie la plus exposée du dépôt |
| Douleur aiguë | Le meilleur marqueur sonore connu multiplie les chances par **1,2** (1,0 = n'apporte aucune information) | Le mot « douleur » ne doit jamais être une conclusion |
| Ictère (jaunisse) | L'effet est si faible qu'il plafonne toute performance possible à 0,596 (0,50 = pile ou face) | Et la fenêtre J2-J10 représente moins de 3 % des usages |
| Syndromes génétiques | Vrai signal pour le cri-du-chat, mais 13 à 44 cas par an en France : 249 familles dévastées pour un vrai cas | Plus l'encadrement légal du test génétique |
| Asphyxie / souffrance cérébrale à la naissance | Rien de mesurable chez un bébé rentré à la maison (0,57-0,64, où 0,50 = pile ou face) | Classe III ; publicité grand public interdite |
| Risque d'autisme | La différence mesurée est si petite qu'elle peut être du pur hasard | Et l'autisme n'est pas diagnosticable avant 18-24 mois |
| Mort subite du nourrisson | Une seule étude, 12 décès. Le marqueur est à J2-J7, le pic de mort subite à 2-4 mois | La preuve nécessaire est **arithmétiquement impossible** à réunir |
| Sevrage néonatal / exposition prénatale | 775 h d'enregistrement fixe pour 2,5 h exploitables | Un faux positif est une accusation contre la mère |
| Hypoglycémie et troubles métaboliques | Un résumé de congrès de 1974, jamais publié en entier, jamais reproduit en 52 ans | Contredit le dépistage néonatal d'État |

## Les 4 bugs, vérifiés dans le code

| Gravité | Où | Ce qui se passe |
|---|---|---|
| **Critique** | `app.py:294-306` | Sur les pleurs que l'app juge **les plus anormaux**, l'alerte médicale réelle est écrasée par une valeur que l'écran ne sait pas afficher : le parent perd le bandeau orange **et** le bouton « voir un pédiatre ». Exactement au pire moment. |
| **Grave** | `app.py:282` avant `287` | Le pleur en cours est ajouté à sa propre référence **avant** d'être comparé à elle. Il se compare donc à lui-même : tout paraît normal. Le défaut dominant du produit est la **fausse réassurance**, pas l'alarme excessive. |
| **Grave** | `app.py` ≈250-266 | L'analyse est enregistrée en base **avant** la montée d'alerte : l'historique et le rapport partageable au médecin contredisent ce que le parent a vu à l'écran. |
| **Bloquant pour la suite** | `Record.tsx:27`, `VoiceSetup.tsx:59`, `babbl/Home.tsx:56` | Le micro tourne avec `autoGainControl` (réglage automatique du volume), `noiseSuppression` (réduction de bruit) et `echoCancellation` (annulation d'écho) **activés**. Ils détruisent précisément la dynamique dont dépend la seule mesure valable — l'intensité. Trois `false` à écrire. |

**Deux défauts de plus, à traiter avec les suppressions.** (a) `baseline.py` ≈296-311 : le score 0, le plus rassurant de tous, n'est en pratique atteint que par la **branche d'erreur** — un échec de calcul s'affiche comme un certificat de bonne santé, par défaut, à une primo-utilisatrice ; et le message « globalement normal » sort sur **80 à 97 % des pleurs normaux**. (b) `triage_rules.py:167` : le **pourcentage de fiabilité** affiché ne teste à aucun moment si la réponse est juste — un modèle qui répondrait toujours la même chose maximise sa propre note, donc **plus le modèle se dégrade, plus la fiabilité affichée monte**.

## À faire, dans l'ordre

*Les durées sont mon estimation, pas un résultat de l'étude — l'étude ne chiffre que le matériel. Luigi porte tout depuis le 23/09/2026. Revue de ce plan : **30 septembre 2026**.*

### Aujourd'hui — c'est un risque parent, en production (Luigi, ~2 h)

1. Corriger le bug qui efface l'alerte (`app.py:294-306`) — **1 h**
2. Inverser `app.py:282` et `287`, et écrire l'analyse en base **après** toute montée d'alerte — **30 min**
3. Passer `autoGainControl`, `noiseSuppression`, `echoCancellation` à `false` (`Record.tsx:27`, `VoiceSetup.tsx:59`, `babbl/Home.tsx:56`), fixer la durée de clip, ajouter un repli de format pour iOS — **1 ligne × 3**. La correction la plus rentable du dépôt : sans elle, aucune recherche acoustique n'est possible.

### Cette semaine — fermer l'exposition (Luigi, ~3 jours)

4. **Retirer les 8 barres de pourcentage** : `backend/taxonomy.py` l. 45-110, miroir `frontend/src/lib/taxonomy.ts` `CAUSE_META` l. 24-73 — **1 journée**
5. **Retirer les 7 considérations médicales**, puis le dictionnaire entier : `backend/taxonomy.py` l. 122-158 ; `MEDICAL_META` l. 76-84 et ses replis dans `causeFr`/`causeDesc` ; `layerLabel` l. 99-110 perd « détecté au son » et « à surveiller » — **1 journée**
6. **Débrancher et nettoyer** : `ml_model.py` l. 111 et 113-118 (classes à rappel nul + les 3 constantes) ; `triage_rules.py` l. 79-92 (sortir `hunger` de la distribution : aujourd'hui les 8 barres sont forcées de totaliser 100 %, donc gonfler la barre « faim » rabote mécaniquement la barre « douleur » d'environ 26 %, sans que le son ait changé) ; `triage_rules.py` l. 167 (retirer le % de fiabilité) ; `baseline.py` l. 277 ; retirer `baseline_deviation_score` / `_anomalies` / `_message` de la réponse `/analyze` en laissant `update_baseline` écrire **silencieusement** — **1 journée**
7. **Remplacer par 3 cartes de sécurité statiques**, identiques sur tous les écrans pour que leur absence ne puisse jamais se lire comme un feu vert, déclenchées uniquement par l'âge du bébé et par ce que le parent saisit : fièvre mesurée avant 3 mois (formulation HAS) · respiration (fiche parents HAS bronchiolite) · nouveau-né de moins de 15 jours (jaunisse, tétée, somnolence) — **compris dans les 3 jours**
8. **Faire refuser l'app** sur un enregistrement trop bruité. Dans l'étude de référence, **79,6 %** des enregistrements ont été jetés pour bruit — et c'était avec un enregistreur professionnel fixe. Babbl, lui, répond toujours — **½ journée**

**Faut-il couper la fonctionnalité en production dès maintenant ?** Mon avis : non, si les points 1 à 8 sont faits cette semaine — le bug critique est corrigé aujourd'hui, et le reste part avec la mise à jour. Pas de message alarmiste aux utilisateurs actuels, mais cette question précise doit être posée au conseil réglementaire (point 10) en même temps que le reste. Si la semaine dérape, on coupe l'affichage des causes et des alertes.

### Ce mois-ci — le discours

9. **Réécrire `SCIENCE.md` et le pitch du `README`** sur le nouveau positionnement — **1 jour**. C'est la promesse marketing qui fixe le statut légal. Quatre erreurs à corriger précisément :
   - `SCIENCE.md` l. 18-21 : « validé en recherche et prouvé en business (cf. Ubenwa) » est faux sur les deux moitiés.
   - `SCIENCE.md` l. 33 : la douleur n'est pas une preuve « forte » — le seuil « 600 Hz » n'est pas dans Porter 1986, la source citée, et 600 Hz tombe dans la plage d'un bébé en bonne santé (moyenne 496 Hz, point le plus haut 583 Hz). Les lignes 34, 35 et 36 sont trois autres erreurs distinctes : le score de détresse, le drapeau neuro, la faim.
   - `SCIENCE.md` l. 73 : « ne sépare fiablement que la faim » est l'inverse de la vérité — il ne sépare rien.
   - `README.md` l. 15 : le lien pleurs / bébé secoué est mal cadré. Le prédicteur n'est pas la quantité de pleurs (effet nul) mais le **jugement** du parent (×2,63) et son **inquiétude** (×3,05). Et la fenêtre critique est **1-2 mois** (CDC, 780 cas mortels).
10. **Appeler un conseil réglementaire** pour confirmer notre lecture du règlement MDR, et faire relire toutes les formulations destinées aux parents par un professionnel de santé français — **1 appel, à caler avant fin septembre**. Ce n'est pas une note de bas de page : c'est ce qui valide ou invalide le point 9.

### Ce trimestre — la recherche (Luigi)

| # | Expérience | Coût | Ce que ça décide |
|---|---|---|---|
| 11 | **Étude de dégradation** : reprendre des cris cliniques enregistrés en qualité studio, les repasser par une chaîne téléphone réaliste (compression, réglage auto du volume, 1-3 m, écho de salon) et remesurer ce qui survit | Aucun recrutement, aucune autorisation | **L'expérience la plus rentable du dossier.** Elle tranche d'un coup si une ambition acoustique quelconque est physiquement viable sur un téléphone. Une réponse « non » vaut mieux qu'un an de développement |
| 12 | **Test de répétabilité** : même pleur rejoué à 20 cm et à 1 m, iPhone et Android, réglage auto activé/désactivé, avec et sans télévision | 2 téléphones + 1 enceinte, un week-end | Si le téléphone fait varier le son plus que l'état du bébé, rien n'est livrable |
| 13 | **Le résidu par bébé** sur le corpus public gratuit `EnesBabyCries1` (39 201 pleurs, 24 bébés) : une fois retirés l'effet bébé, l'âge, le moment dans la crise et le niveau d'éveil, reste-t-il quelque chose ? | Interne. Partenaire joignable à coût nul : équipe ENES / CNRS, Saint-Étienne | **La seule question de recherche que personne n'a posée.** Réserve : ce corpus ne permet pas d'estimer l'effet appareil/distance |
| 14 | **Expérience de sécurité** : afficher un indicateur d'intensité rend-il le parent plus calme, ou plus inquiet ? | A/B interne | La question pivot du produit entier — le risque de secouer son bébé est multiplié par 2,63 quand le parent **juge** les pleurs excessifs, et par 3,05 quand il **s'en inquiète** |
| 15 | **Cohorte allergie aux protéines de lait** avec un service de pédiatrie — **seulement si (11) est positif** | Partenariat clinique | 39 des 52 causes organiques trouvées chez les gros pleureurs adressés. Confirmable par test, avec un vrai délai de diagnostic à réduire |

**Hors de portée quoi qu'il arrive** : tout ce qui demande une étiquette posée à l'hôpital. La seule voie serait un partenariat CHU (celui de Saint-Étienne existe : 1 100 nourrissons, résultats pas avant ~2028) — et ce serait un produit pour médecins, en maternité : autre utilisateur, autre business, autre entreprise.

**La phrase pour un investisseur :** *nous ne cherchons plus quelle maladie entendre, nous mesurons d'abord si notre microphone entend quoi que ce soit* — et entre-temps nous vendons la seule chose que la preuve autorise : l'honnêteté outillée.

## Ce que Babbl ne dira jamais

- La **cause** d'un pleur, la **douleur**, les **coliques**, ou une maladie nommée, quelle qu'elle soit.
- **Le négatif est encore plus dangereux que le positif** : « normal », « habituel », « rien d'inquiétant », « profil acoustique habituel », « tout va bien ». Phrase de remplacement, permanente : **« Babbl ne peut pas dire si votre bébé va bien ou non. »**
- Un **chiffre présenté comme une probabilité ou une fiabilité** : pas de % par cause, pas de score 0-100, pas de jauge, pas d'historique, aucun classement du bébé par rapport aux autres bébés.
- Les expressions « stéthoscope acoustique » et « dépistage précoce par le cri » — à elles seules, elles créent le statut de dispositif médical.
- **Règle de revue de code** : aucune clé ne doit porter un nom de maladie. Une clé qui porte ce nom finit toujours par produire un texte qui porte ce nom — c'est ainsi que `neuro_redflag` a survécu jusqu'en production.

## Ce que cette étude ne prouve pas (à dire aussi, c'est ce qui rend le reste crédible)

- L'idée de comparer un bébé **à lui-même** n'a jamais été correctement testée. Ce n'est pas qu'elle a échoué — personne ne l'a mesurée. C'est pour ça que l'expérience 13 existe.
- Toute l'arithmétique du type « une vraie alerte sur 226 » repose sur des taux de maladie **supposés** dans une population de parents inquiets que personne n'a jamais mesurée.
- Les lectures juridiques de ce document sont des **lectures de texte par des non-juristes**. D'où le point 10.
- **Aucune étude au monde ne correspond au format de Babbl** — smartphone non calibré, 5-15 s, bruit de salon, 0-12 mois. Zéro, même pour les six maladies qui ont une vraie littérature. Tous les chiffres ci-dessus viennent donc de conditions **plus favorables** que les tiennes.

**Le mot de la fin.** Tu n'as pas construit un mauvais produit sur une bonne idée. Tu as construit un bon produit — l'UX, la voix clonée, le parcours — sur une promesse que le son ne peut pas tenir. La promesse doit changer ; le produit, largement moins. Et la nouvelle promesse a un avantage que l'ancienne n'avait pas : **elle est vraie, elle est vérifiable, et un concurrent qui prétend entendre la maladie ne peut pas la copier sans avouer qu'il ment.**