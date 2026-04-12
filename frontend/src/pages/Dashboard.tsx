import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Utensils, Baby, Flame, Clock, Plus, Droplet, Moon, Mic } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import {
  getUserData, getGreeting, isStreakInDanger, formatRelativeDate, saveUserData,
  DiaperEntry,
} from '@/lib/userData';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(getUserData());
  const [diaperPulse, setDiaperPulse] = useState(false);
  const [mealPulse, setMealPulse] = useState(false);
  const [showDiaperMenu, setShowDiaperMenu] = useState(false);

  const greeting = getGreeting();
  const streakDanger = isStreakInDanger(data);

  const lastCry = data.analyses.length > 0
    ? formatRelativeDate(data.analyses[data.analyses.length - 1].timestamp)
    : null;

  const totalCries = data.analyses.length;

  const handleLogMeal = () => {
    const now = new Date().toISOString();
    const updated = { ...data, lastMeal: now };
    saveUserData(updated);
    setData(updated);
    setMealPulse(true);
    setTimeout(() => setMealPulse(false), 600);
  };

  const handleLogDiaper = (type: 'pee' | 'stool') => {
    const now = new Date().toISOString();
    const entry: DiaperEntry = { timestamp: now, type };
    const updated = {
      ...data,
      lastDiaper: now,
      diaperHistory: [...data.diaperHistory, entry],
    };
    saveUserData(updated);
    setData(updated);
    setShowDiaperMenu(false);
    setDiaperPulse(true);
    setTimeout(() => setDiaperPulse(false), 600);
  };

  const formatTime = (iso?: string) => {
    if (!iso) return 'Not set';
    return formatRelativeDate(iso);
  };

  return (
    <MobileLayout className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="mb-5 animate-fade-in">
        <p className="text-sm text-muted-foreground">{greeting.text}</p>
        <h1 className="font-serif text-2xl font-bold tracking-tight">Babycare</h1>
      </div>

      {/* CTA Card */}
      <div
        onClick={() => navigate('/record')}
        className="relative rounded-2xl p-6 mb-5 overflow-hidden animate-scale-in cursor-pointer group"
        style={{
          background: 'linear-gradient(135deg, hsl(0 100% 74%), hsl(0 85% 62%))',
          animationFillMode: 'backwards',
        }}
      >
        <div className="absolute top-3 right-3 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
          <Droplets className="w-6 h-6 text-white" strokeWidth={1.5} />
        </div>
        <p className="text-white/80 text-sm mb-1">Listen & analyze</p>
        <h2 className="font-serif text-white text-xl font-bold mb-3 transition-transform duration-200 group-active:translate-x-0.5">My baby is crying</h2>
        <div className="flex items-baseline gap-1">
          <span className="text-white text-3xl font-bold font-serif">{totalCries}</span>
          <span className="text-white/70 text-sm">recorded episode{totalCries !== 1 ? 's' : ''}</span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div
          onClick={() => navigate('/history')}
          className="rounded-2xl p-4 animate-fade-in relative overflow-hidden transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={{
            background: 'linear-gradient(145deg, hsl(0 100% 92%), hsl(40 50% 92%))',
            animationDelay: '0.1s',
            animationFillMode: 'backwards',
          }}
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">Last cry</p>
          <p className="text-sm font-bold leading-tight">{lastCry || 'None'}</p>
        </div>

        <div
          className="rounded-2xl p-4 bg-card animate-fade-in relative overflow-hidden border border-border/50 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{ animationDelay: '0.15s', animationFillMode: 'backwards' }}
        >
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <Flame className="w-5 h-5 text-destructive animate-flame" strokeWidth={1.5} />
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">Streak</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-serif">{data.streak.current}</span>
            <span className="text-xs text-muted-foreground">day{data.streak.current !== 1 ? 's' : ''}</span>
          </div>
          {streakDanger && (
            <p className="text-[10px] animate-pulse-orange mt-1">Keep it alive!</p>
          )}
        </div>
      </div>

      {/* Meal with quick-add button */}
      <div
        className={`w-full rounded-2xl p-4 mb-3 bg-card/80 backdrop-blur-md border border-border/50 flex items-center justify-between animate-fade-in transition-all duration-300 ${mealPulse ? 'ring-2 ring-success/50' : ''}`}
        style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-success/15 flex items-center justify-center transition-transform duration-300 ${mealPulse ? 'scale-125' : ''}`}>
            <Utensils className="w-5 h-5 text-success" strokeWidth={1.5} />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Last meal</p>
            <p className="text-sm font-semibold">{formatTime(data.lastMeal)}</p>
          </div>
        </div>
        <button
          onClick={handleLogMeal}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <Plus className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
        </button>
      </div>

      {/* Diaper */}
      <div
        onClick={() => navigate('/history?tab=diaper')}
        className={`w-full rounded-2xl p-4 mb-6 bg-card/80 backdrop-blur-md border border-border/50 flex items-center justify-between animate-fade-in transition-all duration-300 hover:shadow-md hover:border-primary/30 active:scale-[0.98] cursor-pointer ${diaperPulse ? 'ring-2 ring-primary/50' : ''}`}
        style={{ animationDelay: '0.25s', animationFillMode: 'backwards' }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center transition-transform duration-300 ${diaperPulse ? 'scale-125' : ''}`}>
            <Baby className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Diaper change</p>
            <p className="text-sm font-semibold">{formatTime(data.lastDiaper)}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDiaperMenu(true);
          }}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <Plus className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
        </button>
      </div>

      {/* New feature cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div
          onClick={() => navigate('/night-mode')}
          className="rounded-2xl p-4 animate-fade-in cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] border border-border/50"
          style={{
            background: 'linear-gradient(145deg, hsl(230 25% 18%), hsl(260 20% 22%))',
            animationDelay: '0.3s',
            animationFillMode: 'backwards',
          }}
        >
          <div className="w-10 h-10 rounded-full bg-yellow-300/20 flex items-center justify-center mb-3">
            <Moon className="w-5 h-5 text-yellow-300" strokeWidth={1.5} />
          </div>
          <p className="text-xs text-white/60 mb-0.5">Baby monitor</p>
          <p className="text-sm font-bold text-white leading-tight">Night mode</p>
        </div>

        <div
          onClick={() => navigate('/voice-setup')}
          className="rounded-2xl p-4 animate-fade-in cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(145deg, hsl(0 100% 92%), hsl(40 50% 92%))',
            animationDelay: '0.35s',
            animationFillMode: 'backwards',
          }}
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
            <Mic className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">Clone my voice</p>
          <p className="text-sm font-bold leading-tight">Customize</p>
        </div>
      </div>

      {showDiaperMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200"
            onClick={() => setShowDiaperMenu(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
            <div className="max-w-[480px] mx-auto bg-card rounded-t-3xl p-6 pb-10 shadow-2xl border-t border-border/50">
              <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-5" />
              <h3 className="font-serif text-lg font-bold mb-4 text-center">Diaper type</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleLogDiaper('pee')}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-accent/50 hover:bg-accent transition-colors duration-150 active:scale-95"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                    <Droplet className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-semibold">Pee</span>
                </button>
                <button
                  onClick={() => handleLogDiaper('stool')}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-accent/50 hover:bg-accent transition-colors duration-150 active:scale-95"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-2xl">💩</span>
                  </div>
                  <span className="text-sm font-semibold">Stool</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </MobileLayout>
  );
}
