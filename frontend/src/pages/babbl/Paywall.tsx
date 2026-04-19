/**
 * Babbl Claude Design — Screen 04 Paywall.
 * Ported from eee-handoff/app/app-screens.jsx::ScreenPaywall.
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
        <div style={{ fontFamily: C.mono, fontSize: 10, color: 'rgba(243,234,218,.5)', letterSpacing: '.15em', textTransform: 'uppercase' }}>
          Babbl+ · essai 7 jours
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
          — ce soir à 3h07
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
          Vous ne serez
          <br />
          <span style={{ fontStyle: 'italic', fontWeight: 300, color: C.ocre }}>plus seul(e).</span>
        </div>
      </div>

      <div style={{ padding: '0 20px', flex: 1 }}>
        {[
          {
            accent: C.terracottaLight,
            label: 'signaux acoustiques détaillés',
            desc: 'Pitch, rythme, intensité. Exactement ce que signale le pleur.',
          },
          {
            accent: C.ocre,
            label: 'babbl voice — votre voix qui le calme',
            desc: 'Clonez votre voix une fois. Babbl la joue même quand vous n\'êtes pas là.',
          },
          {
            accent: C.sauge,
            label: 'mode nuit — veille pendant que vous dormez',
            desc: 'Détection passive 22h–7h. Ne vous réveille que si c\'est nécessaire.',
          },
          {
            accent: C.terracotta,
            label: 'rapports pédiatre exportables',
            desc: 'PDF horodatés pour le médecin. Sommeil, alimentation, pleurs.',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: C.display, fontSize: 34, color: C.lait, letterSpacing: '-0.02em' }}>
              9,90<span style={{ fontSize: 18, color: 'rgba(243,234,218,.5)' }}>€</span>
            </div>
            <div style={{ fontFamily: C.mono, fontSize: 10, color: 'rgba(243,234,218,.5)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
              par mois · résiliable
            </div>
          </div>
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 9,
              color: C.cafe,
              background: C.ocre,
              padding: '4px 10px',
              borderRadius: 99,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
            }}
          >
            7 jours offerts
          </div>
        </div>
        <button
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
          Commencer l'essai gratuit
        </button>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(243,234,218,.4)', marginTop: 14, lineHeight: 1.5 }}>
          Aucun paiement avant le 25 avril · Rappel 2 jours avant facturation
        </div>
      </div>

      <HomeIndicator dark />
    </BabblShell>
  );
}
