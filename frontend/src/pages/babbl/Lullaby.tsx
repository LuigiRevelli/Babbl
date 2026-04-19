/**
 * Babbl Claude Design — Screen 05 Lullaby (Voice comfort).
 * Ported from eee-handoff/app/app-screens.jsx::ScreenVoice.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BabblTheme as C } from '@/components/babbl/theme';
import { AppStatusBar, HomeIndicator, Waveform, BabblShell } from '@/components/babbl/primitives';

export default function BabblLullaby() {
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(12);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setElapsed(e => (e + 1) % 180), 1000);
    return () => clearInterval(iv);
  }, [playing]);

  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <BabblShell background={`linear-gradient(180deg, #241A15 0%, ${C.cafe} 100%)`} color={C.lait}>
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
            fontSize: 18,
          }}
        >
          ↓
        </button>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: 10,
            color: 'rgba(243,234,218,.5)',
            letterSpacing: '.15em',
            textTransform: 'uppercase',
          }}
        >
          Babbl voice · en lecture
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '40px 32px 0' }}>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: 10,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: C.ocre,
            marginBottom: 12,
          }}
        >
          votre voix · pour lui
        </div>
        <div
          style={{
            fontFamily: C.display,
            fontSize: 42,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: C.lait,
            fontStyle: 'italic',
            fontWeight: 300,
          }}
        >
          « Chut mon amour,
          <br />
          <span style={{ color: C.ocre }}>maman est là. »</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(243,234,218,.6)', marginTop: 14, lineHeight: 1.5 }}>
          Générée à partir de 30 s de votre voix — ton apaisant, tempo berceuse.
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 32px' }}>
        <div style={{ width: '100%' }}>
          <Waveform active={playing} color={C.ocre} count={36} />
        </div>
      </div>

      <div style={{ padding: '0 28px 24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: C.mono,
            fontSize: 11,
            color: 'rgba(243,234,218,.5)',
            marginBottom: 10,
          }}
        >
          <span>
            {mm}:{ss}
          </span>
          <span>3:00</span>
        </div>
        <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${(elapsed / 180) * 100}%`,
              height: '100%',
              background: C.ocre,
              borderRadius: 99,
              transition: 'width .5s linear',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginTop: 28 }}>
          <button
            aria-label="Précédent"
            style={{
              background: 'rgba(255,255,255,.05)',
              border: 'none',
              width: 48,
              height: 48,
              borderRadius: '50%',
              cursor: 'pointer',
              color: C.lait,
              fontSize: 18,
            }}
          >
            ⏮
          </button>
          <button
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? 'Pause' : 'Lecture'}
            style={{
              background: C.ocre,
              border: 'none',
              width: 72,
              height: 72,
              borderRadius: '50%',
              cursor: 'pointer',
              color: C.cafe,
              fontSize: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 40px -10px rgba(217,181,106,.4)',
            }}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button
            aria-label="Suivant"
            style={{
              background: 'rgba(255,255,255,.05)',
              border: 'none',
              width: 48,
              height: 48,
              borderRadius: '50%',
              cursor: 'pointer',
              color: C.lait,
              fontSize: 18,
            }}
          >
            ⏭
          </button>
        </div>

        <div
          style={{
            marginTop: 28,
            padding: 14,
            background: 'rgba(255,255,255,.05)',
            borderRadius: 18,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: C.sauge,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.cafe,
              fontSize: 16,
            }}
          >
            ♡
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: C.lait, fontWeight: 500 }}>Bébé s'est apaisé en 47 s</div>
            <div style={{ fontSize: 11, color: 'rgba(243,234,218,.5)' }}>Voix maman · berceuse apaisante</div>
          </div>
          <button
            aria-label="Sauvegarder"
            style={{
              background: 'transparent',
              border: 'none',
              color: C.ocre,
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ★
          </button>
        </div>
      </div>

      <HomeIndicator dark />
    </BabblShell>
  );
}
