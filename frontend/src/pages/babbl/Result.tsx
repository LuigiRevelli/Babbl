/**
 * Babbl Claude Design — Screen 03 Result.
 *
 * Deux couches, rien d'autre (SYMPTOMS.md) :
 *  1. Ce que Babbl a entendu — observation sonore en texte, transitoire :
 *     elle arrive par l'état de navigation et n'est jamais stockée.
 *  2. D'après ce que vous avez saisi — hypothèses contextuelles, jamais en %.
 * Plus les trois cartes de sécurité, toujours affichées.
 */

import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BabblTheme as C } from '@/components/babbl/theme';
import { AppStatusBar, HomeIndicator, BabblShell } from '@/components/babbl/primitives';
import { getUserData } from '@/lib/userData';
import type { SafetyCard, TransientObservation } from '@/lib/analysis';
import { HYPOTHESIS_DISCLAIMER, INTENSITY_DISCLAIMER, SAFETY_CARDS, SAFETY_FOOTER, hypothesisFr } from '@/lib/taxonomy';

const LEVEL_WORD: Record<string, string> = {
  intense: 'Pleur intense.',
  modere: 'Pleur modéré.',
  faible: 'Pleur faible.',
};

const label = (text: string) => (
  <span
    style={{
      fontFamily: C.mono,
      fontSize: 10,
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: C.cafeMute,
    }}
  >
    {text}
  </span>
);

