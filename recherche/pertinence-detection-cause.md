# Détecter *pourquoi* un bébé pleure : est-ce pertinent, est-ce viable ?

*24/09/2026. Sources : trois revues de littérature et une étude de marché, faites en parallèle et vérifiées par recherche web ; une expérience menée sur le corpus Donate-a-Cry (`backend/bench/cause_bench.py`). Le texte intégral de la plupart des articles était bloqué par le réseau : les chiffres viennent des résumés et d'extraits. Ce qui n'a pas pu être confirmé est marqué NON VÉRIFIÉ.*

---

## La réponse en 5 points

1. **Environ 25 à 35 % des épisodes de pleurs des 0-3 mois n'ont aucune cause identifiable sur le moment.** Cette estimation est fragile : la seule mesure directe date de 1945 (Aldrich). La part est la plus forte vers 5-6 semaines. Entre 17 et 25 % des bébés ont des coliques avant 6 semaines, et chez ceux qui pleurent beaucoup, **moins de 5 à 10 % ont une cause médicale**.
2. **Quand une cause existe, le son ne permet pas de la retrouver.** L'étude la plus rigoureuse (Saint-Étienne, 2023, 24 bébés à domicile, 39 201 cris, cause établie par le geste qui a calmé) obtient **36 % de bonnes réponses sur 3 causes, contre 33 % au hasard**. Les parents font aussi au niveau du hasard, même après entraînement.
3. **Notre propre test donne le même résultat.** Sur Donate-a-Cry, évalué sur des bébés jamais entendus, le détecteur ne fait **pas mieux que répondre « faim » à chaque fois**. Il reconnaît 0 % des 4 autres causes. En équilibrant les causes, il est au niveau du hasard.
4. **Les « 90 % » annoncés ailleurs viennent presque tous d'une erreur d'évaluation** : le même bébé se retrouve à la fois dans l'entraînement et dans le test. Sur Donate-a-Cry, une prépublication de 2026 passe du hasard à 85-98 % selon qu'on commet ou non cette erreur, avec le même modèle. **Aucune application n'a de validation indépendante** de la cause.
5. **Ce que le son porte vraiment :** qu'il y a un pleur, le **niveau de détresse**, la **douleur aiguë** (mesurée en situation contrôlée, pas encore validée à la maison), ainsi que l'âge et l'identité du bébé. Le pleur est un **signal gradué de détresse**, pas un code de causes : c'est le consensus scientifique.

**Verdict.** La promesse « Babbl vous dit pourquoi votre bébé pleure, à partir du son » n'est **pas viable**. La science ne la soutient pas, notre test non plus, et elle expose à la DGCCRF et au règlement européen sur les dispositifs médicaux (MDR) dès qu'elle touche à la santé. Les acteurs du marché qui réussissent (Nanit, Owlet, Cradlewise, Harbor) détectent le pleur **sans prétendre en donner la cause**.

**Mais le besoin est réel, et il est ailleurs.** Entre 84 et 93 % des mères disent avoir besoin d'informations sur les pleurs. Leur vraie question est **« est-ce normal ou grave, et que faire maintenant ? »**, pas « faim ou fatigue ? ». C'est ce que fait Babbl aujourd'hui : repères d'urgence, pistes tirées de ce que le parent a noté, rappel que tous les pleurs n'ont pas de cause, carte « si vous êtes à bout ».

---

## 1. Combien de pleurs n'ont pas de cause ?

