import { describe, expect, it } from 'vitest';
import { babyAgeForContext, staticSafety } from '@/lib/analysis';

describe("âge du bébé : jamais inventé", () => {
  it('sans profil, âge inconnu (pas « 2 mois »)', () => {
    expect(babyAgeForContext(undefined).months).toBeNull();
    expect(babyAgeForContext({}).months).toBeNull();
  });
  it('la date de naissance prime, la tranche sert de repli', () => {
    expect(babyAgeForContext({ ageRange: '6-12' }).months).toBe(9);
    const bd = new Date(Date.now() - 10 * 86_400_000).toISOString().slice(0, 10);
    const age = babyAgeForContext({ birthDate: bd, ageRange: '6-12' });
    expect(age.months).toBe(0);
    expect(age.days).toBeGreaterThanOrEqual(9);
  });
  it('hors ligne, âge inconnu met la carte fièvre < 3 mois en avant', () => {
    const fever = (r?: string) => staticSafety(r).cards.find(c => c.key === 'fever_under_3_months')!.emphasized;
    expect(fever(undefined)).toBe(true);
    expect(fever('0-3')).toBe(true);
    expect(fever('6-12')).toBe(false);
  });
});
