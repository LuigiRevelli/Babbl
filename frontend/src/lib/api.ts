/**
 * Babbl API client.
 *
 * The backend base URL defaults to http://localhost:5001 in development.
 * Override via the VITE_API_URL env var.
 */

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
  form.append('audio', audioBlob, 'recording.webm');
  form.append('context', JSON.stringify(context));
  if (opts?.voiceId) form.append('voice_id', opts.voiceId);
  if (opts?.parentLabel) form.append('parent_label', opts.parentLabel);
  if (opts?.babyAgeMonths != null) form.append('baby_age_months', String(opts.babyAgeMonths));

  const res = await fetch(apiUrl('/api/analyze'), { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "L'analyse a échoué");
  }
  return res.json();
}

/**
 * POST an audio sample to /api/voice/clone.
 * Returns { voice_id, name }.
 */
export async function cloneVoice(audioBlob: Blob, name: string) {
  const form = new FormData();
  form.append('audio', audioBlob, 'voice_sample.webm');
  form.append('name', name);

  const res = await fetch(apiUrl('/api/voice/clone'), { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Le clonage vocal a échoué");
  }
  return res.json() as Promise<{ voice_id: string; name: string }>;
}
