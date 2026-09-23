import { describe, expect, it } from 'vitest';
import { checkNewBadges, migrateLegacyValues, sinceLabel, type UserData } from '@/lib/userData';

function legacy(): UserData {
  return {
    babyName: '', createdAt: '', analyses: [], streak: { current: 0, best: 0, lastActive: '' },
    xp: 0, badges: [], seenBadges: [], breathingSessions: 0, moodLog: [], nightMode: false,
    babyphoneConnected: false,
    // Valeurs écrites par les premières versions, en français.
    parentProfile: { role: 'maman', ageRange: '1-2ans' },
    voiceProfile: { role: 'papa', userName: 'x', ageRange: '0-3', audioRecorded: true },
    diaperHistory: [{ timestamp: 't', type: 'urine' }, { timestamp: 't', type: 'selle' }, { timestamp: 't', type: 'pee' }],
  } as unknown as UserData;
}

describe('migrateLegacyValues', () => {
  it('traduit les anciennes valeurs françaises', () => {
    const d = migrateLegacyValues(legacy());
    expect(d.parentProfile?.role).toBe('mother');
    expect(d.parentProfile?.ageRange).toBe('1-2');
    expect(d.voiceProfile?.role).toBe('father');
    expect(d.voiceProfile?.ageRange).toBe('0-3');
    expect(d.diaperHistory.map((e) => e.type)).toEqual(['pee', 'stool', 'pee']);
  });

  it('laisse les données sans profil intactes', () => {
    const d = legacy();
    delete d.parentProfile;
    delete d.voiceProfile;
    expect(() => migrateLegacyValues(d)).not.toThrow();
  });
});

describe('sinceLabel', () => {
  const now = Date.parse('2026-09-23T10:00:00Z');
  const ago = (m: number) => new Date(now - m * 60000).toISOString();
  it('parle comme le backend', () => {
    expect(sinceLabel(ago(0), now)).toBe("à l'instant");
    expect(sinceLabel(ago(45), now)).toBe('il y a 45 min');
    expect(sinceLabel(ago(120), now)).toBe('il y a 2 h');
    expect(sinceLabel(ago(200), now)).toBe('il y a 3 h 20');
    expect(sinceLabel(ago(26 * 60), now)).toBe('il y a plus d’un jour');
  });
});

describe('checkNewBadges', () => {
  it("ne récompense jamais le fait d'enregistrer", () => {
    const d = legacy();
    d.analyses = Array.from({ length: 60 }, (_, i) => ({
      id: String(i), timestamp: '2026-09-23T03:00:00Z', topCause: ['hunger', 'fatigue', 'a', 'b', 'c', 'd'][i % 6],
      probabilities: {}, parent_summary: '', confidence_level: '', alert: '', feedback: null, actualCause: null, sosModeUsed: false,
    }));
    d.badges = [];
    const got = checkNewBadges(d);
    for (const id of ['first_cry', 'analyses_10', 'analyses_50', 'all_causes', 'night_owl']) {
      expect(got).not.toContain(id);
    }
  });
});
