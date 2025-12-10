'use client';

import { COLORS } from '@/lib/ui/colors';

interface HpBarProps {
  currentHp: number;
  maxHp: number;
}

/**
 * HP Bar component showing player health
 */
export function HpBar({ currentHp, maxHp }: HpBarProps) {
  const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  // Color based on HP percentage
  let barColor: string = COLORS.success; // Green
  if (hpPercent <= 25) {
    barColor = '#FF4444'; // Red
  } else if (hpPercent <= 50) {
    barColor = '#FFAA00'; // Orange
  }

  return (
    <div style={{ marginBottom: '12px' }}>
      {/* HP Label */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px'
      }}>
        <span style={{
          color: '#FF6666',
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          ❤️ HP
        </span>
        <span style={{
          color: '#FFF',
          fontSize: '14px',
          fontWeight: 700
        }}>
          {currentHp} / {maxHp}
        </span>
      </div>

      {/* HP Bar Background */}
      <div style={{
        width: '100%',
        height: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '8px',
        border: '2px solid #333',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* HP Bar Fill */}
        <div style={{
          width: `${hpPercent}%`,
          height: '100%',
          backgroundColor: barColor,
          borderRadius: '6px',
          transition: 'width 0.3s ease, background-color 0.3s ease',
          boxShadow: `0 0 10px ${barColor}40`
        }} />

        {/* Damage flash effect when low HP */}
        {hpPercent <= 25 && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 0, 0, 0.3)',
            animation: 'pulse 1s infinite'
          }} />
        )}
      </div>

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
