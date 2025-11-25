'use client';

import { useEffect, useState } from 'react';
import { COLORS } from '@/lib/ui/colors';
import type { ItemDefinition, ItemRarity } from '@/lib/items';
import { RARITY_COLORS } from '@/lib/items';

interface ItemDropNotificationProps {
  item: ItemDefinition;
  onComplete?: () => void;
}

// German slot names
const SLOT_NAMES: Record<string, string> = {
  head: 'Helm',
  chest: 'Brustplatte',
  legs: 'Hose',
  feet: 'Schuhe',
  mainHand: 'Waffe',
  offHand: 'Nebenhand',
};

// German rarity names
const RARITY_NAMES: Record<ItemRarity, string> = {
  common: 'Gewoehnlich',
  uncommon: 'Ungewoehnlich',
  rare: 'Selten',
  epic: 'Episch',
  legendary: 'Legendaer',
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
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          boxShadow: `0 0 20px ${rarityColor}40, 0 0 40px ${rarityColor}20`,
        }}
      >
        {/* Header */}
        <div style={{
          color: COLORS.gold,
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          Item erhalten!
        </div>

        {/* Item name */}
        <div style={{
          color: rarityColor,
          fontSize: '20px',
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
            {RARITY_NAMES[item.rarity]}
          </span>
          <span>
            {SLOT_NAMES[item.slot] || item.slot}
          </span>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '4px',
        }}>
          {item.bonusHp && (
            <span style={{ color: '#4ade80', fontSize: '13px' }}>
              +{item.bonusHp} HP
            </span>
          )}
          {item.bonusDamage && (
            <span style={{ color: '#f87171', fontSize: '13px' }}>
              +{item.bonusDamage} Schaden
            </span>
          )}
          {item.bonusTimeLimit && (
            <span style={{ color: '#60a5fa', fontSize: '13px' }}>
              +{item.bonusTimeLimit}s Zeit
            </span>
          )}
        </div>

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
  );
}
