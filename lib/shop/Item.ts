/**
 * Item system for the shop feature.
 * Defines all equipment items that can be purchased in the shop.
 * Item effect strength scales with rarity.
 */

import { Rarity, getRarityMultiplier, rollRarity } from './Rarity';

export enum ItemType {
  SWORD = 'sword',
  CHESTPLATE = 'chestplate',
  HELMET = 'helmet',
  SHIELD = 'shield',
  BOOTS = 'boots',
  AMULET = 'amulet'
}

export enum ItemEffectType {
  DAMAGE_FLAT = 'damage_flat',       // +X damage
  DAMAGE_REDUCTION = 'damage_reduction', // -X% incoming damage
  HP_FLAT = 'hp_flat',               // +X max HP
  BLOCK_CHANCE = 'block_chance',     // X% chance to block damage
  SPEED = 'speed',                   // +X% movement speed
  ALL_STATS = 'all_stats'            // +X% to all stats
}

export interface ItemDefinition {
  type: ItemType;
  name: string;
  description: string;
  baseEffect: number;
  effectType: ItemEffectType;
  spriteKey: string;
  baseCost: number;  // Base gold cost before rarity multiplier
}

export interface Item {
  id: string;
  definition: ItemDefinition;
  rarity: Rarity;
  effectValue: number;  // baseEffect * rarityMultiplier
  finalCost: number;    // baseCost * rarityMultiplier
}

export const ITEM_DEFINITIONS: ItemDefinition[] = [
  {
    type: ItemType.SWORD,
    name: 'Schwert',
    description: 'Erhöht den Schaden bei korrekten Antworten',
    baseEffect: 5,
    effectType: ItemEffectType.DAMAGE_FLAT,
    spriteKey: 'item_sword',
    baseCost: 60
  },
  {
    type: ItemType.CHESTPLATE,
    name: 'Brustplatte',
    description: 'Reduziert eingehenden Schaden',
    baseEffect: 10,
    effectType: ItemEffectType.DAMAGE_REDUCTION,
    spriteKey: 'item_chestplate',
    baseCost: 50
  },
  {
    type: ItemType.HELMET,
    name: 'Helm',
    description: 'Erhöht die maximalen HP',
    baseEffect: 10,
    effectType: ItemEffectType.HP_FLAT,
    spriteKey: 'item_helmet',
    baseCost: 40
  },
  {
    type: ItemType.SHIELD,
    name: 'Schild',
    description: 'Chance, Schaden komplett zu blocken',
    baseEffect: 10,
    effectType: ItemEffectType.BLOCK_CHANCE,
    spriteKey: 'item_shield',
    baseCost: 70
  },
  {
    type: ItemType.BOOTS,
    name: 'Stiefel',
    description: 'Erhöht die Bewegungsgeschwindigkeit',
    baseEffect: 10,
    effectType: ItemEffectType.SPEED,
    spriteKey: 'item_boots',
    baseCost: 45
  },
  {
    type: ItemType.AMULET,
    name: 'Amulett',
    description: 'Verbessert alle Stats leicht',
    baseEffect: 5,
    effectType: ItemEffectType.ALL_STATS,
    spriteKey: 'item_amulet',
    baseCost: 80
  }
];

let itemIdCounter = 0;

/**
 * Generates a unique item ID.
 */
function generateItemId(): string {
  return `item_${Date.now()}_${itemIdCounter++}`;
}

/**
 * Finds an item definition by type.
 */
export function getItemDefinition(type: ItemType): ItemDefinition | undefined {
  return ITEM_DEFINITIONS.find(def => def.type === type);
}

/**
 * Creates an item with specific type and rarity.
 */
export function createItem(type: ItemType, rarity: Rarity): Item | null {
  const definition = getItemDefinition(type);
  if (!definition) return null;

  const multiplier = getRarityMultiplier(rarity);
  const effectValue = Math.round(definition.baseEffect * multiplier);
  const finalCost = Math.round(definition.baseCost * multiplier);

  return {
    id: generateItemId(),
    definition,
    rarity,
    effectValue,
    finalCost
  };
}

/**
 * Creates a random item with random rarity.
 */
export function generateRandomItem(randomFn: () => number = Math.random): Item {
  // Choose random type
  const types = Object.values(ItemType);
  const randomType = types[Math.floor(randomFn() * types.length)];

  // Roll random rarity
  const rarity = rollRarity(randomFn);

  return createItem(randomType, rarity)!;
}

/**
 * Returns a readable description of the item effect.
 */
export function getItemEffectDescription(item: Item): string {
  const { effectType } = item.definition;
  const value = item.effectValue;

  switch (effectType) {
    case ItemEffectType.DAMAGE_FLAT:
      return `+${value} Schaden`;
    case ItemEffectType.DAMAGE_REDUCTION:
      return `-${value}% eingehender Schaden`;
    case ItemEffectType.HP_FLAT:
      return `+${value} max HP`;
    case ItemEffectType.BLOCK_CHANCE:
      return `${value}% Block-Chance`;
    case ItemEffectType.SPEED:
      return `+${value}% Geschwindigkeit`;
    case ItemEffectType.ALL_STATS:
      return `+${value}% alle Stats`;
    default:
      return `+${value}`;
  }
}
