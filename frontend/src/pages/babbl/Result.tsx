/**
 * Babbl Claude Design — Screen 03 Result.
 *
 * Ported from eee-handoff/app/app-screens.jsx::ScreenResult and fed with real
 * analysis data fetched from localStorage by id (falls back gracefully if
 * the id is unknown).
 */

import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BabblTheme as C } from '@/components/babbl/theme';
import { AppStatusBar, HomeIndicator, BabblShell } from '@/components/babbl/primitives';
import { getUserData } from '@/lib/userData';

const CAUSE_FR: Record<string, string> = {
  hungry: 'Faim',
  tired: 'Fatigue',
  discomfort: 'Inconfort',
  pain: 'Douleur',
  burping: 'Rot',
  cold_hot: 'Température',
  lonely: 'Besoin de câlin',
  unknown: 'Inconnu',
};

const CAUSE_DESC: Record<string, string> = {
  hungry: 'Pleur rythmé, pitch bas, pauses régulières.',
  tired: 'Pleurs en vagues, yeux qui se ferment, baillements.',
  discomfort: 'Pleurs irréguliers, agitation, signaux mixtes.',
  pain: 'Pleurs aigus, soudains, intenses.',
  burping: 'Courtes décharges, respiration saccadée.',
  cold_hot: 'Pleurs geignards, peau inhabituelle.',
  lonely: 'Pleurs qui s\'apaisent au contact visuel.',
  unknown: 'Signaux mixtes — vérifiez les éléments classiques.',
};

