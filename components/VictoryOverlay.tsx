'use client';

import { useEffect, useState } from 'react';
import FloatingXpBubble from './FloatingXpBubble';
import GameOverlay, { OVERLAY_STYLES } from './GameOverlay';

interface VictoryOverlayProps {
  xpGained: number;
  onComplete: () => void;
}

export default function VictoryOverlay({ xpGained, onComplete }: VictoryOverlayProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; rotation: number; color: string; delay: number }>>([]);
  const [showXpBubble, setShowXpBubble] = useState(false);

  useEffect(() => {
    // Generate confetti particles
    const particles = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -20,
      rotation: Math.random() * 360,
      color: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 6)],
      delay: Math.random() * 500
    }));
    setConfetti(particles);

    // Show XP bubble after brief delay
    setTimeout(() => setShowXpBubble(true), 500);

    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <GameOverlay pointerEvents="none">
      {/* Confetti */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: '10px',
            height: '10px',
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            animation: `fall 3s ease-in ${particle.delay}ms forwards, spin 1s linear infinite`,
            opacity: 0.8
          }}
        />
      ))}

      {/* Victory Text */}
      <div
        style={{
          ...OVERLAY_STYLES.title,
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#FFD700',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.5), 4px 4px 8px rgba(0, 0, 0, 0.9)',
          animation: 'victoryBounce 0.6s ease-out',
        }}
      >
        VICTORY!
      </div>

      {/* Floating XP Bubble */}
      {showXpBubble && (
        <FloatingXpBubble
          xp={xpGained}
          x={window.innerWidth / 2}
          y={window.innerHeight / 2}
          onComplete={() => {}}
        />
      )}

      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(${window.innerHeight + 50}px) rotate(${Math.random() * 360}deg);
            opacity: 0;
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes victoryBounce {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </GameOverlay>
  );
}
