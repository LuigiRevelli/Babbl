# Babbl — Toutes les Features

## 4 Features Signature

### 1. Babbl Cry — Analyse de Pleurs IA

Le coeur de l'app. Le parent enregistre 5-15 secondes de pleurs, l'IA analyse et donne la cause en moins de 10 secondes.

**Comment ça marche :**
1. Le parent appuie sur Record et approche le téléphone du bébé
2. L'audio est envoyé au backend qui extrait 19 descripteurs acoustiques avec librosa :
   - Hauteur du son (pitch/F0)
   - Énergie (RMS)
   - Taux de passages par zéro (ZCR)
   - Caractéristiques spectrales (centroïde, bandwidth, rolloff)
   - 13 coefficients MFCC (le "timbre" du cri)
   - Durée et ratio de silence
3. Ces features passent dans un classifieur XGBoost entraîné sur 457 échantillons annotés par des pédiatres
4. Claude Sonnet reçoit les features audio + probabilités ML + contexte parent (dernière tétée, état de la couche, posture du bébé) et affine le diagnostic
5. Des règles de triage contextuel ajustent les probabilités (ex : bébé a mangé il y a 4h → probabilité faim monte)

**Ce que le parent reçoit :**
- Cause principale avec pourcentage de confiance
- Barres de probabilité pour chaque cause (faim, fatigue, inconfort, douleur, overstimulation, besoin de réconfort)
- Explication des signaux audio qui ont pesé dans la décision (pas une boîte noire)
- Actions recommandées hiérarchisées
- Résumé vocal chaleureux (ElevenLabs)
- Niveau de confiance et alerte médicale si nécessaire

**Précision actuelle :** 82.6% sur le dataset Donate-a-Cry. Outil de triage, pas un diagnostic clinique.

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
- Si l'analyse détecte un triage haute urgence (douleur persistante, patterns anormaux)
- Notification spéciale : "Ces signaux méritent l'avis d'un professionnel"
- Pas de diagnostic médical, mais un signal d'alerte intelligent

---

## Résumé de l'Écosystème

```
         Babbl Cry (comprendre)
              ↓
         Babbl Voice (réconforter)
              ↓
         Babbl Lullaby (apaiser)
              ↓
         Babbl Monitor (le hardware dédié)
              ↓
         Babbl Nuit (automatiser le tout)
```

Les features s'empilent :
- Cry analyse le problème
- Voice répond avec la voix du parent
- Lullaby endort le bébé
- Monitor capte, diffuse et surveille avec un matériel optimisé
- Nuit fait tourner le tout automatiquement pendant que le parent dort

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
| Dataset | Donate-a-Cry corpus (457 échantillons annotés) |

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
| Alerte pédiatre | Non | Non | Oui |
| Publicité | Oui | Non | Non |

---

*Babbl existe pour qu'aucun parent ne se sente seul à 3h du matin.*
