# Mettre Babbl en ligne

Le backend fonctionne déjà sans aucune clé : il reconnaît un pleur, écrit l'observation, propose les pistes tirées de ce que le parent saisit et affiche les cartes de sécurité. Chaque clé ajoute une couche, et `/api/health` dit laquelle est branchée.

| Clé | Ce qu'elle ajoute | Sans elle |
|---|---|---|
| `ANTHROPIC_API_KEY` | Résumé rédigé par Claude Sonnet 5, sous garde-fou | Résumé en texte fixe, toujours correct |
| `ELEVENLABS_API_KEY` | Résumé lu à voix haute, voix clonée du parent | Pas d'audio |
| `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` | Historique côté serveur, « ce qui a apaisé », suppression du compte | Tout reste dans le téléphone |

## 1. Base de données (une fois)

Dans Supabase → SQL Editor, exécuter `supabase/migrations/20260923_soothed_and_guidance_source.sql`. Sans risque : trois colonnes ajoutées, aucune donnée touchée. Le backend marche avant et après.

## 2. Render (le plus simple)

1. render.com → **New → Blueprint** → choisir le dépôt `LuigiRevelli/Babbl`, branche de votre choix. Render lit `render.yaml` et crée `babbl-api` et `babbl-web`.
2. Renseigner les secrets demandés. `SUPABASE_SERVICE_KEY` est la clé *service role* (Supabase → Settings → API), jamais la clé publique.
3. Une fois `babbl-api` en ligne, copier son adresse dans `VITE_API_URL` de `babbl-web`, et l'adresse de `babbl-web` dans `BABBL_ALLOWED_ORIGINS` de `babbl-api`. Relancer les deux.
4. Vérifier : `https://<babbl-api>/api/health` doit afficher `"llm": true`, `"voice": true`, `"database": true`.

## 3. Ailleurs (Railway, Fly.io, un serveur)

L'image `backend/Dockerfile` suffit : `docker build -t babbl-api backend && docker run -p 5001:5001 --env-file .env babbl-api`. Elle embarque ffmpeg (audio des navigateurs), précompile l'analyse audio au démarrage (première réponse en ~0,5 s au lieu de ~3,7 s) et tourne sans droits root.

Le frontend est un site statique : `cd frontend && npm ci && VITE_API_URL=https://… npm run build`, puis servir `frontend/dist` avec une réécriture de toutes les routes vers `index.html`.

## Avant d'ouvrir au public

- Relecture des cartes par un pédiatre (`recherche/cartes-a-relire.md`). Une fois validées, mettre `BABBL_CARDS_V2=1` sur `babbl-api` : `/api/health` affiche alors `"cards": "v2"` et `GET /api/cards` sert les nouvelles cartes et menus. Retour arrière : retirer la variable.
- Appel au conseil réglementaire (voir `LISTE-FINALE-SYMPTOMES.md`, « Ce qui reste à trancher »).
- Pages légales : brouillon de politique de confidentialité dans `legal/politique-confidentialite-BROUILLON.md` (à faire relire, avec la liste des points à trancher). Brouillons de CGU (`legal/cgu-BROUILLON.md`) et de mentions légales (`legal/mentions-legales-BROUILLON.md`) à compléter et faire relire. La suppression du compte existe déjà (page Profil).
