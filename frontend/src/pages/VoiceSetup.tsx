import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Square, Check, Play, Volume2, Loader2 } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { getUserData, saveUserData, ParentRole, AgeRange } from '@/lib/userData';
import { cloneVoice } from '@/lib/api';

const AGE_OPTIONS: { value: AgeRange; label: string }[] = [
  { value: '0-3', label: '0-3 months' },
  { value: '3-6', label: '3-6 months' },
  { value: '6-12', label: '6-12 months' },
  { value: '1-2', label: '1-2 years' },
  { value: '2+', label: '2+ years' },
];

const PHRASES = [
  "Everything is okay, I'm here with you.",
  "Shh... sleep well my baby, I'm watching over you.",
  "You are safe, I love you so much.",
  "Calm down my angel, everything will be okay.",
  "Good night little treasure, sweet dreams.",
];

type Step = 'profile' | 'recording' | 'result';

export default function VoiceSetup() {
  const navigate = useNavigate();
  const data = getUserData();

  const [step, setStep] = useState<Step>(data.voiceProfile?.audioRecorded ? 'result' : 'profile');
  const [role, setRole] = useState<ParentRole>(data.voiceProfile?.role || 'mother');
  const [userName, setUserName] = useState(data.voiceProfile?.userName || '');
  const [ageRange, setAgeRange] = useState<AgeRange>(data.voiceProfile?.ageRange || '0-3');

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
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
      alert("Unable to access the microphone.");
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
      const merged = new Blob(allBlobs, { type: 'audio/webm' });

      const { voice_id } = await cloneVoice(merged, userName || 'BabyCare parent');

      const updated = {
        ...getUserData(),
        voiceProfile: {
          role,
          userName,
          ageRange,
          audioRecorded: true,
          voiceId: voice_id,
        },
      };
      saveUserData(updated);
      setStep('result');
    } catch (err: any) {
      setCloneError(err?.message ?? 'Voice cloning failed. Please try again.');
    } finally {
      setCloning(false);
    }
  };

  const handlePreview = () => {
    // TODO: Replace with cloned voice TTS API call
    // POST /api/tts-preview { voiceId, text: PHRASES[0] }
    setPlaying(true);
    const utt = new SpeechSynthesisUtterance(
      `${role === 'mother' ? 'Mom' : 'Dad'} is here, everything is okay baby.`
    );
    utt.lang = 'en-US';
    utt.rate = 0.85;
    utt.onend = () => setPlaying(false);
    speechSynthesis.speak(utt);
  };

  // Auto-cleanup
  useEffect(() => {
    return () => { mediaRef.current?.state === 'recording' && mediaRef.current.stop(); };
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
        <h1 className="font-serif text-xl font-bold">Customize voice</h1>
      </div>

      {/* STEP 1: Profile */}
      {step === 'profile' && (
        <div className="flex-1 flex flex-col animate-fade-in">
          <p className="text-sm text-muted-foreground mb-6">
            To create a voice that sounds like you, we need a few details.
          </p>

          {/* Role */}
          <label className="text-xs font-semibold text-muted-foreground mb-2">You are</label>
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
                {r === 'mother' ? '👩 Mom' : '👨 Dad'}
              </button>
            ))}
          </div>

          {/* Name */}
          <label className="text-xs font-semibold text-muted-foreground mb-2">Your name</label>
          <input
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="e.g. Marie"
            className="w-full rounded-xl border border-border/50 bg-card px-4 py-3 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {/* Age */}
          <label className="text-xs font-semibold text-muted-foreground mb-2">Baby age</label>
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
              disabled={!userName.trim()}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
            >
              Record a few phrases
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Recording */}
      {step === 'recording' && (
        <div className="flex-1 flex flex-col animate-fade-in">
          <p className="text-sm text-muted-foreground mb-2">
            Read each sentence out loud. Speak naturally, as if you were talking to your baby.
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
            <p className="text-xs text-muted-foreground mb-2">Sentence {currentPhrase + 1}/{PHRASES.length}</p>
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
              Recorded!
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-auto">
            {currentPhrase > 0 && (
              <button
                onClick={() => setCurrentPhrase(currentPhrase - 1)}
                className="flex-1 py-3 rounded-xl border border-border/50 text-sm font-semibold transition-all active:scale-[0.98]"
              >
                Previous
              </button>
            )}
            {currentPhrase < PHRASES.length - 1 ? (
              <button
                onClick={() => setCurrentPhrase(currentPhrase + 1)}
                disabled={!recorded[currentPhrase]}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!allRecorded || cloning}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {cloning ? <><Loader2 className="w-4 h-4 animate-spin" /> Cloning voice...</> : 'Finish ✨'}
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
          <h2 className="font-serif text-2xl font-bold mb-2">Your voice is ready!</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs">
            In night mode, BabyCare can now use a voice like yours to comfort your baby.
          </p>

          <button
            onClick={handlePreview}
            disabled={playing}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mb-4"
          >
            <Play className="w-5 h-5" strokeWidth={1.5} />
            {playing ? 'Playing...' : 'Listen to a preview'}
          </button>

          <button
            onClick={() => { setStep('profile'); setRecorded(PHRASES.map(() => false)); setCurrentPhrase(0); }}
            className="text-sm text-muted-foreground underline"
          >
            Record again
          </button>
        </div>
      )}
    </MobileLayout>
  );
}