export default function BabblResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const observation = (location.state as { observation?: TransientObservation } | null)?.observation;

  const analysis = useMemo(() => {
    const data = getUserData();
    return data.analyses.find(a => a.id === id);
  }, [id]);

  if (!analysis) {
    return (
      <BabblShell background={C.lait}>
        <AppStatusBar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: C.display, fontSize: 32, color: C.cafe }}>Analyse introuvable</div>
            <div style={{ fontSize: 14, color: C.cafeSoft, marginTop: 12 }}>
              Cette analyse n'existe plus dans votre historique local.
            </div>
            <button
              onClick={() => navigate('/')}
              style={{ marginTop: 24, padding: '12px 20px', borderRadius: 99, background: C.cafe, color: C.lait, border: 'none', cursor: 'pointer', fontFamily: C.body, fontSize: 14, fontWeight: 500 }}
            >
              Revenir à l'accueil
            </button>
          </div>
        </div>
        <HomeIndicator />
      </BabblShell>
    );
  }

  const hypotheses = analysis.hypotheses ?? [];
  const cards: SafetyCard[] =
    analysis.safety_cards && analysis.safety_cards.length > 0
      ? analysis.safety_cards
      : (Object.keys(SAFETY_CARDS) as Array<keyof typeof SAFETY_CARDS>).map(key => ({ key, ...SAFETY_CARDS[key], emphasized: false }));
  const footer = analysis.safety_footer ?? SAFETY_FOOTER;

  const actionsRaw: string[] = (analysis.recommended_actions ?? [])
    .map((a: any) => (typeof a === 'string' ? a : a?.action ?? ''))
    .filter(Boolean);
  const firstAction = actionsRaw[0] ?? 'Prenez votre bébé contre vous et parlez-lui doucement.';

  const timeStr = new Date(analysis.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <BabblShell background={C.lait}>
      <AppStatusBar />

      {/* Top bar */}
      <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: C.coquille, border: `1px solid ${C.ivoire}`, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 2L4 8l6 6" stroke={C.cafe} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ fontFamily: C.mono, fontSize: 10, color: C.cafeMute, letterSpacing: '.15em', textTransform: 'uppercase' }}>
          analyse · {timeStr}
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Couche 1 — ce que Babbl a entendu (transitoire) */}
      <div style={{ padding: '24px 28px 0' }}>
        <div style={{ marginBottom: 8 }}>{label('ce que Babbl a entendu')}</div>
        {observation ? (
          <>
            <div style={{ fontFamily: C.display, fontSize: 56, lineHeight: 0.95, letterSpacing: '-0.035em', color: C.terracotta, fontWeight: 400 }}>
              {LEVEL_WORD[observation.intensity.level] ?? 'Pleur.'}
            </div>
            <div style={{ fontSize: 14, color: C.cafe, marginTop: 14, lineHeight: 1.5 }}>{observation.intensity.observation}</div>
            <div style={{ fontSize: 12, color: C.cafeSoft, marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
              {observation.intensity.disclaimer || INTENSITY_DISCLAIMER}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: C.cafeSoft, lineHeight: 1.5, fontStyle: 'italic' }}>
            L'observation sonore n'est affichée qu'au moment de l'enregistrement. Elle n'est pas conservée.
          </div>
        )}
      </div>

      {/* Couche 2 — d'après ce que vous avez saisi */}
      <div style={{ padding: '28px 28px 0' }}>
        <div style={{ marginBottom: 10 }}>{label("d'après ce que vous avez saisi")}</div>
        {hypotheses.length === 0 ? (
          <div style={{ fontSize: 14, color: C.cafeSoft, lineHeight: 1.5 }}>
            Vous n'avez rien saisi sur les dernières heures : Babbl ne peut pas proposer d'hypothèse.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {hypotheses.map((h, i) => (
              <div key={h.key} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span style={{ fontFamily: C.mono, fontSize: 11, color: C.cafeMute, minWidth: 16 }}>{i + 1}</span>
                <div>
                  <div style={{ fontFamily: C.display, fontSize: i === 0 ? 30 : 22, letterSpacing: '-0.02em', lineHeight: 1.05, color: i === 0 ? C.cafe : C.cafeSoft }}>
                    {h.label || hypothesisFr(h.key)}
                  </div>
                  <div style={{ fontSize: 13, color: C.cafeSoft, marginTop: 4, lineHeight: 1.45 }}>{h.why}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ fontSize: 12, color: C.cafeMute, marginTop: 12, fontStyle: 'italic' }}>{HYPOTHESIS_DISCLAIMER}</div>
        {analysis.parent_summary && (
          <div style={{ fontSize: 14, color: C.cafe, marginTop: 14, lineHeight: 1.55 }}>{analysis.parent_summary}</div>
        )}
      </div>

      {/* Le geste à poser */}
      <div style={{ padding: '28px 20px 0' }}>
        <div style={{ background: C.coquille, borderRadius: 24, border: `1px solid ${C.ivoire}`, padding: 22, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            {label('le geste à poser')}
            <div style={{ fontFamily: C.mono, fontSize: 10, color: C.cafeMute }}>1 / {Math.max(actionsRaw.length, 1)}</div>
          </div>
          <div style={{ fontFamily: C.display, fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{firstAction}</div>
          {actionsRaw.length > 1 && (
            <div style={{ fontSize: 13, color: C.cafeSoft, marginTop: 12, lineHeight: 1.5 }}>
              Ensuite : {actionsRaw.slice(1).join(' · ')}
            </div>
          )}
        </div>

        {/* Cartes de sécurité — toujours affichées, jamais déduites du son */}
        <div style={{ background: C.coquille, borderRadius: 24, border: `1px solid ${C.ivoire}`, padding: 22, marginBottom: 14 }}>
          <div style={{ marginBottom: 6 }}>{label('repères de sécurité')}</div>
          <div style={{ fontSize: 12, color: C.cafeMute, marginBottom: 14, fontStyle: 'italic' }}>
            Toujours affichés. Ils ne dépendent pas de l'enregistrement.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {cards.map(card => (
              <div
                key={card.key}
                style={{
                  borderRadius: 16,
                  padding: '12px 14px',
                  background: card.emphasized ? '#FBEDE6' : C.lait,
                  border: `1px solid ${card.emphasized ? C.terracotta : C.ivoire}`,
                }}
              >
                <div style={{ fontFamily: C.display, fontSize: 18, letterSpacing: '-0.01em', color: card.emphasized ? C.terracotta : C.cafe }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 13, color: C.cafeSoft, marginTop: 4, lineHeight: 1.45 }}>{card.body}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
            <a
              href="tel:15"
              style={{ padding: '10px 16px', borderRadius: 99, background: C.cafe, color: C.lait, textDecoration: 'none', fontFamily: C.body, fontSize: 13, fontWeight: 500 }}
            >
              Appeler le 15
            </a>
            <div style={{ fontSize: 12, color: C.cafeMute, lineHeight: 1.4 }}>{footer}</div>
          </div>
        </div>

        {/* Paywall: ce que le micro a mesuré */}
        <div
          onClick={() => navigate('/upgrade')}
          style={{ background: `linear-gradient(135deg, ${C.creme}, #EAD9BA)`, borderRadius: 24, padding: 22, marginBottom: 12, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            {label('↳ ce que le micro a mesuré')}
            <div style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', background: C.cafe, color: C.ocre, padding: '4px 10px', borderRadius: 99 }}>
              Babbl+
            </div>
          </div>
          <div style={{ fontFamily: C.display, fontSize: 22, letterSpacing: '-0.02em', filter: 'blur(4px)', opacity: 0.6 }}>
            8,4 s — pleur continu — 487 Hz
          </div>
          <div style={{ fontSize: 13, color: C.cafeSoft, marginTop: 8 }}>
            Durée, continuité, hauteur — <span style={{ fontStyle: 'italic' }}>sans interprétation.</span>
          </div>
        </div>

        {/* Paywall: voice clone */}
        <div onClick={() => navigate('/upgrade')} style={{ background: C.cafe, color: C.lait, borderRadius: 24, padding: 22, cursor: 'pointer', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'rgba(243,234,218,.5)' }}>
              ↳ réconforter avec votre voix
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', background: C.ocre, color: C.cafe, padding: '4px 10px', borderRadius: 99 }}>
              Babbl Voice
            </div>
          </div>
          <div style={{ fontFamily: C.display, fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Laissez-le entendre
            <br />
            <span style={{ fontStyle: 'italic', color: C.ocre }}>votre voix.</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(243,234,218,.7)', marginTop: 10 }}>Même si vous n'êtes pas dans la pièce.</div>
        </div>
      </div>

      <HomeIndicator />
    </BabblShell>
  );
}
