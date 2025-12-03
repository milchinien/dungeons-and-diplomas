'use client';

import { useEffect, useState } from 'react';

interface FloatingXpBubbleProps {
  xp: number;
  x: number; // Screen position in pixels
  y: number; // Screen position in pixels
  onComplete: () => void;
}

export default function FloatingXpBubble({ xp, x, y, onComplete }: FloatingXpBubbleProps) {
  const [opacity, setOpacity] = useState(1);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Float upward
      setOffsetY(-progress * 150);

      // Fade out in the last half
      if (progress > 0.5) {
        setOpacity(1 - (progress - 0.5) * 2);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y + offsetY}px`,
        transform: 'translate(-50%, -50%)',
        opacity,
        pointerEvents: 'none',
        zIndex: 1000,
        fontSize: '32px',
        fontWeight: 700,
        color: '#FFD700',
        textShadow: '0 0 10px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.5), 2px 2px 4px rgba(0, 0, 0, 0.8)',
        animation: 'pulse 0.5s ease-in-out',
        userSelect: 'none'
      }}
    >
      +{xp} XP
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
