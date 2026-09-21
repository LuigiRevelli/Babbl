import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import BackButton from '@/components/BackButton';
import { getUserData, saveUserData } from '@/lib/userData';
import { CRY_AUDIO_CONSTRAINTS, CRY_RECORD_MS, createRecorder, chunksToBlob } from '@/lib/recorder';
import { toStoredAnalysis, transientObservation, refusalFromError, babyAgeForContext, type AnalyzeResponse, type Refusal } from '@/lib/analysis';
import SafetyCardsBlock from '@/components/SafetyCardsBlock';
import { analyzeAudio as apiAnalyze } from '@/lib/api';
import { t } from '@/lib/i18n';

export default function Record() {
  const navigate = useNavigate();
  const data = getUserData();
  const profile = data.parentProfile;

  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: CRY_AUDIO_CONSTRAINTS });
      const recorder = createRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = chunksToBlob(chunksRef.current, recorder);
        await analyzeAudio(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      // Durée fixe : un clip plus long ne mesure rien de plus (SYMPTOMS.md).
      stopTimerRef.current = setTimeout(() => stopRecording(), CRY_RECORD_MS);
    } catch {
      alert(t('micError'));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
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

      const age = babyAgeForContext(userData.parentProfile ?? userData.voiceProfile);
      const babyAgeMonths = age.months;
      if (age.days != null) context.babyAgeDays = age.days;
      if (age.birthDate) context.babyBirthDate = age.birthDate;
      context.babyAgeMonths = babyAgeMonths;

      const result = (await apiAnalyze(blob, context, {
        voiceId: userData.voiceProfile?.voiceId,
        parentLabel: userData.voiceProfile?.role ?? userData.parentProfile?.role ?? 'father',
        babyAgeMonths,
      })) as AnalyzeResponse;

      // En base, c'est le backend qui écrit (jeton vérifié) — un seul écrivain.
      const analysis = toStoredAnalysis(result, result.id ?? crypto.randomUUID());
      userData.analyses.push(analysis);
      saveUserData(userData);

      navigate(`/analysis/${analysis.id}`, { state: { observation: transientObservation(result) } });
    } catch (err: unknown) {
      // INVARIANT : jamais une popup vide — les trois cartes de sécurité restent.
      setRefusal(refusalFromError(err, getUserData().parentProfile?.ageRange));
      setIsAnalyzing(false);
      setSeconds(0);
    }
  };

  const formatTimer = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (refusal) {
    return (
      <MobileLayout className="flex flex-col min-h-screen pb-8">
        <BackButton />
        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-2 mb-1">Babbl n'a pas répondu</p>
        <h1 className="font-serif text-2xl font-bold mb-3">{refusal.message}</h1>
        <p className="text-sm text-primary font-semibold leading-relaxed mb-4">{refusal.reminder}</p>
        <SafetyCardsBlock cards={refusal.cards} footer={refusal.footer} />
        {refusal.hint && <p className="text-sm text-muted-foreground mb-4">{refusal.hint}</p>}
        <button onClick={() => setRefusal(null)} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base active:scale-[0.98] transition-transform">
          Réessayer
        </button>
      </MobileLayout>
    );
  }

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
