/**
 * Les trois repères de sécurité — texte fixe, jamais déduit du son.
 * Version Tailwind (écrans legacy). L'écran Claude Design a sa propre mise en forme.
 *
 * Invariant : ce bloc est rendu sur tous les écrans de résultat ET de refus,
 * pour que son absence ne puisse jamais se lire comme un feu vert.
 */

import { Phone } from 'lucide-react';
import type { SafetyCard } from '@/lib/analysis';
import { t } from '@/lib/i18n';

export default function SafetyCardsBlock({ cards, footer }: { cards: SafetyCard[]; footer: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border/50 p-5 mb-4 animate-fade-in">
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t('safetyTitle')}</p>
      <p className="text-xs text-muted-foreground italic mb-3">{t('safetyNote')}</p>
      <div className="space-y-2">
        {cards.map(card => (
          <div
            key={card.key}
            className="rounded-xl p-3 border"
            style={card.emphasized ? { background: 'hsl(25 100% 95%)', borderColor: 'hsl(25 90% 55%)' } : { background: 'hsl(0 0% 100% / 0.4)', borderColor: 'hsl(0 0% 0% / 0.08)' }}
          >
            <p className="font-semibold text-sm" style={card.emphasized ? { color: 'hsl(25 90% 30%)' } : undefined}>{card.title}</p>
            <p className="text-xs mt-1 leading-relaxed text-muted-foreground">{card.body}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3">
        <a href="tel:15" className="py-2 px-4 rounded-xl flex items-center gap-2 font-bold text-sm text-white bg-destructive transition-all active:scale-[0.98]">
          <Phone className="w-4 h-4" />
          {t('alertCall15')}
        </a>
        <p className="text-xs text-muted-foreground leading-snug">{footer}</p>
      </div>
    </div>
  );
}
