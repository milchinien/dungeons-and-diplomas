/**
 * Item system types
 */

import type { EquipmentSlot } from '@/components/InventoryModal';

// Item rarity
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Item definition with stats
export interface ItemDefinition {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  icon?: string;
  // Stats bonuses
  bonusHp?: number;
  bonusDamage?: number;
  bonusTimeLimit?: number;
}

// Dropped item on the map
export interface DroppedItem {
  id: string;
  item: ItemDefinition;
  x: number; // World position in pixels
  y: number;
  tileX: number; // Tile position
  tileY: number;
  dropTime: number; // Timestamp when dropped
  pickedUp: boolean;
}

// Rarity colors for UI
export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9d9d9d',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
};

// Rarity drop weights (higher = more common)
export const RARITY_WEIGHTS: Record<ItemRarity, number> = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 4,
  legendary: 1,
};
