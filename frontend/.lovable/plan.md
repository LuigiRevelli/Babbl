

## Plan : Mode Nuit, Babyphone & Clonage vocal

### Vue d'ensemble

Trois nouvelles fonctionnalités accessibles depuis le Dashboard :

1. **Mode Nuit + Babyphone** : Une page `/night-mode` qui simule la connexion à un babyphone. Quand activé, le babyphone "écoute" et peut rassurer le bébé automatiquement. Tout le backend sera connecté plus tard — le frontend prépare les appels API avec des TODO.

2. **Personnalisation vocale (Clone)** : Une page `/voice-setup` où l'utilisateur enregistre quelques phrases pour cloner sa voix. Formulaire : Papa/Maman, prénom utilisateur, âge bébé, puis enregistrement audio. Après envoi, aperçu du résultat vocal.

### Fichiers à créer

**1. `src/pages/NightMode.tsx`** — Page mode nuit + babyphone
- Toggle "Mode Nuit" (change le thème en sombre, sauvegardé dans localStorage)
- Section "Connecter un babyphone" avec un bouton de connexion (état simulé : connecté/déconnecté)
- Quand connecté : affichage d'un statut live ("En écoute…", "Pleurs détectés → Réconfort envoyé")
- Appels API préparés avec TODO : détection de pleurs via babyphone, envoi de phrases rassurantes via TTS
- UI : fond sombre, animations douces, icônes lune/micro

**2. `src/pages/VoiceSetup.tsx`** — Personnalisation de la voix
- **Étape 1** : Formulaire — Papa/Maman (toggle), prénom de l'utilisateur (obligatoire), âge du bébé (tranches)
- **Étape 2** : Écran d'enregistrement — 3 à 5 phrases affichées à lire à voix haute, gros bouton enregistrer/stop pour chaque phrase (ou un enregistrement continu)
- **Étape 3** : Résultat — "Votre voix est prête !" avec bouton "Écouter un aperçu" qui joue un échantillon TTS cloné (TODO: appel API clone voice + TTS). En attendant le backend, utilise `speechSynthesis` du navigateur comme placeholder.
- Sauvegarde du profil vocal dans localStorage (`voiceProfile` dans `UserData`)

### Fichiers à modifier

**3. `src/lib/userData.ts`**
- Ajouter `nightMode: boolean` et `babyphoneConnected: boolean` dans `UserData`
- Ajouter `voiceProfile?: { role: ParentRole; userName: string; ageRange: AgeRange; audioRecorded: boolean; voiceId?: string }`

**4. `src/App.tsx`** — Ajouter routes `/night-mode` et `/voice-setup`

**5. `src/pages/Dashboard.tsx`** — Ajouter 2 nouvelles cartes CTA :
- "Mode Nuit / Babyphone" → navigue vers `/night-mode`
- "Personnaliser la voix" → navigue vers `/voice-setup`

### Détails techniques

- Enregistrement vocal : même approche que `Record.tsx` (`MediaRecorder`, WebM/opus, base64)
- Phrases à lire : liste de 3-5 phrases courtes en français ("Tout va bien mon cœur", "Maman/Papa est là", etc.)
- Le clonage vocal et le TTS seront gérés par le backend (ElevenLabs Voice Clone API) — le frontend prépare les payloads avec des TODO clairs
- Mode nuit : toggle CSS qui applique des variables sombres sur le layout, persisté dans localStorage
- Babyphone : état simulé avec des animations (onde sonore en écoute, notification de détection)

### UX

- Les phrases à enregistrer sont affichées une par une avec une animation de progression
- Gros boutons tactiles, optimisés mobile
- Feedback visuel après chaque phrase enregistrée (check vert)
- L'aperçu vocal joue une phrase type avec la voix clonée (ou placeholder navigateur)

