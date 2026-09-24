/**
 * Babbl Claude Design — écran 04, ex-« Paywall ».
 *
 * Aucun paiement n'est branché : l'écran ne montre ni prix, ni essai, ni date
 * de facturation. Il ne liste que ce qui existe vraiment. L'ancienne version
 * vendait des « signaux acoustiques » (le son ne dit pas la cause), un « mode
 * nuit » qui n'existait pas, et une voix jouée en l'absence du parent.
 * Le prix de Babbl+ est une décision à prendre (BUSINESS_MODEL.md dit 6,99 €,
 * l'ancien écran 9,90 €) — à rebrancher ici avec un vrai paiement.
 */

import { useNavigate } from 'react-router-dom';
import { BabblTheme as C } from '@/components/babbl/theme';
import { AppStatusBar, HomeIndicator, BabblShell } from '@/components/babbl/primitives';

export default function BabblPaywall() {
  const navigate = useNavigate();

  return (
    <BabblShell background={`linear-gradient(180deg, ${C.cafe} 0%, #1A1310 100%)`} color={C.lait}>
      <AppStatusBar dark />

      <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,.08)',
            border: 'none',
            width: 40,
            height: 40,
            borderRadius: '50%',
            cursor: 'pointer',
            color: C.lait,
            fontSize: 20,
          }}
        >
          ×
        </button>
        <div style={{ fontFamily: C.mono, fontSize: 10, color: 'rgba(243,234,218,.7)', letterSpacing: '.15em', textTransform: 'uppercase' }}>
          Babbl · phase de test
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '32px 28px 24px' }}>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: 10,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: C.ocre,
            marginBottom: 14,
          }}
        >
          — ce qui existe aujourd'hui
        </div>
        <div
          style={{
            fontFamily: C.display,
            fontSize: 44,
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            color: C.lait,
          }}
        >
          Gratuit
          <br />
          <span style={{ fontStyle: 'italic', fontWeight: 300, color: C.ocre }}>pendant les tests.</span>
        </div>
      </div>

      <div style={{ padding: '0 20px', flex: 1 }}>
        {[
          {
            accent: C.terracottaLight,
            label: 'écouter, puis des pistes',
            desc: 'Babbl vérifie que c\'est un pleur. Les pistes viennent de ce que vous notez (tétée, couche, réveil), pas du son.',
          },
          {
            accent: C.terracotta,
            label: 'quand appeler le 15',
            desc: 'Les situations où il faut appeler, affichées à chaque écoute. Jamais remplacées par une réponse de l\'app.',
          },
          {
            accent: C.sauge,
            label: 'journal et résumé pour le médecin',
            desc: 'Tétées, couches, réveils des 7 derniers jours, à partager si vous le choisissez.',
          },
          {
            accent: C.ocre,
            label: 'votre voix (facultatif)',
            desc: 'Un message de réconfort lu avec votre voix, pendant que vous tenez votre bébé contre vous.',
          },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(255,255,255,.04)',
              borderRadius: 18,
              padding: 18,
              marginBottom: 10,
              border: '1px solid rgba(255,255,255,.05)',
              display: 'flex',
              gap: 14,
            }}
          >
            <div style={{ width: 3, background: f.accent, borderRadius: 99, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: C.mono,
                  fontSize: 10,
                  letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  color: f.accent,
                  marginBottom: 6,
                }}
              >
                {f.label}
              </div>
              <div style={{ fontSize: 14, color: C.lait, lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 20px 28px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '100%',
            padding: '18px 20px',
            borderRadius: 99,
            background: C.ocre,
            color: C.cafe,
            border: 'none',
            cursor: 'pointer',
            fontFamily: C.body,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Retour
        </button>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(243,234,218,.4)', marginTop: 14, lineHeight: 1.5 }}>
          Babbl ne remplace pas un avis médical. En cas de doute, appelez le 15.
        </div>
      </div>

      <HomeIndicator dark />
    </BabblShell>
  );
}
