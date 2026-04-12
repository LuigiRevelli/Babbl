import { useState, useMemo } from 'react';
import MobileLayout from '@/components/MobileLayout';

import BackButton from '@/components/BackButton';
import { getUserData, formatRelativeDate } from '@/lib/userData';
import { CAUSE_LABELS, CAUSE_EMOJIS } from '@/lib/constants';

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

  // Most frequent causes
  const causeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.analyses.forEach(a => { counts[a.topCause] = (counts[a.topCause] || 0) + 1; });
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [data.analyses]);

  // Pattern detection
  const pattern = useMemo(() => {
    if (data.analyses.length < 5) return null;
    const nightAnalyses = data.analyses.filter(a => {
      const h = new Date(a.timestamp).getHours();
      return h >= 2 && h < 5;
    });
    if (nightAnalyses.length >= 2) {
      const nightCauses: Record<string, number> = {};
      nightAnalyses.forEach(a => { nightCauses[a.topCause] = (nightCauses[a.topCause] || 0) + 1; });
      const topNight = Object.entries(nightCauses).sort(([, a], [, b]) => b - a)[0];
      return `Cries are more frequent between 2 a.m. and 5 a.m. Main nighttime cause: ${CAUSE_LABELS[topNight[0]] || topNight[0]}.`;
    }
    return null;
  }, [data.analyses]);

  return (
      <MobileLayout>
        <BackButton to="/dashboard" />
        <h1 className="font-serif text-2xl font-bold mb-4">History</h1>

        {/* Stats */}
        <div className="bg-card rounded-lg p-4 shadow-sm mb-4 text-center">
          <p className="font-serif text-4xl font-bold">{data.analyses.length}</p>
          <p className="text-sm text-muted-foreground">total analyses</p>
          {data.analyses.length >= 5 && (
            <p className="text-xs text-muted-foreground mt-2">
              Your response time is improving week after week 💪
            </p>
          )}
        </div>

        {/* Most frequent causes */}
        {causeCounts.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Most frequent causes</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {causeCounts.map(([cause, count]) => (
                <div key={cause} className="flex items-center gap-1 bg-primary-soft rounded-pill px-3 py-1.5 text-sm whitespace-nowrap">
                  <span>{CAUSE_EMOJIS[cause]}</span>
                  <span className="font-medium">{CAUSE_LABELS[cause]}</span>
                  <span className="text-muted-foreground">×{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pattern */}
        {pattern && (
          <div className="bg-primary-soft rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold mb-1">📊 Pattern detected</p>
            <p className="text-sm text-foreground">{pattern}</p>
          </div>
        )}

        {/* Period filter */}
        <div className="flex gap-2 mb-4">
          {([['week', 'This week'], ['month', 'This month'], ['all', 'All']] as [Period, string][]).map(([key, label]) => (
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
            <p className="text-sm text-muted-foreground">Your history is still empty. Start your first analysis 🧡</p>
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
                      <p className="font-semibold text-sm">{CAUSE_LABELS[a.topCause] || a.topCause}</p>
                      {a.feedback === 'positive' && <span className="text-xs">✅</span>}
                      {a.feedback === 'negative' && <span className="text-xs">❌</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatRelativeDate(a.timestamp)}</p>
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
