# Babbl — Suivi du Projet

## Légende
- ✅ Fait
- 🔄 En cours
- ❌ À faire
- ⏳ Phase future

---

## Phase 0 — Fondations ✅

| Tâche | Statut | Date |
|---|---|---|
| Structure projet (frontend React + backend Flask) | ✅ | Avril 2026 |
| Backend Flask API (/api/analyze, /api/voice/clone, /api/health) | ✅ | Avril 2026 |
| Modèle ML XGBoost entraîné sur Donate-a-Cry (457 samples) — débranché en septembre 2026 | ✅ | Avril 2026 |
| Extraction features audio (librosa, 19 features acoustiques) | ✅ | Avril 2026 |
| Intégration Claude Sonnet (raisonnement IA sur features + contexte) | ✅ | Avril 2026 |
| Intégration ElevenLabs (TTS résumé vocal) | ✅ | Avril 2026 |
| Clonage vocal ElevenLabs (endpoint /api/voice/clone) | ✅ | Avril 2026 |
| Messages de réconfort (voix clonée du parent) | ✅ | Avril 2026 |
| Règles de triage contextuel (ajustement probabilités selon contexte parent) | ✅ | Avril 2026 |
| Score de fiabilité (reliability score sur les prédictions) | ✅ | Avril 2026 |
| Câblage frontend → backend (Record, VoiceSetup, AnalysisResult) | ✅ | Avril 2026 |
| Configuration .env (clés API Anthropic + ElevenLabs) | ✅ | Avril 2026 |
| Repo GitHub créé et sync avec Lovable | ✅ | Avril 2026 |
| Renommage complet CareBaby → Babbl | ✅ | Avril 2026 |
| Test end-to-end (analyse audio → résultat → TTS) | ✅ | Avril 2026 |
| Traduction complète FR (frontend i18n + backend prompts + messages de réconfort) | ✅ | Avril 2026 |

---

## Phase 1 — MVP Fonctionnel 🔄

| Tâche | Statut | Détails |
|---|---|---|
| Base de données Supabase (5 tables) | ✅ | profiles, analyses, context_logs, badges, baby_baselines — avec RLS + trigger auto-création profil |
| Authentification (inscription/connexion) | ✅ | Page /auth, AuthProvider, routes protégées, bouton déconnexion |
| Migration localStorage → Supabase | ✅ | supabaseData.ts (8 fonctions), Record/Dashboard/VoiceSetup lisent/écrivent en base |
| Backend → Supabase | ✅ | Le backend sauvegarde chaque analyse dans Supabase côté serveur (service role key) |
| Babbl Baseline (profil acoustique) | ✅ | Table baby_baselines, apprentissage incremental (Welford), score de deviation 0-100, escalade alerte auto si deviation > 70 apres 5+ echantillons |
| Nom de domaine babbl.fr | ✅ | Acheté sur OVH |
| Déploiement en ligne (Railway/Render) | 🔄 | Prêt : `render.yaml`, `backend/Dockerfile`, `DEPLOY.md`. Reste à créer le service avec les clés |
| PWA (Progressive Web App) | ❌ | Installable sur téléphone, icône sur écran d'accueil |
| Fix preview voix clonée | ❌ | VoiceSetup utilise encore le TTS navigateur pour la preview au lieu de la vraie voix clonée ElevenLabs |
| Onboarding amélioré | ❌ | Parcours de bienvenue guidé : profil parent, nom du bébé, âge, premier enregistrement |

---

## Phase 1 bis — Honnêteté du produit (septembre 2026) 🔄

| Tâche | Statut | Détails |
|---|---|---|
| Liste finale des symptômes (36 signaux de la voix vérifiés) | ✅ | `LISTE-FINALE-SYMPTOMES.md` |
| Sept défauts de production corrigés | ✅ | Vocabulaire, voix clonée, filtre, historique, prototype, docs |
| Porte d'entrée mesurée sur 366 vrais pleurs | ✅ | Rejets à tort de 21 % à 2,2 %, non-pleurs acceptés 36,6 % (`recherche/banc-porte-2026-09.md`) |
| Brouillons des cartes et repères | ✅ | `backend/draft_cards.py`, à faire relire par un pédiatre |
| Page d'accueil et maquettes réécrites | ✅ | Plus de pourcentage, de faux témoignage ni de fausses statistiques |
| « Ce qui l'a calmé » | 🔄 | Question à la réouverture, liste fermée |
| Relecture pédiatrique des cartes | ❌ | Bloque leur publication |
| Appel conseil réglementaire | ❌ | Case cochée → carte : hors DM ? Enregistrement de toux : HDS ? |
| Porte : rejeter babillage, voix et bruits de la maison | ❌ | 36,6 % de non-pleurs passent encore. Demande de vrais enregistrements négatifs au téléphone |

## Phase 2 — Monétisation ❌

| Tâche | Statut | Détails |
|---|---|---|
| Intégration Stripe | ❌ | Abonnements Babbl+ (6.99€/mois) et Babbl Voice (9.99€/mois) |
| Paywall dans l'app | ❌ | Gratuit : observation, pistes, 1 geste, repères de sécurité (toujours gratuits). Payant : tous les gestes, résumé vocal, voix clonée |
| Landing page (babbl.fr) | ❌ | Site vitrine pour acquisition : explication produit, pricing, témoignages, CTA téléchargement |
| Pages légales | ❌ | CGU, Politique de confidentialité, Mentions légales, conformité RGPD |

