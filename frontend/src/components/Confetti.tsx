import { useEffect, useState } from 'react';

const COLORS = ['#ef8a4a', '#e17231', '#f5c842', '#7cb88a', '#e88fa5'];

export default function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: 2 + Math.random() * 2,
      delay: Math.random(),
      rotation: Math.random() * 720,
    }))
  );

  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: -10,
            width: 8,
            height: 4,
            backgroundColor: p.color,
            borderRadius: 1,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
