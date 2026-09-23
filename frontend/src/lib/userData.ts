import { t } from '@/lib/i18n';
import type { Hypothesis, SafetyCard } from '@/lib/analysis';
import type { SoothedKey } from '@/lib/taxonomy';

const STORAGE_KEY = 'babbl_user_data_v1';

export interface Analysis {
  id: string;
  timestamp: string;
  topCause: string;
  probabilities: Record<string, number>;
  parent_summary: string;
  confidence_level: string;
  alert: string;
  feedback: null | 'positive' | 'negative';
  actualCause: null | string;
  sosModeUsed: boolean;
  key_signals?: any[];
  recommended_actions?: any[];
  /** Couche 2 — d'après ce que le parent a saisi. Absent sur les anciennes entrées. */
  hypotheses?: Hypothesis[];
  /** Cartes de sécurité telles qu'affichées. Absent sur les anciennes entrées. */
  safety_cards?: SafetyCard[];
  safety_footer?: string;
  /** Qui a rédigé le résumé : le modèle (sous garde-fou) ou le texte fixe. Affiché (AI Act art. 50). */
  guidance_source?: 'llm' | 'deterministic';
  audio_url?: string;
  comfort_audio_url?: string;
  comfort_text?: string;
  /** « Qu'est-ce qui l'a calmé ? » — réponse du parent, ou 'skipped' s'il a fermé la question. */
  soothedBy?: SoothedKey | 'skipped';
  soothedAt?: string;
}

export interface DiaperEntry {
  timestamp: string;
  type: 'pee' | 'stool';
}

export type ParentRole = 'mother' | 'father';
export type AgeRange = '0-3' | '3-6' | '6-12' | '1-2' | '2+';

export interface ParentProfile {
  role: ParentRole;
  babyName?: string;
  ageRange: AgeRange;
  /** Date de naissance (AAAA-MM-JJ). Seule source fiable de l'âge en jours. */
  birthDate?: string;
}

export interface VoiceProfile {
  role: ParentRole;
  userName: string;
  ageRange: AgeRange;
  birthDate?: string;
  audioRecorded: boolean;
  voiceId?: string;
}

export interface UserData {
  babyName: string;
  createdAt: string;
  analyses: Analysis[];
  streak: { current: number; best: number; lastActive: string };
  xp: number;
  badges: string[];
  seenBadges: string[];
  breathingSessions: number;
  moodLog: Array<{ timestamp: string; mood: string }>;
  lastMeal?: string;
  lastDiaper?: string;
  /** Dernier réveil — alimente l'hypothèse « fatigue », d'après la saisie du parent. */
  lastWake?: string;
  diaperHistory: DiaperEntry[];
  parentProfile?: ParentProfile;
  nightMode: boolean;
  babyphoneConnected: boolean;
  voiceProfile?: VoiceProfile;
}

function defaultData(): UserData {
  return {
    babyName: '',
    createdAt: new Date().toISOString(),
    analyses: [],
    streak: { current: 0, best: 0, lastActive: '' },
    xp: 0,
    badges: [],
    seenBadges: [],
    breathingSessions: 0,
    moodLog: [],
    diaperHistory: [],
    nightMode: false,
    babyphoneConnected: false,
  };
}

// Valeurs françaises stockées par les premières versions de l'app. Le JSON
// brut n'a pas encore le type courant : on compare des chaînes, puis on range.
const LEGACY_ROLE: Record<string, ParentRole> = { maman: 'mother', papa: 'father' };
const LEGACY_AGE: Record<string, AgeRange> = { '1-2ans': '1-2' };
const LEGACY_DIAPER: Record<string, DiaperEntry['type']> = { urine: 'pee', selle: 'stool' };

function fromLegacy<T extends string>(value: string | undefined, table: Record<string, T>): T | undefined {
  if (value === undefined) return undefined;
  return table[value] ?? (value as T);
}

