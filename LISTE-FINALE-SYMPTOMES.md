# Babbl — Liste finale : ce que la voix du bébé permet de dire

> Deuxième passe de l'étude, élargie du **cri** à **toute la voix du bébé** : cri, babillage, toux, bruits de respiration, rire, hoquet, rythme des pleurs.
> Méthode : 5 chercheurs indépendants → 102 pistes brutes → 36 candidats distincts → chaque candidat attaqué par 3 relecteurs adverses (science, faisabilité au téléphone à la maison, sécurité et réglementaire) → un arbitre par candidat → classement → un critique chargé de trouver ce qui manque. 152 agents au total, 22/09/2026.
> Complète `SYMPTOMS.md` (verdict sur le cri) et `SYMPTOMS-TECHNIQUE.md` (références). Le détail de chaque verdict, avec les sources, est dans `recherche/voix-bebe-2026-09.json`.

## Le verdict

**Sur 36 candidats, aucun ne peut être déduit du son et affiché au parent.** Élargir au babillage, à la toux et à la respiration ne change pas la conclusion sur le cri : un clip de 10 secondes, pris au téléphone à 20-100 cm puis compressé, renseigne surtout sur **l'enregistrement** (distance, pièce, moment où l'on appuie), pas sur l'état, la cause, la santé ou le développement du bébé.

Le son ne commande donc que **deux sorties** :

1. **La porte d'entrée** : « Babbl n'a pas entendu de pleur net », jamais rassurante, toujours suivie des cartes de sécurité.
2. **Au plus, une phrase qui décrit l'enregistrement** : « un pleur presque continu » ou « un pleur entrecoupé de pauses ». Elle remplace les trois niveaux « faible / modéré / intense » et n'est affichée qu'après l'expérience A/B sur le calme du parent (`ROADMAP-BACKEND.md`, n°5). Si l'expérience montre qu'elle inquiète, on la retire.

**La vraie valeur de ce passage est ailleurs.** Il fournit le **contenu des cartes et repères** que Babbl peut afficher sans jamais écouter : toux, geignement, stridor, coqueluche, babillage à 10 mois, voix enrouée, spasme du sanglot. Et il met au jour **cinq défauts déjà en production**, à corriger avant d'ajouter quoi que ce soit (voir plus bas).

| Résultat | Nombre |
|---|---|
| Déductible du son et affichable | **0** |
| Carte ou repère statique (jamais déduit du son) | **21** |
| Recherche, rien d'affiché | **3** |
| Exclu, aucun mot | **12** |

*Règle de lecture.* Le **verdict acoustique** juge ce que le son peut prouver. La colonne **carte** dit si Babbl peut en parler par un contenu fixe, identique pour tous, déclenché par l'âge ou ouvert par le parent. Les deux sont indépendants : la toux aboyante est « rien au son » **et** « carte oui ».

---

## La liste finale, par ordre de pertinence produit

### A. Ce que Babbl affiche — cartes et repères, jamais déduits du son (21)

