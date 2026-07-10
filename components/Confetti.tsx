'use client';

import { useEffect, useMemo, useState } from 'react';

const COLORS = ['#E8487E', '#EE6C3A', '#E9AE3E', '#1AA293', '#F4CB72', '#F2789F'];

type Piece = {
  left: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  round: boolean;
  drift: number;
};

/** Confettis flottants légers (DOM + CSS) — dégradés sur mobile. */
export default function Confetti({ count = 26 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: count }).map(() => ({
      left: Math.random() * 100,
      size: 6 + Math.random() * 10,
      delay: Math.random() * 8,
      duration: 9 + Math.random() * 9,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      round: Math.random() > 0.5,
      drift: (Math.random() - 0.5) * 60,
    }));
  }, [count]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-[-8%] block opacity-80"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            background: p.color,
            borderRadius: p.round ? '9999px' : '3px',
            // @ts-expect-error custom property for keyframes
            '--drift': `${p.drift}px`,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
            boxShadow: `0 0 10px ${p.color}66`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translate3d(0,-10vh,0) rotate(0deg); opacity: 0; }
          10% { opacity: .85; }
          90% { opacity: .85; }
          100% { transform: translate3d(var(--drift),115vh,0) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
