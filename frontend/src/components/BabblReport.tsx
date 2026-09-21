/**
 * BabblReport — texte partageable avec le médecin.
 *
 * Reprend ce que le parent a saisi et ce que l'application a affiché.
 * Aucun pourcentage, aucun niveau d'alerte, aucune observation sonore :
 * Babbl ne détecte aucune maladie dans le son (SYMPTOMS.md).
 */

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { t } from '@/lib/i18n';
import { getUserData, type Analysis } from '@/lib/userData';
import { HYPOTHESIS_DISCLAIMER, hypothesisFr } from '@/lib/taxonomy';

function generateReportText(analysis: Analysis): string {
  const data = getUserData();
  const babyName = data.babyName || data.parentProfile?.babyName;
  const who = babyName ? `Bébé : ${babyName}` : 'Bébé';
  const age = data.parentProfile?.ageRange ?? data.voiceProfile?.ageRange ?? 'Non renseigné';
  const date = new Date(analysis.timestamp).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

  const hypotheses = analysis.hypotheses ?? [];
  const hypLines = hypotheses.length
    ? hypotheses.map((h, i) => `  ${i + 1}. ${h.label || hypothesisFr(h.key)} — ${h.why}`).join('\n')
    : '  Aucune saisie sur les dernières heures.';

  const actionLines = (analysis.recommended_actions ?? [])
    .map((a: any, i: number) => `  ${i + 1}. ${typeof a === 'string' ? a : a?.action ?? ''}`)
    .join('\n');

  const safetyLines = (analysis.safety_cards ?? []).map(c => `  • ${c.title}`).join('\n');

  return `═══════════════════════════════
  RAPPORT BABBL
═══════════════════════════════

👶 ${who}
📅 ${date}
🗓 Âge (tranche) : ${age}

── Hypothèses, d'après ce que le parent a saisi ──
${hypLines}
  ${HYPOTHESIS_DISCLAIMER}

── Gestes proposés ──────────────
${actionLines || '  Aucun geste spécifique.'}

── Résumé affiché au parent ─────
${analysis.parent_summary}

── Repères de sécurité affichés ─
${safetyLines || '  (repères standard)'}

═══════════════════════════════
Babbl n'est pas un dispositif médical. Il ne détecte aucune
maladie dans le son. Ce rapport reprend uniquement ce que le
parent a saisi et ce que l'application a affiché.
Généré le ${date}
═══════════════════════════════`;
}

export default function BabblReport({ analysis }: { analysis: Analysis }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const text = generateReportText(analysis);

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Rapport Babbl', text });
        return;
      } catch {
        // annulé ou non supporté → presse-papiers
      }
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
