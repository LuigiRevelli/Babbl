/**
 * Résumé pour le médecin : 7 jours de ce que le parent a noté, à copier ou
 * partager. Généré dans le téléphone ; rien n'est envoyé nulle part tant que le
 * parent ne choisit pas de le partager.
 */
import { useMemo, useState } from 'react';
import MobileLayout from '@/components/MobileLayout';
import BackButton from '@/components/BackButton';
import { getUserData } from '@/lib/userData';
import { buildDoctorReport } from '@/lib/report';

export default function Report() {
  const text = useMemo(() => buildDoctorReport(getUserData()), []);
  const [status, setStatus] = useState<string | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copié. Vous pouvez le coller dans un message à votre médecin.');
    } catch {
      setStatus('La copie a échoué : sélectionnez le texte à la main.');
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Résumé Babbl pour le médecin', text });
      } catch {
        /* partage annulé */
      }
    } else {
      await copy();
    }
  };

  return (
    <MobileLayout>
      <BackButton to="/dashboard" />
      <h1 className="font-serif text-2xl font-bold mb-2">Résumé pour le médecin</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Les 7 derniers jours de ce que vous avez noté : tétées, changes, réveils, et ce qui a apaisé votre bébé.
        Aucune mesure du son. À montrer ou envoyer à votre médecin si vous le souhaitez.
      </p>
      <pre className="whitespace-pre-wrap text-xs leading-relaxed bg-card rounded-lg p-4 shadow-sm mb-4 font-mono">{text}</pre>
      <div className="flex gap-3 mb-2">
        <button onClick={share} className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm">
          Partager
        </button>
        <button onClick={copy} className="flex-1 py-3 rounded-2xl border border-border font-bold text-sm">
          Copier
        </button>
      </div>
      {status && <p className="text-xs text-muted-foreground text-center">{status}</p>}
    </MobileLayout>
  );
}
