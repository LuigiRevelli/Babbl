/**
 * Constantes d'affichage. Les anciennes listes anglaises (« 85% of parents… »,
 * « That is normal ») ont été retirées : chiffres non sourcés et réassurance,
 * interdits par le test d'honnêteté (backend/tests/test_honesty.py).
 */

export const CAUSE_EMOJIS: Record<string, string> = {
  hunger: '🍼',
  fatigue: '😴',
  discomfort: '🤗',
  need_for_comfort: '💗',
  // clés héritées d'anciennes analyses
  pain: '🩺',
  overstimulation: '🌀',
  gas: '🌬️',
  stress: '🌀',
};
