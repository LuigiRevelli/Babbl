import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import BackButton from '@/components/BackButton';
import { getUserData, saveUserData } from '@/lib/userData';
import { analyzeAudio as apiAnalyze } from '@/lib/api';
import { t } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { saveAnalysis as saveAnalysisToSupabase } from '@/lib/supabaseData';

export default function Record() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const data = getUserData();
  const profile = data.parentProfile;

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await analyzeAudio(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      alert(t('micError'));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const analyzeAudio = async (blob: Blob) => {
    setIsAnalyzing(true);
    try {
      const userData = getUserData();

      // Build context from user data
      const context: Record<string, unknown> = {};
      if (userData.lastMeal) context.lastFeedingTime = userData.lastMeal;
      if (userData.lastDiaper) context.lastDiaperTime = userData.lastDiaper;
      if (userData.parentProfile?.ageRange) context.babyAgeRange = userData.parentProfile.ageRange;
      if (userData.babyName) context.babyName = userData.babyName;

      // Age range to months (midpoint)
      const ageMap: Record<string, number> = { '0-3': 2, '3-6': 5, '6-12': 9, '1-2': 18, '2+': 30 };
      const babyAgeMonths = ageMap[userData.parentProfile?.ageRange ?? '0-3'] ?? 3;

      const result = await apiAnalyze(blob, context, {
        voiceId: userData.voiceProfile?.voiceId,
        parentLabel: userData.voiceProfile?.role ?? userData.parentProfile?.role ?? 'father',
        babyAgeMonths,
      });

      // Determine top cause from probabilities
      const probs: Record<string, number> = result.probabilities ?? {};
      const topCause = Object.entries(probs).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] ?? 'unknown';

      // Normalize recommended_actions to string[]
      const actions: string[] = (result.recommended_actions ?? []).map((a: any) =>
        typeof a === 'string' ? a : a.action ?? '',
      );

      // Normalize key_signals to string[]
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

      // Persist to Supabase (best-effort, localStorage is the fallback)
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
          console.warn('[supabase] Sauvegarde analyse échouée, localStorage utilisé :', e);
        }
      }

      navigate(`/analysis/${analysis.id}`);
    } catch (err: any) {
      alert(err?.message ?? "L'analyse a échoué. Veuillez réessayer.");
      setIsAnalyzing(false);
    }
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <MobileLayout className="flex flex-col min-h-screen">
      <BackButton />
      <div className="flex-1 flex flex-col items-center justify-center px-2">
        <p className="text-muted-foreground text-sm mb-1">
          {profile?.role === 'mother' ? t('mom') : profile?.role === 'father' ? t('dad') : t('hello')}
          {profile?.babyName ? ` de ${profile.babyName}` : ''} 👋
        </p>
        <h1 className="font-serif text-2xl font-bold mb-2 text-center">
          {isAnalyzing ? t('analyzing') : isRecording ? t('recording') : t('readyToListen')}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-10">
          {isAnalyzing
            ? t('babblListening')
            : isRecording
            ? t('pressStop')
            : t('holdPhone')}
        </p>

        {(isRecording || isAnalyzing) && (
          <p className="text-3xl font-mono font-bold mb-8 text-primary">
            {formatTimer(seconds)}
          </p>
        )}

        {isAnalyzing ? (
          <div className="w-28 h-28 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-primary animate-pulse" />
          </div>
        ) : isRecording ? (
          <button
            onClick={stopRecording}
            className="w-28 h-28 rounded-full bg-destructive/15 flex items-center justify-center transition-transform active:scale-90"
          >
            <div className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center shadow-lg animate-pulse">
              <Square className="w-8 h-8 text-white" fill="white" />
            </div>
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="w-32 h-32 rounded-full flex items-center justify-center transition-transform active:scale-90 group"
            style={{ background: 'linear-gradient(135deg, hsl(24 84% 61%), hsl(21 78% 54%))' }}
          >
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-105">
              <Mic className="w-10 h-10 text-white" strokeWidth={1.5} />
            </div>
          </button>
        )}

        {!isRecording && !isAnalyzing && (
          <p className="mt-6 text-base font-bold text-primary">{t('recordCry')}</p>
        )}
      </div>
    </MobileLayout>
  );
}
