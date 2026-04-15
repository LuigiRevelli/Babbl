import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Volume2, Home, ThumbsUp, ThumbsDown, Heart, Phone, MapPin, Stethoscope, AlertTriangle } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import BabblReport from '@/components/BabblReport';
import { getUserData, saveUserData } from '@/lib/userData';
import { apiUrl } from '@/lib/api';
import { t, translateCause } from '@/lib/i18n';

export default function AnalysisResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const data = getUserData();
  const analysis = data.analyses.find(a => a.id === id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComfortPlaying, setIsComfortPlaying] = useState(false);
  const [feedback, setFeedback] = useState(analysis?.feedback ?? null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!analysis) {
    return (
      <MobileLayout className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t('analysisNotFound')}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary font-semibold">
          {t('back')}
        </button>
      </MobileLayout>
    );
  }

  const confidenceLabel =
    analysis.confidence_level === 'high' ? t('confidenceHigh')
    : analysis.confidence_level === 'medium' ? t('confidenceMedium')
    : t('confidenceLow');

  const probEntries = Object.entries(analysis.probabilities).sort(([, a], [, b]) => b - a);
  const alertLevel = analysis.alert ?? 'none';

  const playAudio = (url: string, onEnd: () => void) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(apiUrl(url));
    audioRef.current = audio;
    audio.onended = onEnd;
    audio.onerror = onEnd;
    audio.play().catch(onEnd);
  };

  const handleTTS = async () => {
    setIsPlaying(true);
    if (analysis.audio_url) {
      playAudio(analysis.audio_url, () => setIsPlaying(false));
    } else {
      const utterance = new SpeechSynthesisUtterance(analysis.parent_summary);
      utterance.lang = 'fr-FR';
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
    }
  };

  const handleComfort = () => {
    if (!analysis.comfort_audio_url) return;
    setIsComfortPlaying(true);
    playAudio(analysis.comfort_audio_url, () => setIsComfortPlaying(false));
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedback(type);
    const updated = getUserData();
    const idx = updated.analyses.findIndex(a => a.id === id);
    if (idx !== -1) {
      updated.analyses[idx].feedback = type;
      saveUserData(updated);
    }
  };

  return (
    <MobileLayout className="flex flex-col min-h-screen pb-8">
      {/* Header */}
      <div className="text-center mb-6 pt-2 animate-fade-in">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t('result')}</p>
        <h1 className="font-serif text-2xl font-bold">{t('accordingToBabbl')}</h1>
      </div>

      {/* ═══ ALERT BANNER ═══ */}
      {alertLevel === 'monitor' && (
        <div
          className="rounded-2xl p-4 mb-4 animate-fade-in border-2"
          style={{ background: 'hsl(45 100% 94%)', borderColor: 'hsl(45 90% 60%)' }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" style={{ color: 'hsl(45 90% 40%)' }} />
            <div>
              <p className="font-bold text-sm" style={{ color: 'hsl(45 90% 30%)' }}>{t('alertMonitorTitle')}</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'hsl(45 50% 30%)' }}>{t('alertMonitorDesc')}</p>
            </div>
          </div>
        </div>
      )}

      {alertLevel === 'consult_recommended' && (
        <div
          className="rounded-2xl p-4 mb-4 animate-fade-in border-2"
          style={{ background: 'hsl(25 100% 94%)', borderColor: 'hsl(25 90% 55%)' }}
        >
          <div className="flex items-start gap-3">
            <Stethoscope className="w-6 h-6 shrink-0 mt-0.5" style={{ color: 'hsl(25 90% 40%)' }} />
            <div>
              <p className="font-bold text-sm" style={{ color: 'hsl(25 90% 30%)' }}>{t('alertConsultTitle')}</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'hsl(25 50% 30%)' }}>{t('alertConsultDesc')}</p>
            </div>
          </div>
          <a
            href="https://www.doctolib.fr/pediatre"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-white transition-all active:scale-[0.98]"
            style={{ background: 'hsl(25 90% 50%)' }}
          >
            <Stethoscope className="w-4 h-4" />
            {t('alertFindPediatrician')}
          </a>
        </div>
      )}

      {alertLevel === 'urgent' && (
        <div
          className="rounded-2xl p-4 mb-4 animate-fade-in border-2"
          style={{ background: 'hsl(0 100% 95%)', borderColor: 'hsl(0 80% 50%)' }}
        >
          <div className="flex items-start gap-3">
            <Phone className="w-6 h-6 shrink-0 mt-0.5 text-destructive animate-pulse" />
            <div>
              <p className="font-bold text-sm text-destructive">{t('alertUrgentTitle')}</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'hsl(0 50% 30%)' }}>{t('alertUrgentDesc')}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <a
              href="tel:15"
              className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm text-white bg-destructive transition-all active:scale-[0.98]"
            >
              <Phone className="w-4 h-4" />
              {t('alertCall15')}
            </a>
            <a
              href="https://maps.google.com/maps?q=urgences+p%C3%A9diatriques+pr%C3%A8s+de+moi"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm border-2 border-destructive text-destructive transition-all active:scale-[0.98]"
            >
              <MapPin className="w-4 h-4" />
              {t('alertFindER')}
            </a>
          </div>
        </div>
      )}

      {/* Main cause */}
      <div
        className="rounded-2xl p-6 mb-4 text-center animate-scale-in"
        style={{ background: 'linear-gradient(135deg, hsl(0 100% 74%), hsl(0 85% 62%))' }}
      >
        <p className="text-white/70 text-sm mb-1">{t('mainCause')}</p>
        <p className="text-white text-3xl font-serif font-bold mb-2">{translateCause(analysis.topCause)}</p>
        <p className={`text-sm font-semibold ${analysis.confidence_level === 'high' ? 'text-white' : 'text-white/70'}`}>
          {t('confidence')} : {confidenceLabel}
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-2xl bg-card border border-border/50 p-4 mb-4 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
        <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">{t('summary')}</p>
        <p className="text-sm leading-relaxed">{analysis.parent_summary}</p>
      </div>

      {/* Probabilities */}
      <div className="rounded-2xl bg-card border border-border/50 p-4 mb-4 animate-fade-in" style={{ animationDelay: '0.15s', animationFillMode: 'backwards' }}>
        <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">{t('probabilities')}</p>
        <div className="space-y-2">
          {probEntries.map(([cause, prob]) => (
            <div key={cause} className="flex items-center gap-3">
              <span className="text-sm w-24 truncate">{translateCause(cause)}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.round(prob * 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(prob * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended actions */}
      {analysis.recommended_actions && analysis.recommended_actions.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-4 animate-fade-in"
          style={{
            animationDelay: '0.2s',
            animationFillMode: 'backwards',
            background: 'linear-gradient(145deg, hsl(0 100% 92%), hsl(40 50% 92%))',
            border: '2px solid hsl(0 100% 74% / 0.2)',
          }}
        >
          <p className="text-xs text-primary font-bold uppercase tracking-wider mb-4">{t('recommendedActions')}</p>
          <ul className="space-y-3">
            {analysis.recommended_actions.map((action: string, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-primary text-sm font-bold">{i + 1}</span>
                </span>
                <span className="text-sm font-semibold leading-snug pt-1">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Listen button */}
      <button
        onClick={handleTTS}
        disabled={isPlaying}
        className="w-full py-4 rounded-2xl bg-card border border-border/50 flex items-center justify-center gap-3 mb-4 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 animate-fade-in"
        style={{ animationDelay: '0.25s', animationFillMode: 'backwards' }}
      >
        <Volume2 className={`w-5 h-5 text-primary ${isPlaying ? 'animate-pulse' : ''}`} />
        <span className="font-semibold text-sm">{isPlaying ? t('playing') : t('listenSummary')}</span>
      </button>

      {/* Comfort baby with cloned voice */}
      {analysis.comfort_audio_url && (
        <button
          onClick={handleComfort}
          disabled={isComfortPlaying}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 mb-4 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 animate-fade-in"
          style={{
            animationDelay: '0.28s',
            animationFillMode: 'backwards',
            background: 'linear-gradient(135deg, hsl(0 100% 92%), hsl(340 60% 90%))',
            border: '2px solid hsl(0 100% 74% / 0.2)',
          }}
        >
          <Heart className={`w-5 h-5 text-primary ${isComfortPlaying ? 'animate-pulse' : ''}`} />
          <span className="font-semibold text-sm text-primary">
            {isComfortPlaying ? t('playing') : t('comfortBaby')}
          </span>
        </button>
      )}

      {/* Babbl Report — share with doctor */}
      {alertLevel !== 'none' && (
        <BabblReport analysis={analysis as any} />
      )}

      {/* Feedback */}
      <div className="rounded-2xl bg-card border border-border/50 p-4 mb-6 mt-4 text-center animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
        <p className="text-xs text-muted-foreground mb-3">{t('feedbackQuestion')}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleFeedback('positive')}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              feedback === 'positive' ? 'bg-success/20 scale-110' : 'bg-muted hover:bg-success/10'
            }`}
          >
            <ThumbsUp className={`w-5 h-5 ${feedback === 'positive' ? 'text-success' : 'text-muted-foreground'}`} />
          </button>
          <button
            onClick={() => handleFeedback('negative')}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
              feedback === 'negative' ? 'bg-destructive/20 scale-110' : 'bg-muted hover:bg-destructive/10'
            }`}
          >
            <ThumbsDown className={`w-5 h-5 ${feedback === 'negative' ? 'text-destructive' : 'text-muted-foreground'}`} />
          </button>
        </div>
      </div>

      {/* Back to dashboard */}
      <button
        onClick={() => navigate('/dashboard')}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Home className="w-5 h-5" /> {t('backToDashboard')}
      </button>
    </MobileLayout>
  );
}
