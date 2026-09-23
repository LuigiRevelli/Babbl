/**
 * Babbl Claude Design — shared primitives.
 * Ported 1:1 from eee-handoff/app/app-screens.jsx.
 */

import { useEffect, useState, type CSSProperties } from 'react';
import { BabblTheme as C } from './theme';

// ─────────────────────────────────────────────────────────────
// Global animation keyframes (injected once per mount)
// ─────────────────────────────────────────────────────────────
const KEYFRAMES_ID = 'babbl-keyframes';
const KEYFRAMES = `
@keyframes babbl-wave  { 0%,100% { transform: scaleY(.3); } 50% { transform: scaleY(1); } }
@keyframes babbl-spin  { to { transform: rotate(360deg); } }
@keyframes babbl-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: .8; } }
@keyframes babbl-ripple { 0% { transform: scale(.9); opacity: .6; } 100% { transform: scale(1.5); opacity: 0; } }
`;

function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────
// Status bar + home indicator
// ─────────────────────────────────────────────────────────────
export function AppStatusBar({ time, dark = false }: { time?: string; dark?: boolean }) {
  const [now, setNow] = useState(time ?? defaultTime());
  useEffect(() => {
    if (time) return;
    const iv = setInterval(() => setNow(defaultTime()), 30_000);
    return () => clearInterval(iv);
  }, [time]);

  const c = dark ? '#fff' : C.cafe;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 28px 0',
        fontFamily: '-apple-system, system-ui',
        fontWeight: 600,
        fontSize: 15,
        color: c,
        position: 'relative',
        zIndex: 20,
      }}
    >
      <span>{now}</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="17" height="11" viewBox="0 0 17 11">
          <rect x="0" y="6" width="3" height="5" rx="0.5" fill={c} />
          <rect x="4.5" y="4" width="3" height="7" rx="0.5" fill={c} />
          <rect x="9" y="2" width="3" height="9" rx="0.5" fill={c} />
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" fill={c} />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12">
          <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke={c} strokeOpacity="0.4" fill="none" />
          <rect x="2" y="2" width="16" height="8" rx="1.5" fill={c} />
        </svg>
      </div>
    </div>
  );
}

function defaultTime(): string {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function HomeIndicator({ dark = false }: { dark?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 60,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 134,
          height: 5,
          borderRadius: 99,
          background: dark ? 'rgba(255,255,255,.7)' : 'rgba(43,35,32,.25)',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────────────────────
export function Logo({
  size = 26,
  color = C.cafe,
  accent = C.terracotta,
}: {
  size?: number;
  color?: string;
  accent?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: size * 1.15,
          height: size * 1.15,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, #fff 0%, ${accent} 60%, #9E3E22 100%)`,
          boxShadow: 'inset 0 -3px 4px rgba(0,0,0,.08)',
        }}
      />
      <span
        style={{
          fontFamily: C.display,
          fontWeight: 500,
          fontSize: size,
          letterSpacing: '-0.04em',
          color,
        }}
      >
        babb<span style={{ fontStyle: 'italic', fontWeight: 300 }}>l</span>
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Record button (hero circle)
// ─────────────────────────────────────────────────────────────
export function RecordButton({
  listening,
  onClick,
  disabled,
}: {
  listening: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  useEffect(ensureKeyframes, []);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={listening ? "Arrêter l'écoute" : 'Écouter mon bébé'}
      style={{
        width: 200,
        height: 200,
        borderRadius: '50%',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        opacity: disabled ? 0.6 : 1,
        background: listening
          ? `radial-gradient(circle at 35% 35%, ${C.terracottaLight}, ${C.terracotta} 60%, #9E3E22 100%)`
          : `radial-gradient(circle at 35% 35%, #fff, ${C.creme} 60%, ${C.ocre} 100%)`,
        boxShadow: listening
          ? `0 20px 60px -10px rgba(194,82,48,.5), inset 0 -8px 16px rgba(0,0,0,.15)`
          : `0 20px 60px -10px rgba(43,35,32,.2), inset 0 -8px 16px rgba(0,0,0,.08)`,
        transition: 'all .3s ease',
      }}
    >
      {listening && (
        <span
          style={{
            position: 'absolute',
            inset: -20,
            borderRadius: '50%',
            border: `2px solid ${C.terracotta}`,
            opacity: 0.3,
            animation: 'babbl-ripple 2s ease-out infinite',
          }}
        />
      )}
      <div
        style={{
          fontFamily: C.display,
          fontSize: listening ? 22 : 28,
          fontStyle: 'italic',
          fontWeight: 300,
          color: listening ? '#fff' : C.cafe,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        {listening ? (
          <>
            j'écoute
            <br />
            votre bébé…
          </>
        ) : (
          <>
            Appuyer
            <br />
            pour
            <br />
            écouter
          </>
        )}
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Waveform (div-based, animates when active=true)
// ─────────────────────────────────────────────────────────────
export function Waveform({
  active,
  color = C.cafe,
  count = 28,
}: {
  active: boolean;
  color?: string;
  count?: number;
}) {
  useEffect(ensureKeyframes, []);
  const bars = Array.from({ length: count }, (_, i) => {
    const style: CSSProperties = {
      width: 4,
      flex: 'none',
      background: color,
      borderRadius: 4,
      height: active ? `${20 + Math.random() * 80}%` : '30%',
      animation: active
        ? `babbl-wave ${(1.2 + Math.random() * 0.6).toFixed(2)}s ease-in-out ${Math.random().toFixed(2)}s infinite`
        : 'none',
      opacity: active ? 0.85 : 0.3,
    };
    return <span key={i} style={style} />;
  });
  return (
    <div
      style={{
        display: 'flex',
        gap: 3,
        alignItems: 'center',
        height: 60,
        justifyContent: 'center',
      }}
    >
      {bars}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shell — mimics the device frame body styling without the iPhone bezel
// (we run in the actual viewport, not a mock device, so no device chrome)
// ─────────────────────────────────────────────────────────────
export function BabblShell({
  background,
  color = C.cafe,
  children,
}: {
  background?: string;
  color?: string;
  children: React.ReactNode;
}) {
  useEffect(ensureKeyframes, []);
  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: background ?? C.lait,
        color,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: C.body,
      }}
    >
      {children}
    </div>
  );
}
