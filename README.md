# Babbl

> Comprends les pleurs de ton bébé en 10 secondes et apaise-le avec ta propre voix clonée.

**Fondé par Luigi Revelli Caracciolo** — [LinkedIn](https://www.linkedin.com/in/luigi-revelli/)

## Le Problème

Les pleurs de nourrisson sont l'une des expériences les plus universelles et les plus isolantes de la parentalité. Les bébés pleurent entre 1 et 3 heures par jour, et tant qu'ils ne peuvent pas parler, un pleur est leur seul langage. Les parents devinent : faim ? fatigue ? douleur ? couche mouillée ? surstimulation ?

Les conséquences de ce jeu de devinettes sont gravement sous-estimées en santé publique :

- **1 mère sur 7 en France** développe une dépression post-partum (Santé Publique France), et les épisodes de pleurs non résolus sont l'un des principaux déclencheurs.
- **80% des nouveaux parents** déclarent se sentir « complètement démunis » face à un bébé qui pleure (OMS, 2022).
- La privation chronique de sommeil causée par le décodage des pleurs la nuit est cliniquement liée au burnout maternel, aux ruptures de couple, et dans les cas extrêmes au syndrome du bébé secoué, qui touche environ 200 nourrissons chaque année en France.

**Ce n'est pas un manque d'amour. C'est un manque d'information.**

Babbl s'attaque à une crise silencieuse de santé publique qui se situe à l'intersection de la santé mentale maternelle, de la sécurité infantile et du bien-être parental — et qui jusqu'ici était laissée entièrement à l'intuition.

## Ce que fait Babbl

Babbl est une application web mobile-first qui aide les parents à comprendre pourquoi leur bébé pleure en moins de 10 secondes, et réconforte le bébé avec la voix clonée du parent.

### Parcours utilisateur

1. **Onboarding.** Le parent configure son profil une fois : âge du bébé, et enregistre optionnellement 20 secondes de sa voix qui est clonée avec ElevenLabs. Cette voix clonée devient le réconfort personnalisé du bébé.

2. **Enregistrement.** Quand le bébé pleure, le parent ouvre l'app, appuie sur le bouton d'enregistrement, et approche le téléphone du bébé pendant 5 à 15 secondes.

3. **Analyse.** En coulisses, Babbl extrait 19 descripteurs acoustiques avec *librosa* (pitch, énergie, features spectrales, MFCCs), les passe dans un classifieur *XGBoost* entraîné, puis envoie le tout à *Claude Sonnet* qui raisonne sur les features audio, les prédictions ML et le contexte parental pour retourner :
   - Des probabilités pondérées pour chaque cause de pleur (faim, fatigue, inconfort, douleur, surstimulation, besoin de réconfort)
   - Les signaux clés qui ont guidé la décision (traçable, pas une boîte noire)
   - Des actions recommandées priorisées
   - Un niveau de confiance et un champ d'alerte qui escalade vers « consulter un professionnel » si nécessaire
   - Un résumé chaleureux pour le parent

4. **Résultat.** Le parent voit un écran de résultat calme avec les barres de probabilité, la cause principale mise en avant, les actions à essayer, et deux boutons audio :
   - **« Écouter le résumé »** : une voix douce (ElevenLabs) lit le résultat au parent.
   - **« Réconforter mon bébé avec ma voix »** : la voix clonée du parent prononce un message de réconfort adapté à l'âge et à la cause détectée.

5. **Dashboard.** Les utilisateurs réguliers arrivent sur un tableau de bord gamifié : séries, XP, niveaux, badges, affirmations quotidiennes, exercice de respiration guidé pour les parents submergés, et historique complet des analyses passées.

### Note sur la précision

Le modèle actuel atteint 82.6% de précision sur le dataset Donate-a-Cry, mais le macro F1 est limité (18.1%) à cause d'un fort déséquilibre de classes (le dataset est dominé par la classe « faim »). Babbl est un **outil d'aide au triage**, pas un diagnostic clinique, et le score de confiance dans l'app reflète toujours cela de manière transparente.

## Stack Technique

### Frontend
- React (Vite), TypeScript, mobile-first (max-width 480px)
- Tailwind CSS + shadcn/ui
- Typographie Fraunces serif + Inter sans, design system crème/corail
- API MediaRecorder pour la capture audio
- localStorage pour la gamification et les données utilisateur
- Système i18n centralisé (français)

### Backend
- Python 3, Flask, Flask-CORS
- *librosa* pour l'extraction de features acoustiques (19 features : RMS, ZCR, centroïde/bandwidth/rolloff spectral, MFCC 1-13, durée, ratio de silence)
- Classifieur *XGBoost* (multi:softprob, entraîné sur Donate-a-Cry avec split stratifié et pondération de classes)
- Règles de triage contextuel qui ajustent les prédictions selon les horaires de repas/change/sommeil

### IA & APIs
- **Claude Sonnet** (Anthropic) — raisonnement JSON structuré sur features ML + contexte parental, temperature 0.3, prompt système imposant un ton chaleureux et une attribution transparente des signaux. Réponses en français.
- **ElevenLabs** — eleven_multilingual_v2 pour le TTS, et Instant Voice Cloning pour la feature signature : cloner la voix du parent pour réconforter le bébé.

### Base scientifique
Jeu de features aligné avec la littérature Frontiers / IEEE / MDPI sur l'analyse des pleurs de nourrisson (F0, énergie, descripteurs spectraux, MFCCs sont les marqueurs standard en classification académique).

## Les 5 Features Signature

1. **Babbl Cry** — Analyse IA des pleurs (XGBoost + Claude Sonnet)
2. **Babbl Voice** — Voix clonée du parent pour réconforter le bébé
3. **Babbl Lullaby** — Berceuses IA personnalisées chantées dans la voix du parent
4. **Babbl Monitor** — Baby phone hardware connecté (micro HD, veilleuse, capteurs)
5. **Babbl Alert** — Connexion directe au bon pédiatre en cas d'urgence

## Documents

| Document | Description |
|---|---|
| [FEATURES.md](FEATURES.md) | Détail des 5 features signature + features complémentaires |
| [BUSINESS_MODEL.md](BUSINESS_MODEL.md) | Pricing, projections financières, unit economics, concurrence |
| [TODO.md](TODO.md) | Suivi complet de l'avancement du projet (Phase 0 à 5) |

---

*Babbl existe pour qu'aucun parent ne se sente plus jamais seul à 3h du matin.*
