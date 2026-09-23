import { useState, useMemo } from 'react';
import MobileLayout from '@/components/MobileLayout';

import BackButton from '@/components/BackButton';
import { getUserData, formatRelativeDate } from '@/lib/userData';
import { CAUSE_EMOJIS } from '@/lib/constants';
import { t, translateCause } from '@/lib/i18n';
import { SOOTHED_BY } from '@/lib/taxonomy';

type Period = 'week' | 'month' | 'all';

export default function History() {
  const data = getUserData();
  const [period, setPeriod] = useState<Period>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const now = Date.now();
    return data.analyses.filter(a => {
      if (period === 'all') return true;
      const diff = now - new Date(a.timestamp).getTime();
      return period === 'week' ? diff < 7 * 86400000 : diff < 30 * 86400000;
    }).reverse();
  }, [data.analyses, period]);

  // Pas de « tendance » : un nombre d'enregistrements n'est pas une fréquence
  // de pleurs (on enregistre quand on est réveillé), et « il pleure plus la
  // nuit » est un jugement de quantité (LISTE-FINALE-SYMPTOMES.md, n°1).
  // Même raison pour le total d'enregistrements et le classement des pistes :
  // « la faim ×6 » se lit comme un profil du bébé, alors que c'est un
  // reflet de ce que le parent a noté.

  return (
      <MobileLayout>
        <BackButton to="/dashboard" />
        <h1 className="font-serif text-2xl font-bold mb-4">{t('historyTitle')}</h1>
        <a href="/report" className="block text-sm underline text-muted-foreground mb-4">Résumé pour le médecin (7 jours)</a>

        {/* Period filter */}
        <div className="flex gap-2 mb-4">
          {([['week', t('thisWeek')], ['month', t('thisMonth')], ['all', t('all')]] as [Period, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-pill text-sm font-medium border transition-colors ${
                period === key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:border-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🧸</p>
            <p className="text-sm text-muted-foreground">{t('historyEmpty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(a => (
              <button
                key={a.id}
                onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                className="w-full bg-card rounded-lg p-3 shadow-sm text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-soft rounded-lg flex items-center justify-center text-xl shrink-0">
                    {CAUSE_EMOJIS[a.topCause] || '❓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{translateCause(a.topCause)}</p>
                      {a.feedback === 'positive' && <span className="text-xs">✅</span>}
                      {a.feedback === 'negative' && <span className="text-xs">❌</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatRelativeDate(a.timestamp)}</p>
                    {a.soothedBy && a.soothedBy !== 'skipped' && (
                      <p className="text-xs text-foreground mt-0.5">Ce qui a apaisé : {SOOTHED_BY[a.soothedBy]}</p>
                    )}
                  </div>
                </div>
                {expandedId === a.id && (
                  <p className="text-sm text-muted-foreground italic mt-2 leading-relaxed">
                    {a.parent_summary}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </MobileLayout>
  );
}
