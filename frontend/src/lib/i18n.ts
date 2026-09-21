/**
 * Babbl i18n — French translations.
 *
 * Single-language for now (FR). When we add more languages,
 * swap this for a locale map + context provider.
 */

const fr = {
  // ─── Common ────────────────────────────────────────
  back: "Retour",
  home: "Accueil",
  history: "Historique",
  badges: "Badges",
  start: "Commencer",
  next: "Suivant",
  previous: "Précédent",
  playing: "Lecture...",
  loading: "Chargement...",
  notSet: "Non défini",

  // ─── Welcome ───────────────────────────────────────
  welcomeTitle: "Babbl",
  welcomeSubtitle: "Comprenez les besoins de votre bébé grâce à une analyse douce et bienveillante de ses pleurs.",
  welcomeTrust: "Utilisé par des milliers de parents. Aucune donnée médicale collectée.",
  welcomeStart: "Commencer",
  welcomeFooter: "Gratuit · 30 secondes · Sans inscription",

  // ─── Dashboard ─────────────────────────────────────
  dashboardTitle: "Babbl",
  listenAnalyze: "Écouter & analyser",
  myBabyCrying: "Mon bébé pleure",
  recordedEpisode: "épisode enregistré",
  recordedEpisodes: "épisodes enregistrés",
  lastCry: "Dernier pleur",
  none: "Aucun",
  streak: "Série",
  day: "jour",
  days: "jours",
  keepItAlive: "Continue comme ça !",
  lastMeal: "Dernier repas",
  lastWake: "Dernier réveil",
  diaperChange: "Dernier change",
  cloneMyVoice: "Cloner ma voix",
  customize: "Personnaliser",
  diaperType: "Type de change",
  pee: "Pipi",
  stool: "Selles",

  // ─── Record ────────────────────────────────────────
  micError: "Impossible d'accéder au microphone. Vérifiez les permissions.",
  mom: "Maman",
  dad: "Papa",
  hello: "Bonjour",
  analyzing: "Analyse en cours...",
  recording: "Enregistrement...",
  readyToListen: "Prêt à écouter",
  babblListening: "Babbl écoute attentivement les pleurs",
  pressStop: "Appuyez sur stop quand vous avez terminé",
  holdPhone: "Approchez le téléphone et lancez l'enregistrement",
  recordCry: "Enregistrer les pleurs",

  // ─── Analysis Result ───────────────────────────────
  analysisNotFound: "Analyse introuvable",
  result: "Résultat",
  accordingToBabbl: "Selon Babbl",
  summary: "Résumé",
  recommendedActions: "💡 Actions recommandées",
  listenSummary: "🔊 Écouter le résumé",
  comfortBaby: "Réconforter mon bébé avec ma voix",
  feedbackQuestion: "Cette analyse vous a-t-elle aidé ?",
  backToDashboard: "Retour au tableau de bord",

  // ─── Cause labels ──────────────────────────────────
  hunger: "Faim",
  fatigue: "Fatigue",
  discomfort: "Inconfort",
  pain: "Douleur",
  overstimulation: "Surstimulation",
  need_for_comfort: "Besoin de réconfort",
  unknown: "Inconnu",

  // ─── Voice Setup ───────────────────────────────────
  customizeVoice: "Personnaliser la voix",
  voiceIntro: "Pour créer une voix qui vous ressemble, nous avons besoin de quelques détails.",
  youAre: "Vous êtes",
  momLabel: "👩 Maman",
  dadLabel: "👨 Papa",
  yourName: "Votre prénom",
  namePlaceholder: "ex : Marie",
  babyAge: "Âge du bébé",
  babyBirthDate: "Date de naissance du bébé",
  babyBirthDateHint: "Avec la date exacte, les repères de sécurité s'adaptent au jour près (nouveau-né, moins de 3 mois). Sans elle, Babbl utilise la tranche.",
  age0_3: "0-3 mois",
  age3_6: "3-6 mois",
  age6_12: "6-12 mois",
  age1_2: "1-2 ans",
  age2plus: "2+ ans",
  recordPhrases: "Enregistrer quelques phrases",
  readAloud: "Lisez chaque phrase à voix haute. Parlez naturellement, comme si vous parliez à votre bébé.",
  sentence: "Phrase",
  recorded: "Enregistré !",
  cloningVoice: "Clonage de la voix...",
  finish: "Terminer ✨",
  voiceReady: "Votre voix est prête !",
  voiceReadyDesc: "En mode nuit, Babbl peut maintenant utiliser une voix semblable à la vôtre pour réconforter votre bébé.",
  listenPreview: "Écouter un aperçu",
  recordAgain: "Ré-enregistrer",
  voiceCloneFailed: "Le clonage vocal a échoué. Veuillez réessayer.",
  babblParent: "Parent Babbl",

  // ─── Phrases to read for voice clone ───────────────
  phrase1: "Je suis là avec toi, tout contre toi.",
  phrase2: "Chut... dors bien mon bébé, je veille sur toi.",
  phrase3: "Tu es en sécurité, je t'aime tellement.",
  phrase4: "Calme-toi mon ange, je suis là.",
  phrase5: "Bonne nuit petit trésor, fais de beaux rêves.",

  // ─── Breathing ─────────────────────────────────────
  breathingExercise: "Exercice de respiration",
  ready: "Prêt(e) ?",
  oneMinute: "1 minute pour vous recentrer",
  inhale: "Inspirez",
  hold: "Maintenez",
  exhale: "Expirez",
  pause: "Pause",
  secondsLeft: "s restantes",
  wellDone: "Bravo",
  breathingDone: "Vous venez de prendre soin de vous. C'est important.",
  xpGained: "+5 XP",

  // ─── History ───────────────────────────────────────
  historyTitle: "Historique",
  totalAnalyses: "analyses au total",
  mostFrequentCauses: "Hypothèses les plus fréquentes",
  patternDetected: "📊 Tendance dans vos saisies",
  thisWeek: "Cette semaine",
  thisMonth: "Ce mois",
  all: "Tout",
  historyEmpty: "Votre historique est encore vide. Lancez votre première analyse 🧡",

  // ─── Night Mode ────────────────────────────────────

  // ─── Greetings ─────────────────────────────────────
  greetingNight: "Encore debout ?",
  greetingMorning: "Bonjour",
  greetingAfternoon: "Bon après-midi",
  greetingEvening: "Bonsoir",

  // ─── Affirmations ──────────────────────────────────
  affirmation1: "Votre calme est l'un des plus beaux cadeaux que vous puissiez offrir à votre bébé.",
  affirmation2: "Chaque nuit difficile est une preuve d'amour.",
  affirmation3: "Vous n'avez pas besoin d'être parfait(e), juste présent(e).",
  affirmation4: "Un parent qui cherche à comprendre est déjà un bon parent.",
  affirmation5: "Les pleurs sont un langage. Vous apprenez à le parler.",
  affirmation6: "Demander de l'aide est une force, pas une faiblesse.",
  affirmation7: "Votre bébé a de la chance de vous avoir.",
  affirmation8: "Même les sages-femmes expérimentées ont parfois des doutes.",

  // ─── Time ago ──────────────────────────────────────
  justNow: "À l'instant",
  minAgo: "min",
  hAgo: "h",
  yesterday: "Hier",
  daysAgo: "jours",
  weekAgo: "1 semaine",
  weeksAgo: "semaines",

  // ─── Alerts ───────────────────────────────────────
  alertCall15: "Appeler le 15 (SAMU)",
  alertShareReport: "Partager avec mon médecin",

  // ─── Babbl Report ────────────────────────────────
  hypothesesTitle: "D'après ce que vous avez saisi",
  hypothesesEmpty: "Vous n'avez rien saisi sur les dernières heures : Babbl ne peut pas proposer d'hypothèse.",
  observationTitle: "Ce que Babbl a entendu",
  aiSummaryNotice: "Résumé rédigé par une IA (Claude), relu par un filtre automatique. Les repères de sécurité sont un texte fixe, non généré.",
  fixedSummaryNotice: "Résumé automatique, texte fixe (sans IA). Les repères de sécurité sont un texte fixe.",
  syntheticVoiceNotice: "Voix synthétique générée à partir de votre enregistrement.",
  observationNotKept: "L'observation sonore n'est affichée qu'au moment de l'enregistrement. Elle n'est pas conservée.",
  safetyTitle: "Repères de sécurité",
  safetyNote: "Toujours affichés. Ils ne dépendent pas de l'enregistrement.",
  reportCopied: "Rapport copié !",

  // ─── App title ─────────────────────────────────────
} as const;

export type TranslationKey = keyof typeof fr;

export function t(key: TranslationKey): string {
  return fr[key];
}

/**
 * Translate a cause key (from backend) to French label.
 */
export function translateCause(cause: string): string {
  const map: Record<string, string> = {
    hunger: fr.hunger,
    fatigue: fr.fatigue,
    discomfort: fr.discomfort,
    pain: fr.pain,
    overstimulation: fr.overstimulation,
    need_for_comfort: fr.need_for_comfort,
  };
  return map[cause] ?? cause;
}

export default fr;
