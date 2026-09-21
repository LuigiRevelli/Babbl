/**
 * Babbl API client.
 *
 * The backend base URL defaults to http://localhost:5001 in development.
 * Override via the VITE_API_URL env var.
 */

import { extensionForMime } from './recorder';
import { supabase } from './supabase';

/** Erreur API avec le statut et le corps JSON — un 422 porte les cartes de sécurité. */
export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** Délai maximal d'une analyse côté client. Le backend répond en < 15 s (repli déterministe). */
const ANALYZE_TIMEOUT_MS = 25_000;

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

/** Full URL for a backend path (e.g. "/api/analyze"). */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

/**
 * POST an audio blob + JSON context to /api/analyze.
 * Returns the raw backend JSON response.
 */
export async function analyzeAudio(
  audioBlob: Blob,
  context: Record<string, unknown>,
  opts?: { voiceId?: string; parentLabel?: string; babyAgeMonths?: number },
) {
  const form = new FormData();
  form.append('audio', audioBlob, `recording.${extensionForMime(audioBlob.type)}`);
  form.append('context', JSON.stringify(context));
  if (opts?.voiceId) form.append('voice_id', opts.voiceId);
  if (opts?.parentLabel) form.append('parent_label', opts.parentLabel);
  if (opts?.babyAgeMonths != null) form.append('baby_age_months', String(opts.babyAgeMonths));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(apiUrl('/api/analyze'), {
      method: 'POST',
      body: form,
      headers: await authHeaders(),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body, body?.error ?? "L'analyse a échoué");
  }
  return res.json();
}

/**
 * POST an audio sample to /api/voice/clone.
 * Returns { voice_id, name }.
 */
export async function cloneVoice(audioBlob: Blob, name: string) {
  const form = new FormData();
  form.append('audio', audioBlob, `voice_sample.${extensionForMime(audioBlob.type)}`);
  form.append('name', name);

  const res = await fetch(apiUrl('/api/voice/clone'), { method: 'POST', body: form, headers: await authHeaders() });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body, body?.error ?? 'Le clonage vocal a échoué');
  }
  return res.json() as Promise<{ voice_id: string; name: string }>;
}