export default function BabblResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
              style={{
                marginTop: 24,
                padding: '12px 20px',
                borderRadius: 99,
                background: C.cafe,
                color: C.lait,
                border: 'none',
                cursor: 'pointer',
                fontFamily: C.body,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Revenir à l'accueil
            </button>
          </div>
        </div>
        <HomeIndicator />
      </BabblShell>
    );
  }

  const causeKey = analysis.topCause;
  const causeLabel = CAUSE_FR[causeKey] ?? causeKey.charAt(0).toUpperCase() + causeKey.slice(1);
  const causeDesc = CAUSE_DESC[causeKey] ?? '';
  const confidence = Math.round(((analysis.probabilities[causeKey] ?? 0) as number) * 100);

  const actionsRaw: string[] = (analysis.recommended_actions ?? [])
    .map((a: any) => (typeof a === 'string' ? a : a?.action ?? ''))
    .filter(Boolean);
  const firstAction = actionsRaw[0] ?? 'Gardez votre bébé contre vous et parlez-lui doucement.';

  const timeStr = new Date(analysis.timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <BabblShell background={C.lait}>
      <AppStatusBar />

      {/* Top bar */}
      <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: C.coquille,
            border: `1px solid ${C.ivoire}`,
            width: 40,
            height: 40,
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 2L4 8l6 6" stroke={C.cafe} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: 10,
            color: C.cafeMute,
            letterSpacing: '.15em',
            textTransform: 'uppercase',
          }}
        >
          analyse · {timeStr}
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Cause + confidence */}
      <div style={{ padding: '24px 28px 0' }}>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: 10,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: C.cafeMute,
            marginBottom: 8,
          }}
        >
          cause principale
        </div>
        <div
          style={{
            fontFamily: C.display,
            fontSize: 88,
            lineHeight: 0.85,
            letterSpacing: '-0.04em',
            color: C.terracotta,
            fontWeight: 400,
          }}
        >
          {causeLabel}.
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 99, background: C.ivoire, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${confidence}%`,
                background: `linear-gradient(90deg, ${C.terracotta}, ${C.ocre})`,
                borderRadius: 99,
                transition: 'width .6s ease',
              }}
            />
          </div>
          <div style={{ fontFamily: C.mono, fontSize: 13, color: C.terracotta, fontWeight: 500 }}>{confidence}%</div>
        </div>
        <div style={{ fontSize: 13, color: C.cafeSoft, marginTop: 10, lineHeight: 1.5 }}>
          {causeDesc} {analysis.parent_summary && <span style={{ fontStyle: 'italic' }}>{analysis.parent_summary}</span>}
        </div>
      </div>

      {/* Action card */}
      <div style={{ padding: '28px 20px 0' }}>
        <div
          style={{
            background: C.coquille,
            borderRadius: 24,
            border: `1px solid ${C.ivoire}`,
            padding: 22,
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div
              style={{
                fontFamily: C.mono,
                fontSize: 10,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: C.cafeMute,
              }}
            >
              le geste à poser
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 10, color: C.cafeMute }}>
              1 / {Math.max(actionsRaw.length, 1)}
            </div>
          </div>
          <div style={{ fontFamily: C.display, fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{firstAction}</div>
          <div style={{ fontSize: 14, color: C.cafeSoft, marginTop: 12, lineHeight: 1.5 }}>
            Si dans 2 minutes il ne se calme pas, Babbl vous proposera l'étape suivante.
          </div>
          <button
            style={{
              marginTop: 18,
              padding: '14px 20px',
              borderRadius: 99,
              background: C.cafe,
              color: C.lait,
              border: 'none',
              cursor: 'pointer',
              fontFamily: C.body,
              fontSize: 14,
              fontWeight: 500,
              width: '100%',
            }}
          >
            J'ai commencé — démarrer un minuteur de 2 min
          </button>
        </div>

        {/* Paywall: detailed signals */}
        <div
          onClick={() => navigate('/upgrade')}
          style={{
            background: `linear-gradient(135deg, ${C.creme}, #EAD9BA)`,
            borderRadius: 24,
            padding: 22,
            marginBottom: 12,
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div
              style={{
                fontFamily: C.mono,
                fontSize: 10,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: C.cafeMute,
              }}
            >
              ↳ signaux acoustiques détaillés
            </div>
            <div
              style={{
                display: 'flex',
                gap: 4,
                alignItems: 'center',
                fontFamily: C.mono,
                fontSize: 9,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                background: C.cafe,
                color: C.ocre,
                padding: '4px 10px',
                borderRadius: 99,
              }}
            >
              Babbl+
            </div>
          </div>
          <div style={{ fontFamily: C.display, fontSize: 22, letterSpacing: '-0.02em', filter: 'blur(4px)', opacity: 0.6 }}>
            Pitch 487 Hz — rythme régulier 1,2 s — 3 pauses
          </div>
          <div style={{ fontSize: 13, color: C.cafeSoft, marginTop: 8 }}>
            Comprendre <span style={{ fontStyle: 'italic' }}>exactement</span> ce que signale le pleur.
          </div>
        </div>

        {/* Paywall: voice clone */}
        <div
          onClick={() => navigate('/upgrade')}
          style={{
            background: C.cafe,
            color: C.lait,
            borderRadius: 24,
            padding: 22,
            cursor: 'pointer',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div
              style={{
                fontFamily: C.mono,
                fontSize: 10,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: 'rgba(243,234,218,.5)',
              }}
            >
              ↳ réconforter avec votre voix
            </div>
            <div
              style={{
                fontFamily: C.mono,
                fontSize: 9,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                background: C.ocre,
                color: C.cafe,
                padding: '4px 10px',
                borderRadius: 99,
              }}
            >
              Babbl Voice
            </div>
          </div>
          <div style={{ fontFamily: C.display, fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Laissez-le entendre
            <br />
            <span style={{ fontStyle: 'italic', color: C.ocre }}>votre voix.</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(243,234,218,.7)', marginTop: 10 }}>
            Même si vous n'êtes pas dans la pièce.
          </div>
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,.08)',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L10 6H13v4H10l-4 3V3z" fill={C.ocre} />
            </svg>
            <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
              <div style={{ width: '34%', height: '100%', background: C.ocre }} />
            </div>
            <span style={{ fontFamily: C.mono, fontSize: 10, color: C.ocre }}>0:12</span>
          </div>
        </div>
      </div>

      <HomeIndicator />
    </BabblShell>
  );
}
