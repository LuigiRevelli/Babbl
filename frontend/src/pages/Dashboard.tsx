import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Utensils, Baby, Flame, Clock, Plus, Droplet, Mic, LogOut, Sun } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { getUserData, getGreeting, isStreakInDanger, formatRelativeDate, saveUserData, DiaperEntry, logContext, type Analysis } from '@/lib/userData';
import { t } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { fetchAnalyses, fetchProfile } from '@/lib/supabaseData';
import { HYPOTHESIS_DISCLAIMER } from '@/lib/taxonomy';

/** Ligne `analyses` telle que Supabase la renvoie (colonnes lues ici seulement). */
type SignalRow = { key: string; label?: string; why?: string; signal?: string };
type AnalysisRow = {
  id: string;
  created_at: string;
  top_cause?: string | null;
  probabilities?: Record<string, number> | null;
  parent_summary?: string | null;
  confidence_level?: string | null;
  alert?: string | null;
  key_signals?: unknown[] | null;
  recommended_actions?: unknown[] | null;
  audio_url?: string | null;
  comfort_audio_url?: string | null;
  comfort_text?: string | null;
  soothed_by?: Analysis['soothedBy'] | null;
  soothed_at?: string | null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [data, setData] = useState(getUserData());
  const [diaperPulse, setDiaperPulse] = useState(false);
  const [mealPulse, setMealPulse] = useState(false);
  const [wakePulse, setWakePulse] = useState(false);
  const [showDiaperMenu, setShowDiaperMenu] = useState(false);

  // Hydrate from Supabase when logged in, fall back to localStorage
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const [sbAnalyses, sbProfile] = await Promise.all([
          fetchAnalyses(user.id),
          fetchProfile(user.id),
        ]);

        if (cancelled) return;

        const local = getUserData();

        // Merge Supabase analyses into local data (Supabase is source of truth when available)
        if (sbAnalyses && sbAnalyses.length > 0) {
          const mapped = (sbAnalyses as AnalysisRow[]).map(a => ({
            id: a.id,
            timestamp: a.created_at,
            topCause: a.top_cause ?? 'unknown',
            probabilities: a.probabilities ?? {},
            parent_summary: a.parent_summary ?? '',
            confidence_level: a.confidence_level ?? 'medium',
            alert: a.alert ?? 'none',
            feedback: null,
            actualCause: null,
            sosModeUsed: false,
            key_signals: a.key_signals ?? [],
            recommended_actions: a.recommended_actions ?? [],
            // Le backend persiste les hypothèses dans key_signals (objets {key,label,why}).
            hypotheses: (a.key_signals ?? []).filter((s): s is SignalRow => !!s && typeof s === 'object' && !!(s as SignalRow).key).map(s => ({
              key: s.key, label: s.label ?? '', why: s.why ?? s.signal ?? '', source: 'context' as const,
              disclaimer: HYPOTHESIS_DISCLAIMER,
            })),
            safety_cards: [],
            audio_url: a.audio_url,
            comfort_audio_url: a.comfort_audio_url,
            comfort_text: a.comfort_text,
            soothedBy: a.soothed_by ?? undefined,
            soothedAt: a.soothed_at ?? undefined,
          }));
          local.analyses = mapped;
        }

        // Merge profile data
        if (sbProfile) {
          if (sbProfile.baby_name) local.babyName = sbProfile.baby_name;
          if (sbProfile.role || sbProfile.age_range) {
            local.parentProfile = {
              role: sbProfile.role ?? local.parentProfile?.role ?? 'father',
              babyName: sbProfile.baby_name ?? local.parentProfile?.babyName,
              ageRange: sbProfile.age_range ?? local.parentProfile?.ageRange ?? '0-3',
            };
          }
        }

        saveUserData(local);
        setData({ ...local });
      } catch (e) {
        console.warn('[supabase] Chargement échoué, utilisation de localStorage :', e);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const greeting = getGreeting();
  const streakDanger = isStreakInDanger(data);

  const lastCry = data.analyses.length > 0
    ? formatRelativeDate(data.analyses[data.analyses.length - 1].timestamp)
    : null;

  const handleLogMeal = () => {
    const updated = logContext(data, 'meal');
    saveUserData(updated);
    setData(updated);
    setMealPulse(true);
    setTimeout(() => setMealPulse(false), 600);
  };

  const handleLogWake = () => {
    const updated = logContext(data, 'wake');
    saveUserData(updated);
    setData(updated);
    setWakePulse(true);
    setTimeout(() => setWakePulse(false), 600);
  };

  const handleLogDiaper = (type: 'pee' | 'stool') => {
    const logged = logContext(data, 'diaper');
    const entry: DiaperEntry = { timestamp: logged.lastDiaper!, type };
    const updated = { ...logged, diaperHistory: [...data.diaperHistory, entry] };
    saveUserData(updated);
    setData(updated);
    setShowDiaperMenu(false);
    setDiaperPulse(true);
    setTimeout(() => setDiaperPulse(false), 600);
  };

  const formatTime = (iso?: string) => {
    if (!iso) return t('notSet');
    return formatRelativeDate(iso);
  };

  return (
    <MobileLayout className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="mb-5 animate-fade-in flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting.text}</p>
          <h1 className="font-serif text-2xl font-bold tracking-tight">{t('dashboardTitle')}</h1>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
          title="Se déconnecter"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>

      {/* CTA Card */}
      <button
        type="button"
        onClick={() => navigate('/record')}
        className="relative block w-full text-left rounded-2xl p-6 mb-5 overflow-hidden animate-scale-in cursor-pointer group"
        style={{
          background: 'linear-gradient(135deg, hsl(0 100% 74%), hsl(0 85% 62%))',
          animationFillMode: 'backwards',
        }}
      >
        <span className="absolute top-3 right-3 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
          <Droplets className="w-6 h-6 text-primary-foreground" strokeWidth={1.5} />
        </span>
        <span className="block text-primary-foreground/80 text-sm mb-1">{t('listenAnalyze')}</span>
        <span className="block font-serif text-primary-foreground text-xl font-bold mb-3 transition-transform duration-200 group-active:translate-x-0.5">{t('myBabyCrying')}</span>
        {/* Pas de compteur d'enregistrements : « il pleure trop » est le
            facteur de risque mesuré du bébé secoué (ROADMAP-BACKEND.md). */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </button>

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
            <Clock className="w-5 h-5 text-primary-ink" strokeWidth={1.5} />
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">{t('lastCry')}</p>
          <p className="text-sm font-bold leading-tight">{lastCry || t('none')}</p>
        </div>

        <div
          className="rounded-2xl p-4 bg-card animate-fade-in relative overflow-hidden border border-border/50 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{ animationDelay: '0.15s', animationFillMode: 'backwards' }}
        >
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <Flame className="w-5 h-5 text-destructive animate-flame" strokeWidth={1.5} />
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">{t('streak')}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-serif">{data.streak.current}</span>
            <span className="text-xs text-muted-foreground">{data.streak.current !== 1 ? t('days') : t('day')}</span>
          </div>
          {streakDanger && (
            <p className="text-[10px] animate-pulse-orange mt-1">{t('keepItAlive')}</p>
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
            <p className="text-xs text-muted-foreground">{t('lastMeal')}</p>
            <p className="text-sm font-semibold">{formatTime(data.lastMeal)}</p>
          </div>
        </div>
        <button
          onClick={handleLogMeal}
          aria-label="Noter une tétée maintenant"
          className="w-11 h-11 rounded-full bg-muted flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <Plus className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
        </button>
      </div>

      {/* Réveil — alimente l'hypothèse « fatigue » à partir de la saisie du parent */}
      <div
        className={`w-full rounded-2xl p-4 mb-3 bg-card/80 backdrop-blur-md border border-border/50 flex items-center justify-between animate-fade-in transition-all duration-300 ${wakePulse ? 'ring-2 ring-primary/50' : ''}`}
        style={{ animationDelay: '0.22s', animationFillMode: 'backwards' }}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center transition-transform duration-300 ${wakePulse ? 'scale-125' : ''}`}>
            <Sun className="w-5 h-5 text-primary-ink" strokeWidth={1.5} />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">{t('lastWake')}</p>
            <p className="text-sm font-semibold">{formatTime(data.lastWake)}</p>
          </div>
        </div>
        <button
          onClick={handleLogWake}
          aria-label="Noter un réveil maintenant"
          className="w-11 h-11 rounded-full bg-muted flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
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
            <Baby className="w-5 h-5 text-primary-ink" strokeWidth={1.5} />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">{t('diaperChange')}</p>
            <p className="text-sm font-semibold">{formatTime(data.lastDiaper)}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDiaperMenu(true);
          }}
          aria-label="Noter un change"
          className="w-11 h-11 rounded-full bg-muted flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95"
        >
          <Plus className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
        </button>
      </div>

      {/* Feature card */}
      <div className="grid grid-cols-1 gap-3 mb-6">
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
            <Mic className="w-5 h-5 text-primary-ink" strokeWidth={1.5} />
          </div>
          <p className="text-xs text-muted-foreground mb-0.5">{t('cloneMyVoice')}</p>
          <p className="text-sm font-bold leading-tight">{t('customize')}</p>
        </div>
      </div>

      <button
        onClick={() => navigate('/report')}
        className="w-full mt-4 py-3 rounded-2xl border border-border text-sm font-semibold"
      >
        Résumé pour le médecin (7 jours)
      </button>
      <button
        onClick={() => navigate('/quand-appeler')}
        className="w-full mt-3 py-3 rounded-2xl text-sm font-semibold underline text-primary-ink"
      >
        Quand appeler le 15 ?
      </button>

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
              <h3 className="font-serif text-lg font-bold mb-4 text-center">{t('diaperType')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleLogDiaper('pee')}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-accent/50 hover:bg-accent transition-colors duration-150 active:scale-95"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                    <Droplet className="w-7 h-7 text-blue-400" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-semibold">{t('pee')}</span>
                </button>
                <button
                  onClick={() => handleLogDiaper('stool')}
                  className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-accent/50 hover:bg-accent transition-colors duration-150 active:scale-95"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-2xl">💩</span>
                  </div>
                  <span className="text-sm font-semibold">{t('stool')}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </MobileLayout>
  );
}
