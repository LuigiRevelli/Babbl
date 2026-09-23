import { afterEach, describe, expect, it, vi } from 'vitest';
import { cardsQuery, fetchCards } from '@/lib/cards';

afterEach(() => vi.unstubAllGlobals());

describe('repères « quand appeler »', () => {
  it("n'envoie que l'âge, et rien si l'âge est inconnu", () => {
    expect(cardsQuery(null)).toBe('');
    expect(cardsQuery({ ageRange: '3-6' })).toBe('?age_months=5');
  });

  it('sans réseau, les cartes embarquées (jamais un écran vide)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const c = await fetchCards(null);
    expect(c.version).toBe('offline');
    expect(c.safety.cards.length).toBeGreaterThanOrEqual(3);
    expect(c.menus).toEqual([]);
  });

  it('v1 : pas de menus même si le serveur en glissait', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: 'v1', safety: { cards: [{ key: 'a', title: 't', body: 'b', emphasized: true }], footer: 'f' }, menus: [] }),
    }));
    const c = await fetchCards({ ageRange: '0-3' });
    expect(c.version).toBe('v1');
    expect(c.menus).toEqual([]);
  });

  it('v2 : les menus servis sont affichés', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: 'v2', safety: { cards: [{ key: 'a', title: 't', body: 'b', emphasized: true }], footer: 'f' }, menus: [{ key: 'cough', title: 'Toux', body: '…' }] }),
    }));
    const c = await fetchCards(null);
    expect(c.version).toBe('v2');
    expect(c.menus.map(m => m.key)).toEqual(['cough']);
  });
});
