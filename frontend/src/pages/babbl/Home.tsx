/**
 * Babbl Claude Design — Screen 01 Home (+ inline Screen 02 Analyzing).
 *
 * Ported from eee-handoff/app/app-screens.jsx::ScreenHome + ScreenAnalyzing
 * and wired to the real backend (MediaRecorder → /api/analyze → /analysis/:id).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BabblTheme as C } from '@/components/babbl/theme';
import {
  AppStatusBar,
  HomeIndicator,
  Logo,
  RecordButton,
  Waveform,
  BabblShell,
} from '@/components/babbl/primitives';
import { analyzeAudio as apiAnalyze, sendSoothed } from '@/lib/api';
import { getUserData, saveUserData, sinceLabel } from '@/lib/userData';
import { CRY_AUDIO_CONSTRAINTS, CRY_RECORD_MS, createRecorder, chunksToBlob } from '@/lib/recorder';
import { SOOTHED_BY, SOOTHED_QUESTION, type SoothedKey } from '@/lib/taxonomy';
import { answerSoothed, pendingSoothedQuestion } from '@/lib/soothed';
import { toStoredAnalysis, transientObservation, refusalFromError, babyAgeForContext, type AnalyzeResponse, type Refusal } from '@/lib/analysis';

const RECORD_MS = CRY_RECORD_MS; // durée fixe, définie dans lib/recorder.ts

type Phase = 'idle' | 'listening' | 'analyzing';

export default function BabblHome() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase | 'refused'>('idle');
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "3 / 5" daily analyses widget
  const todayAnalyses = useMemo(() => {
    const data = getUserData();
    const today = new Date().toDateString();
    return data.analyses.filter(a => new Date(a.timestamp).toDateString() === today).length;
  }, [phase]);

  // « Qu'est-ce qui l'a calmé ? » — à la réouverture, jamais par notification.
  const [soothedTarget, setSoothedTarget] = useState(() => pendingSoothedQuestion(getUserData().analyses));
  const answer = (key: SoothedKey | 'skipped') => {
    if (!soothedTarget) return;
    const data = getUserData();
    data.analyses = answerSoothed(data.analyses, soothedTarget.id, key);
    saveUserData(data);
    void sendSoothed(soothedTarget.id, key); // gardé dans le téléphone de toute façon
    setSoothedTarget(null);
  };

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const d = new Date();
    const h = d.getHours();
    const timeStr = `${h}h${String(d.getMinutes()).padStart(2, '0')}`;
    const period = h < 6 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bonjour' : 'Bonsoir';
    return `— ${period}, il est ${timeStr}`;
  }, [phase]);

  const startRecording = useCallback(async () => {
    if (phase !== 'idle') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: CRY_AUDIO_CONSTRAINTS });
      const recorder = createRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = chunksToBlob(chunksRef.current, recorder);
        setPhase('analyzing');
        await runAnalysis(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setPhase('listening');
      stopTimerRef.current = setTimeout(() => stopRecording(), RECORD_MS);
    } catch {
      alert("Micro inaccessible — autorisez l'accès dans votre navigateur.");
    }
  }, [phase]);

  const stopRecording = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => () => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
  }, []);

  const runAnalysis = async (blob: Blob) => {
    try {
      const userData = getUserData();
      const ctx: Record<string, unknown> = {};
      if (userData.lastMeal) ctx.lastFeedingTime = userData.lastMeal;
      if (userData.lastDiaper) ctx.lastDiaperTime = userData.lastDiaper;
      if (userData.lastWake) ctx.awakeSinceAt = userData.lastWake;
      if (userData.parentProfile?.ageRange) ctx.babyAgeRange = userData.parentProfile.ageRange;
      if (userData.babyName) ctx.babyName = userData.babyName;

      // La date de naissance prime sur la tranche : sans elle, la carte
      // « nouveau-né de moins de 15 jours » ne peut jamais s'allumer.
      const age = babyAgeForContext(userData.parentProfile ?? userData.voiceProfile);
      const babyAgeMonths = age.months;
      if (age.days != null) ctx.babyAgeDays = age.days;
      if (age.birthDate) ctx.babyBirthDate = age.birthDate;
      ctx.babyAgeMonths = babyAgeMonths;

      const result = (await apiAnalyze(blob, ctx, {
        voiceId: userData.voiceProfile?.voiceId,
        parentLabel: userData.voiceProfile?.role ?? userData.parentProfile?.role ?? 'father',
        babyAgeMonths,
      })) as AnalyzeResponse;

      // L'historique local ne garde que le contexte, le résumé et les gestes.
      // En base, c'est le backend qui écrit (jeton vérifié) — un seul écrivain.
      const analysis = toStoredAnalysis(result, result.id ?? crypto.randomUUID());
      userData.analyses.push(analysis);
      saveUserData(userData);
      // L'observation sonore n'est affichée qu'une fois : elle voyage dans
      // l'état de navigation, jamais dans le stockage.
      navigate(`/analysis/${analysis.id}`, { state: { observation: transientObservation(result) } });
    } catch (err: unknown) {
      // INVARIANT : jamais une popup vide. Le refus (422), la panne (500) et le
      // réseau coupé affichent tous les trois cartes de sécurité.
      setRefusal(refusalFromError(err, getUserData().parentProfile?.ageRange));
      setPhase('refused');
    }
  };

  if (phase === 'analyzing') return <ScreenAnalyzing />;
  if (phase === 'refused' && refusal) {
    return <ScreenRefused refusal={refusal} onRetry={() => { setRefusal(null); setPhase('idle'); }} />;
  }

  // ─── Screen 01 Home ───
  return (
    <BabblShell background={`linear-gradient(180deg, ${C.lait} 0%, ${C.creme} 100%)`}>
      <AppStatusBar />

      <div style={{ padding: '14px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo size={22} />
        <button
          onClick={() => navigate('/voice-setup')}
          aria-label="Profil"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: C.coquille,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${C.ivoire}`,
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5.5" r="3" stroke={C.cafeSoft} strokeWidth="1.5" />
            <path d="M2 14c0-3.3 2.7-5 6-5s6 1.7 6 5" stroke={C.cafeSoft} strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <div style={{ padding: '32px 28px 0' }}>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: 10,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: C.cafeMute,
            marginBottom: 10,
          }}
        >
          {greeting}
        </div>
        <div
          style={{
            fontFamily: C.display,
            fontSize: 38,
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            color: C.cafe,
          }}
        >
          Il pleure.
          <br />
          <span style={{ fontStyle: 'italic', fontWeight: 300, color: C.terracotta }}>On est là.</span>
        </div>
        <div style={{ fontSize: 14, color: C.cafeSoft, marginTop: 14, lineHeight: 1.5, maxWidth: 280 }}>
          Tenez le téléphone à 20-30 cm du bébé. Babbl écoute 10 secondes.
        </div>
      </div>

      {phase === 'idle' && <ContextStrip onOpenJournal={() => navigate('/dashboard')} />}

      {soothedTarget && phase === 'idle' && <SoothedCard onAnswer={answer} />}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          padding: '40px 0',
        }}
      >
        <RecordButton listening={phase === 'listening'} onClick={phase === 'listening' ? stopRecording : startRecording} />
        <Waveform active={phase === 'listening'} />
      </div>

      <div style={{ padding: '0 20px 32px' }}>
        <div
          style={{
            background: C.coquille,
            borderRadius: 20,
            padding: '16px 18px',
            border: `1px solid ${C.ivoire}`,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              fontFamily: C.mono,
              fontSize: 10,
              color: C.cafeMute,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
            }}
          >
            aujourd'hui
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'flex-end', height: 28 }}>
            {[14, 22, 18, 8, 26, 12, 6, 20, 16, 10, 24, 18].map((h, i) => (
              <span
                key={i}
                style={{
                  flex: 1,
                  height: h,
                  background: i === Math.min(todayAnalyses * 2, 11) ? C.terracotta : C.ocre,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
          <div style={{ fontFamily: C.display, fontSize: 22, letterSpacing: '-0.02em' }}>
            {todayAnalyses}
            <span style={{ fontSize: 13, color: C.cafeMute }}>/5</span>
          </div>
        </div>
      </div>

      <HomeIndicator />
    </BabblShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Contexte en un geste : c'est la SEULE source des pistes (le son ne dit pas
// la cause). Sans ce bandeau, la saisie n'existait que dans le journal, et
// les pistes se réduisaient à « besoin de réconfort ».
// ─────────────────────────────────────────────────────────────
type ContextKey = 'lastMeal' | 'lastDiaper' | 'lastWake';
const CONTEXT_ITEMS: { key: ContextKey; label: string; action: string }[] = [
  { key: 'lastMeal', label: 'Tétée', action: 'Noter une tétée maintenant' },
  { key: 'lastDiaper', label: 'Couche', action: 'Noter un change maintenant' },
  { key: 'lastWake', label: 'Réveil', action: 'Noter un réveil maintenant' },
];

function ContextStrip({ onOpenJournal }: { onOpenJournal: () => void }) {
  const [data, setData] = useState(() => getUserData());
  const log = (key: ContextKey) => {
    const fresh = getUserData();
    fresh[key] = new Date().toISOString();
    saveUserData(fresh);
    setData(fresh);
  };
  return (
    <div style={{ padding: '18px 20px 0' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {CONTEXT_ITEMS.map(({ key, label, action }) => {
          const when = data[key];
          return (
            <button
              key={key}
              onClick={() => log(key)}
              aria-label={action}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: 16, border: `1px solid ${C.ivoire}`,
                background: C.coquille, cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ fontFamily: C.body, fontSize: 13, color: C.cafe, fontWeight: 600 }}>{label}</div>
              <div style={{ fontFamily: C.mono, fontSize: 10, color: C.cafeMute, marginTop: 2 }}>
                {when ? sinceLabel(when) : '+ maintenant'}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontFamily: C.body, fontSize: 11, color: C.cafeMute }}>
          Les pistes viennent de ce que vous notez ici, pas du son.
        </span>
        <button
          onClick={onOpenJournal}
          style={{ background: 'none', border: 'none', padding: 0, fontFamily: C.body, fontSize: 11, color: C.cafeSoft, textDecoration: 'underline', cursor: 'pointer' }}
        >
          Journal
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// « Qu'est-ce qui l'a calmé ? » — liste fermée, une réponse ou « plus tard ».
// ─────────────────────────────────────────────────────────────
function SoothedCard({ onAnswer }: { onAnswer: (key: SoothedKey | 'skipped') => void }) {
  return (
    <div style={{ padding: '20px 20px 0' }}>
      <div
        role="group"
        aria-label={SOOTHED_QUESTION}
        style={{ background: C.coquille, borderRadius: 20, padding: '16px 18px', border: `1px solid ${C.ivoire}` }}
      >
        <div style={{ fontFamily: C.display, fontSize: 18, letterSpacing: '-0.01em', color: C.cafe, marginBottom: 12 }}>
          {SOOTHED_QUESTION}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(Object.keys(SOOTHED_BY) as SoothedKey[]).map((key) => (
            <button
              key={key}
              onClick={() => onAnswer(key)}
              style={{
                padding: '8px 12px', borderRadius: 99, border: `1px solid ${C.ivoire}`,
                background: C.lait, color: C.cafe, fontFamily: C.body, fontSize: 13, cursor: 'pointer',
              }}
            >
              {SOOTHED_BY[key]}
            </button>
          ))}
        </div>
        <button
          onClick={() => onAnswer('skipped')}
          style={{
            marginTop: 10, background: 'none', border: 'none', padding: 0, color: C.cafeMute,
            fontFamily: C.body, fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen 02b Refused — Babbl n'a pas répondu. Les cartes restent.
// ─────────────────────────────────────────────────────────────
function ScreenRefused({ refusal, onRetry }: { refusal: Refusal; onRetry: () => void }) {
  const label = (text: string) => (
    <span style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: C.cafeMute }}>{text}</span>
  );
  return (
    <BabblShell background={C.lait}>
      <AppStatusBar />
      <div style={{ padding: '24px 28px 0' }}>
        <div style={{ marginBottom: 8 }}>{label('babbl n\'a pas répondu')}</div>
        <div style={{ fontFamily: C.display, fontSize: 34, lineHeight: 1.0, letterSpacing: '-0.03em', color: C.cafe }}>
          {refusal.message}
        </div>
        <div style={{ fontSize: 14, color: C.terracotta, marginTop: 14, lineHeight: 1.5, fontWeight: 500 }}>{refusal.reminder}</div>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ background: C.coquille, borderRadius: 24, border: `1px solid ${C.ivoire}`, padding: 22, marginBottom: 14 }}>
          <div style={{ marginBottom: 6 }}>{label('repères de sécurité')}</div>
          <div style={{ fontSize: 12, color: C.cafeMute, marginBottom: 14, fontStyle: 'italic' }}>
            Toujours affichés. Ils ne dépendent pas de l'enregistrement.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {refusal.cards.map(card => (
              <div
                key={card.key}
                style={{ borderRadius: 16, padding: '12px 14px', background: card.emphasized ? '#FBEDE6' : C.lait, border: `1px solid ${card.emphasized ? C.terracotta : C.ivoire}` }}
              >
                <div style={{ fontFamily: C.display, fontSize: 18, letterSpacing: '-0.01em', color: card.emphasized ? C.terracotta : C.cafe }}>{card.title}</div>
                <div style={{ fontSize: 13, color: C.cafeSoft, marginTop: 4, lineHeight: 1.45 }}>{card.body}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
            <a href="tel:15" style={{ padding: '10px 16px', borderRadius: 99, background: C.cafe, color: C.lait, textDecoration: 'none', fontFamily: C.body, fontSize: 13, fontWeight: 500 }}>
              Appeler le 15
            </a>
            <div style={{ fontSize: 12, color: C.cafeMute, lineHeight: 1.4 }}>{refusal.footer}</div>
          </div>
        </div>

        {refusal.hint && (
          <div style={{ fontSize: 13, color: C.cafeSoft, lineHeight: 1.5, padding: '0 8px 16px' }}>{refusal.hint}</div>
        )}
        <button
          onClick={onRetry}
          style={{ width: '100%', padding: '14px 20px', borderRadius: 99, background: C.cafe, color: C.lait, border: 'none', cursor: 'pointer', fontFamily: C.body, fontSize: 14, fontWeight: 500, marginBottom: 24 }}
        >
          Réessayer
        </button>
      </div>
      <HomeIndicator />
    </BabblShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen 02 Analyzing — shown inline while /api/analyze runs
// ─────────────────────────────────────────────────────────────
function ScreenAnalyzing() {
  return (
    <BabblShell background={C.lait}>
      <AppStatusBar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          padding: 28,
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: '50%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="140"
            height="140"
            viewBox="0 0 140 140"
            style={{ position: 'absolute', animation: 'babbl-spin 2s linear infinite' }}
          >
            <circle cx="70" cy="70" r="64" fill="none" stroke={C.ivoire} strokeWidth="2" />
            <circle
              cx="70"
              cy="70"
              r="64"
              fill="none"
              stroke={C.terracotta}
              strokeWidth="2"
              strokeDasharray="100 402"
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: C.terracotta,
              animation: 'babbl-pulse 1.2s ease-in-out infinite',
            }}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontFamily: C.display,
              fontSize: 36,
              fontStyle: 'italic',
              fontWeight: 300,
              color: C.cafe,
              letterSpacing: '-0.02em',
            }}
          >
            on écoute…
          </div>
          <div style={{ fontSize: 14, color: C.cafeSoft, marginTop: 12, maxWidth: 260, lineHeight: 1.5, marginInline: 'auto' }}>
            Babbl mesure le son et lit ce que vous avez saisi. Rien de plus.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: '100%',
            maxWidth: 280,
            fontFamily: C.mono,
            fontSize: 11,
            color: C.cafeMute,
            letterSpacing: '.05em',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
            <span>✓ Enregistrement</span>
            <span>10 s</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.terracotta }}>▸ Observation sonore…</span>
            <span>…</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.4 }}>
            <span>&nbsp;&nbsp;Lecture de ce que vous avez saisi</span>
            <span>—</span>
          </div>
        </div>
      </div>
      <HomeIndicator />
    </BabblShell>
  );
}
