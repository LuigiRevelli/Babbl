# Babbl

> Babbl dit aux parents ce qu'un pleur prouve — et ce qu'il ne prouve pas — et apaise le bébé avec leur propre voix clonée.

**Fondé par Luigi Revelli Caracciolo** — [LinkedIn](https://www.linkedin.com/in/luigi-revelli/)

## Le Problème

Les pleurs de nourrisson sont l'une des expériences les plus universelles et les plus isolantes de la parentalité. Les bébés pleurent entre 1 et 3 heures par jour, et tant qu'ils ne peuvent pas parler, un pleur est leur seul langage. Les parents devinent : faim ? fatigue ? douleur ? couche mouillée ? surstimulation ?

Les conséquences de ce jeu de devinettes sont gravement sous-estimées en santé publique :

- **1 mère sur 7 en France** développe une dépression post-partum (Santé Publique France), et les épisodes de pleurs non résolus sont l'un des principaux déclencheurs.
- **80% des nouveaux parents** déclarent se sentir « complètement démunis » face à un bébé qui pleure (OMS, 2022).
- La privation chronique de sommeil est cliniquement liée au burnout parental et aux ruptures de couple. Sur le syndrome du bébé secoué, la preuve est plus précise qu'on ne le dit : le facteur de risque mesuré n'est **pas** la quantité de pleurs mais le **jugement** du parent que ces pleurs sont excessifs (×2,6) et son inquiétude (×3,1) (Reijneveld 2004, n = 3 259), avec un pic de cas entre 1 et 2 mois (CDC). Une app qui dit « votre bébé pleure trop » fabrique ce facteur de risque ; Babbl est conçu pour ne jamais le faire.

**Ce n'est pas un manque d'amour. C'est un manque d'information — et la première information honnête, c'est ce qu'un pleur ne dit pas.**

Babbl s'attaque à une crise silencieuse de santé publique qui se situe à l'intersection de la santé mentale maternelle, de la sécurité infantile et du bien-être parental — et qui jusqu'ici était laissée entièrement à l'intuition.

## Ce que fait Babbl

Babbl est une application web mobile-first qui, à partir de 10 secondes de pleurs et de ce que le parent a saisi, dit honnêtement ce que le son prouve, propose les hypothèses les plus simples à essayer, affiche des repères de sécurité fixes, et réconforte le bébé avec la voix clonée du parent. Voir `SYMPTOMS.md` pour ce que la science autorise — et n'autorise pas.

### Parcours utilisateur

1. **Onboarding.** Le parent configure son profil une fois : âge du bébé, et enregistre optionnellement 20 secondes de sa voix qui est clonée avec ElevenLabs. Cette voix clonée devient le réconfort personnalisé du bébé.

2. **Enregistrement.** Quand le bébé pleure, le parent ouvre l'app, appuie sur le bouton d'enregistrement, et approche le téléphone du bébé pendant 5 à 15 secondes.

3. **Analyse.** Babbl extrait des descripteurs acoustiques avec *librosa*, refuse l'enregistrement s'il est trop court ou sans pleur, puis produit deux couches — et rien d'autre :
   - **Ce que Babbl a entendu** : une observation en texte (pleur faible / modéré / intense) sur les secondes enregistrées. Jamais chiffrée, jamais stockée, jamais rassurante.
   - **D'après ce que vous avez saisi** : des hypothèses (faim, inconfort, fatigue, besoin de réconfort) déduites de la dernière tétée, de la couche et de l'âge — jamais du son, jamais en pourcentage.
   - Trois **repères de sécurité** fixes (fièvre avant 3 mois, respiration, nouveau-né), toujours affichés, mis en avant selon l'âge et ce que le parent saisit.
   - *Claude Sonnet* rédige le résumé chaleureux et les gestes à essayer à partir de ces deux couches, sous garde-fou : aucun pourcentage, aucun nom de maladie, aucun niveau d'alerte.

4. **Résultat.** Un écran calme : l'observation sonore, les hypothèses dans l'ordre, le geste à poser, les repères de sécurité, et deux boutons audio :
   - **« Écouter le résumé »** : une voix douce (ElevenLabs) lit le résumé au parent.
   - **« Réconforter mon bébé avec ma voix »** : la voix clonée du parent prononce un message de réconfort adapté à l'âge et à l'hypothèse retenue.

5. **Dashboard.** Les utilisateurs réguliers arrivent sur un tableau de bord gamifié : séries, XP, niveaux, badges, affirmations quotidiennes, exercice de respiration guidé pour les parents submergés, et historique complet des analyses passées.

### Note d'honnêteté

Le modèle de classification précédent (XGBoost sur Donate-a-Cry) atteignait 82,6 % de précision — là où répondre toujours « faim » en obtient 83,6 %. Il ne séparait rien et a été débranché. Un pleur ne porte de façon fiable que trois choses : le niveau de détresse à l'instant, l'âge approximatif, l'identité du bébé. Babbl ne prétend donc entendre ni cause ni maladie. Ce n'est pas un dispositif médical, et il ne rassure jamais sur l'état de santé du bébé. Détail dans `SYMPTOMS.md`.

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
- *librosa* pour les descripteurs acoustiques (hauteur, continuité, durée, spectre, MFCC)
- Règles déterministes (`triage_rules.py`) : porte d'entrée, observation sonore en texte, hypothèses depuis la saisie du parent, cartes de sécurité
- Aucun classifieur de cause en production (voir Note d'honnêteté)

### IA & APIs
- **Claude Sonnet** (Anthropic) — rédaction du résumé et des gestes à partir des hypothèses et de l'observation en texte, sans accès aux descripteurs acoustiques, sous garde-fou (`sanitize_llm_output`). Réponses en français.
- **ElevenLabs** — eleven_multilingual_v2 pour le TTS, et Instant Voice Cloning pour la feature signature : cloner la voix du parent pour réconforter le bébé.

### Base scientifique
`SYMPTOMS.md` — 21 pistes confrontées à 399 sources puis à des relecteurs adverses. `SCIENCE.md` — ce que le produit affiche et pourquoi.

## Les 5 Features Signature

1. **Babbl Cry** — Observation sonore honnête + hypothèses d'après la saisie du parent (Claude Sonnet, contraint)
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