---

## Phase 3 — Features Signature ❌

| Tâche | Statut | Détails |
|---|---|---|
| Babbl Lullaby | ❌ | Berceuses IA personnalisées dans la voix clonée du parent. Intégration Suno/Udio + ElevenLabs singing mode |
| ~~Babbl Nuit~~ | 🚫 Abandonné | Écoute continue : art. 226-1 du code pénal et règle 11b du MDR. Voir FEATURES.md |
| ~~Babbl Alert (Phase 1)~~ | 🚫 Retiré | Le triage à 4 niveaux depuis le son a été retiré en septembre 2026 (dispositif médical sans preuve possible). Remplacé par les repères de sécurité |
| Notifications push | ❌ | Rappels non sonores uniquement ; jamais la nuit, jamais pour inviter à enregistrer plus |
| Mode co-parenting | ❌ | Dashboard partagé entre 2 parents, synchronisation des données |

---

## Phase 4 — Hardware 🧊 Gelé

> Un baby phone qui « comprend » et répond seul pose les mêmes problèmes que Babbl Nuit. Gelé tant qu'un conseil réglementaire n'a pas validé un usage sans analyse.

| Tâche | Statut | Détails |
|---|---|---|
| Conception Babbl Monitor | ⏳ | Cahier des charges hardware : micro HD, haut-parleur, veilleuse, capteurs temp/humidité, WiFi |
| Prototype hardware | ⏳ | Premier prototype fonctionnel (ESP32 ou Raspberry Pi) |
| App ↔ Monitor communication | ⏳ | Protocole de communication temps réel entre l'app et le monitor |
| Production (fabricant) | ⏳ | Trouver un fabricant, MOQ, certifications CE |
| Kickstarter / lancement | ⏳ | Campagne de financement participatif + early adopters |

---

## Phase 5 — Scale ⏳

| Tâche | Statut | Détails |
|---|---|---|
| ~~Babbl Alert (Phase 2 — Babbl Pro)~~ | 🚫 Abandonné | Orienter vers un pédiatre selon la cause détectée au son = triage, dispositif médical |
| B2B Maternités | ⏳ | Partenariats avec maternités : 300-500€/mois/établissement |
| B2B Mutuelles | ⏳ | Proposition comme avantage santé : 2-4€/assuré/mois |
| Analytics (Mixpanel/PostHog) | ⏳ | Tracking conversion, rétention, funnel, A/B tests |
| Multilingue | ⏳ | Anglais, Espagnol, Allemand, Italien pour expansion européenne |
| App native (React Native) | ⏳ | Remplacement PWA par app native iOS/Android pour meilleures performances |
| Hébergement HDS | ⏳ | Nécessaire seulement si Babbl conserve des données de santé (ex. enregistrement de toux pour le médecin). À trancher avec le conseil réglementaire |
| Babbl Timeline | ⏳ | Frise chronologique audio du développement du bébé (premiers rires, premiers mots) |

---

## Documents Business (sur GitHub)

| Document | Fichier | Contenu |
|---|---|---|
| README | `README.md` | Présentation du projet, architecture, stack technique |
| Business Model | `BUSINESS_MODEL.md` | Pricing, projections financières, unit economics, concurrence |
| Features | `FEATURES.md` | 5 features signature détaillées + features complémentaires |
| Traductions | `frontend/src/lib/i18n.ts` | Toutes les traductions françaises centralisées |
| Suivi projet | `TODO.md` | Ce fichier — suivi complet de l'avancement |

---

## Stack Technique Actuelle

| Composant | Technologie |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Backend | Python Flask + Flask-CORS |
| ML | XGBoost (scikit-learn, joblib) |
| Audio | librosa (extraction features acoustiques) |
| IA | Claude Sonnet (Anthropic API) |
| TTS | ElevenLabs (text-to-speech + voice cloning) |
| Base de données | ✅ Supabase (PostgreSQL) — 5 tables avec RLS |
| Auth | ✅ Supabase Auth (email/password) |
| Paiement | ❌ Pas encore (Stripe prévu Phase 2) |
| Hébergement | ❌ localhost uniquement (Railway prévu Phase 1) |
| Domaine | ✅ babbl.fr (acheté sur OVH) |

---

## Notes

- Le frontend est sync avec Lovable via GitHub (repo baby-s-lullaby-lab)
- Le backend tourne sur localhost:5001, le frontend sur localhost:8080
- Les clés API sont dans `.env` (non commitées sur GitHub)
- Le modèle ML (Donate-a-Cry, 457 clips étiquetés par les parents contributeurs) est débranché : il faisait moins bien que répondre toujours « faim »
- Les messages de réconfort et l'IA répondent en français
- L'interface est entièrement en français via le système i18n (src/lib/i18n.ts)
- Supabase : projet "babbl" sur lttrlcemwprjmylixtee.supabase.co (région West EU Paris)
- Les données sont protégées par Row Level Security (chaque parent ne voit que ses données) — **à vérifier** : aucune règle n'était versionnée avant `supabase/migrations/20260924_rls_least_privilege.sql` ; lancer `scripts/check_rls.sh`
- Le backend utilise la service role key pour écrire en base côté serveur
- Organisation Stripe "Babbl" créée (clés API test pas encore intégrées)
- Babbl Baseline : apprentissage incrémental du profil acoustique unique de chaque bébé (algorithme de Welford)
- BabblReport : composant qui génère un rapport structuré que le parent peut montrer au médecin
