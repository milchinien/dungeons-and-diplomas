'use client';

import { MEDIEVAL_COLORS } from '@/lib/ui/medieval-styles';
import { COLORS } from '@/lib/ui/colors';

interface TopRightPanelProps {
  gold: number;
  minimapRef: React.RefObject<HTMLCanvasElement>;
}

/**
 * Top right panel with gold counter and minimap
 * Groups resources and map information in one unified panel
 */
export function TopRightPanel({ gold, minimapRef }: TopRightPanelProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end',
      }}
    >
      {/* Gold Counter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: `
            linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.05) 50%, transparent 100%),
            linear-gradient(135deg, ${MEDIEVAL_COLORS.frame.dark}F2, ${MEDIEVAL_COLORS.frame.darker}F2)
          `,
          border: `3px solid ${MEDIEVAL_COLORS.frame.bronze}`,
          borderRadius: '4px',
          boxShadow: `
            inset 0 1px 0 rgba(255, 215, 0, 0.1),
            inset 0 -1px 2px rgba(139, 105, 20, 0.3),
            0 4px 12px rgba(0, 0, 0, 0.7),
            0 0 8px rgba(255, 215, 0, 0.15)
          `,
          minWidth: '150px',
          position: 'relative' as const,
          overflow: 'hidden',
        }}
      >
        {/* Gold shimmer animation */}
        <div
          style={{
            position: 'absolute' as const,
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.3) 50%, transparent 100%)',
            animation: 'goldShimmer 3s ease-in-out infinite',
            pointerEvents: 'none' as const,
          }}
        />
        {/* Gold Icon */}
        <span
          style={{
            fontSize: '20px',
            filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))',
          }}
        >
          🪙
        </span>

        {/* Gold Amount */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '18px',
              fontWeight: 'bold',
              color: MEDIEVAL_COLORS.gold.primary,
              textShadow: `0 0 8px ${MEDIEVAL_COLORS.gold.secondary}80, 2px 2px 3px rgba(0, 0, 0, 0.9)`,
              letterSpacing: '0.5px',
            }}
          >
            {gold}
          </span>
          <span
            style={{
              fontSize: '9px',
              color: MEDIEVAL_COLORS.text.secondary,
              opacity: 0.7,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Gold
          </span>
        </div>

        {/* Corner rivets */}
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${MEDIEVAL_COLORS.rivet.light} 0%, ${MEDIEVAL_COLORS.rivet.dark} 100%)`,
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${MEDIEVAL_COLORS.rivet.light} 0%, ${MEDIEVAL_COLORS.rivet.dark} 100%)`,
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
        }} />
      </div>

      {/* Minimap */}
      <canvas
        ref={minimapRef}
        width={200}
        height={200}
        style={{
          border: `3px solid ${COLORS.success}`,
          borderRadius: '4px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          imageRendering: 'pixelated',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.7)',
        } as React.CSSProperties}
      />

      {/* Animations */}
      <style jsx>{`
        @keyframes goldShimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>
    </div>
  );
}
