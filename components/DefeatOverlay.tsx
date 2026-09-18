'use client';

import { useState, useEffect } from 'react';
import GameOverlay, { OVERLAY_STYLES } from './GameOverlay';
import { api } from '@/lib/api';

interface GameStats {
  enemiesDefeated: number;
  roomsExplored: number;
  xpGained: number;
  maxCombo: number;
  playTimeSeconds: number;
}

interface DefeatOverlayProps {
  onRestart: () => void;
  userId: number | null;
  stats?: GameStats;
}

export default function DefeatOverlay({ onRestart, userId, stats }: DefeatOverlayProps) {
  const [isRestarting, setIsRestarting] = useState(false);
  const [playerScore, setPlayerScore] = useState<number | null>(null);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);

  useEffect(() => {
    const saveHighscore = async () => {
      try {
        if (userId && stats) {
          const result = await api.highscores.saveHighscore({
            user_id: userId,
            enemies_defeated: stats.enemiesDefeated,
            rooms_explored: stats.roomsExplored,
            xp_gained: stats.xpGained,
            max_combo: stats.maxCombo,
            play_time_seconds: stats.playTimeSeconds
          });
          setPlayerScore(result.score);
          setIsNewPersonalBest(result.isNewPersonalBest);
        }
      } catch (error) {
        console.error('Failed to save highscore:', error);
      }
    };
    saveHighscore();
  }, [userId, stats]);

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
          marginBottom: '20px',
          fontSize: '48px'
        }}
      >
        DEFEAT
      </div>

      {/* Score Display */}
      {playerScore !== null && (
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: isNewPersonalBest ? '#FFD700' : '#fff' }}>
            {playerScore.toLocaleString('en-US')} Points
          </div>
          {isNewPersonalBest && (
            <div style={{ fontSize: '18px', color: '#FFD700', marginTop: '8px' }}>
              New personal best!
            </div>
          )}
        </div>
      )}

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
        {isRestarting ? 'Restarting...' : 'Try Again'}
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