/** Migre les anciennes valeurs françaises. Exporté pour les tests. */
export function migrateLegacyValues(data: UserData): UserData {
  for (const profile of [data.parentProfile, data.voiceProfile]) {
    if (!profile) continue;
    profile.role = fromLegacy(profile.role as string, LEGACY_ROLE) ?? profile.role;
    profile.ageRange = fromLegacy(profile.ageRange as string, LEGACY_AGE) ?? profile.ageRange;
  }
  data.diaperHistory = (data.diaperHistory || []).map((entry) => ({
    ...entry,
    type: fromLegacy(entry.type as string, LEGACY_DIAPER) ?? entry.type,
  }));
  return data;
}

export function getUserData(): UserData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = { ...defaultData(), ...JSON.parse(raw) } as UserData;

    return migrateLegacyValues(parsed);
  } catch {
    return defaultData();
  }
}

export function saveUserData(data: UserData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}

export function getXpForNextLevel(xp: number) {
  const level = getLevel(xp);
  return level * 100;
}

export function getXpProgress(xp: number) {
  return xp % 100;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function updateStreak(data: UserData): UserData {
  const today = todayStr();
  if (data.streak.lastActive === today) return data;
  if (data.streak.lastActive === yesterdayStr()) {
    data.streak.current += 1;
  } else {
    data.streak.current = 1;
  }
  data.streak.best = Math.max(data.streak.best, data.streak.current);
  data.streak.lastActive = today;
  return data;
}

export function isStreakInDanger(data: UserData): boolean {
  return data.streak.lastActive !== todayStr() && data.streak.current > 0;
}

export function hasAnalysisToday(data: UserData): boolean {
  return data.streak.lastActive === todayStr();
}

export function addXp(data: UserData, amount: number): UserData {
  data.xp += amount;
  return data;
}

export function checkNewBadges(data: UserData): string[] {
  const newBadges: string[] = [];
  const count = data.analyses.length;
  const best = data.streak.best;
  const causes = new Set(data.analyses.map(a => a.topCause));
  const hasNightAnalysis = data.analyses.some(a => {
    const h = new Date(a.timestamp).getHours();
    return h >= 2 && h < 5;
  });

  const checks: [string, boolean][] = [
    ['first_cry', count >= 1],
    ['analyses_10', count >= 10],
    ['analyses_50', count >= 50],
    ['streak_3', best >= 3],
    ['streak_7', best >= 7],
    ['streak_30', best >= 30],
    ['streak_50', best >= 50],
    ['all_causes', causes.size >= 6],
    ['breath_master', data.breathingSessions >= 10],
    ['night_owl', hasNightAnalysis],
  ];

  for (const [id, met] of checks) {
    if (met && !data.badges.includes(id)) {
      data.badges.push(id);
      newBadges.push(id);
    }
  }

  return newBadges;
}

export function getGreeting(): { text: string; emoji: string } {
  const h = new Date().getHours();
  if (h >= 22 || h < 6) return { text: t('greetingNight'), emoji: '🌙' };
  if (h < 12) return { text: t('greetingMorning'), emoji: '👋' };
  if (h < 18) return { text: t('greetingAfternoon'), emoji: '👋' };
  return { text: t('greetingEvening'), emoji: '👋' };
}

export function getDailyAffirmation(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const AFFIRMATIONS = [
    t('affirmation1'),
    t('affirmation2'),
    t('affirmation3'),
    t('affirmation4'),
    t('affirmation5'),
    t('affirmation6'),
    t('affirmation7'),
    t('affirmation8'),
  ];
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}

export function formatRelativeDate(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('justNow');
  if (mins < 60) return `${mins} ${t('minAgo')}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}${t('hAgo')}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return t('yesterday');
  if (days < 7) return `${days} ${t('daysAgo')}`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return t('weekAgo');
  return `${weeks} ${t('weeksAgo')}`;
}