| # | Signal | Son | Ce que le son prouve | Ce que Babbl fait | Âge |
|---|---|---|---|---|---|
| 1 | **Quantité et durée des pleurs** | pleurs | Rien : un clip contient un pleur par construction, sa durée est celle du clip | **Journal saisi par le parent**, totaux bruts sur 24 h, sans norme, courbe ni couleur. **Carte anti-secouement** fixe avant chaque enregistrement | 0-12 mois, pic de risque 1-2 mois |
| 2 | **Babillage canonique** (« ba-ba », « da-da ») | babillage | Rien d'attribuable : Babbl ne sait pas qui parle | **Repère fixe à 10-12 mois** : « si vous ne l'avez jamais entendu, parlez-en à la visite du 9e ou 12e mois et faites vérifier l'audition » | 10-12 mois |
| 3 | **Continuité du pleur** (ex-« intensité ») | cri | Que le clip contient un pleur plutôt continu ou coupé de pauses. Ni détresse, ni douleur, ni santé | **Seule phrase tirée du son**, en 2 descriptions, sous condition de l'A/B | 0-12 mois |
| 4 | **Cri faible, geignard ou absent** | cri | Rien : le volume dépend du téléphone, et le cas le plus grave ne produit aucun clip | **Carte 15** sur chaque écran, y compris le refus : « pleure très faiblement, ne pleure plus, mou, refuse de boire » | 0-12 mois, en avant < 3 mois |
| 5 | **Geignement expiratoire** | respiration | Rien de validé au téléphone ; les grognements bénins dominent | Ajouté à la **carte Respiration** : « petit bruit plaintif à chaque expiration » | 0-12 mois, surtout < 2 mois |
| 6 | **Échanges vocaux parent-bébé** | babillage | Rien : 10 s contiennent 0 à 3 échanges | **Conseil éducatif** fixe (répondre, puis laisser un silence), jamais après une analyse | 0-12 mois |
| 7 | **Toux aboyante** | toux | Séparée à l'hôpital chez l'enfant de 1 à 6 ans, pas chez le nourrisson à domicile | **Entrée « Toux »** ouverte par le parent, fiche Ameli laryngite, 15 avant 6 mois. Enregistrer la toux **pour la faire écouter au médecin, sans analyse** | 0-12 mois, en avant < 6 mois |
| 8 | **Nez bouché, ronflement** | respiration | Rien : indiscernable d'un stridor ou d'un sifflement au téléphone | **Case « bruit en respirant / nez bouché »** → carte lavage de nez HAS + signes du 15 | 0-12 mois |
| 9 | **Cri aigu ou monotone** | cri | Rien d'individuel : la hauteur monte avec toute détresse | **Carte 15** « pleur inhabituel ». **Retirer le mot « aigu »** de l'observation actuelle | 0-12 mois |
| 10 | **Quintes avec « chant du coq »** | toux | Rien : avant 3 mois la coqueluche tue souvent **sans** chant du coq, par des pauses silencieuses | **Carte coqueluche** dans « Toux » et « Respiration », en avant < 6 mois | 0-12 mois, danger < 3 mois |
| 11 | **Toux avant 3 mois** | toux | Rien d'utile : le parent sait déjà qu'il tousse | Carte « Moins de 3 mois » étendue de **« fièvre » à « fièvre ou toux »** | < 3 mois |
| 12 | **Spasme du sanglot** | pleurs | Rien : un pleur suivi d'un silence est la fin normale de presque tous les pleurs | Carte **« Quand appeler »** : arrêt de respiration, bleu, mou → 15, puis filmer | 0-12 mois |
| 13 | **Voix rauque ou éteinte** | cri | Rien : ces mesures suivent surtout l'intensité, la pièce et le codec | Carte **« Voix enrouée »** ouverte par le parent : médecin si > 2 semaines ou depuis la naissance | 0-12 mois |
| 14 | **Toux grasse ou sèche** | toux | Rien : la référence elle-même est subjective ; « sèche » rassurerait à tort | Fusionnée dans l'entrée « Toux », aucune étiquette | 0-12 mois |
| 15 | **Gazouillis, rire** | autres sons | Rien de validé ; un gémissement pourrait passer pour un gazouillis | Renvoi au **carnet de santé**, aucun compteur ni badge | 1-12 mois |
| 16 | **Besoins du quotidien** (fatigue, inconfort, gaz) | cri | **Réfuté** : 36 % contre 33 % de hasard | Pistes **tirées du contexte saisi**, avec leur provenance | 0-12 mois |
| 17 | **Faim** | cri | **Réfuté** : un modèle sur ces données fait moins bien que répondre toujours « faim » | Rappel du délai depuis la dernière tétée saisie + alerte « refuse de boire » | 0-12 mois |
| 18 | **Âge, prématurité** | cri | Au niveau du groupe seulement ; le parent le sait déjà | Date de naissance saisie. Champ « né à terme / semaines » **à ajouter** avant de parler d'âge corrigé | 0-12 mois |
| 19 | **Sifflement, fréquence respiratoire** | respiration | Rien : tout système validé est posé sur le thorax | **Carte bronchiolite HAS**, jamais affichée ni masquée selon le clip | 0-12 mois |
| 20 | **Surdité** | cri | Rien : le pleur d'un bébé sourd sonne le plus souvent normalement | **Rappel du test auditif de maternité**, lié au repère babillage | 0-12 mois |
| 21 | **Stridor inspiratoire** | respiration | Rien : tout pleur normal comporte une inspiration sonore | Ajouté à la **carte Respiration** | 0-12 mois |

### B. Recherche — rien d'affiché (3)

