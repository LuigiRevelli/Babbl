export const CAUSE_LABELS: Record<string, string> = {
  hunger: 'Faim',
  fatigue: 'Fatigue',
  discomfort: 'Inconfort',
  pain: 'Douleur',
  overstimulation: 'Surstimulation',
  need_for_comfort: 'Besoin de réconfort',
};

export const CAUSE_EMOJIS: Record<string, string> = {
  hunger: '🍼',
  fatigue: '😴',
  discomfort: '🤗',
  pain: '🩺',
  overstimulation: '🌀',
  need_for_comfort: '💗',
};

export const AFFIRMATIONS = [
  "Your calm is one of the best gifts you can give your baby.",
  "Every hard night is a proof of love.",
  "You do not need to be perfect, just present.",
  "A parent who tries to understand is already a good parent.",
  "Crying is a language. You are learning to speak it.",
  
  "Your baby is lucky to have you.",
  "Even experienced midwives sometimes have doubts.",
];

export const REASSURANCE_MESSAGES = [
  "85% of parents struggle to identify this type of cry.",
  "Colic cries are among the hardest to decode, even for pediatricians.",
  "No parent understands their baby 100% of the time.",
  "Did you know babies cry on average 2 to 3 hours a day? That is normal.",
  "Even experienced midwives struggle with some cries.",
  "Each cry you analyze brings you a little closer to your baby.",
  "Asking for help is a sign of strength, not weakness.",
  "Your baby is lucky to have you.",
];

export const LEVEL_NAMES: Record<number, string> = {
  1: 'New parent',
  2: 'Curious parent',
  3: 'Attentive parent',
  4: 'Confident parent',
  5: 'Expert parent',
  6: 'Baby whisperer',
};

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  condition: string;
}

export const BADGES: Badge[] = [
  { id: 'first_cry', emoji: '🍼', name: 'First cry', description: '1 analysis completed', condition: '1 analysis' },
  { id: 'analyses_10', emoji: '📊', name: 'Careful observer', description: '10 analyses completed', condition: '10 analyses' },
  { id: 'analyses_50', emoji: '🎓', name: 'Expert parent', description: '50 analyses completed', condition: '50 analyses' },
  { id: 'streak_3', emoji: '✨', name: 'Three days in a row', description: '3-day streak', condition: 'best ≥ 3' },
  { id: 'streak_7', emoji: '🔥', name: 'Full week', description: '7-day streak', condition: 'best ≥ 7' },
  { id: 'streak_30', emoji: '🌟', name: 'Full month', description: '30-day streak', condition: 'best ≥ 30' },
  { id: 'streak_50', emoji: '👑', name: '50 days in a row', description: '50-day streak', condition: 'best ≥ 50' },
  { id: 'all_causes', emoji: '🌈', name: 'All causes', description: 'See each cause at least once', condition: '6 different causes' },
  { id: 'breath_master', emoji: '🌬️', name: 'Calm breath', description: '10 breathing exercises', condition: '10 breaths' },
  { id: 'night_owl', emoji: '🌙', name: 'Night owl', description: '1 analysis between 2am and 5am', condition: 'night analysis' },
];

export const LOADING_MESSAGES = [
  "Listening to frequencies...",
  "Comparing with known patterns...",
  "Preparing your guidance...",
  "Just a moment...",
];
