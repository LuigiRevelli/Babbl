import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Square, Check, Play, Volume2, Loader2 } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { getUserData, saveUserData, clearUserData, ParentRole, AgeRange } from '@/lib/userData';
import { cloneVoice, deleteAccount } from '@/lib/api';
import { t } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { updateProfile } from '@/lib/supabaseData';
import { createRecorder, chunksToBlob } from '@/lib/recorder';
import { ageRangeFromBirthDate } from '@/lib/analysis';

const AGE_OPTIONS: { value: AgeRange; label: string }[] = [
  { value: '0-3', label: t('age0_3') },
  { value: '3-6', label: t('age3_6') },
  { value: '6-12', label: t('age6_12') },
  { value: '1-2', label: t('age1_2') },
  { value: '2+', label: t('age2plus') },
];

const PHRASES = [
  t('phrase1'),
  t('phrase2'),
  t('phrase3'),
  t('phrase4'),
  t('phrase5'),
];

type Step = 'profile' | 'recording' | 'result';

export default function VoiceSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const data = getUserData();

  const [step, setStep] = useState<Step>(data.voiceProfile?.audioRecorded ? 'result' : 'profile');
  const [role, setRole] = useState<ParentRole>(data.voiceProfile?.role || 'mother');
  const [userName, setUserName] = useState(data.voiceProfile?.userName || '');
  const [ageRange, setAgeRange] = useState<AgeRange>(data.voiceProfile?.ageRange || data.parentProfile?.ageRange || '0-3');
  const [birthDate, setBirthDate] = useState<string>(data.voiceProfile?.birthDate || data.parentProfile?.birthDate || '');
  const todayIso = new Date().toISOString().slice(0, 10);
  const birthDateValid = birthDate === '' || (/^\d{4}-\d{2}-\d{2}$/.test(birthDate) && birthDate <= todayIso);

  // Recording state
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [recorded, setRecorded] = useState<boolean[]>(PHRASES.map(() => false));
  const [isRecording, setIsRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [audioBlobs, setAudioBlobs] = useState<(Blob | null)[]>(PHRASES.map(() => null));

  // TTS preview
  const [playing, setPlaying] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  const handleProfileNext = () => {
    if (!userName.trim()) return;
    setStep('recording');
  };

  const startRecording = async () => {
    try {
      // Voix du PARENT (clonage) : on garde la réduction de bruit du navigateur,
      // elle aide le clone. Les contraintes brutes ne valent que pour le pleur.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = createRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = chunksToBlob(chunksRef.current, mr);
        const newBlobs = [...audioBlobs];
        newBlobs[currentPhrase] = blob;
        setAudioBlobs(newBlobs);
        const newRecorded = [...recorded];
        newRecorded[currentPhrase] = true;
        setRecorded(newRecorded);
      };
      mr.start();
      mediaRef.current = mr;
      setIsRecording(true);
    } catch {
      alert(t('micError'));
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setIsRecording(false);
  };

  const allRecorded = recorded.every(Boolean);

  const handleFinish = async () => {
    setCloning(true);
    setCloneError(null);
    try {
      // Merge all recorded blobs into a single audio file for the API
      const allBlobs = audioBlobs.filter((b): b is Blob => b !== null);
      const merged = new Blob(allBlobs, { type: allBlobs[0]?.type || 'audio/webm' });

      const { voice_id } = await cloneVoice(merged, userName || t('babblParent'));

      const current = getUserData();
      const updated = {
        ...current,
        voiceProfile: {
          role,
          userName,
          ageRange,
          birthDate: birthDate || undefined,
          audioRecorded: true,
          voiceId: voice_id,
        },
        // Le profil parent porte l'âge utilisé par l'analyse : on le garde aligné.
        parentProfile: {
          ...(current.parentProfile ?? { role, ageRange }),
          role,
          ageRange,
          birthDate: birthDate || current.parentProfile?.birthDate,
        },
      };
      saveUserData(updated);

      // Persist voice_id to Supabase profile (best-effort)
      if (user?.id && voice_id) {
        try {
          await updateProfile(user.id, {
            voice_id,
            role,
            baby_name: updated.babyName || userName,
            age_range: ageRange,
          });
        } catch (e) {
          console.warn('[supabase] Sauvegarde voice_id échouée :', e);
        }
      }

      setStep('result');
    } catch (err) {
      setCloneError(err instanceof Error ? err.message : t('voiceCloneFailed'));
    } finally {
      setCloning(false);
    }
  };

  const handlePreview = () => {
    setPlaying(true);
    const utt = new SpeechSynthesisUtterance(
      `${role === 'mother' ? t('mom') : t('dad')} est là, je suis avec toi.`
    );
    utt.lang = 'fr-FR';
    utt.rate = 0.85;
    utt.onend = () => setPlaying(false);
    speechSynthesis.speak(utt);
  };

  // Auto-cleanup
  useEffect(() => {
    return () => { if (mediaRef.current?.state === 'recording') mediaRef.current.stop(); };
  }, []);

  return (
    <MobileLayout className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => step === 'recording' ? setStep('profile') : navigate('/dashboard')}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center border border-border/50"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif text-xl font-bold">{t('customizeVoice')}</h1>
      </div>

      {/* STEP 1: Profile */}
      {step === 'profile' && (
        <div className="flex-1 flex flex-col animate-fade-in">
          <p className="text-sm text-muted-foreground mb-6">
            {t('voiceIntro')}
          </p>

          {/* Role */}
          <label className="text-xs font-semibold text-muted-foreground mb-2">{t('youAre')}</label>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {(['mother', 'father'] as ParentRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                  role === r
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border/50 text-foreground'
                }`}
              >
                {r === 'mother' ? t('momLabel') : t('dadLabel')}
              </button>
            ))}
          </div>

          {/* Name */}
          <label className="text-xs font-semibold text-muted-foreground mb-2">{t('yourName')}</label>
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={t('namePlaceholder')}
            className="w-full rounded-xl border border-border/50 bg-card px-4 py-3 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {/* Birth date — la seule source fiable de l'âge en jours */}
          <label className="text-xs font-semibold text-muted-foreground mb-2">{t('babyBirthDate')}</label>
          <input
            type="date"
            value={birthDate}
            max={todayIso}
            onChange={(e) => {
              const v = e.target.value;
              setBirthDate(v);
              if (/^\d{4}-\d{2}-\d{2}$/.test(v) && v <= todayIso) setAgeRange(ageRangeFromBirthDate(v));
            }}
            className={`w-full rounded-xl border bg-card px-4 py-3 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-primary/30 ${birthDateValid ? 'border-border/50' : 'border-destructive'}`}
          />
          <p className="text-[11px] text-muted-foreground mb-5 leading-snug">{t('babyBirthDateHint')}</p>

          {/* Age range (repli si pas de date) */}
          <label className="text-xs font-semibold text-muted-foreground mb-2">{t('babyAge')}</label>
          <div className="flex flex-wrap gap-2 mb-8">
            {AGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAgeRange(opt.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border ${
                  ageRange === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border/50 text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mt-auto">
            <button
              onClick={handleProfileNext}
              disabled={!userName.trim() || !birthDateValid}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
            >
              {t('recordPhrases')}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Recording */}
      {step === 'recording' && (
        <div className="flex-1 flex flex-col animate-fade-in">
          <p className="text-sm text-muted-foreground mb-2">
            {t('readAloud')}
          </p>

          {/* Progress */}
          <div className="flex gap-1.5 mb-6">
            {PHRASES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  recorded[i] ? 'bg-success' : i === currentPhrase ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Current phrase */}
          <div className="rounded-2xl bg-card border border-border/50 p-6 mb-6 text-center">
            <p className="text-xs text-muted-foreground mb-2">{t('sentence')} {currentPhrase + 1}/{PHRASES.length}</p>
            <p className="font-serif text-lg font-bold leading-relaxed">
              « {PHRASES[currentPhrase]} »
            </p>
          </div>

          {/* Record button */}
          <div className="flex justify-center mb-6">
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center animate-pulse shadow-lg transition-transform active:scale-95"
              >
                <Square className="w-8 h-8 text-white" fill="white" strokeWidth={0} />
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                <Mic className="w-8 h-8 text-primary-foreground" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Phrase check */}
          {recorded[currentPhrase] && (
            <div className="flex items-center justify-center gap-2 text-success text-sm font-semibold mb-4 animate-fade-in">
              <Check className="w-4 h-4" strokeWidth={2} />
              {t('recorded')}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-auto">
            {currentPhrase > 0 && (
              <button
                onClick={() => setCurrentPhrase(currentPhrase - 1)}
                className="flex-1 py-3 rounded-xl border border-border/50 text-sm font-semibold transition-all active:scale-[0.98]"
              >
                {t('previous')}
              </button>
            )}
            {currentPhrase < PHRASES.length - 1 ? (
              <button
                onClick={() => setCurrentPhrase(currentPhrase + 1)}
                disabled={!recorded[currentPhrase]}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
              >
                {t('next')}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!allRecorded || cloning}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {cloning ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('cloningVoice')}</> : t('finish')}
              </button>
            )}
          </div>

          {cloneError && (
            <p className="mt-3 text-xs text-destructive text-center">{cloneError}</p>
          )}
        </div>
      )}

      {/* STEP 3: Result */}
      {step === 'result' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mb-5">
            <Volume2 className="w-10 h-10 text-success" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2">{t('voiceReady')}</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs">
            {t('voiceReadyDesc')}
          </p>

          <button
            onClick={handlePreview}
            disabled={playing}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mb-4"
          >
            <Play className="w-5 h-5" strokeWidth={1.5} />
            {playing ? t('playing') : t('listenPreview')}
          </button>

          <button
            onClick={() => { setStep('profile'); setRecorded(PHRASES.map(() => false)); setCurrentPhrase(0); }}
            className="text-sm text-muted-foreground underline"
          >
            {t('recordAgain')}
          </button>
        </div>
      )}

      {user && step !== 'recording' && <DeleteAccount />}
    </MobileLayout>
  );
}


/** Droit à l'effacement (RGPD) : compte, analyses, profil, voix clonée. */
function DeleteAccount() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    const ok = window.confirm(
      'Supprimer votre compte ? Vos analyses, votre profil et votre voix clonée seront effacés définitivement.',
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      const voiceId = getUserData().voiceProfile?.voiceId;
      await deleteAccount(voiceId ? [voiceId] : []);
      clearUserData();
      await signOut().catch(() => undefined);
      navigate('/auth');
    } catch (e) {
      setError(e instanceof Error ? e.message : "La suppression n'a pas pu être terminée.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-10 mb-6 text-center">
      <button onClick={onDelete} disabled={busy} className="text-xs text-destructive underline disabled:opacity-60">
        {busy ? 'Suppression…' : 'Supprimer mon compte et mes données'}
      </button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
