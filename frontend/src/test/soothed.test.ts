import { describe, expect, it } from 'vitest';
import { answerSoothed, pendingSoothedQuestion } from '@/lib/soothed';
import type { Analysis } from '@/lib/userData';

const NOW = Date.parse('2026-09-23T10:00:00Z');
const at = (minutesAgo: number, extra: Partial<Analysis> = {}): Analysis => ({
  id: `a${minutesAgo}`, timestamp: new Date(NOW - minutesAgo * 60000).toISOString(),
  topCause: 'hunger', probabilities: {}, parent_summary: '', confidence_level: '', alert: '',
  feedback: null, actualCause: null, sosModeUsed: false, ...extra,
});

describe('pendingSoothedQuestion', () => {
  it('ne demande rien juste après un enregistrement', () => {
    expect(pendingSoothedQuestion([at(5)], NOW)).toBeNull();
  });
  it('demande entre 15 minutes et 24 heures', () => {
    expect(pendingSoothedQuestion([at(40)], NOW)?.id).toBe('a40');
    expect(pendingSoothedQuestion([at(23 * 60)], NOW)?.id).toBe('a1380');
  });
  it('ne demande plus après 24 heures', () => {
    expect(pendingSoothedQuestion([at(25 * 60)], NOW)).toBeNull();
  });
  it('porte sur le dernier enregistrement seulement', () => {
    expect(pendingSoothedQuestion([at(300), at(40)], NOW)?.id).toBe('a40');
    expect(pendingSoothedQuestion([at(40), at(5)], NOW)).toBeNull();
  });
  it('ne redemande pas après une réponse ou un « plus tard »', () => {
    expect(pendingSoothedQuestion([at(40, { soothedBy: 'feeding' })], NOW)).toBeNull();
    expect(pendingSoothedQuestion([at(40, { soothedBy: 'skipped' })], NOW)).toBeNull();
  });
});

describe('answerSoothed', () => {
  it("enregistre la réponse sur la bonne analyse et pas les autres", () => {
    const out = answerSoothed([at(300), at(40)], 'a40', 'arms_or_voice', new Date(NOW));
    expect(out[1].soothedBy).toBe('arms_or_voice');
    expect(out[1].soothedAt).toBe(new Date(NOW).toISOString());
    expect(out[0].soothedBy).toBeUndefined();
  });
});
