'use client';

import { useState } from 'react';
import { COLORS } from '@/lib/ui/colors';
import type { ItemDefinition, EquipmentSlotKey } from '@/lib/items/types';
import { RARITY_COLORS, SLOT_DISPLAY_NAMES, RARITY_CONFIG } from '@/lib/items/types';

// Re-export types for backwards compatibility
export type EquipmentSlot = EquipmentSlotKey;

// Inventory item type (simplified from ItemDefinition)
export type Item = ItemDefinition;

// Equipment state
export interface Equipment {
  helm: Item | null;
  brustplatte: Item | null;
  schwert: Item | null;
  schild: Item | null;
  hose: Item | null;
  schuhe: Item | null;
}

interface InventoryModalProps {
  onClose: () => void;
  equipment: Equipment;
  inventory: Item[];
  onEquip?: (item: Item) => void;
  onUnequip?: (slot: EquipmentSlot) => void;
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

// Tooltip component
function ItemTooltip({ item, style }: { item: Item; style?: React.CSSProperties }) {
  const rarityColor = RARITY_COLORS[item.rarity];
  const rarityName = RARITY_CONFIG[item.rarity].name;

  return (
    <div
      style={{
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        border: `2px solid ${rarityColor}`,
        borderRadius: '8px',
        padding: '12px',
        minWidth: '220px',
        maxWidth: '280px',
        zIndex: 10010,
        pointerEvents: 'none',
        boxShadow: `0 0 15px ${rarityColor}40`,
        ...style,
      }}
    >
      {/* Item name */}
      <div style={{ color: rarityColor, fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
        {item.name}
      </div>

      {/* Rarity and slot */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '12px' }}>
        <span style={{ color: rarityColor }}>{rarityName}</span>
        <span style={{ color: COLORS.text.muted }}>{SLOT_DISPLAY_NAMES[item.slot]}</span>
      </div>

      {/* Description */}
      <div style={{ color: COLORS.text.secondary, fontSize: '11px', marginBottom: '10px', lineHeight: '1.4' }}>
        {item.description}
      </div>

      {/* Stats */}
      {item.effects && item.effects.length > 0 && (
        <div style={{ borderTop: `1px solid ${COLORS.border.input}`, paddingTop: '8px' }}>
          {item.effects.map((effect, index) => {
            const effectConfig = EFFECT_NAMES[effect.type] || { name: effect.type, color: '#fff', suffix: '' };
            return (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: COLORS.text.muted, fontSize: '12px' }}>{effectConfig.name}</span>
                <span style={{ color: effectConfig.color, fontSize: '12px', fontWeight: 600 }}>
                  +{effect.value}{effectConfig.suffix}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Value */}
      <div style={{ borderTop: `1px solid ${COLORS.border.input}`, paddingTop: '6px', marginTop: '6px' }}>
        <span style={{ color: COLORS.gold, fontSize: '11px' }}>Wert: {item.value} Gold</span>
      </div>
    </div>
  );
}

// Equipment slot component with icon
function EquipmentSlotBox({
  slot,
  item,
  onClick,
  style,
}: {
  slot: EquipmentSlot;
  item: Item | null;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const rarityColor = item ? RARITY_COLORS[item.rarity] : COLORS.border.input;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        width: '70px',
        height: '70px',
        backgroundColor: item ? COLORS.background.input : COLORS.background.darker,
        border: `3px solid ${rarityColor}`,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: onClick && item ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        boxShadow: item ? `0 0 8px ${rarityColor}40` : 'none',
        ...style,
      }}
      title=""
    >
      {item ? (
        <>
          <img
            src={item.iconPath}
            alt={item.name}
            style={{
              width: '48px',
              height: '48px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {showTooltip && <ItemTooltip item={item} style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' }} />}
        </>
      ) : (
        <span style={{ color: COLORS.text.muted, fontSize: '10px', textAlign: 'center' }}>
          {SLOT_DISPLAY_NAMES[slot]}
        </span>
      )}
    </div>
  );
}

// Inventory slot component with icon
function InventorySlotBox({
  item,
  onClick,
}: {
  item: Item | null;
  onClick?: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const rarityColor = item ? RARITY_COLORS[item.rarity] : COLORS.border.input;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        width: '60px',
        height: '60px',
        backgroundColor: item ? COLORS.background.input : COLORS.background.darker,
        border: `2px solid ${rarityColor}`,
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: item && onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        boxShadow: item ? `0 0 6px ${rarityColor}30` : 'none',
      }}
      title=""
    >
      {item ? (
        <>
          <img
            src={item.iconPath}
            alt={item.name}
            style={{
              width: '44px',
              height: '44px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {showTooltip && <ItemTooltip item={item} style={{ bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' }} />}
        </>
      ) : null}
    </div>
  );
}

