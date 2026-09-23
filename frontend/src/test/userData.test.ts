import { describe, expect, it } from 'vitest';
import { migrateLegacyValues, type UserData } from '@/lib/userData';

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
