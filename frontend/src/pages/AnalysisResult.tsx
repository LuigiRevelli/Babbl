/**
 * Écran de résultat (route legacy /legacy/analysis/:id).
 *
 * Deux couches, rien d'autre (SYMPTOMS.md) : l'observation sonore en texte,
 * transitoire (état de navigation, jamais stockée), puis les hypothèses
 * d'après ce que le parent a saisi. Aucune barre, aucun pourcentage, aucun
 * niveau d'alerte. Les trois cartes de sécurité sont toujours affichées.
 */

import { useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Volume2, Home, ThumbsUp, ThumbsDown, Heart, Phone } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import BabblReport from '@/components/BabblReport';
import { getUserData, saveUserData } from '@/lib/userData';
import { apiUrl } from '@/lib/api';
import { t } from '@/lib/i18n';
import type { SafetyCard, TransientObservation } from '@/lib/analysis';
import { HYPOTHESIS_DISCLAIMER, INTENSITY_DISCLAIMER, SAFETY_CARDS, SAFETY_FOOTER, hypothesisFr } from '@/lib/taxonomy';

const LEVEL_WORD: Record<string, string> = {
  intense: 'Pleur intense',
  modere: 'Pleur modéré',
  faible: 'Pleur faible',
};

export default function AnalysisResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const observation = (location.state as { observation?: TransientObservation } | null)?.observation;
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

  const hypotheses = analysis.hypotheses ?? [];
  const cards: SafetyCard[] =
    analysis.safety_cards && analysis.safety_cards.length > 0
      ? analysis.safety_cards
      : (Object.keys(SAFETY_CARDS) as Array<keyof typeof SAFETY_CARDS>).map(key => ({ key, ...SAFETY_CARDS[key], emphasized: false }));
  const footer = analysis.safety_footer ?? SAFETY_FOOTER;
  const actions: string[] = (analysis.recommended_actions ?? [])
    .map((a: any) => (typeof a === 'string' ? a : a?.action ?? ''))
    .filter(Boolean);

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

      {/* Couche 1 — ce que Babbl a entendu (transitoire) */}
      <div className="rounded-2xl bg-card border border-border/50 p-5 mb-4 animate-scale-in">
        <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">{t('observationTitle')}</p>
        {observation ? (
          <>
            <p className="font-serif text-2xl font-bold text-primary mb-2">{LEVEL_WORD[observation.intensity.level] ?? 'Pleur'}</p>
            <p className="text-sm leading-relaxed">{observation.intensity.observation}</p>
            <p className="text-xs text-muted-foreground mt-2 italic leading-relaxed">{observation.intensity.disclaimer || INTENSITY_DISCLAIMER}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground italic leading-relaxed">{t('observationNotKept')}</p>
        )}
      </div>

      {/* Couche 2 — d'après ce que vous avez saisi */}
      <div className="rounded-2xl bg-card border border-border/50 p-5 mb-4 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
        <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">{t('hypothesesTitle')}</p>
        {hypotheses.length === 0 ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{t('hypothesesEmpty')}</p>
        ) : (
          <ol className="space-y-3">
            {hypotheses.map((h, i) => (
              <li key={h.key} className="flex items-start gap-3">
                <span className="mt-0.5 w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-primary text-sm font-bold">{i + 1}</span>
                </span>
                <div>
                  <p className={`font-serif ${i === 0 ? 'text-xl font-bold' : 'text-base font-semibold text-muted-foreground'}`}>
                    {h.label || hypothesisFr(h.key)}
                  </p>
                  <p className="text-sm text-muted-foreground leading-snug">{h.why}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="text-xs text-muted-foreground mt-3 italic">{HYPOTHESIS_DISCLAIMER}</p>
      </div>

      {/* Résumé */}
      {analysis.parent_summary && (
        <div className="rounded-2xl bg-card border border-border/50 p-4 mb-4 animate-fade-in" style={{ animationDelay: '0.15s', animationFillMode: 'backwards' }}>
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">{t('summary')}</p>
          <p className="text-sm leading-relaxed">{analysis.parent_summary}</p>
        </div>
      )}

      {/* Gestes proposés */}
      {actions.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-4 animate-fade-in"
          style={{ animationDelay: '0.2s', animationFillMode: 'backwards', background: 'linear-gradient(145deg, hsl(0 100% 92%), hsl(40 50% 92%))', border: '2px solid hsl(0 100% 74% / 0.2)' }}
        >
          <p className="text-xs text-primary font-bold uppercase tracking-wider mb-4">{t('recommendedActions')}</p>
          <ul className="space-y-3">
            {actions.map((action, i) => (
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

      {/* Écouter le résumé */}
      <button
        onClick={handleTTS}
        disabled={isPlaying}
        className="w-full py-4 rounded-2xl bg-card border border-border/50 flex items-center justify-center gap-3 mb-4 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 animate-fade-in"
        style={{ animationDelay: '0.25s', animationFillMode: 'backwards' }}
      >
        <Volume2 className={`w-5 h-5 text-primary ${isPlaying ? 'animate-pulse' : ''}`} />
        <span className="font-semibold text-sm">{isPlaying ? t('playing') : t('listenSummary')}</span>
      </button>

      {/* Réconforter avec la voix clonée */}
      {analysis.comfort_audio_url && (
        <button
          onClick={handleComfort}
          disabled={isComfortPlaying}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 mb-4 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 animate-fade-in"
          style={{ animationDelay: '0.28s', animationFillMode: 'backwards', background: 'linear-gradient(135deg, hsl(0 100% 92%), hsl(340 60% 90%))', border: '2px solid hsl(0 100% 74% / 0.2)' }}
        >
          <Heart className={`w-5 h-5 text-primary ${isComfortPlaying ? 'animate-pulse' : ''}`} />
          <span className="font-semibold text-sm text-primary">{isComfortPlaying ? t('playing') : t('comfortBaby')}</span>
        </button>
      )}

      {/* Repères de sécurité — toujours affichés, jamais déduits du son */}
      <div className="rounded-2xl bg-card border border-border/50 p-5 mb-4 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{t('safetyTitle')}</p>
        <p className="text-xs text-muted-foreground italic mb-3">{t('safetyNote')}</p>
        <div className="space-y-2">
          {cards.map(card => (
            <div
              key={card.key}
              className="rounded-xl p-3 border"
              style={card.emphasized ? { background: 'hsl(25 100% 95%)', borderColor: 'hsl(25 90% 55%)' } : { background: 'hsl(0 0% 100% / 0.4)', borderColor: 'hsl(0 0% 0% / 0.08)' }}
            >
              <p className="font-semibold text-sm" style={card.emphasized ? { color: 'hsl(25 90% 30%)' } : undefined}>{card.title}</p>
              <p className="text-xs mt-1 leading-relaxed text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <a href="tel:15" className="py-2 px-4 rounded-xl flex items-center gap-2 font-bold text-sm text-white bg-destructive transition-all active:scale-[0.98]">
            <Phone className="w-4 h-4" />
            {t('alertCall15')}
          </a>
          <p className="text-xs text-muted-foreground leading-snug">{footer}</p>
        </div>
      </div>

      {/* Rapport pour le médecin */}
      <BabblReport analysis={analysis} />

      {/* Feedback */}
      <div className="rounded-2xl bg-card border border-border/50 p-4 mb-6 mt-4 text-center animate-fade-in" style={{ animationDelay: '0.35s', animationFillMode: 'backwards' }}>
        <p className="text-xs text-muted-foreground mb-3">{t('feedbackQuestion')}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handleFeedback('positive')}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${feedback === 'positive' ? 'bg-success/20 scale-110' : 'bg-muted hover:bg-success/10'}`}
          >
            <ThumbsUp className={`w-5 h-5 ${feedback === 'positive' ? 'text-success' : 'text-muted-foreground'}`} />
          </button>
          <button
            onClick={() => handleFeedback('negative')}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${feedback === 'negative' ? 'bg-destructive/20 scale-110' : 'bg-muted hover:bg-destructive/10'}`}
          >
            <ThumbsDown className={`w-5 h-5 ${feedback === 'negative' ? 'text-destructive' : 'text-muted-foreground'}`} />
          </button>
        </div>
      </div>

      <button
        onClick={() => navigate('/dashboard')}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Home className="w-5 h-5" /> {t('backToDashboard')}
      </button>
    </MobileLayout>
  );
}
