/**
 * Repères « quand appeler », sans enregistrement (GET /api/cards).
 *
 * Le serveur décide du jeu servi : v1 (trois cartes, par défaut) ou v2
 * (cartes relues par un pédiatre + menus « si vous voyez… », activé par
 * BABBL_CARDS_V2=1). Sans réseau, on affiche les trois cartes embarquées :
 * les repères ne dépendent jamais d'une connexion.
 */
import { apiUrl } from './api';
import { babyAgeForContext, staticSafety, type SafetyCard } from './analysis';

export interface ParentMenu {
  key: string;
  title: string;
  body: string;
}

export interface CardsPayload {
  version: 'v1' | 'v2' | 'offline';
  safety: { cards: SafetyCard[]; footer: string };
  menus: ParentMenu[];
}

type Profile = { ageRange?: string; birthDate?: string } | null | undefined;

export function cardsQuery(profile: Profile): string {
  const age = babyAgeForContext(profile);
  const q = new URLSearchParams();
  if (age.months != null) q.set('age_months', String(age.months));
  if (age.birthDate) q.set('birth_date', age.birthDate);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function offlineCards(profile: Profile): CardsPayload {
  return { version: 'offline', safety: staticSafety(profile?.ageRange), menus: [] };
}

export async function fetchCards(profile: Profile, timeoutMs = 5000): Promise<CardsPayload> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(apiUrl('/api/cards' + cardsQuery(profile)), { signal: controller.signal });
    if (!res.ok) return offlineCards(profile);
    const body = await res.json();
    if (!body?.safety?.cards?.length) return offlineCards(profile);
    return {
      version: body.version === 'v2' ? 'v2' : 'v1',
      safety: body.safety,
      menus: Array.isArray(body.menus) ? body.menus.filter((m: ParentMenu) => m && m.title && m.body) : [],
    };
  } catch {
    return offlineCards(profile);
  } finally {
    clearTimeout(timer);
  }
}