| # | Signal | Pourquoi c'est utile | Ce qu'on fait |
|---|---|---|---|
| 22 | **Pleur ou pas pleur** (la porte d'entrée) | **Priorité n°1.** La porte actuelle prend un babillage ou une voix de femme pour un « pleur intense » | Banc de vrais clips téléphone (babillage, rire, voix, télé, toux, geignement). Critère de sécurité : combien de vrais pleurs sont rejetés à tort. Point de départ : le détecteur ouvert de Micheletti/Yao (segments de 5 s) |
| 23 | **Rythme et mélodie des salves** | Le rythme suit l'éveil, pas la cause | Étude hors ligne sur `EnesBabyCries1`, jamais affichée |
| 24 | **« Est-ce bien mon bébé ? »** | Meilleur résultat publié : environ 1 erreur sur 4 | Le vrai besoin se règle par un **sélecteur d'enfant**, pas par l'acoustique |

### C. Exclus — Babbl n'en dit jamais un mot (12)

| # | Signal | Raison principale |
|---|---|---|
| 25 | Pleur de douleur | Les marqueurs de douleur sont ceux de la détresse ; l'absence d'étiquette rassurerait sur un bébé septique qui geint |
| 26 | Maladies génétiques rares (cri-du-chat, Krabbe) | Diagnostiquées en maternité ; une alerte à domicile serait presque toujours fausse |
| 27 | Écart au profil habituel du bébé | Mesure la distance et le codec ; « pas d'écart » est une fausse réassurance |
| 28 | Coliques | Défini par une quantité de pleurs sur des jours, qui demande une écoute continue interdite |
| 29 | Reflux, otite, dents, allergie au lait | Aucune étude acoustique ; « c'est les dents » rassure à tort si c'est une méningite |
| 30 | Risque d'autisme | Effet non significatif, auteurs en conflit d'intérêts, non diagnosticable avant 18-24 mois |
| 31 | « Cinq sons » de Dunstan | Jamais validé de façon indépendante ; une page de débunkage reste possible |
| 32 | Hypoglycémie, maladie métabolique, dénutrition | Profil non spécifique ; une fausse alerte accuse la mère de mal nourrir |
| 33 | Jaunisse (y compris incompatibilité Rhésus) | La jaunisse se voit et se mesure ; seule la carte nouveau-né reste |
| 34 | Sevrage néonatal | 97 alertes sur 100 accuseraient la mère à tort |
| 35 | Lésion cérébrale à la naissance | Se diagnostique en salle de naissance ; seule preuve : un préprint non relu |
| 36 | Risque de mort subite | Une seule étude de 12 décès, jamais répliquée |

### D. Signaux manquants, signalés par le critique

Aucun n'est attendu au-delà de « carte statique » ; ils ferment les derniers trous.

- **Spasmes du nourrisson** (syndrome de West, 3-12 mois) : salves de mouvements brusques au réveil, souvent prises pour des coliques. Le délai de traitement compte. Carte : « filmez et consultez rapidement ». Libellé à valider sur les recommandations françaises.
- **Éternuements** : premier son non-pleur du nouveau-né, confondu avec la toux. À traiter comme classe de rejet interne de la porte, jamais affichée.
- **Bruits de tétée** : s'étouffe ou tousse à chaque tétée. Une ligne dans la carte « Respiration et toux ».
- **Respiration périodique normale** du nouveau-né : la carte actuelle dit « pauses respiratoires : 15 » sans dire quelle pause compte. Seuil à faire fixer par un pédiatre.
- **Voix nasillarde** (fuite nasale) : exclu, listé pour mémoire.
- **Voix d'adultes dans le clip** : un adulte qui crie est la situation même du risque de secouement. Aucune analyse des voix adultes, aucune conservation de l'audio brut, carte anti-secouement toujours visible.

---

## Ce que ça change par rapport à la première étude

- **La quantité de pleurs** quitte la recherche : la compter au son exige une écoute continue, exclue par le code pénal (art. 226-1). Il reste le journal saisi.
- **Le cri faible ou absent** devient une carte 15 statique ; **Dunstan** passe en exclu.
- **L'observation d'intensité** perd ses trois niveaux et le mot « aigu » : au plus deux descriptions de continuité.
- **Formulations retirées** de la première étude : « Babbl utilise l'âge corrigé » (fonction inexistante), « plus aigu et plus monotone que d'habitude », « plus intense et plus rauque que d'habitude », les messages « ce n'est sans doute pas les dents / le reflux », « sonorité inhabituelle sur plusieurs enregistrements ».
- **Argument corrigé** : « le stridor est à l'inspiration, le clip est expiré » ne vaut pas pour le geignement ni la toux, qui sont expirés. Ils sont écartés pour une autre raison : aucune validation au téléphone, confusions bénignes, et l'absence d'alerte qui se lirait comme un feu vert.
- **Lacunes fermées** : asthme, incompatibilité Rhésus, hypothyroïdie congénitale (dépistée à J3), dénutrition, Krabbe, vérification du locuteur, rythme des salves, et tous les sons autres que le cri.

---

## Défauts en production découverts pendant la vérification

À corriger **avant** d'ajouter une carte.

| Défaut | Où | Vérifié |
|---|---|---|
| La porte laisse passer un babillage à 300 Hz et une voix à 270 Hz, puis les classe « pleur intense » | `backend/triage_rules.py` (porte) | **Oui, reproduit** sur signaux synthétiques le 22/09 |
| L'observation dit « pleur soutenu et **aigu** » alors que la hauteur ne décide plus rien | `backend/taxonomy.py`, observation « intense » | Oui, par le critique |
| « Les pleurs sont plus fréquents entre 2h et 5h » présente un nombre d'enregistrements comme une fréquence de pleurs | `frontend/src/pages/History.tsx` | Oui, par le critique |
| Le prototype annonce « détection d'apnée entre pleurs » et « filtrage des bruits de fond » | `frontend/public/prototype/Babbl.html` | Oui, par le critique |
| Le message en voix clonée reprend l'hypothèse de contexte comme un état (« tu es fatigué ») juste après l'analyse | `backend/comfort_messages.py` via `app.py` | Rapporté par les arbitres, non revérifié |
| `FEATURES.md` et `TODO.md` affirment encore « 457 échantillons annotés par des pédiatres » et « 82,6 % » ; en réalité ce sont les parents qui ont étiqueté | `FEATURES.md`, `TODO.md` | Oui, via le fichier du corpus |
| Le filtre de mots interdits laisse passer « a mal », « bobo », « encéphalopathie », « cerveau », « asphyxie », « hypoglycémie », « sevrage » | `backend/mistral_client.py` | Rapporté par les arbitres, non revérifié |

---

## Ordre à l'écran recommandé

0. **Avant le bouton d'enregistrement** : la carte anti-secouement, toujours.
1. **Résultat de la porte**, ou la phrase de continuité si l'A/B l'autorise.
2. **Cartes de sécurité**, toujours affichées, jamais selon le son : « Appelez le 15 » · « Respiration et toux » (une seule carte, seuils recopiés de la fiche HAS/CNPP 2019 et d'Ameli) · « Nouveau-né de moins de 15 jours ».
3. **Pistes tirées de ce que le parent a saisi**, avec leur provenance.
4. **Journal** saisi par le parent, en totaux bruts.
5. **Menus ouverts par le parent** : Toux · Nez bouché / bruit en respirant · Voix enrouée · Quand appeler.
6. **Repères** : test auditif de maternité · babillage à 10-12 mois · conseil sur les échanges vocaux · FAQ « ce que Babbl ne fait pas ».

---

## Ce qui reste à trancher

- **Les chiffres externes n'ont pas pu être rouverts** pendant cette passe : le quota de recherche web a été épuisé et le proxy a bloqué PubMed, PMC, Nature et arXiv. Les nombres cités (sensibilités, AUC, taux d'erreur) sont à reconfirmer avant toute citation publique. **Le verdict n'en dépend pas** : il tient à l'absence de toute étude au format de Babbl.
- **Un pédiatre français doit fixer les seuils** de la carte « Respiration et toux » : les candidats proposaient des seuils incompatibles (toux aboyante avant 6 mois → 15 ; toute toux avant 3 mois → consulter), ce qui ferait recevoir une urgence plus basse à un bébé de 2 mois qu'à un bébé de 5 mois.
- **Une carte déclenchée par une case cochée** (« il tousse ») reste-t-elle hors dispositif médical, ou devient-elle du triage ? Même question pour la mise en avant selon l'âge. Une seule doctrine à faire valider par le conseil réglementaire.
- **Enregistrer une toux pour le médecin** : l'audio d'un bébé associé à sa santé est une donnée de santé. Stockage chez un hébergeur certifié HDS, consentement explicite, analyse d'impact.
- **Toute collecte de clips avec étiquettes cliniques** est une recherche sur la personne humaine (loi Jardé) : avis de comité d'éthique requis. Seul le banc sur corpus publics y échappe.
- **Âge corrigé** : il faut d'abord ajouter le champ « né à terme / semaines » ; en attendant, le repère babillage s'affiche sur l'âge réel avec la mention « si votre bébé est né prématuré, parlez-en à votre médecin ».
- Les lectures réglementaires (MDR, AI Act, code de la santé publique) sont celles de non-juristes. L'article du CSP qui sanctionne l'absence de marquage CE est probablement L.5461-2 et non L.5461-3, à vérifier sur Légifrance.
