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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- corps JSON libre, lu champ par champ
  body: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/**
 * « Qu'est-ce qui a apaisé votre bébé ? » — envoyé au serveur si le parent est
 * connecté. Best-effort : la réponse est déjà gardée dans le téléphone.
 */
export async function sendSoothed(analysisId: string, answer: string): Promise<boolean> {
  try {
    const headers = await authHeaders();
    if (!headers.Authorization) return false;
    const res = await fetch(apiUrl(`/api/analyses/${encodeURIComponent(analysisId)}/soothed`), {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Droit à l'effacement : supprime le compte, les analyses, le profil et la voix
 * clonée. Le serveur répond 207 si une partie n'a pas pu être effacée.
 */
export async function deleteAccount(voiceIds: string[] = []) {
  const res = await fetch(apiUrl('/api/me'), {
    method: 'DELETE',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice_ids: voiceIds }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status !== 200) {
    throw new ApiError(res.status, body, body?.error ?? "La suppression n'a pas pu être terminée.");
  }
  return body as { deleted: boolean; report: Record<string, string> };
}
