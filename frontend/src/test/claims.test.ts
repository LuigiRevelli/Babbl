/**
 * Garde-fou : ce que les écrans servis ne doivent jamais promettre.
 * Chaque motif a déjà été trouvé dans l'app (écran d'abonnement, résultat).
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const FORBIDDEN: Array<[RegExp, string]> = [
  [/\d+\s?Hz\b/, 'chiffre acoustique affiché'],
  [/exactement ce que/i, 'le son ne dit pas la cause'],
  [/d[ée]tection (passive|d'apn)/i, 'surveillance qui n’existe pas'],
  [/n'[êe]tes pas (là|dans la pi[èe]ce)/i, 'pousse à laisser le bébé seul'],
  [/ne vous r[ée]veille que si/i, 'fausse promesse de surveillance'],
  [/tout va bien/i, 'réassurance'],
  [/Laissez-le\b|calme-le\b|berce-le\b/, 'bébé genré'],
  [/Aucun paiement avant le \d+/i, 'date de facturation inventée'],
  [/apais[ée] en \d+ ?s\b/i, 'résultat inventé'],
  [/V[ée]rifie tes|Content de te revoir|Cr[ée]e ton compte/, 'tutoiement du parent'],
];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|html)$/.test(name) ? [p] : [];
  });
}

const SERVED = [...files(join(__dirname, '..', 'pages')), ...files(join(__dirname, '..', 'components', 'babbl')), join(__dirname, '..', 'lib', 'i18n.ts')];

describe('promesses interdites dans les écrans servis', () => {
  for (const [re, why] of FORBIDDEN) {
    it(`${why} (${re})`, () => {
      const hits = SERVED.filter(f => re.test(readFileSync(f, 'utf8'))).map(f => f.split('/src/')[1]);
      expect(hits).toEqual([]);
    });
  }
});
