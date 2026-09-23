/**
 * Export « mes données » : ce qui est sur le téléphone, plus ce que le serveur
 * garde si un compte existe. Un seul fichier JSON, lisible, que le parent
 * enregistre où il veut. Rien n'est envoyé ailleurs.
 */
import type { UserData } from './userData';

export type ServerExport = Record<string, unknown> | { unavailable: string } | null;

export function buildExport(local: UserData, server: ServerExport, now = new Date()) {
  return {
    format: 'babbl-export-1',
    generated_at: now.toISOString(),
    on_this_phone: local,
    on_the_server: server ?? 'Pas de compte : rien n\'est gardé sur le serveur.',
    not_kept: 'Les enregistrements de pleurs et toute mesure chiffrée du son ne sont jamais conservés.',
  };
}

export function exportFileName(now = new Date()): string {
  return `babbl-mes-donnees-${now.toISOString().slice(0, 10)}.json`;
}

export function downloadJson(data: unknown, name: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
