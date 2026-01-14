'use client';

import { useState } from 'react';
import GameOverlay from './GameOverlay';
import { COLORS } from '@/lib/ui/colors';
import type { CheatState } from '@/hooks/useCheatSystem';
import type { RoomType } from '@/lib/constants';

interface CheatModalProps {
  cheatState: CheatState;
  onClose: () => void;
  onTeleportToRoom: (type: RoomType) => void;
  onHealPlayer: (amount: number) => void;
  onFullHeal: () => void;
  onAddShield: (amount: number) => void;
  onToggleGodMode: () => void;
  onToggleSpeedBoost: () => void;
  onToggleShowCorrectAnswer: () => void;
  onKillAllEnemies: () => void;
  onKillCurrentEnemy: () => void;
  onRevealAllRooms: () => void;
  onAddXp: (amount: number) => void;
  onNewDungeon: () => void;
  inCombat: boolean;
}

interface CheatButtonProps {
  label: string;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

function CheatButton({ label, onClick, color = COLORS.gold, disabled = false }: CheatButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      style={{
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: 600,
        color: disabled ? '#666' : isHovered ? '#000' : '#fff',
        backgroundColor: disabled ? '#333' : isHovered ? color : 'transparent',
        border: `2px solid ${disabled ? '#444' : color}`,
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        transform: isHovered && !disabled ? 'scale(1.02)' : 'scale(1)',
        userSelect: 'none',
        textShadow: isHovered || disabled ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.5)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

interface ToggleButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  activeColor?: string;
}

function ToggleButton({ label, isActive, onClick, activeColor = COLORS.success }: ToggleButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: 600,
        color: isActive ? '#000' : '#fff',
        backgroundColor: isActive ? activeColor : isHovered ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: `2px solid ${isActive ? activeColor : '#666'}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: isActive ? '#000' : '#444',
        border: isActive ? 'none' : '2px solid #666',
      }} />
      {label}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '16px',
      fontWeight: 700,
      color: COLORS.gold,
      marginBottom: '12px',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      borderBottom: `1px solid ${COLORS.border.gold}`,
      paddingBottom: '6px',
    }}>
      {children}
    </div>
  );
}

export default function CheatModal({
  cheatState,
  onClose,
  onTeleportToRoom,
  onHealPlayer,
  onFullHeal,
  onAddShield,
  onToggleGodMode,
  onToggleSpeedBoost,
  onToggleShowCorrectAnswer,
  onKillAllEnemies,
  onKillCurrentEnemy,
  onRevealAllRooms,
  onAddXp,
  onNewDungeon,
  inCombat,
}: CheatModalProps) {
  return (
    <GameOverlay
      backgroundColor="rgba(0, 0, 0, 0.9)"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        animation: 'cheatFadeIn 0.15s ease-out',
      }}
    >
      {/* Title */}
      <div style={{
        fontSize: '48px',
        fontWeight: 900,
        color: '#FF00FF',
        textShadow: '0 0 20px rgba(255, 0, 255, 0.7), 0 0 40px rgba(255, 0, 255, 0.4)',
        marginBottom: '30px',
        userSelect: 'none',
        letterSpacing: '4px',
      }}>
        CHEAT MENU
      </div>

      {/* Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '30px',
        maxWidth: '800px',
        width: '90%',
      }}>
        {/* Teleport Section */}
        <div style={{
          backgroundColor: 'rgba(30, 30, 50, 0.8)',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #444',
        }}>
          <SectionTitle>Teleport</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <CheatButton
              label="Zum Schatz"
              onClick={() => onTeleportToRoom('treasure')}
              color="#FFD700"
              disabled={inCombat}
            />
            <CheatButton
              label="Zum Shop"
              onClick={() => onTeleportToRoom('shop')}
              color="#00CED1"
              disabled={inCombat}
            />
            <CheatButton
              label="Zum Gegner"
              onClick={() => onTeleportToRoom('combat')}
              color="#FF4444"
              disabled={inCombat}
            />
            <CheatButton
              label="Zum Schrein"
              onClick={() => onTeleportToRoom('shrine')}
              color="#FFA500"
              disabled={inCombat}
            />
          </div>
        </div>

        {/* HP/Shield Section */}
        <div style={{
          backgroundColor: 'rgba(30, 30, 50, 0.8)',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #444',
        }}>
          <SectionTitle>HP / Schild</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <CheatButton
              label="+50 HP"
              onClick={() => onHealPlayer(50)}
              color={COLORS.success}
            />
            <CheatButton
              label="Voll heilen"
              onClick={onFullHeal}
              color={COLORS.success}
            />
            <CheatButton
              label="+20 Schild"
              onClick={() => onAddShield(20)}
              color="#4488FF"
            />
            <ToggleButton
              label="God Mode"
              isActive={cheatState.godMode}
              onClick={onToggleGodMode}
              activeColor="#FF00FF"
            />
          </div>
        </div>

        {/* Combat Section */}
        <div style={{
          backgroundColor: 'rgba(30, 30, 50, 0.8)',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #444',
        }}>
          <SectionTitle>Kampf</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <ToggleButton
              label="Antwort zeigen"
              isActive={cheatState.showCorrectAnswer}
              onClick={onToggleShowCorrectAnswer}
              activeColor="#00FF00"
            />
            <CheatButton
              label="Gegner töten"
              onClick={onKillCurrentEnemy}
              color="#FF4444"
              disabled={!inCombat}
            />
            <CheatButton
              label="Alle Gegner töten"
              onClick={onKillAllEnemies}
              color="#FF0000"
            />
          </div>
        </div>

        {/* Other Section */}
        <div style={{
          backgroundColor: 'rgba(30, 30, 50, 0.8)',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #444',
        }}>
          <SectionTitle>Sonstiges</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <CheatButton
              label="Fog of War aus"
              onClick={onRevealAllRooms}
              color="#888888"
              disabled={cheatState.fogOfWarDisabled}
            />
            <CheatButton
              label="+1000 XP"
              onClick={() => onAddXp(1000)}
              color="#FFD700"
            />
            <ToggleButton
              label="Speed Boost (2x)"
              isActive={cheatState.speedBoost}
              onClick={onToggleSpeedBoost}
              activeColor="#00BFFF"
            />
            <CheatButton
              label="Neues Dungeon"
              onClick={onNewDungeon}
              color="#FFA500"
              disabled={inCombat}
            />
          </div>
        </div>
      </div>

      {/* Close hint */}
      <div style={{
        marginTop: '30px',
        color: COLORS.text.muted,
        fontSize: '14px',
        userSelect: 'none',
      }}>
        Drücke STRG+P oder ESC zum Schließen
      </div>

      <style jsx>{`
        @keyframes cheatFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </GameOverlay>
  );
}
