'use client';

import { useEffect, useState } from 'react';
import { COLORS } from '@/lib/ui/colors';
import type { ItemDefinition } from '@/lib/items';
import { RARITY_COLORS, RARITY_CONFIG, SLOT_DISPLAY_NAMES } from '@/lib/items';

interface ItemDropNotificationProps {
  item: ItemDefinition;
  onComplete?: () => void;
}

// Effect display names
const EFFECT_NAMES: Record<string, { name: string; color: string; suffix: string }> = {
  max_hp: { name: 'Max HP', color: '#4ade80', suffix: '' },
  damage_boost: { name: 'Schaden', color: '#f87171', suffix: '' },
  damage_reduction: { name: 'Schutz', color: '#60a5fa', suffix: '' },
  time_boost: { name: 'Zeit', color: '#fbbf24', suffix: 's' },
  xp_boost: { name: 'XP Bonus', color: '#a78bfa', suffix: '%' },
  hint_chance: { name: 'Hinweis', color: '#34d399', suffix: '%' },
};

export default function ItemDropNotification({ item, onComplete }: ItemDropNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Entrance animation
    requestAnimationFrame(() => setVisible(true));

    // Exit animation after 2.5 seconds
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 2500);

    // Call onComplete after animation
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const rarityColor = RARITY_COLORS[item.rarity];
  const rarityName = RARITY_CONFIG[item.rarity].name;

  return (
    <div
      style={{
        position: 'fixed',
        top: '120px',
        left: '50%',
        transform: `translateX(-50%) translateY(${visible && !exiting ? '0' : '-100px'}) scale(${visible && !exiting ? 1 : 0.8})`,
        opacity: visible && !exiting ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: 10002,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          border: `3px solid ${rarityColor}`,
          borderRadius: '12px',
          padding: '16px 24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          boxShadow: `0 0 30px ${rarityColor}50, 0 0 60px ${rarityColor}30`,
        }}
      >
        {/* Item Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: COLORS.background.darker,
            border: `2px solid ${rarityColor}`,
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: `0 0 10px ${rarityColor}40`,
          }}
        >
          <img
            src={item.iconPath}
            alt={item.name}
            style={{
              width: '52px',
              height: '52px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.3))',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Item Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Header */}
          <div style={{
            color: COLORS.gold,
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>
            Item erhalten!
          </div>

          {/* Item name */}
          <div style={{
            color: rarityColor,
            fontSize: '18px',
            fontWeight: 700,
            textShadow: `0 0 10px ${rarityColor}80`,
          }}>
            {item.name}
          </div>

          {/* Item details */}
          <div style={{
            display: 'flex',
            gap: '16px',
            color: COLORS.text.muted,
            fontSize: '12px',
          }}>
            <span style={{ color: rarityColor }}>
              {rarityName}
            </span>
            <span>
              {SLOT_DISPLAY_NAMES[item.slot]}
            </span>
          </div>

          {/* Stats */}
          {item.effects && item.effects.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '4px',
            }}>
              {item.effects.map((effect, index) => {
                const effectConfig = EFFECT_NAMES[effect.type] || { name: effect.type, color: '#fff', suffix: '' };
                return (
                  <span key={index} style={{ color: effectConfig.color, fontSize: '13px', fontWeight: 600 }}>
                    +{effect.value}{effectConfig.suffix} {effectConfig.name}
                  </span>
                );
              })}
            </div>
          )}

          {/* Hint */}
          <div style={{
            color: COLORS.text.muted,
            fontSize: '11px',
            marginTop: '4px',
          }}>
            Druecke [I] fuer Inventar
          </div>
        </div>
      </div>
    </div>
  );
}
