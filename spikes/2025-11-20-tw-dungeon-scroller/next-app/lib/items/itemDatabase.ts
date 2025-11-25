/**
 * Item database - all available items in the game
 */

import type { ItemDefinition, ItemRarity } from './types';
import type { EquipmentSlot } from '@/components/InventoryModal';

// Item templates by slot
const ITEM_TEMPLATES: Record<EquipmentSlot, { names: string[], baseStats: { hp?: number, damage?: number, time?: number } }> = {
  head: {
    names: ['Helm', 'Kapuze', 'Krone', 'Diadem', 'Stirnband'],
    baseStats: { hp: 5 }
  },
  chest: {
    names: ['Rüstung', 'Robe', 'Wams', 'Kettenhemd', 'Platte'],
    baseStats: { hp: 10 }
  },
  legs: {
    names: ['Hose', 'Beinschienen', 'Stoffhose', 'Kilt', 'Schutz'],
    baseStats: { hp: 5 }
  },
  feet: {
    names: ['Stiefel', 'Schuhe', 'Sandalen', 'Gamaschen', 'Treter'],
    baseStats: { hp: 3 }
  },
  mainHand: {
    names: ['Schwert', 'Dolch', 'Stab', 'Axt', 'Hammer'],
    baseStats: { damage: 5 }
  },
  offHand: {
    names: ['Schild', 'Buch', 'Orb', 'Fackel', 'Talisman'],
    baseStats: { time: 2 }
  },
};

// Rarity prefixes
const RARITY_PREFIXES: Record<ItemRarity, string[]> = {
  common: ['Einfacher', 'Normaler', 'Schlichter'],
  uncommon: ['Guter', 'Stabiler', 'Solider'],
  rare: ['Seltener', 'Feiner', 'Meister-'],
  epic: ['Epischer', 'Legendärer', 'Helden-'],
  legendary: ['Mythischer', 'Göttlicher', 'Uralter'],
};

// Stat multipliers by rarity
const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
  common: 1,
  uncommon: 1.5,
  rare: 2,
  epic: 3,
  legendary: 5,
};

/**
 * Generate a random item for a slot with given rarity
 */
export function generateItem(slot: EquipmentSlot, rarity: ItemRarity): ItemDefinition {
  const template = ITEM_TEMPLATES[slot];
  const prefixes = RARITY_PREFIXES[rarity];
  const multiplier = RARITY_MULTIPLIERS[rarity];

  const baseName = template.names[Math.floor(Math.random() * template.names.length)];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const name = `${prefix} ${baseName}`;

  const id = `${slot}_${rarity}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const item: ItemDefinition = {
    id,
    name,
    slot,
    rarity,
  };

  // Apply stats with rarity multiplier
  if (template.baseStats.hp) {
    item.bonusHp = Math.round(template.baseStats.hp * multiplier);
  }
  if (template.baseStats.damage) {
    item.bonusDamage = Math.round(template.baseStats.damage * multiplier);
  }
  if (template.baseStats.time) {
    item.bonusTimeLimit = Math.round(template.baseStats.time * multiplier);
  }

  return item;
}

/**
 * Get all available equipment slots
 */
export function getAllSlots(): EquipmentSlot[] {
  return ['head', 'chest', 'legs', 'feet', 'mainHand', 'offHand'];
}
