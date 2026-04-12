import { useEffect, useState } from 'react';

interface Props {
  message: string;
  levelUp?: string;
  onDone: () => void;
}

export default function XpToast({ message, levelUp, onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'), 3000);
    const t2 = setTimeout(onDone, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className={`fixed top-4 left-1/2 z-[80] px-5 py-2 rounded-pill font-semibold text-sm shadow-md ${
        levelUp
          ? 'bg-gradient-to-r from-primary to-primary-strong text-primary-foreground'
          : 'bg-primary-soft text-primary-strong'
      }`}
      style={{
        animation: phase === 'in' ? 'slide-in-top 0.4s ease-out forwards' : 'slide-out-top 0.4s ease-in forwards',
      }}
    >
      {levelUp ? `🎉 ${levelUp}` : message}
    </div>
  );
}