| Mesure | Chiffre | Source |
|---|---|---|
| Épisodes sans cause déterminée, nouveau-nés à l'hôpital | environ 1/3 ; l'« inconnu » dépasse la faim en nombre d'épisodes | Aldrich, Sung & Knop 1945, *J Pediatr* 26:313 (50 nouveau-nés). Le chiffre « 1/3 » vient de citations secondaires : NON VÉRIFIÉ dans le tableau original |
| Cause perçue par le parent ≠ geste qui a calmé | 1 cas sur 4 | Lockhart-Bouron 2023 (le geste concorde avec l'avis du parent dans 75 % des cas) |
| Bébés avec plus de 20 min/jour de pleurs impossibles à calmer, à 5-6 semaines | 13,3 % | Radesky 2013, *Pediatrics* 131:e1857 (587 mères) |
| Pleurs impossibles à calmer | présents surtout à 6 semaines, quasi absents à 5 mois ; peu modifiés par la façon de s'occuper du bébé | Barr 2005, *J Dev Behav Pediatr* 26:14 ; St James-Roberts 2006, *Pediatrics* 117:e1146 |
| Coliques (règle des 3) | 17-25 % des bébés avant 6 semaines, 0,6 % à 10-12 semaines | Wolke, Bilgin & Samara 2017, *J Pediatr* 185:55 (8 690 bébés) |
| Cause grave parmi les bébés vus aux urgences pour pleurs | 5,1 % (surtout des infections urinaires, trouvées par l'examen) | Freedman 2009, *Pediatrics* 123:841 (237 bébés) |
| Cause médicale en consultation spécialisée pour pleurs excessifs | 9,8 % (dont 7,4 % d'allergie aux protéines du lait de vache) | Amsterdam UMC 2026, *Eur J Pediatr*, doi:10.1007/s00431-026-07155-3 (530 bébés) |
| Pleurs réduits en portant davantage | −43 % à 6 semaines | Hunziker & Barr 1986, *Pediatrics* 77:641 (essai randomisé, 99 couples mère-bébé) |

**Ce que ça implique :** même un détecteur parfait n'aurait rien à désigner pour environ un tiers des épisodes des premiers mois, et pour la plupart des pleurs du pic de 6 semaines. C'est aussi le moment où les parents sont le plus en détresse.

## 2. Le son dit-il la cause ?

### Ce qui ne marche pas
- **Lockhart-Bouron et al. 2023**, *Communications Psychology*, doi:10.1038/s44271-023-00022-z (Mathevon, Reby, Anikin, Pisanski ; Saint-Étienne). Au niveau du hasard pour faim / inconfort / isolement, quel que soit le découpage des données. Les auditeurs humains aussi. En revanche, l'identité du bébé est reconnue (28 % sur 24 bébés, pour environ 4 % au hasard).
- **Études anciennes, toutes au hasard ou presque :**
  - Sherman 1927 : des observateurs qui ne voient pas la situation répondent au hasard (source secondaire) ;
  - Müller, Hollien & Murry 1974, *J Child Lang* 1:175 : les mères ne reconnaissent pas la situation, même pour leur propre bébé ;
  - Lenti Boero 1998, *Perceptual & Motor Skills*, doi:10.2466/pms.1998.86.3c.1123.
- **« Langage » de Dunstan :** aucune validation relue par des pairs. La seule étude chiffrée (Franti 2018, 89 %) est circulaire : elle teste sur les extraits du DVD commercial eux-mêmes.
- **Revues de littérature** (Ji 2021, *EURASIP JASMP*, doi:10.1186/s13636-021-00197-5 ; Owino & Shibwabo 2025, *JMIR Rehabil Assist Technol* 12:e69457 ; Sirithepmontree 2026, *Science Progress*). Elles citent des scores de 44 à 99,8 % sans examiner comment les données ont été séparées.

### Pourquoi les articles affichent 90 %
- **Des étiquettes non fiables.** Dans Donate-a-Cry, la cause est déclarée par le parent dans l'app. Le README l'écrit lui-même : « étiqueté par les contributeurs ». Le Dunstan est circulaire. Pour Baby Chillanto, la procédure qui établit la « faim » n'est pas documentée (NON VÉRIFIÉ).
- **La fuite de données.** Un même bébé, voire un même épisode découpé en morceaux, se retrouve à la fois dans l'entraînement et dans le test. Simeone 2026, arXiv:2608.30456 (prépublication, un seul auteur, non relue) :
  - Donate-a-Cry évalué par bébé : hasard (AUC 0,38-0,54) ;
  - découpé par extrait : 85,2 % ;
  - avec augmentation des données avant le découpage : 97,9 %.
- **Le déséquilibre des classes.** Dans Donate-a-Cry, 83,6 % des extraits sont étiquetés « faim ». Répondre « faim » à tout donne donc déjà 84 % de justesse.

### Notre expérience (`backend/bench/cause_bench.py`)
Corpus : Donate-a-Cry, 457 extraits, 221 appareils (un appareil = un bébé), 368 épisodes distincts. 89 % des appareils n'ont déclaré qu'une seule cause.

| Évaluation | Justesse | Justesse équilibrée (hasard = 20 %) | Causes autres que « faim » reconnues |
|---|---|---|---|
| Répondre « faim » à tout | 83,6 % | 20,0 % | 0 % |
| Forêt aléatoire, extraits mélangés | 83,6 % | 20,0 % | 0 % |
| Forêt aléatoire, **bébés jamais entendus** | 83,4 % | 19,9 % | 0 % |
| Régression logistique, bébés jamais entendus | 31,9 % | 18,7 % | 6 à 25 % selon la cause, au niveau du hasard |
| Faim contre autre chose, bébés jamais entendus | — | 50,4 % (hasard = 50 %) | 1 % |

*Limite :* ce fichier ne contient que des descripteurs moyens, pas l'audio complet. Des modèles plus riches sur l'audio complet (Lockhart-Bouron, 39 201 cris ; Simeone 2026) ne font pas mieux.

### Ce qui marche
- **Détecter qu'il y a un pleur :** AUC d'environ 0,99, y compris sur des bébés nouveaux. Babbl le fait déjà (porte d'entrée v3).
- **Le niveau de détresse :** le pleur est gradué (Porter 1986 ; Gustafson, Wood & Green 2000 ; Soltis 2004, *Behav Brain Sci* 27:443).
- **La douleur aiguë :**
  - la « rugosité » de la voix (instabilité, sons éraillés) en est le marqueur (Corvin 2022, *Current Biology* 32:R824 ; Corvin 2024, *iScience* 27:110375 ; Corvin 2025, *Phil Trans R Soc B*) ;
  - l'intensité sonore suit l'intensité de la douleur (Bellieni 2004, *Pediatric Research* 55:142) ;
  - mais c'est mesuré en situation contrôlée (vaccin contre bain, piqûre au talon). **Aucune validation pleur par pleur, à la maison, sur des bébés nouveaux.** Et c'est une allégation médicale.
- **L'âge et l'identité du bébé**, donc la possibilité de comparer un pleur **au profil habituel de CE bébé**.

## 3. Le marché

| Acteur | Promesse | Preuve indépendante | Statut |
|---|---|---|---|
| Cry Translator (Biloop) | 5 causes, « 96 % » | aucune ; des avis « 5 résultats différents pour le même pleur » | semble arrêté (NON VÉRIFIÉ) |
| ChatterBaby (UCLA) | douleur / faim / agacement, 71,5 % sur 3 classes | article de l'équipe elle-même (Parga 2020, *Pediatric Research*, doi:10.1038/s41390-019-0592-4) | projet de recherche |
| Zoundream (Suisse) → Philips Avent, Maxi-Cosi | 5 causes, « 92 % » | étude financée par l'entreprise, 38 nouveau-nés (Laguna 2023, *Comput Biol Med*, PMID 37918262), découpage par bébé NON VÉRIFIÉ ; Philips publie une page d'aide « résultat inexact » | actif ; 4 M€ levés en seed (10/2025) |
| CryAnalyzer, dizaines d'apps « Baby Cry Translator » | « 80-96 % » | aucune ; avis « scam » | actives, 3 à 10 $/semaine |
| Nanit, Owlet, Cradlewise, Harbor, Hatch | détectent le pleur, **sans la cause** | — | ceux qui marchent : Nanit 50 M$ levés, Owlet 105,7 M$ de chiffre d'affaires en 2025 |
| May (France) | accompagnement par des professionnels | — | 9,90 €/mois, 80 000 utilisateurs actifs par mois, 7 M€ levés |

**Risque réglementaire :**
- FDA, lettre d'avertissement à Owlet (10/2021) et suspension des ventes aux États-Unis ;
- avis de la FDA du 16/09/2025 contre les moniteurs de signes vitaux non autorisés ;
- DGCCRF : enquête publiée en 2018, injonctions de retirer des allégations santé ;
- MDR règle 11 : un logiciel d'aide au diagnostic relève généralement de la classe IIa.

---

## 4. Ce que Babbl peut faire de pertinent avec le son

1. **Déjà fait :** vérifier que c'est un pleur (porte v3), et en tirer une phrase de continuité, jamais une cause.
2. **Piste de recherche sérieuse, à mener avec un laboratoire :** « **ce pleur sort de l'ordinaire pour votre bébé** ». Le cri code l'identité et la détresse, donc on peut apprendre le profil vocal de chaque bébé et signaler un écart (rugosité, détresse inhabituelle). L'équipe Mathevon / Reby de **Saint-Étienne** est française et leader mondial du sujet : c'est le partenaire naturel. Deux conditions :
   - ce serait une **allégation médicale**, donc un dispositif médical, avec étude clinique ;
   - le risque de fausse alerte ou de fausse réassurance est majeur (voir Owlet).
3. **La cause vient du contexte, pas du son.** Délai depuis la dernière tétée, sommeil, change, âge : c'est ce que fait déjà Babbl. On pourrait mesurer si ces pistes prédisent ce qui a réellement calmé le bébé, grâce à la question « Qu'est-ce qui a apaisé votre bébé ? » déjà en place. C'est une étude faisable avec nos propres données, avec le consentement des parents.

### S'il faut trancher définitivement : le protocole
- 150 à 300 bébés entre 0 et 6 mois, enregistrés **à domicile avec vidéo**.
- Chaque épisode annoté à l'aveugle par deux personnes, à partir du geste qui a calmé le bébé, avec mesure de leur accord.
- Une référence de douleur pour chaque bébé, enregistrée au moment d'un vaccin.
- **Évaluation uniquement sur des bébés jamais vus** ; précision équilibrée ou AUC par cause.
- **Seuil fixé à l'avance :** une AUC d'au moins 0,70 par cause sur des bébés nouveaux. En dessous, la promesse est abandonnée pour de bon.
- Cadre légal : recherche impliquant la personne humaine (avis d'un CPP), conformité CNIL, idéalement portée par un CHU ou par le laboratoire de Saint-Étienne.

---

## Références principales
*Complètes dans les rapports sources. Les numéros de page et DOI sont ceux trouvés en ligne.*

- Aldrich CA, Sung C, Knop C (1945). The crying of newly born babies. I. The community phase. *J Pediatr* 26:313.
- Barr RG et al. (2005). Prolonged and unsoothable crying bouts in infants with and without colic. *J Dev Behav Pediatr* 26:14–23. PMID 15718878.
- Bellieni CV et al. (2004). Cry features reflect pain intensity in term newborns: an alarm threshold. *Pediatric Research* 55:142–146.
- Brazelton TB (1962). Crying in infancy. *Pediatrics* 29:579.
- Corvin S et al. (2022). Adults learn to identify pain in babies' cries. *Current Biology* 32:R824. doi:10.1016/j.cub.2022.06.076.
- Corvin S et al. (2024). *iScience* 27:110375.
- Freedman SB, Al-Harthy N, Thull-Freedman J (2009). The crying infant: diagnostic testing and frequency of serious underlying disease. *Pediatrics* 123:841. PMID 19255012.
- Gustafson GE, Wood RM, Green JA (2000). Can we hear the causes of infants' crying? In Barr RG et al. (dir.), *Crying as a Sign, a Symptom and a Signal*. Mac Keith Press.
- Hunziker UA, Barr RG (1986). Increased carrying reduces infant crying: a randomized controlled trial. *Pediatrics* 77:641.
- Ji C et al. (2021). A review of infant cry analysis and classification. *EURASIP J Audio Speech Music Process*. doi:10.1186/s13636-021-00197-5.
- Laguna A et al. (2023). *Computers in Biology and Medicine*. PMID 37918262 (financé par Zoundream).
- Lockhart-Bouron M et al. (2023). Infant cries convey both stable and dynamic information about age and identity. *Communications Psychology*. doi:10.1038/s44271-023-00022-z.
- Müller E, Hollien H, Murry T (1974). Perceptual responses to infant crying: identification of cry types. *J Child Lang* 1:175.
- Owino G, Shibwabo B (2025). *JMIR Rehabil Assist Technol* 12:e69457.
- Parga JJ et al. (2020). Defining and distinguishing infant behavioral states using acoustic cry analysis: is colic painful? *Pediatric Research* 87:576–580. doi:10.1038/s41390-019-0592-4.
- Porter FL, Miller RH, Marshall RE (1986). Neonatal pain cries. *Child Development* 57:790–802. PMID 3720404.
- Radesky JS et al. (2013). Inconsolable infant crying and maternal postpartum depressive symptoms. *Pediatrics* 131:e1857. PMID 23650295.
- Simeone (2026). Self-Supervised Pretext Tasks for Infant Cry Analysis… A Cautionary Result on Donateacry. arXiv:2608.30456. Prépublication non relue : NON VÉRIFIÉ au-delà du résumé.
- Soltis J (2004). The signal functions of early infant crying. *Behavioral and Brain Sciences* 27:443.
- St James-Roberts I et al. (2006). Infant crying and sleeping in London, Copenhagen and when parents adopt a "proximal" form of care. *Pediatrics* 117:e1146. doi:10.1542/peds.2005-2387.
- Wolke D, Bilgin A, Samara M (2017). Systematic review and meta-analysis: fussing and crying durations and prevalence of colic in infants. *J Pediatr* 185:55–61. PMID 28385295.
- Corpus Donate-a-Cry : github.com/gveres/donateacry-corpus (étiquettes déclarées par les contributeurs).
