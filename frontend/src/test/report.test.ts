import { describe, expect, it } from 'vitest';
import { buildDoctorReport, reportDays } from '@/lib/report';
import { logContext, type UserData } from '@/lib/userData';

const NOW = new Date(2026, 8, 23, 10, 0); // 23/09/2026 10:00, heure locale

function base(): UserData {
  return {
    babyName: 'Léa', createdAt: '', analyses: [], streak: { current: 0, best: 0, lastActive: '' }, xp: 0,
    badges: [], seenBadges: [], breathingSessions: 0, moodLog: [], diaperHistory: [], nightMode: false,
    babyphoneConnected: false, parentProfile: { role: 'mother', ageRange: '0-3', birthDate: '2026-08-01' },
  };
}

const at = (dayOffset: number, h: number) => new Date(2026, 8, 23 + dayOffset, h, 0);
const analysis = (d: Date, soothedBy?: string) => ({
  id: d.toISOString(), timestamp: d.toISOString(), topCause: 'hunger', probabilities: {}, parent_summary: '',
  confidence_level: '', alert: '', feedback: null, actualCause: null, sosModeUsed: false,
  soothedBy: soothedBy as never,
});

describe('reportDays', () => {
  it('compte ce que le parent a noté, par jour, sur 7 jours', () => {
    let d = base();
    d = logContext(d, 'meal', at(0, 6));
    d = logContext(d, 'meal', at(0, 9));
    d = logContext(d, 'diaper', at(-1, 22));
    d = logContext(d, 'wake', at(-8, 7)); // hors fenêtre (et hors des 14 jours gardés ? non : 8 jours)
    d.analyses = [analysis(at(0, 3)), analysis(at(-2, 21))];
    const days = reportDays(d, NOW);
    expect(days).toHaveLength(7);
    const today = days[6], yesterday = days[5];
    expect([today.meal, today.diaper, today.recordings.length]).toEqual([2, 0, 1]);
    expect(yesterday.diaper).toBe(1);
    expect(days.reduce((s, l) => s + l.wake, 0)).toBe(0);
  });
});

describe('buildDoctorReport', () => {
  it('contient les saisies et ce qui a apaisé, jamais de mesure sonore ni de norme', () => {
    let d = base();
    d = logContext(d, 'meal', at(0, 6));
    d.analyses = [analysis(at(0, 3), 'feeding'), analysis(at(-1, 20), 'feeding'), analysis(at(-1, 23))];
    const text = buildDoctorReport(d, NOW);
    expect(text).toContain('Bébé : Léa');
    expect(text).toContain('7 semaines');
    expect(text).toContain('Une tétée ou un biberon : 2');
    expect(text).toContain('sans réponse : 1');
    expect(text).toMatch(/ne détecte aucune maladie/);
    for (const banned of [/%/, /intens/i, /continu/i, /normal/i, /excessi/i, /moyenne/i, /détresse/i, /cause/i]) {
      expect(text).not.toMatch(banned);
    }
  });

  it('ne garde que 14 jours de saisies', () => {
    let d = base();
    d = logContext(d, 'meal', at(-20, 8));
    d = logContext(d, 'meal', at(0, 8));
    expect(d.contextLog).toHaveLength(1);
  });
});
