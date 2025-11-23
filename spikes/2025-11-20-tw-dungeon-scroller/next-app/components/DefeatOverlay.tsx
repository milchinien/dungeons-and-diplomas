'use client';

import { useState } from 'react';
import GameOverlay, { OVERLAY_STYLES } from './GameOverlay';

interface DefeatOverlayProps {
  onRestart: () => void;
}

export default function DefeatOverlay({ onRestart }: DefeatOverlayProps) {
  const [isRestarting, setIsRestarting] = useState(false);

  const handleRestart = () => {
    setIsRestarting(true);
    setTimeout(() => {
      onRestart();
    }, 300);
  };

  return (
    <GameOverlay
      backgroundColor="rgba(0, 0, 0, 0.95)"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      {/* Defeat Text */}
      <div
        style={{
          ...OVERLAY_STYLES.title,
          color: '#FF4444',
          textShadow: '0 0 20px rgba(255, 68, 68, 0.8), 0 0 40px rgba(255, 68, 68, 0.5), 4px 4px 8px rgba(0, 0, 0, 0.9)',
          animation: 'defeatShake 0.6s ease-out',
          marginBottom: '40px'
        }}
      >
        DEFEAT
      </div>

      {/* Try Again Text */}
      <div
        style={{
          ...OVERLAY_STYLES.subtitle,
          marginBottom: '60px',
        }}
      >
        Du wurdest besiegt!
      </div>

      {/* Restart Button */}
      <button
        onClick={handleRestart}
        disabled={isRestarting}
        style={{
          padding: '20px 60px',
          fontSize: '32px',
          fontWeight: 700,
          color: '#FFFFFF',
          backgroundColor: isRestarting ? '#555555' : '#FF4444',
          border: 'none',
          borderRadius: '12px',
          cursor: isRestarting ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 20px rgba(255, 68, 68, 0.4)',
          transition: 'all 0.2s ease',
          transform: isRestarting ? 'scale(0.95)' : 'scale(1)',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isRestarting) {
            e.currentTarget.style.backgroundColor = '#FF6666';
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isRestarting) {
            e.currentTarget.style.backgroundColor = '#FF4444';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        {isRestarting ? 'Wird neu gestartet...' : 'Nochmal versuchen'}
      </button>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes defeatShake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-10px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(10px);
          }
        }
      `}</style>
    </GameOverlay>
  );
}
