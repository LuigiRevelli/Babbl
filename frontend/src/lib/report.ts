/**
 * Résumé pour le médecin — généré dans le téléphone, à partir de ce que le
 * parent a noté. Aucune mesure sonore, aucune norme, aucune couleur : c'est
 * l'anamnèse qu'un pédiatre reconstitue lui-même (ROADMAP-BACKEND.md, item 10).
 * Les totaux n'apparaissent qu'ici, jamais sur l'écran du parent.
 */
import type { ContextKind, UserData } from '@/lib/userData';
import { SOOTHED_BY, type SoothedKey } from '@/lib/taxonomy';

const DAY_MS = 86400000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const dayLabel = (d: Date) =>
  d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
const hourLabel = (d: Date) =>
  d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export interface DayLine {
  date: Date;
  meal: number;
  diaper: number;
  wake: number;
  recordings: string[];
}

export function reportDays(data: UserData, now: Date = new Date(), days = 7): DayLine[] {
  const first = new Date(startOfDay(now).getTime() - (days - 1) * DAY_MS);
  const lines: DayLine[] = Array.from({ length: days }, (_, i) => ({
    date: new Date(first.getTime() + i * DAY_MS), meal: 0, diaper: 0, wake: 0, recordings: [],
  }));
  const slot = (iso: string) => {
    const t = new Date(iso);
    const i = Math.floor((startOfDay(t).getTime() - first.getTime()) / DAY_MS);
    return i >= 0 && i < days && t.getTime() <= now.getTime() ? lines[i] : null;
  };
  for (const e of data.contextLog ?? []) {
    const line = slot(e.timestamp);
    if (line) line[e.kind as ContextKind] += 1;
  }
  for (const a of data.analyses) {
    const line = slot(a.timestamp);
    if (line) line.recordings.push(hourLabel(new Date(a.timestamp)));
  }
  lines.forEach((l) => l.recordings.sort());
  return lines;
}

function ageLine(birth?: string, now: Date = new Date()): string {
  if (!birth) return 'Date de naissance : non renseignée';
  const b = new Date(`${birth.slice(0, 10)}T00:00:00`);
  const daysOld = Math.floor((startOfDay(now).getTime() - b.getTime()) / DAY_MS);
  if (Number.isNaN(daysOld) || daysOld < 0) return `Date de naissance : ${birth}`;
  const age = daysOld < 60 ? `${Math.floor(daysOld / 7)} semaines` : `${Math.floor(daysOld / 30.44)} mois`;
  return `Date de naissance : ${b.toLocaleDateString('fr-FR')} (${age})`;
}

export function buildDoctorReport(data: UserData, now: Date = new Date(), days = 7): string {
  const lines = reportDays(data, now, days);
  const name = data.babyName || data.parentProfile?.babyName;
  const birth = data.parentProfile?.birthDate ?? data.voiceProfile?.birthDate;
  const from = lines[0].date.toLocaleDateString('fr-FR');
  const to = lines[lines.length - 1].date.toLocaleDateString('fr-FR');

  const rows = lines.map((l) => {
    const rec = l.recordings.length ? `${l.recordings.length} (${l.recordings.join(', ')})` : '0';
    return `${dayLabel(l.date)} — tétées : ${l.meal} · changes : ${l.diaper} · réveils : ${l.wake} · pleurs enregistrés : ${rec}`;
  });

  const inWindow = data.analyses.filter((a) => {
    const t = new Date(a.timestamp).getTime();
    return t >= lines[0].date.getTime() && t <= now.getTime();
  });
  const counts = new Map<SoothedKey, number>();
  let unanswered = 0;
  for (const a of inWindow) {
    if (a.soothedBy && a.soothedBy !== 'skipped') counts.set(a.soothedBy, (counts.get(a.soothedBy) ?? 0) + 1);
    else unanswered += 1;
  }
  const soothed = [...counts.entries()]
    .sort((x, y) => y[1] - x[1])
    .map(([k, n]) => `  • ${SOOTHED_BY[k]} : ${n}`);

  return [
    `RÉSUMÉ POUR LE MÉDECIN — du ${from} au ${to}`,
    '',
    name ? `Bébé : ${name}` : 'Bébé',
    ageLine(birth, now),
    '',
    'Ce que le parent a noté dans Babbl, jour par jour :',
    ...rows.map((r) => `  ${r}`),
    '',
    "Ce qui a apaisé le bébé, d'après les réponses du parent :",
    ...(soothed.length ? soothed : ['  • aucune réponse']),
    ...(unanswered ? [`  • sans réponse : ${unanswered}`] : []),
    '',
    'À lire avec ceci :',
    '  • Babbl ne mesure rien du bébé dans le son et ne détecte aucune maladie.',
    '  • Ce résumé ne contient que ce que le parent a noté. Un jour sans saisie',
    "    ne veut pas dire qu'il ne s'est rien passé.",
    '  • Un enregistrement est fait quand le parent le décide : ce n’est pas',
    '    une mesure de la quantité de pleurs.',
  ].join('\n');
}
