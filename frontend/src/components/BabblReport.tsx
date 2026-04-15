/**
 * BabblReport — Generates a shareable text summary of an analysis
 * that the parent can send to their pediatrician.
 */

import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { t, translateCause } from '@/lib/i18n';
import { getUserData } from '@/lib/userData';

interface Analysis {
  id: string;
  timestamp: string;
  topCause: string;
  probabilities: Record<string, number>;
  parent_summary: string;
  confidence_level: string;
  alert: string;
  key_signals: string[];
  recommended_actions: string[];
}

function generateReportText(analysis: Analysis): string {
  const data = getUserData();
  const babyName = data.voiceProfile?.userName
    ? `Bébé de ${data.voiceProfile.userName}`
    : 'Bébé';
  const age = data.voiceProfile?.ageRange ?? 'Non renseigné';
  const date = new Date(analysis.timestamp).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const alertLabels: Record<string, string> = {
    none: '🟢 Normal',
    monitor: '🟡 Surveillance',
    consult_recommended: '🟠 Consultation recommandée',
    urgent: '🔴 Urgent',
  };

  const probLines = Object.entries(analysis.probabilities)
    .sort(([, a], [, b]) => b - a)
    .map(([cause, prob]) => `  • ${translateCause(cause)}: ${Math.round(prob * 100)}%`)
    .join('\n');

  const signalLines = analysis.key_signals
    .map((s, i) => `  ${i + 1}. ${s}`)
    .join('\n');

  const actionLines = analysis.recommended_actions
    .map((a, i) => `  ${i + 1}. ${a}`)
    .join('\n');

  return `═══════════════════════════════
  RAPPORT BABBL
═══════════════════════════════

👶 ${babyName}
📅 ${date}
👶 Âge : ${age}

── Résultat ──────────────────
Cause principale : ${translateCause(analysis.topCause)}
Confiance : ${analysis.confidence_level === 'high' ? 'Élevée' : analysis.confidence_level === 'medium' ? 'Moyenne' : 'Faible'}
Alerte : ${alertLabels[analysis.alert] ?? analysis.alert}

── Probabilités ──────────────
${probLines}

── Signaux clés ──────────────
${signalLines || '  Aucun signal spécifique détecté.'}

── Actions recommandées ──────
${actionLines || '  Aucune action spécifique.'}

── Résumé ────────────────────
${analysis.parent_summary}

═══════════════════════════════
⚠️ Ce rapport est généré par Babbl, un outil d'aide au triage.
Il ne constitue pas un diagnostic médical.
Généré le ${date}
═══════════════════════════════`;
}

export default function BabblReport({ analysis }: { analysis: Analysis }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = generateReportText(analysis);

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rapport Babbl',
          text,
        });
        return;
      } catch {
        // User cancelled or not supported, fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Last resort: select text
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="w-full py-4 rounded-2xl bg-card border border-border/50 flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] animate-fade-in"
      style={{ animationDelay: '0.35s', animationFillMode: 'backwards' }}
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 text-success" />
          <span className="font-semibold text-sm text-success">{t('reportCopied')}</span>
        </>
      ) : (
        <>
          <Share2 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">{t('alertShareReport')}</span>
        </>
      )}
    </button>
  );
}
