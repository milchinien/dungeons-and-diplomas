'use client';

import type { Item } from '@/lib/shop/Item';
import type { Perk } from '@/lib/shop/Perk';
import { ShopItemsDisplay } from '../character/ShopItemsDisplay';

interface TopLeftPanelProps {
  username: string;
  level: number;
  currentHp: number;
  maxHp: number;
  equippedItems?: Item[];
  activePerks?: Perk[];
}

/**
 * Compact character panel for top left corner
 * Shows only essential info: username, level, HP, and equipment
 * Actions (Restart/Logout) are in ESC menu
 */
export function TopLeftPanel({
  username,
  level,
  currentHp,
  maxHp,
  equippedItems = [],
  activePerks = []
}: TopLeftPanelProps) {
  const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));

  // Modern color scheme based on HP percentage
  let hpColor = '#00ff88'; // Cyan-green (healthy)
  let hpGlow = '#00ff88';

  if (hpPercent <= 25) {
    hpColor = '#ff3366'; // Neon red (critical)
    hpGlow = '#ff0044';
  } else if (hpPercent <= 50) {
    hpColor = '#ffaa00'; // Orange (warning)
    hpGlow = '#ff8800';
  } else if (hpPercent <= 75) {
    hpColor = '#ffff00'; // Yellow (caution)
    hpGlow = '#dddd00';
  }
  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        zIndex: 100,
        background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.95), rgba(10, 10, 20, 0.98))',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '200px',
        maxWidth: '240px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >

      {/* Compact Header */}
      <div
        style={{
          marginBottom: '8px',
          padding: '6px 8px',
          background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(10, 10, 20, 0.98))',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#ffffff',
            textShadow: '0 0 8px rgba(255, 255, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.9)',
            letterSpacing: '0.5px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {username}
        </div>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '2px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Level {level}
        </div>
      </div>

      {/* Modern HP Bar */}
      <div style={{ marginBottom: '8px' }}>
        {/* HP Label */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px',
            paddingLeft: '2px',
            paddingRight: '2px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: hpColor,
              textShadow: `0 0 6px ${hpGlow}80`,
              letterSpacing: '1px',
            }}
          >
            HP
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: 'monospace',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
            }}
          >
            {currentHp} / {maxHp}
          </span>
        </div>

        {/* HP Bar Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '20px',
            background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.9), rgba(5, 5, 10, 0.95))',
            border: '2px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* HP Fill */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${hpPercent}%`,
              background: `linear-gradient(90deg, ${hpColor} 0%, ${hpColor}CC 100%)`,
              borderRadius: '8px',
              boxShadow: `
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                0 0 12px ${hpGlow}60,
                inset 0 -1px 2px rgba(0, 0, 0, 0.3)
              `,
              transition: 'width 0.3s ease-out, background 0.3s ease-out',
            }}
          />

          {/* Shine overlay */}
          <div
            style={{
              position: 'absolute',
              top: '2px',
              left: 0,
              width: `${hpPercent}%`,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.4), transparent)',
              borderRadius: '8px 8px 0 0',
              pointerEvents: 'none',
            }}
          />

          {/* Critical pulse */}
          {hpPercent <= 25 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${hpPercent}%`,
                height: '100%',
                background: `radial-gradient(circle, ${hpGlow}40, transparent)`,
                animation: 'hpPulse 1s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>

      {/* Equipment Display */}
      {(equippedItems.length > 0 || activePerks.length > 0) && (
        <>
          <div
            style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
              margin: '8px 0',
            }}
          />
          <ShopItemsDisplay
            equippedItems={equippedItems}
            activePerks={activePerks}
          />
        </>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes hpPulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
}
