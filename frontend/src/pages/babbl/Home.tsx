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
import { analyzeAudio as apiAnalyze } from '@/lib/api';
import { getUserData, saveUserData } from '@/lib/userData';
import { CRY_AUDIO_CONSTRAINTS, CRY_RECORD_MS, createRecorder, chunksToBlob } from '@/lib/recorder';
import { useAuth } from '@/lib/AuthContext';
import { saveAnalysis as saveAnalysisToSupabase } from '@/lib/supabaseData';

const RECORD_MS = CRY_RECORD_MS; // durée fixe, définie dans lib/recorder.ts

type Phase = 'idle' | 'listening' | 'analyzing';

export default function BabblHome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [phase, setPhase] = useState<Phase>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "3 / 5" daily analyses widget
  const todayAnalyses = useMemo(() => {
    const data = getUserData();
    const today = new Date().toDateString();
    return data.analyses.filter(a => new Date(a.timestamp).toDateString() === today).length;
  }, [phase]);

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
      if (userData.parentProfile?.ageRange) ctx.babyAgeRange = userData.parentProfile.ageRange;
      if (userData.babyName) ctx.babyName = userData.babyName;

      const ageMap: Record<string, number> = { '0-3': 2, '3-6': 5, '6-12': 9, '1-2': 18, '2+': 30 };
      const babyAgeMonths = ageMap[userData.parentProfile?.ageRange ?? '0-3'] ?? 3;

      const result = await apiAnalyze(blob, ctx, {
        voiceId: userData.voiceProfile?.voiceId,
        parentLabel: userData.voiceProfile?.role ?? userData.parentProfile?.role ?? 'father',
        babyAgeMonths,
      });

      const probs: Record<string, number> = result.probabilities ?? {};
      const topCause = Object.entries(probs).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] ?? 'unknown';
      const actions: string[] = (result.recommended_actions ?? []).map((a: any) =>
        typeof a === 'string' ? a : a.action ?? '',
      );
      const signals: string[] = (result.key_signals ?? []).map((s: any) =>
        typeof s === 'string' ? s : s.signal ?? '',
      );

      const analysis = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        topCause,
        probabilities: probs,
        parent_summary: result.parent_summary ?? '',
        confidence_level: result.confidence_level ?? 'medium',
        alert: result.alert ?? 'none',
        feedback: null,
        actualCause: null,
        sosModeUsed: false,
        key_signals: signals,
        recommended_actions: actions,
        audio_url: result.audio_url ?? undefined,
        comfort_audio_url: result.comfort_audio_url ?? undefined,
        comfort_text: result.comfort_text ?? undefined,
      };
      userData.analyses.push(analysis);
      saveUserData(userData);

      if (user?.id) {
        try {
          await saveAnalysisToSupabase(user.id, {
            id: analysis.id,
            top_cause: analysis.topCause,
            probabilities: analysis.probabilities,
            parent_summary: analysis.parent_summary,
            confidence_level: analysis.confidence_level,
            alert: analysis.alert,
            key_signals: analysis.key_signals,
            recommended_actions: analysis.recommended_actions,
            audio_url: analysis.audio_url ?? null,
            comfort_audio_url: analysis.comfort_audio_url ?? null,
            comfort_text: analysis.comfort_text ?? null,
          });
        } catch (e) {
          console.warn('[supabase] sauvegarde échouée, localStorage uniquement :', e);
        }
      }
      navigate(`/analysis/${analysis.id}`);
    } catch (err: any) {
      alert(err?.message ?? "L'analyse a échoué. Réessayez.");
      setPhase('idle');
    }
  };

  if (phase === 'analyzing') return <ScreenAnalyzing />;

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
          Posez le téléphone à 50 cm du bébé. Babbl écoute 8 à 12 secondes.
        </div>
      </div>

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
            Deux modèles, deux secondes. Vos données ne quittent pas votre téléphone.
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
            <span>✓ Capture · 8,4 s</span>
            <span>44.1 kHz</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
            <span>✓ Filtrage bruit ambiant</span>
            <span>-18 dB</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.terracotta }}>▸ Classification acoustique…</span>
            <span>…</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.4 }}>
            <span>&nbsp;&nbsp;Contextualisation</span>
            <span>—</span>
          </div>
        </div>
      </div>
      <HomeIndicator />
    </BabblShell>
  );
}