export default function InventoryModal({
  onClose,
  equipment,
  inventory,
  onEquip,
  onUnequip,
}: InventoryModalProps) {
  // Create inventory grid with 30 slots (6x5)
  const INVENTORY_SLOTS = 30;
  const inventorySlots = Array(INVENTORY_SLOTS).fill(null).map((_, i) => inventory[i] || null);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10001,
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.background.panel,
          borderRadius: '12px',
          border: `3px solid ${COLORS.border.gold}`,
          padding: '24px',
          display: 'flex',
          gap: '40px',
          maxWidth: '900px',
        }}
      >
        {/* Left side: Character with equipment slots */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ color: COLORS.gold, margin: '0 0 16px 0', fontSize: '20px' }}>
            Ausruestung
          </h3>

          {/* Character T-pose layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 90px 70px',
              gridTemplateRows: '70px 20px 80px 20px 70px 20px 70px',
              gap: '4px',
              justifyItems: 'center',
              alignItems: 'center',
            }}
          >
            {/* Row 1: Head (center) */}
            <div />
            <EquipmentSlotBox
              slot="helm"
              item={equipment.helm}
              onClick={() => equipment.helm && onUnequip?.('helm')}
            />
            <div />

            {/* Row 2: Neck area (visual) */}
            <div />
            <div
              style={{
                width: '40px',
                height: '16px',
                backgroundColor: COLORS.background.darker,
                borderRadius: '4px',
              }}
            />
            <div />

            {/* Row 3: Weapon - Chest - Shield */}
            <EquipmentSlotBox
              slot="schwert"
              item={equipment.schwert}
              onClick={() => equipment.schwert && onUnequip?.('schwert')}
            />
            <EquipmentSlotBox
              slot="brustplatte"
              item={equipment.brustplatte}
              onClick={() => equipment.brustplatte && onUnequip?.('brustplatte')}
              style={{ width: '80px', height: '80px' }}
            />
            <EquipmentSlotBox
              slot="schild"
              item={equipment.schild}
              onClick={() => equipment.schild && onUnequip?.('schild')}
            />

            {/* Row 4: Body connector (visual) */}
            <div
              style={{
                width: '30px',
                height: '16px',
                backgroundColor: COLORS.background.darker,
                borderRadius: '4px',
              }}
            />
            <div
              style={{
                width: '30px',
                height: '16px',
                backgroundColor: COLORS.background.darker,
                borderRadius: '4px',
              }}
            />
            <div
              style={{
                width: '30px',
                height: '16px',
                backgroundColor: COLORS.background.darker,
                borderRadius: '4px',
              }}
            />

            {/* Row 5: Legs (center) */}
            <div />
            <EquipmentSlotBox
              slot="hose"
              item={equipment.hose}
              onClick={() => equipment.hose && onUnequip?.('hose')}
              style={{ width: '80px' }}
            />
            <div />

            {/* Row 6: Leg connector (visual) */}
            <div />
            <div style={{ display: 'flex', gap: '20px' }}>
              <div
                style={{
                  width: '20px',
                  height: '16px',
                  backgroundColor: COLORS.background.darker,
                  borderRadius: '4px',
                }}
              />
              <div
                style={{
                  width: '20px',
                  height: '16px',
                  backgroundColor: COLORS.background.darker,
                  borderRadius: '4px',
                }}
              />
            </div>
            <div />

            {/* Row 7: Feet (center) */}
            <div />
            <EquipmentSlotBox
              slot="schuhe"
              item={equipment.schuhe}
              onClick={() => equipment.schuhe && onUnequip?.('schuhe')}
              style={{ width: '60px', height: '60px' }}
            />
            <div />
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: '2px',
            backgroundColor: COLORS.border.gold,
            alignSelf: 'stretch',
          }}
        />

        {/* Right side: Inventory grid */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: COLORS.gold, margin: '0 0 16px 0', fontSize: '20px' }}>
            Inventar ({inventory.length}/{INVENTORY_SLOTS})
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 60px)',
              gridTemplateRows: 'repeat(5, 60px)',
              gap: '6px',
            }}
          >
            {inventorySlots.map((item, index) => (
              <InventorySlotBox
                key={index}
                item={item}
                onClick={() => item && onEquip?.(item)}
              />
            ))}
          </div>

          {/* Close hint */}
          <div
            style={{
              marginTop: '16px',
              color: COLORS.text.muted,
              fontSize: '12px',
              textAlign: 'center',
            }}
          >
            Druecke [I] oder [ESC] zum Schliessen | Klicke auf Item zum Ausruesten
          </div>
        </div>
      </div>
    </div>
  );
}
