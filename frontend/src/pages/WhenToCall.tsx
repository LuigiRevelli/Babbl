/**
 * « Quand appeler ? » — les repères de sécurité à tout moment, sans avoir à
 * enregistrer. Chargé d'emblée (pas à la demande) : il doit s'ouvrir hors
 * connexion, avec les cartes embarquées.
 */
import { useEffect, useState } from 'react';
import MobileLayout from '@/components/MobileLayout';
import BackButton from '@/components/BackButton';
import { getUserData } from '@/lib/userData';
import { fetchCards, offlineCards, type CardsPayload } from '@/lib/cards';

export default function WhenToCall() {
  const [profile] = useState(() => {
    const d = getUserData();
    return d.parentProfile ?? d.voiceProfile ?? null;
  });
  const [cards, setCards] = useState<CardsPayload>(() => offlineCards(profile));

  useEffect(() => {
    let alive = true;
    fetchCards(profile).then((c) => { if (alive) setCards(c); });
    return () => { alive = false; };
  }, [profile]);

  return (
    <MobileLayout>
      <BackButton to="/" />
      <h1 className="font-serif text-2xl font-bold mb-2">Quand appeler ?</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Ces repères ne dépendent ni du son ni d'un enregistrement. Au moindre doute, appelez.
      </p>

      <a
        href="tel:15"
        className="block w-full text-center py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg mb-5"
      >
        Appeler le 15
      </a>

      <div className="space-y-3 mb-4">
        {cards.safety.cards.map((c) => (
          <div
            key={c.key}
            className={`rounded-2xl p-4 shadow-sm ${c.emphasized ? 'bg-card border-2 border-primary' : 'bg-card'}`}
          >
            <p className="font-semibold mb-1">{c.title}</p>
            <p className="text-sm leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-6">{cards.safety.footer}</p>

      {cards.menus.length > 0 && (
        <section className="mb-6">
          <h2 className="font-serif text-lg font-bold mb-2">Si vous voyez…</h2>
          <div className="space-y-2">
            {cards.menus.map((m) => (
              <details key={m.key} className="bg-card rounded-2xl p-4 shadow-sm">
                <summary className="font-semibold cursor-pointer">{m.title}</summary>
                <p className="text-sm leading-relaxed mt-2">{m.body}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {cards.version === 'offline' && (
        <p className="text-xs text-muted-foreground text-center">Hors connexion : repères embarqués dans l'application.</p>
      )}
    </MobileLayout>
  );
}
