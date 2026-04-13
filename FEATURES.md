# Babbl — Toutes les Features

## 3 Features Signature

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

## Feature Principale : Babbl Nuit — Baby Phone IA Autonome

Le parent pose le baby phone dans la chambre du bébé. L'app devient une nounou de nuit autonome qui combine toutes les features.

**Comment ça marche :**
1. Écoute en continu (mode basse consommation batterie)
2. Détecte les pleurs instantanément
3. Analyse le type de cri en temps réel (faim, fatigue, inconfort, douleur)
4. Décide de la réponse automatiquement :
   - Si fatigue ou besoin de réconfort → lance une Babbl Lullaby dans la voix du parent
   - Si faim ou douleur → alerte le parent avec la cause + action recommandée, joue la voix clonée en attendant qu'il arrive
5. Surveille si le bébé se calme après l'intervention
6. Si le bébé ne se calme pas → escalade : notification push au parent avec diagnostic complet
7. Rapport matinal : résumé complet de la nuit (nombre de réveils, causes, durées, interventions)

**Exemple de rapport matinal :**
"Cette nuit : 2 réveils. 22h30 — fatigue (berceuse jouée, rendormi en 4 min). 3h47 — faim (alerté, vous êtes intervenu)."

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
         Babbl Nuit (automatiser)
```

Les 4 features s'empilent :
- Cry analyse le problème
- Voice répond avec la voix du parent
- Lullaby endort le bébé
- Nuit fait tourner les 3 automatiquement pendant que le parent dort

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
| Babbl Nuit (baby phone) | Non | Non | Oui |
| Rapport matinal | Non | Non | Oui |
| Alerte pédiatre | Non | Non | Oui |
| Publicité | Oui | Non | Non |

---

*Babbl existe pour qu'aucun parent ne se sente seul à 3h du matin.*
