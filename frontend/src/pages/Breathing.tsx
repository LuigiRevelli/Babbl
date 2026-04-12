import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import { getUserData, saveUserData, addXp, checkNewBadges, updateStreak } from '@/lib/userData';


const PHASES = [
  { label: 'Inhale', duration: 4, scale: 1.6, color: 'text-foreground' },
  { label: 'Hold', duration: 4, scale: 1.6, color: 'text-muted-foreground' },
  { label: 'Exhale', duration: 6, scale: 1.0, color: 'text-primary' },
  { label: 'Pause', duration: 2, scale: 1.0, color: 'text-muted-foreground' },
];

const TOTAL_DURATION = 60;

export default function Breathing() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_DURATION);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const [badgeToShow, setBadgeToShow] = useState<string | null>(null);
  const intervalRef = useRef<number>(0);

  const currentPhase = PHASES[phaseIdx];

  const currentScale = (() => {
    if (!started || done) return 1;
    const phase = PHASES[phaseIdx];
    if (phaseIdx === 0) {
      // Inspirez: scale 1.0 → 1.6
      return 1 + (0.6 * phaseTime / phase.duration);
    } else if (phaseIdx === 1) {
      return 1.6;
    } else if (phaseIdx === 2) {
      // Expirez: scale 1.6 → 1.0
      return 1.6 - (0.6 * phaseTime / phase.duration);
    }
    return 1;
  })();

  useEffect(() => {
    if (!started || done) return;

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          handleComplete();
          return 0;
        }
        return s - 1;
      });

      setPhaseTime(pt => {
        const newPt = pt + 1;
        if (newPt >= PHASES[phaseIdx].duration) {
          setPhaseIdx(pi => (pi + 1) % PHASES.length);
          return 0;
        }
        return newPt;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [started, done, phaseIdx]);

  const handleComplete = useCallback(() => {
    setDone(true);
    const data = getUserData();
    data.breathingSessions += 1;
    addXp(data, 5);
    updateStreak(data);
    const newBadges = checkNewBadges(data);
    saveUserData(data);

    if (newBadges.length > 0) {
      setTimeout(() => setBadgeToShow(newBadges[0]), 500);
    }
  }, []);

  const progress = ((TOTAL_DURATION - secondsLeft) / TOTAL_DURATION) * 100;

  if (done) {
    return (
      <>
        <MobileLayout className="flex flex-col items-center justify-center min-h-screen text-center">
          <span className="text-5xl animate-badge-bounce">🌸</span>
          <h1 className="font-serif text-2xl font-bold mt-4">Well done</h1>
          <p className="text-muted-foreground mt-2">You just took care of yourself. That matters.</p>
          <p className="text-sm text-primary font-semibold mt-2">+5 XP</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full h-14 bg-primary text-primary-foreground rounded-pill font-semibold text-lg mt-8 hover:bg-primary-strong transition-colors"
          >
            Back to dashboard
          </button>
        </MobileLayout>
        
      </>
    );
  }

  return (
    <MobileLayout className="flex flex-col items-center justify-center min-h-screen text-center relative">
      {/* Close button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 right-4 w-8 h-8 rounded-full text-muted-foreground hover:text-foreground text-lg"
      >
        ✕
      </button>

      <p className="text-sm text-muted-foreground mb-8">Breathing exercise</p>

      {!started ? (
        <>
          <div
            className="w-[140px] h-[140px] rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary-soft)), hsl(var(--primary)))',
              boxShadow: '0 0 40px rgba(255,120,120,0.3)',
            }}
          />
          <h2 className="font-serif text-2xl font-bold mt-6">Ready?</h2>
          <p className="text-muted-foreground mt-2">1 minute to recenter yourself</p>
          <button
            onClick={() => setStarted(true)}
            className="mt-8 h-14 px-8 bg-primary text-primary-foreground rounded-pill font-semibold text-lg hover:bg-primary-strong transition-colors"
          >
            Start
          </button>
        </>
      ) : (
        <>
          <h2 className={`font-serif text-2xl font-bold mb-8 transition-colors ${currentPhase.color}`}>
            {currentPhase.label}
          </h2>

          <div
            className="w-[140px] h-[140px] rounded-full transition-transform duration-1000"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary-soft)), hsl(var(--primary)))',
              boxShadow: '0 0 40px rgba(255,120,120,0.3)',
              transform: `scale(${currentScale})`,
            }}
          />

          <p className="text-lg font-medium mt-8">{secondsLeft}s left</p>

          {/* Progress bar */}
          <div className="w-full h-1 bg-primary-soft rounded-full mt-6 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
    </MobileLayout>
  );
}
