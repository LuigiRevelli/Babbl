import { describe, expect, it } from 'vitest';
import { buildExport, exportFileName } from '@/lib/export';
import { getUserData } from '@/lib/userData';

describe('export mes données', () => {
  it('contient le téléphone et dit ce qui n\'est jamais gardé', () => {
    const now = new Date('2026-09-23T10:00:00Z');
    const out = buildExport(getUserData(), null, now);
    expect(out.on_this_phone).toHaveProperty('analyses');
    expect(String(out.on_the_server)).toMatch(/Pas de compte/);
    expect(out.not_kept).toMatch(/jamais conservés/);
    expect(exportFileName(now)).toBe('babbl-mes-donnees-2026-09-23.json');
  });

  it('joint le serveur quand il répond', () => {
    const out = buildExport(getUserData(), { tables: { analyses: [] } });
    expect(out.on_the_server).toEqual({ tables: { analyses: [] } });
  });
});
