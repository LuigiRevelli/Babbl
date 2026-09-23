# Babbl — Toutes les Features

## 5 Features Signature

### 1. Babbl Cry — Ce qu'un pleur prouve, et ce qu'il ne prouve pas

Le parent enregistre 10 secondes de pleurs. Babbl dit honnêtement ce que le son permet de dire (presque rien), propose des pistes tirées de ce que le parent a saisi, et affiche des repères de sécurité fixes. Voir `LISTE-FINALE-SYMPTOMES.md`.

**Comment ça marche :**
1. Le parent appuie sur Record et approche le téléphone du bébé. Micro brut : réduction de bruit, réglage automatique du volume et annulation d'écho désactivés.
2. Le backend extrait des descripteurs avec librosa, dont la hauteur (pyin) et la part des trames voisées.
3. **Porte d'entrée** : si Babbl n'entend pas de pleur net, il refuse de répondre, rappelle qu'un bébé qui pleure peu n'est jamais rassurant en soi, et affiche les cartes de sécurité.
4. **Observation** : une phrase sur la continuité du pleur pendant le clip (presque continu, coupé de pauses, entrecoupé de longues pauses). Jamais un chiffre, jamais stockée.
5. **Pistes** tirées du contexte saisi (dernière tétée, couche, durée d'éveil, âge), jamais du son, jamais en pourcentage.
6. Claude Sonnet rédige le résumé à partir de ces deux couches, sous garde-fou : aucun pourcentage, aucun nom de maladie, aucune réassurance.

**Ce que le parent reçoit :**
- L'observation en une phrase, et ce que le son ne permet pas de dire
- Les pistes à essayer, avec leur provenance
- Trois cartes de sécurité fixes, toujours affichées
- Un résumé vocal (ElevenLabs) et un message de réconfort dans la voix du parent

**Ce que Babbl ne donne plus :** cause du pleur, pourcentage de confiance, alerte médicale. L'ancien classifieur XGBoost (Donate-a-Cry, 457 clips **étiquetés par les parents contributeurs**, pas par des pédiatres) obtenait 82,6 % de justesse, moins que répondre toujours « faim » (83,6 %). Il est débranché.

---

### 2. Babbl Voice — Clonage de Voix Parental

Le parent enregistre 20 secondes de sa voix. L'IA la clone. Désormais, l'app peut parler au bébé avec la voix de maman ou papa.

**Comment ça marche :**
1. Le parent enregistre un échantillon vocal de 20 secondes pendant l'onboarding
2. ElevenLabs (Instant Voice Cloning) crée un clone vocal en quelques secondes
3. Quand le bébé pleure, après l'analyse, le parent peut appuyer sur "Réconforter avec ma voix"
4. L'app génère un message de réconfort adapté à la cause détectée, prononcé dans la voix clonée du parent
5. Le message est adapté à l'âge du bébé (ton, rythme, vocabulaire)

**Pourquoi c'est puissant :**
- La voix du parent est le son le plus rassurant pour un bébé
- Fonctionne même quand le parent n'est pas physiquement là (au travail, en déplacement)
- 2 slots de voix : maman + papa
- Chaque message est unique et contextualisé (pas un enregistrement générique en boucle)

**Cas d'usage :**
- Bébé pleure la nuit → voix clonée le rassure le temps que le parent arrive
- Parent au travail → le conjoint peut lancer la voix de l'absent
- Baby-sitter → peut utiliser la voix du parent pour calmer le bébé

---

### 3. Babbl Lullaby — Berceuse IA Personnalisée

L'IA compose une berceuse unique pour le bébé, chantée dans la voix clonée du parent. La feature la plus virale de l'app.

**Comment ça marche :**
1. La voix du parent est déjà clonée (feature Voice)
2. Claude Sonnet génère des paroles personnalisées :
   - Inclut le prénom du bébé
   - Adapté à la cause du pleur (doux si fatigue, rassurant si inconfort)
   - Dans la langue du parent
   - Adapté à l'heure (berceuse du soir vs mélodie du matin)
3. Musique générée via API (Suno/Udio/ElevenLabs Music) — style berceuse acoustique, tempo lent
4. Voix clonée chante les paroles sur la mélodie via ElevenLabs
5. Audio final servi au parent (cacheable, réutilisable)

**Ce qui rend chaque berceuse unique :**
- Le prénom du bébé est dans les paroles
- Chantée dans la voix de maman ou papa
- S'adapte à l'état émotionnel détecté du bébé
- Nouvelle mélodie générée chaque semaine pour éviter l'habituation
- Disponible dans n'importe quelle langue

**Pourquoi c'est la feature la plus virale :**
Un parent filme son bébé qui s'endort avec une berceuse IA dans sa voix et poste sur TikTok/Instagram. Contenu viral natif. Chaque utilisateur devient potentiellement une pub gratuite pour Babbl. Budget marketing : 0€.

**Coût :** ~0.15-0.25€ par berceuse générée

---

### 4. Babbl Monitor — Le Baby Phone Physique Connecté

Un vrai appareil hardware conçu et commercialisé par Babbl, placé dans la chambre du bébé. Pas un téléphone posé à côté — un produit dédié, optimisé pour cette mission.

**Le produit physique :**
- Micro haute sensibilité optimisé pour capter les pleurs avec précision
- Haut-parleur intégré pour diffuser la voix clonée et les berceuses
- Veilleuse douce intégrée (intensité réglable, couleur chaude)
- Capteur de température et humidité de la chambre
- Connexion WiFi → communique directement avec l'app Babbl sur le téléphone du parent
- Design doux et arrondi, matériaux baby-safe, sans écran (pas de lumière bleue)
- Batterie de secours en cas de coupure de courant
- Compact et portable (fonctionne aussi en voyage)

**Comment ça marche avec l'app :**
1. Le Babbl Monitor écoute en continu dans la chambre (micro dédié, bien meilleur qu'un téléphone)
2. Détecte les pleurs instantanément et envoie l'audio au backend Babbl
3. L'IA analyse le type de cri en temps réel (faim, fatigue, inconfort, douleur)
4. Décide de la réponse automatiquement :
   - Si fatigue ou besoin de réconfort → le Monitor diffuse une Babbl Lullaby dans la voix du parent
   - Si faim ou douleur → le Monitor joue la voix clonée en attendant + l'app alerte le parent avec la cause et l'action recommandée
5. Le Monitor surveille si le bébé se calme après l'intervention
6. Si le bébé ne se calme pas → escalade : notification push au parent avec diagnostic complet
7. Rapport matinal sur l'app : résumé complet de la nuit

**Exemple de rapport matinal :**
"Cette nuit : 2 réveils. 22h30 — fatigue (berceuse jouée via Monitor, rendormi en 4 min). 3h47 — faim (alerté, vous êtes intervenu). Température chambre : 21°C stable. Humidité : 45%."

**Pourquoi un produit physique et pas juste le téléphone :**
- Le micro est optimisé pour la captation de pleurs (directivité, filtrage bruit ambiant) → analyse plus précise
- Le haut-parleur est optimisé pour la voix douce → meilleure qualité de berceuse
- Pas besoin de laisser son téléphone dans la chambre du bébé toute la nuit (batterie, notifications, etc.)
- Le parent garde son téléphone avec lui et reçoit les alertes dessus
- La veilleuse et les capteurs environnementaux ajoutent de la valeur
- Un objet dédié = le parent n'oublie jamais de le mettre en place (habitude)
- C'est un produit CADEAU parfait pour une baby shower ou une naissance

**Business model hardware :**
- Prix de vente : 79-129€ (positionnement mid-premium, moins cher que Nanit à 299€)
- Coût de fabrication estimé : 25-40€ (micro + speaker + WiFi + capteurs + boîtier)
- Marge brute hardware : ~60-70%
- L'appareil NÉCESSITE un abonnement Babbl Voice pour fonctionner → revenue récurrent garanti
- Chaque Monitor vendu = un abonné Babbl Voice à 9.99€/mois pendant 12+ mois
- Revenue total par Monitor vendu : 129€ (hardware) + 120€ (abonnement annuel) = ~249€ par client

**Pourquoi c'est stratégiquement puissant :**
- Crée une barrière d'entrée physique (un concurrent software ne peut pas copier ça facilement)
- Le parent qui a acheté le Monitor ne va JAMAIS chez un concurrent (coût d'investissement + habitude)
- Revenu mixte hardware + software = valorisation startup beaucoup plus élevée
- Possibilité de vendre en retail (Fnac, Amazon, pharmacies, magasins bébé)
- Le Monitor est un objet visible dans la chambre = marketing physique permanent

**Roadmap hardware :**
- Phase 1 : L'app utilise le téléphone comme baby phone (mode Babbl Nuit — ce qu'on a déjà)
- Phase 2 : Conception et prototypage du Babbl Monitor (3D print + Raspberry Pi pour le MVP)
- Phase 3 : Production série et commercialisation (partenariat fabricant ou crowdfunding Kickstarter)

---

### 5. Babbl Alert — Connexion Directe au Bon Professionnel de Santé

Quand l'IA détecte quelque chose d'anormal, elle ne dit pas juste "consultez un médecin". Elle connecte le parent DIRECTEMENT avec le bon professionnel, au bon moment, avec toutes les données déjà prêtes.

**Le problème que ça résout :**
Il est 3h du matin. Le bébé hurle de douleur depuis 45 minutes. Le parent a analysé 3 fois avec Babbl, la douleur persiste. Il est paniqué. Qu'est-ce qu'il fait ? Il appelle le 15 (SAMU) et attend 20 minutes en ligne ? Il cherche un pédiatre sur Doctolib à 3h du mat ? Il va aux urgences avec un bébé qui hurle en voiture ?

Babbl Alert résout ça : un bouton, une connexion, un professionnel qui a DÉJÀ les données du bébé.

---

#### Le Système d'Alerte à 4 Niveaux

**🟢 Vert — Normal (aucune alerte)**
- L'analyse est standard, cause identifiée, confiance haute
- Actions recommandées suffisent
- "Votre bébé a faim, voici quoi faire"

**🟡 Jaune — Attention (surveillance)**
- Pattern légèrement inhabituel ou confiance basse
- Recommandation : re-analyser dans 1h, surveiller
- "Certains signaux sont inhabituels. Relancez une analyse dans 1h. Si ça persiste, Babbl vous proposera un professionnel."
- L'app programme un rappel automatique

**🟠 Orange — Consultation recommandée (sous 24h)**
- Pattern anormal détecté mais pas d'urgence immédiate
- Exemples : pleurs récurrents de douleur sur 3+ analyses, pattern compatible avec coliques, otite, reflux
- Babbl propose de prendre RDV avec un pédiatre
- → Connexion Doctolib / réseau Babbl Pro pour RDV dans les 24h
- Le professionnel reçoit le Babbl Report avant la consultation

**🔴 Rouge — Urgent (intervention immédiate)**
- Signaux de détresse aiguë, douleur intense persistante, patterns neurologiques anormaux
- Babbl propose immédiatement :
  - 1. Téléconsultation pédiatrique instantanée (via réseau Babbl Pro)
  - 2. Appel direct au 15 (SAMU) — pré-rempli avec localisation
  - 3. Itinéraire vers les urgences pédiatriques les plus proches (GPS)
- Le professionnel reçoit le Babbl Report en temps réel

---

#### Le Babbl Report — Le Dossier que le Médecin Reçoit

Quand un parent se connecte avec un professionnel via Babbl Alert, le médecin ne part pas de zéro. Il reçoit un rapport structuré :

**Données incluses dans le Babbl Report :**
- Historique des pleurs des dernières 24h à 7 jours (fréquence, durées, causes détectées)
- Courbes de tendance des causes (la douleur augmente-t-elle ?)
- Caractéristiques acoustiques des pleurs (pitch, énergie, patterns spectraux anormaux)
- Contexte parental (alimentation, sommeil, changes, température si Monitor)
- Données environnementales du Babbl Monitor (température chambre, humidité)
- Niveau de triage IA avec explication des signaux qui ont déclenché l'alerte
- Âge du bébé, informations pertinentes du profil

**Pourquoi c'est révolutionnaire pour le médecin :**
- Il a un "dossier patient" AVANT que le parent ouvre la bouche
- Les données objectives (acoustique) complètent le ressenti subjectif du parent
- Il gagne 5-10 minutes de consultation (pas besoin de poser "depuis quand ?", "combien de fois ?", "à quelle heure ?")
- Il peut comparer avec les données des consultations précédentes
- C'est un outil d'aide à la décision, pas un diagnostic concurrent

---

#### Le Réseau Babbl Pro — La Marketplace Santé

**Phase 1 : Partenariat Doctolib (lancement)**

Intégration via l'API Doctolib pour :
- Rechercher les pédiatres disponibles près du parent (géolocalisation)
- Filtrer par disponibilité (urgent = aujourd'hui, recommandé = cette semaine)
- Pré-remplir le motif de consultation avec le résumé Babbl
- Le parent réserve en 2 taps sans quitter l'app Babbl
- Doctolib gère le paiement et la téléconsultation

Avantages : base de médecins massive (380 000+ praticiens en France), confiance établie, pas de recrutement nécessaire.
Inconvénient : pas de commission pour Babbl (Doctolib ne partage pas), dépendance.

**Phase 2 : Réseau Babbl Pro (propre plateforme, à partir du mois 12-18)**

Babbl recrute son propre réseau de professionnels certifiés :

**Qui sont les Babbl Pros :**
- Pédiatres libéraux
- Pédiatres hospitaliers (en garde)
- Sages-femmes
- Infirmières puéricultrices
- Pédopsychiatres (pour le volet santé mentale parentale)
- Médecins ORL pédiatriques (otites = cause majeure de pleurs)
- Gastro-pédiatres (coliques, reflux)

**Pourquoi les professionnels VEULENT être sur Babbl Pro :**
- Ils reçoivent le Babbl Report avant chaque consultation (gain de temps)
- Flux de patients qualifiés (pas des parents anxieux pour rien — l'IA a déjà filtré)
- Visibilité auprès de jeunes parents (la démographie la plus active en recherche de pédiatre)
- Outil de suivi à distance entre les consultations
- Dashboard professionnel avec données anonymisées agrégées
- Badge "Babbl Pro Certified" = crédibilité et confiance

**Pourquoi les parents préfèrent un Babbl Pro :**
- Le médecin a DÉJÀ toutes les données du bébé (pas besoin de tout réexpliquer)
- Le médecin connaît l'app et sait interpréter les données
- Disponibilité garantie pour les alertes orange et rouge
- Téléconsultation intégrée directement dans l'app (pas de redirection)
- Suivi continu : le médecin voit l'évolution entre les consultations

---

#### Fonctionnement de la Téléconsultation Babbl Pro

1. Alerte orange ou rouge déclenchée
2. Le parent appuie sur "Parler à un professionnel"
3. L'app propose les Babbl Pros disponibles (triés par : spécialité adaptée à la cause détectée → proximité → disponibilité → note)
4. Le parent choisit un professionnel
5. Le Babbl Report est envoyé automatiquement au médecin
6. Téléconsultation vidéo ou audio directement dans l'app Babbl
7. Le médecin peut voir en temps réel les données du Monitor (température, audio)
8. À la fin : le médecin laisse des notes dans le Babbl Report, prescrit si nécessaire
9. Ordonnance envoyée par email, parent redirigé vers pharmacie de garde si besoin

**Pour les alertes de nuit (le cas critique) :**
- Réseau de médecins de garde inscrits sur Babbl Pro
- Rotation par timezone et disponibilité
- Temps de réponse cible : moins de 10 minutes pour une alerte rouge
- Si aucun Babbl Pro dispo → fallback automatique vers le 15 (SAMU) avec transfert du Babbl Report

---

#### Business Model Babbl Alert

**Pour les parents :**

| Service | Prix | Inclus dans |
|---|---|---|
| Alertes automatiques (détection) | Gratuit | Tous les paliers |
| Prise de RDV Doctolib (Phase 1) | Gratuit (Doctolib gère) | Babbl+ et Voice |
| Téléconsultation Babbl Pro | 25-35€/consultation | Pay-per-use |
| Pack 3 téléconsultations | 59€ (économie ~30%) | Pay-per-use |
| Téléconsultations illimitées | 14.99€/mois en add-on | Add-on sur Babbl Voice |

**Pour les professionnels :**

| Service | Prix |
|---|---|
| Inscription Babbl Pro (de base) | Gratuit |
| Dashboard avancé + analytics patients | 49€/mois |
| Visibilité prioritaire (mis en avant) | 99€/mois |
| Commission par téléconsultation | 20-25% (Babbl prend 5-8€ par consult de 25-35€) |

**Revenue estimé :**

| Métrique | 12 mois | 24 mois |
|---|---|---|
| Téléconsultations/mois | 500 | 5 000 |
| Commission moyenne/consult | 6€ | 6€ |
| Revenue téléconsult/mois | 3 000€ | 30 000€ |
| Abonnements pro (50 → 300 médecins) | 2 450€/mois | 14 700€/mois |
| **Revenue Alert total/mois** | **5 450€** | **44 700€** |
| **Revenue Alert ARR** | **65K€** | **536K€** |

---

#### Intégration avec le Babbl Monitor

Le Babbl Monitor rend les alertes encore plus puissantes :

- Le micro HD capte des nuances que le téléphone manquerait → alertes plus précises
- Le capteur de température détecte si la chambre est trop chaude/froide → contexte pour le médecin
- Le capteur d'humidité ajoute des données environnementales au Babbl Report
- Pendant la téléconsultation, le médecin peut écouter le bébé EN DIRECT via le Monitor
- Le médecin peut envoyer un message vocal via le Monitor pour rassurer le parent/bébé

---

#### Aspects Réglementaires

**Ce que Babbl Alert N'EST PAS :**
- Pas un dispositif médical (pas de diagnostic)
- Pas un service de télémédecine (c'est une marketplace qui connecte)
- Pas un substitut au 15/SAMU pour les urgences vitales

**Ce que Babbl Alert EST :**
- Un outil de triage intelligent qui SUGGÈRE de consulter
- Une marketplace de mise en relation parent-professionnel
- Un facilitateur de transmission de données de santé

**Conformité nécessaire :**
- RGPD strict (données de santé = catégorie sensible)
- Hébergement HDS (Hébergeur de Données de Santé agréé — OVH Health, AWS HDS, etc.)
- Consentement explicite du parent pour le partage de données avec le professionnel
- Droit à l'effacement des données médicales
- Pas de conservation des données de téléconsultation au-delà du nécessaire

**Roadmap réglementaire :**
- Phase 1 : Redirection Doctolib (pas de données santé hébergées par Babbl)
- Phase 2 : Certification HDS pour héberger les Babbl Reports
- Phase 3 : Discussions avec l'ARS pour conventionnement potentiel (remboursement sécu des téléconsultations via Babbl)

---

### 6. Babbl Baseline — Apprentissage du Profil Acoustique Unique

Chaque bébé pleure différemment. Babbl Baseline apprend le profil acoustique unique de votre bébé au fil du temps, et détecte quand un pleur sort de l'ordinaire — pour CE bébé en particulier.

**Comment ça marche :**
1. À chaque analyse de pleurs, Babbl enregistre les caractéristiques acoustiques (pitch, énergie, amplitude, timbre MFCC, spectre, durée, etc.)
2. Ces données alimentent un profil acoustique personnel via une formule de moyenne incrémentale (algorithme de Welford) — pas besoin de recalculer tout l'historique
3. Après un minimum de 5 analyses, le profil est considéré comme fiable et Babbl Baseline s'active
4. À chaque nouvelle analyse, Babbl compare les caractéristiques du pleur actuel au profil appris
5. Un score de déviation (0-100) est calculé, et les caractéristiques qui dévient significativement (> 1.5 écarts-types) sont identifiées
6. Si la déviation dépasse 70/100, le niveau d'alerte est automatiquement escaladé

**Ce que le parent reçoit :**
- Score de déviation (0-100) : à quel point ce pleur est inhabituel pour SON bébé
- Liste des caractéristiques anormales (ex : "pitch anormalement élevé", "énergie inhabituellement forte")
- Message contextuel en français (ex : "Ce pleur dévie significativement du profil habituel de votre bébé")
- Compteur de progression vers l'activation de la baseline (ex : "3/5 échantillons")

**Caractéristiques acoustiques suivies dans la baseline :**
- Pitch moyen et écart-type (hauteur du cri)
- Énergie totale et amplitude (intensité)
- Centroïde spectral, bandwidth, rolloff (forme du spectre)
- Taux de passages par zéro (rugosité)
- 13 coefficients MFCC (timbre vocal unique du bébé)
- Durée et ratio de silence
- Pitch min/max historiques

**Pourquoi c'est un avantage concurrentiel majeur :**
- **Personnalisation profonde** : aucun concurrent ne fait de l'apprentissage par bébé individuel. Les autres apps comparent à des moyennes génériques.
- **Plus le parent utilise l'app, plus elle devient précise** : effet volant d'inertie (flywheel) — chaque analyse rend la suivante plus pertinente
- **Rétention naturelle** : le parent ne veut pas perdre le profil acoustique que Babbl a appris sur 50+ analyses. Coût de switching élevé.
- **Détection précoce** : un changement soudain dans le pattern de pleurs peut signaler un problème de santé avant même que le parent ne le remarque
- **Fonctionne avec Babbl Alert** : une déviation forte déclenche automatiquement une escalade d'alerte, ce qui accélère la mise en relation avec un professionnel de santé

**Seuil de sécurité :**
La baseline ne commence à influencer les alertes qu'après 5 analyses minimum. Avant ce seuil, le parent voit un compteur de progression. Cela évite les faux positifs sur un profil acoustique pas encore fiable.

---

## Babbl Nuit — Le Mode Baby Phone (via téléphone ou Monitor)

Que ce soit avec le Babbl Monitor ou simplement avec le téléphone posé dans la chambre, le mode Babbl Nuit transforme l'appareil en nounou de nuit autonome.

**Fonctionnement identique sur les deux supports :**
1. Écoute en continu
2. Détecte et analyse les pleurs en temps réel
3. Répond automatiquement (berceuse ou voix clonée selon la cause)
4. Alerte le parent si intervention nécessaire
5. Rapport matinal

La différence : le Babbl Monitor offre une meilleure qualité audio (captation et diffusion), les capteurs environnementaux, la veilleuse, et libère le téléphone du parent.

**Pourquoi c'est la feature qui retient les utilisateurs :**
On vend du sommeil. La douleur n°1 des nouveaux parents. Un parent qui gagne 2h de sommeil par nuit grâce à Babbl Nuit ne cancel jamais son abonnement.

---

## Features Complémentaires

### Dashboard Gamifié
- Streaks (jours consécutifs d'utilisation)
- XP et niveaux
- Badges (First Cry, 3-Day Streak, Night Owl, Calm Master)
- Affirmations quotidiennes pour encourager le parent
- Historique complet de toutes les analyses passées
- Tendances hebdomadaires (graphiques)

### Exercice de Respiration (4-4-6)
- Exercice guidé pour les parents submergés
- Animation circulaire : inspire 4s, maintien 4s, expire 6s
- Gratuit (coûte rien à fournir, fidélise les utilisateurs)
- Accessible depuis le dashboard à tout moment

### Night Mode (Manuel)
- Interface sombre pour ne pas éblouir le bébé ou le parent la nuit
- Luminosité réduite automatiquement
- Sons d'ambiance optionnels (bruit blanc, pluie, océan)

### Historique et Tendances
- Timeline de toutes les analyses
- Graphiques hebdomadaires : évolution des causes principales
- Patterns détectés : "Votre bébé pleure plus souvent entre 18h et 20h"
- Export possible pour montrer au pédiatre

### Contexte Parental
- Suivi du dernier repas, dernier change, dernière sieste
- Ces données alimentent l'IA pour affiner les prédictions
- Interface simple : boutons rapides pour logger "vient de manger", "couche changée", etc.

### Alerte Pédiatre
Voir Feature Signature n°5 : Babbl Alert

---

## Résumé de l'Écosystème

```
         Babbl Cry (comprendre le pleur)
              ↓
         Babbl Baseline (apprendre le profil unique du bébé)
              ↓
         Babbl Voice (réconforter le bébé)
              ↓
         Babbl Lullaby (apaiser et endormir)
              ↓
         Babbl Monitor (le hardware dans la chambre)
              ↓
         Babbl Nuit (automatiser le tout la nuit)
              ↓
         Babbl Alert (connecter au médecin si nécessaire)
```

Les features forment une chaîne complète :
- Cry analyse le problème
- Baseline apprend le profil acoustique unique du bébé et détecte les déviations
- Voice répond avec la voix du parent
- Lullaby endort le bébé
- Monitor capte, diffuse et surveille avec un matériel optimisé
- Nuit fait tourner le tout automatiquement pendant que le parent dort
- Alert intervient quand l'IA détecte que ce n'est plus du ressort de l'app mais d'un professionnel

Babbl couvre l'intégralité du parcours : de la compréhension du pleur jusqu'à la connexion médicale. Le parent n'a jamais besoin de quitter l'écosystème.

---

## Tech Stack

| Composant | Technologie |
|---|---|
| Frontend | React (Vite), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python 3, Flask, Flask-CORS |
| Analyse audio | librosa (19 features acoustiques) |
| Machine Learning | XGBoost (classifieur multi-classes) |
| IA raisonnement | Claude Sonnet (Anthropic API) |
| Voix / TTS | ElevenLabs (eleven_multilingual_v2 + Instant Voice Cloning) |
| Berceuses | ElevenLabs Music + Claude Sonnet (paroles) |
| Dataset | Donate-a-Cry corpus (457 clips étiquetés par les parents ; modèle débranché) |

---

## Accès par Palier

| Feature | Free | Babbl+ (6.99€/mois) | Babbl Voice (9.99€/mois) |
|---|---|---|---|
| Analyse de pleurs | 5/jour | Illimité | Illimité |
| Résultat (cause + %) | Oui | Oui | Oui |
| Explication IA détaillée | Non | Oui | Oui |
| Actions recommandées | 1ère seulement | Toutes | Toutes |
| Historique | 7 jours | Complet | Complet |
| Exercice respiration | Oui | Oui | Oui |
| Night mode | Non | Manuel | Auto-détection |
| Voice clone | Non | Non | 2 voix (maman + papa) |
| Babbl Lullaby | Non | Non | Oui |
| Babbl Nuit (via téléphone) | Non | Non | Oui |
| Babbl Monitor (hardware) | Non | Non | Compatible (vendu séparément) |
| Rapport matinal | Non | Non | Oui |
| Babbl Alert (détection auto) | Basique | Oui (4 niveaux) | Oui (4 niveaux) |
| Babbl Alert (connexion Doctolib) | Non | Oui | Oui |
| Babbl Alert (téléconsult Babbl Pro) | Non | Non | Pay-per-use ou add-on |
| Babbl Report (envoyé au médecin) | Non | Non | Oui |
| Publicité | Oui | Non | Non |

---

*Babbl existe pour qu'aucun parent ne se sente seul à 3h du matin.*
