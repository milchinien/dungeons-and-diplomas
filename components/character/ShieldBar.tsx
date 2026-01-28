'use client';

import { MEDIEVAL_COLORS, MEDIEVAL_STYLES, getShieldGradient } from '@/lib/ui/medieval-styles';

interface ShieldBarProps {
  currentShield: number;
  maxShield: number;
}

/**
 * Shield Bar component showing player shield in medieval metal frame style
 */
export function ShieldBar({ currentShield, maxShield }: ShieldBarProps) {
  // Don't render if no shield capacity
  if (maxShield <= 0) {
    return null;
  }

  const shieldPercent = Math.max(0, Math.min(100, (currentShield / maxShield) * 100));
  const gradient = getShieldGradient();

  return (
    <div style={{ marginBottom: '12px' }}>
      {/* Shield Label */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px'
      }}>
        <span style={{
          ...MEDIEVAL_STYLES.barLabel,
          color: MEDIEVAL_COLORS.text.shield,
          fontSize: '12px',
        }}>
          Schild
        </span>
        <span style={{
          ...MEDIEVAL_STYLES.barValue,
          fontSize: '12px',
        }}>
          {currentShield} / {maxShield}
        </span>
      </div>

      {/* Metal Frame Shield Bar */}
      <div style={{
        width: '100%',
        height: '16px',
        ...MEDIEVAL_STYLES.barFrameSmall,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Inner shadow for depth */}
        <div style={{
          ...MEDIEVAL_STYLES.innerShadow,
          height: '2px',
        }} />

        {/* Fill bar with gradient */}
        <div style={{
          height: '100%',
          background: gradient,
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${shieldPercent}%`,
          transition: 'width 0.3s ease-out',
          boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.3), 0 0 8px ${MEDIEVAL_COLORS.shield.full}80`
        }} />

        {/* Shine effect on fill */}
        <div style={{
          ...MEDIEVAL_STYLES.shineEffect,
          width: `${shieldPercent}%`,
          height: '35%',
        }} />

        {/* Metal rivets */}
        <div style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          ...MEDIEVAL_STYLES.rivet,
          width: '3px',
          height: '3px',
        }} />
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          ...MEDIEVAL_STYLES.rivet,
          width: '3px',
          height: '3px',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '2px',
          left: '2px',
          ...MEDIEVAL_STYLES.rivet,
          width: '3px',
          height: '3px',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          ...MEDIEVAL_STYLES.rivet,
          width: '3px',
          height: '3px',
        }} />

        {/* Shield regenerating pulse effect */}
        {currentShield < maxShield && currentShield > 0 && (
          <>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${shieldPercent}%`,
              bottom: 0,
              backgroundColor: 'rgba(74, 158, 255, 0.2)',
              animation: 'shieldPulse 2s infinite'
            }} />
            <style jsx>{`
              @keyframes shieldPulse {
                0%, 100% { opacity: 0.2; }
                50% { opacity: 0.5; }
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  );
}
