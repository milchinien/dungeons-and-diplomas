'use client';

import { useState } from 'react';
import GameOverlay from './GameOverlay';
import { COLORS } from '@/lib/ui/colors';

interface PauseMenuProps {
  onResume: () => void;
  onOptions: () => void;
  onStats: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

interface MenuButtonProps {
  label: string;
  onClick: () => void;
  color?: string;
  hoverColor?: string;
}

function MenuButton({ label, onClick, color = COLORS.gold, hoverColor }: MenuButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const actualHoverColor = hoverColor || '#FFE44D';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '300px',
        padding: '16px 40px',
        fontSize: '24px',
        fontWeight: 600,
        color: isHovered ? '#000' : '#fff',
        backgroundColor: isHovered ? actualHoverColor : 'transparent',
        border: `3px solid ${color}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        userSelect: 'none',
        textShadow: isHovered ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.5)',
      }}
    >
      {label}
    </button>
  );
}

export default function PauseMenu({ onResume, onOptions, onStats, onRestart, onMainMenu }: PauseMenuProps) {
  return (
    <GameOverlay
      backgroundColor="rgba(0, 0, 0, 0.85)"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        animation: 'pauseFadeIn 0.2s ease-out',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: '72px',
          fontWeight: 900,
          color: COLORS.gold,
          textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 4px 4px 8px rgba(0, 0, 0, 0.9)',
          marginBottom: '60px',
          userSelect: 'none',
          letterSpacing: '8px',
        }}
      >
        PAUSE
      </div>

      {/* Menu Buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'center',
        }}
      >
        <MenuButton label="Weiterspielen" onClick={onResume} />
        <MenuButton label="Optionen" onClick={onOptions} />
        <MenuButton label="Statistiken" onClick={onStats} color={COLORS.info} hoverColor="#66B2FF" />
        <MenuButton
          label="Neustart"
          onClick={onRestart}
          color={COLORS.warning}
          hoverColor="#FFB833"
        />
        <MenuButton
          label="Hauptmenü"
          onClick={onMainMenu}
          color={COLORS.error}
          hoverColor="#FF6666"
        />
      </div>

      {/* Hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          color: COLORS.text.muted,
          fontSize: '16px',
          userSelect: 'none',
        }}
      >
        Drücke ESC um fortzufahren
      </div>

      <style jsx>{`
        @keyframes pauseFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </GameOverlay>
  );
}
