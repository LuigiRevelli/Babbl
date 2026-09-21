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
import type { IntensityLevel, SafetyCardKey } from './taxonomy';

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
