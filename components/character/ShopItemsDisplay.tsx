/**
 * Displays purchased shop items and perks in the CharacterPanel
 */
import type { Item } from '@/lib/shop/Item';
import type { Perk } from '@/lib/shop/Perk';
import { RARITY_CONFIG } from '@/lib/shop/Rarity';
import { getItemEffectDescription } from '@/lib/shop/Item';
import { getPerkEffectDescription } from '@/lib/shop/Perk';
import { MEDIEVAL_COLORS } from '@/lib/ui/medieval-styles';
import { useState } from 'react';

interface ShopItemsDisplayProps {
  equippedItems: Item[];
  activePerks: Perk[];
}

interface TooltipState {
  visible: boolean;
  content: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export function ShopItemsDisplay({ equippedItems, activePerks }: ShopItemsDisplayProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Don't render if nothing to show
  if (equippedItems.length === 0 && activePerks.length === 0) {
    return null;
  }

  const handleMouseEnter = (
    e: React.MouseEvent,
    name: string,
    effect: string,
    color: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      name,
      content: effect,
      color,
      x: rect.right + 10,
      y: rect.top
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div style={{ marginTop: '8px', marginBottom: '4px' }}>
      {/* Section title */}
      <div style={{
        fontSize: '10px',
        color: MEDIEVAL_COLORS.text.muted,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '4px'
      }}>
        Shop-Ausrüstung
      </div>

      {/* Items and Perks grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px'
      }}>
        {/* Items */}
        {equippedItems.map((item, index) => {
          const config = RARITY_CONFIG[item.rarity];
          return (
            <div
              key={`item-${index}`}
              onMouseEnter={(e) => handleMouseEnter(
                e,
                item.definition.name,
                getItemEffectDescription(item),
                config.color
              )}
              onMouseLeave={handleMouseLeave}
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: `${config.color}20`,
                border: `2px solid ${config.color}`,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'transform 0.1s ease',
              }}
              title={item.definition.name}
            >
              <span style={{ color: config.color }}>
                {getItemIcon(item.definition.type)}
              </span>
            </div>
          );
        })}

        {/* Perks */}
        {activePerks.map((perk, index) => {
          const config = RARITY_CONFIG[perk.rarity];
          return (
            <div
              key={`perk-${index}`}
              onMouseEnter={(e) => handleMouseEnter(
                e,
                perk.definition.name,
                getPerkEffectDescription(perk),
                config.color
              )}
              onMouseLeave={handleMouseLeave}
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: `${config.color}20`,
                border: `2px solid ${config.color}`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                cursor: 'pointer',
                transition: 'transform 0.1s ease',
              }}
              title={perk.definition.name}
            >
              <span style={{ color: config.color }}>
                {getPerkIcon(perk.definition.type)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
          backgroundColor: 'rgba(20, 20, 30, 0.95)',
          border: `2px solid ${tooltip.color}`,
          borderRadius: '6px',
          padding: '8px 12px',
          zIndex: 1000,
          maxWidth: '200px',
          pointerEvents: 'none',
          boxShadow: `0 0 10px ${tooltip.color}40`
        }}>
          <div style={{
            color: tooltip.color,
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '4px'
          }}>
            {tooltip.name}
          </div>
          <div style={{
            color: '#ccc',
            fontSize: '12px'
          }}>
            {tooltip.content}
          </div>
        </div>
      )}
    </div>
  );
}

function getItemIcon(type: string): string {
  switch (type) {
    case 'sword': return '⚔';
    case 'chestplate': return '🛡';
    case 'helmet': return '⛑';
    case 'shield': return '🔰';
    case 'boots': return '👢';
    case 'amulet': return '💎';
    default: return '?';
  }
}

function getPerkIcon(type: string): string {
  switch (type) {
    case 'hp_flat':
    case 'hp_percent': return '❤';
    case 'damage_flat':
    case 'damage_percent': return '⚡';
    case 'regeneration': return '💚';
    case 'critical': return '💥';
    case 'time_bonus': return '⏱';
    case 'extra_life': return '✨';
    case 'elo_boost': return '📈';
    default: return '★';
  }
}
