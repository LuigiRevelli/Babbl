/**
 * « Qu'est-ce qui l'a calmé ? » (ROADMAP-BACKEND.md, item 7).
 *
 * La question porte sur le dernier enregistrement seulement, et seulement
 * quand le parent rouvre l'app entre 15 minutes et 24 heures après : assez
 * tard pour que le pleur soit passé, assez tôt pour s'en souvenir. Jamais par
 * notification. Une réponse ou un « plus tard » la ferme pour de bon.
 */
import type { Analysis } from '@/lib/userData';
import type { SoothedKey } from '@/lib/taxonomy';

export const ASK_AFTER_MS = 15 * 60 * 1000;
export const ASK_UNTIL_MS = 24 * 60 * 60 * 1000;

export function pendingSoothedQuestion(analyses: Analysis[], now: number = Date.now()): Analysis | null {
  if (!analyses.length) return null;
  const last = analyses.reduce((a, b) => (new Date(a.timestamp) > new Date(b.timestamp) ? a : b));
  if (last.soothedBy) return null;
  const age = now - new Date(last.timestamp).getTime();
  if (Number.isNaN(age) || age < ASK_AFTER_MS || age > ASK_UNTIL_MS) return null;
  return last;
}

export function answerSoothed(analyses: Analysis[], id: string, answer: SoothedKey | 'skipped', now: Date = new Date()): Analysis[] {
  return analyses.map((a) => (a.id === id ? { ...a, soothedBy: answer, soothedAt: now.toISOString() } : a));
}
