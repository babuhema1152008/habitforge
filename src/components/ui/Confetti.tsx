import { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#4f46e5', '#14b8a6', '#f43f5e', '#f59e0b', '#8b5cf6', '#22c55e'];

interface Piece {
  id: number;
  x: number;
  color: string;
  rotate: number;
  delay: number;
  duration: number;
  size: number;
}

export function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        delay: Math.random() * 0.4,
        duration: 1.8 + Math.random() * 1.2,
        size: 6 + Math.random() * 6,
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[110] overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ top: '-5%', left: `${p.x}%`, opacity: 1, rotate: 0 }}
          animate={{ top: '105%', opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size * 1.6,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
