/**
 * Item system types
 */

// Equipment slot keys (defined here to avoid circular imports)
export type EquipmentSlotKey = 'helm' | 'brustplatte' | 'schwert' | 'schild' | 'hose' | 'schuhe';

// Item rarity
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Item type
export type ItemType = 'equipment' | 'consumable' | 'quest' | 'misc';

// Item effect types
export type ItemEffectType = 'max_hp' | 'damage_boost' | 'damage_reduction' | 'time_boost' | 'xp_boost' | 'hint_chance';

// Item effect
export interface ItemEffect {
  type: ItemEffectType;
  value: number;
}

// Item definition with stats
export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  slot: EquipmentSlotKey;
  rarity: ItemRarity;
  icon?: string;
  iconPath: string;
  spritePath?: string;
  description: string;
  value: number;
  stackable: boolean;
  maxStack: number;
  droppable: boolean;
  tradeable: boolean;
  questItem: boolean;
  effects?: ItemEffect[];
  // Legacy stats bonuses (for backwards compatibility)
  bonusHp?: number;
  bonusDamage?: number;
  bonusTimeLimit?: number;
}

// Slot display names
export const SLOT_DISPLAY_NAMES: Record<EquipmentSlotKey, string> = {
  helm: 'Helm',
  brustplatte: 'Brustplatte',
  schwert: 'Schwert',
  schild: 'Schild',
  hose: 'Hose',
  schuhe: 'Schuhe',
};

// Rarity configuration
export const RARITY_CONFIG: Record<ItemRarity, { name: string; dropChance: number }> = {
  common: { name: 'Gewöhnlich', dropChance: 0.50 },
  uncommon: { name: 'Ungewöhnlich', dropChance: 0.30 },
  rare: { name: 'Selten', dropChance: 0.15 },
  epic: { name: 'Episch', dropChance: 0.04 },
  legendary: { name: 'Legendär', dropChance: 0.01 },
};

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
