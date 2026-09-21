/**
 * Babbl — contrat de POST /api/analyze et conversion vers l'historique.
 *
 * Deux règles issues de SYMPTOMS.md :
 *  - L'observation sonore (`intensity`, `recording`) est TRANSITOIRE : affichée
 *    une fois, jamais écrite dans localStorage ni Supabase. Elle voyage via
 *    l'état de navigation (`navigate(path, { state })`).
 *  - L'historique ne stocke que les hypothèses contextuelles, le résumé, les
 *    gestes et les liens audio.
 */

import type { Analysis } from './userData';
import { INTENSITY_DISCLAIMER, SAFETY_CARDS, SAFETY_FOOTER, type IntensityLevel, type SafetyCardKey } from './taxonomy';
import { ApiError } from './api';

export interface Hypothesis {
  key: string;
  label: string;
  why: string;
  source: 'context';
  disclaimer: string;
}

export interface SafetyCard {
  key: SafetyCardKey | string;
  title: string;
  body: string;
  emphasized: boolean;
}

export interface Intensity {
  level: IntensityLevel;
  observation: string;
  disclaimer: string;
}

export interface Recording {
  duration_seconds: number;
  continuity: number;
  pitch_mean_hz: number;
}

export interface RecommendedAction {
  priority: number;
  action: string;
  reasoning: string;
}

export interface KeySignal {
  signal: string;
  source: 'context' | 'intensity';
}

export interface AnalyzeResponse {
  recording: Recording;
  intensity: Intensity;
  hypotheses: Hypothesis[];
  safety: { cards: SafetyCard[]; footer: string };
  parent_summary: string;
  recommended_actions: RecommendedAction[];
  key_signals: KeySignal[];
  guidance_source: 'llm' | 'deterministic';
  context: Record<string, unknown>;
  audio_url: string | null;
  comfort_audio_url: string | null;
  comfort_text: string | null;
}

/** Ce qui transite d'un écran à l'autre sans jamais être stocké. */
export interface TransientObservation {
  intensity: Intensity;
  recording: Recording;
}

export function transientObservation(res: AnalyzeResponse): TransientObservation {
  return { intensity: res.intensity, recording: res.recording };
}

/** Entrée d'historique : hypothèses + résumé + gestes. Pas d'observation sonore. */
export function toStoredAnalysis(res: AnalyzeResponse, id: string): Analysis {
  const top = res.hypotheses?.[0]?.key ?? 'need_for_comfort';
  return {
    id,
    timestamp: new Date().toISOString(),
    topCause: top,
    probabilities: {}, // hérité — plus jamais renseigné
    parent_summary: res.parent_summary ?? '',
    confidence_level: 'context', // hérité — plus jamais un niveau de confiance
    alert: 'none', // hérité — les alertes n'existent plus, voir cartes de sécurité
    feedback: null,
    actualCause: null,
    sosModeUsed: false,
    key_signals: (res.key_signals ?? []).filter(s => s.source === 'context').map(s => s.signal),
    recommended_actions: (res.recommended_actions ?? []).map(a => (typeof a === 'string' ? a : a.action)),
    hypotheses: res.hypotheses ?? [],
    safety_cards: res.safety?.cards ?? [],
    safety_footer: res.safety?.footer,
    audio_url: res.audio_url ?? undefined,
    comfort_audio_url: res.comfort_audio_url ?? undefined,
    comfort_text: res.comfort_text ?? undefined,
  };
}

/** Colonnes Supabase (schéma hérité, valeurs neutres pour les champs retirés). */
export function toSupabaseRow(a: Analysis) {
  return {
    id: a.id,
    top_cause: a.topCause,
    probabilities: {},
    parent_summary: a.parent_summary,
    confidence_level: 'context',
    alert: 'none',
    key_signals: a.key_signals ?? [],
    recommended_actions: a.recommended_actions ?? [],
    audio_url: a.audio_url ?? null,
    comfort_audio_url: a.comfort_audio_url ?? null,
    comfort_text: a.comfort_text ?? null,
  };
}

/** Corps d'un refus (422) — ou reconstruit côté client quand le réseau tombe. */
export interface Refusal {
  code: 'too_short' | 'no_cry_detected' | 'network' | 'server';
  message: string;
  reminder: string;
  hint?: string;
  cards: SafetyCard[];
  footer: string;
}

/** Les trois cartes, mises en avant par l'âge seul — même logique que le backend. */
export function staticSafety(ageRange?: string): { cards: SafetyCard[]; footer: string } {
  const under3 = ageRange === '0-3';
  const cards: SafetyCard[] = (Object.keys(SAFETY_CARDS) as SafetyCardKey[]).map(key => ({
    key,
    ...SAFETY_CARDS[key],
    emphasized: key === 'breathing' || (key === 'fever_under_3_months' && under3),
  }));
  cards.sort((a, b) => Number(b.emphasized) - Number(a.emphasized));
  return { cards, footer: SAFETY_FOOTER };
}

const NO_CRY_REMINDER =
  "Un bébé qui pleure peu, faiblement ou pas du tout n'est jamais rassurant en soi. " +
  "Si votre bébé vous semble différent de d'habitude, consultez.";

/**
 * INVARIANT : quoi qu'il arrive (refus, panne serveur, réseau coupé), le parent
 * voit les trois cartes de sécurité. Jamais une popup vide.
 */
export function refusalFromError(err: unknown, ageRange?: string): Refusal {
  const fallback = staticSafety(ageRange);
  if (err instanceof ApiError && err.status === 422 && err.body) {
    const b = err.body;
    return {
      code: b.code === 'too_short' ? 'too_short' : 'no_cry_detected',
      message: b.error ?? "Babbl n'a pas entendu de pleur net sur cet enregistrement.",
      reminder: b.reminder ?? NO_CRY_REMINDER,
      hint: b.hint,
      cards: b.safety?.cards?.length ? b.safety.cards : fallback.cards,
      footer: b.safety?.footer ?? fallback.footer,
    };
  }
  const network = !(err instanceof ApiError);
  return {
    code: network ? 'network' : 'server',
    message: network ? "L'analyse n'a pas abouti (réseau ou délai dépassé)." : "L'analyse n'a pas abouti.",
    reminder: NO_CRY_REMINDER,
    hint: 'Vous pouvez réessayer. Les repères ci-dessous ne dépendent pas de l\'enregistrement.',
    cards: fallback.cards,
    footer: fallback.footer,
  };
}

export { INTENSITY_DISCLAIMER };
