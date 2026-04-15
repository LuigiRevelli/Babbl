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
| Modèle ML XGBoost entraîné sur Donate-a-Cry (457 samples) | ✅ | Avril 2026 |
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
| Base de données Supabase (4 tables) | ✅ | profiles, analyses, context_logs, badges — avec RLS + trigger auto-création profil |
| Authentification (inscription/connexion) | ✅ | Page /auth, AuthProvider, routes protégées, bouton déconnexion |
| Migration localStorage → Supabase | ✅ | supabaseData.ts (8 fonctions), Record/Dashboard/VoiceSetup lisent/écrivent en base |
| Backend → Supabase | ✅ | Le backend sauvegarde chaque analyse dans Supabase côté serveur (service role key) |
| Nom de domaine babbl.fr | ✅ | Acheté sur OVH |
| Déploiement en ligne (Railway/Render) | ❌ | Backend + frontend accessibles publiquement. Actuellement localhost uniquement |
| PWA (Progressive Web App) | ❌ | Installable sur téléphone, icône sur écran d'accueil |
| Fix preview voix clonée | ❌ | VoiceSetup utilise encore le TTS navigateur pour la preview au lieu de la vraie voix clonée ElevenLabs |
| Onboarding amélioré | ❌ | Parcours de bienvenue guidé : profil parent, nom du bébé, âge, premier enregistrement |

---

## Phase 2 — Monétisation ❌

| Tâche | Statut | Détails |
|---|---|---|
| Intégration Stripe | ❌ | Abonnements Babbl+ (6.99€/mois) et Babbl Voice (9.99€/mois) |
| Paywall dans l'app | ❌ | Résultat gratuit = cause + %. Détails + actions + audio = payant |
| Landing page (babbl.fr) | ❌ | Site vitrine pour acquisition : explication produit, pricing, témoignages, CTA téléchargement |
| Pages légales | ❌ | CGU, Politique de confidentialité, Mentions légales, conformité RGPD |

---

## Phase 3 — Features Signature ❌

| Tâche | Statut | Détails |
|---|---|---|
| Babbl Lullaby | ❌ | Berceuses IA personnalisées dans la voix clonée du parent. Intégration Suno/Udio + ElevenLabs singing mode |
| Babbl Nuit complet | ❌ | Écoute continue en arrière-plan, détection auto des pleurs, réponse automatique, rapport matinal |
| Babbl Alert (Phase 1 — Doctolib) | ❌ | Système d'alerte 4 niveaux (vert/jaune/orange/rouge). Redirection vers Doctolib pour prise de RDV |
| Notifications push | ❌ | Alertes parents quand Babbl Nuit détecte un pleur qui nécessite intervention |
| Mode co-parenting | ❌ | Dashboard partagé entre 2 parents, synchronisation des données |

---

## Phase 4 — Hardware ⏳

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
| Babbl Alert (Phase 2 — Babbl Pro) | ⏳ | Propre réseau de pédiatres certifiés, téléconsultation intégrée, commission 20-25% |
| B2B Maternités | ⏳ | Partenariats avec maternités : 300-500€/mois/établissement |
| B2B Mutuelles | ⏳ | Proposition comme avantage santé : 2-4€/assuré/mois |
| Analytics (Mixpanel/PostHog) | ⏳ | Tracking conversion, rétention, funnel, A/B tests |
| Multilingue | ⏳ | Anglais, Espagnol, Allemand, Italien pour expansion européenne |
| App native (React Native) | ⏳ | Remplacement PWA par app native iOS/Android pour meilleures performances |
| Certification HDS | ⏳ | Hébergeur de Données de Santé agréé pour Babbl Alert |
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
| Base de données | ✅ Supabase (PostgreSQL) — 4 tables avec RLS |
| Auth | ✅ Supabase Auth (email/password) |
| Paiement | ❌ Pas encore (Stripe prévu Phase 2) |
| Hébergement | ❌ localhost uniquement (Railway prévu Phase 1) |
| Domaine | ✅ babbl.fr (acheté sur OVH) |

---

## Notes

- Le frontend est sync avec Lovable via GitHub (repo baby-s-lullaby-lab)
- Le backend tourne sur localhost:5001, le frontend sur localhost:8080
- Les clés API sont dans `.env` (non commitées sur GitHub)
- Le modèle ML est entraîné sur le dataset Donate-a-Cry (457 échantillons annotés par pédiatres)
- Les messages de réconfort et l'IA répondent en français
- L'interface est entièrement en français via le système i18n (src/lib/i18n.ts)
- Supabase : projet "babbl" sur lttrlcemwprjmylixtee.supabase.co (région West EU Paris)
- Les données sont protégées par Row Level Security (chaque parent ne voit que ses données)
- Le backend utilise la service role key pour écrire en base côté serveur
