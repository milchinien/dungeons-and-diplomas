/**
 * Loot Generator - generates item drops from enemies
 */

import type { ItemDefinition, ItemRarity, DroppedItem } from './types';
import { RARITY_WEIGHTS } from './types';
import { getRandomItemByRarity, getAllSlots } from './itemDatabase';
import type { EquipmentSlotKey } from './types';

// Drop chance per enemy level (percentage, 0-100)
// Higher level enemies have higher drop chance
const DROP_CHANCE_BY_LEVEL: Record<number, number> = {
  1: 20,
  2: 25,
  3: 30,
  4: 35,
  5: 40,
  6: 45,
  7: 50,
  8: 55,
  9: 60,
  10: 70,
};

/**
 * Select a random rarity based on weights
 */
function selectRarity(): ItemRarity {
  const rarities = Object.keys(RARITY_WEIGHTS) as ItemRarity[];
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (const rarity of rarities) {
    random -= RARITY_WEIGHTS[rarity];
    if (random <= 0) {
      return rarity;
    }
  }

  return 'common';
}

/**
 * Select a random equipment slot
 */
function selectSlot(): EquipmentSlotKey {
  const slots = getAllSlots();
  return slots[Math.floor(Math.random() * slots.length)];
}

/**
 * Generate loot for a defeated enemy
 * @param enemyLevel The level of the defeated enemy
 * @param enemyX World position X (pixels)
 * @param enemyY World position Y (pixels)
 * @param tileSize Size of a tile in pixels
 * @returns DroppedItem if an item drops, null otherwise
 */
export function generateEnemyLoot(
  enemyLevel: number,
  enemyX: number,
  enemyY: number,
  tileSize: number
): DroppedItem | null {
  // Get drop chance for this enemy level
  const dropChance = DROP_CHANCE_BY_LEVEL[enemyLevel] ?? DROP_CHANCE_BY_LEVEL[5];

  // Roll for drop
  const roll = Math.random() * 100;
  console.log(`[LootGenerator] Enemy level ${enemyLevel}, drop chance ${dropChance}%, roll: ${roll.toFixed(1)}`);

  if (roll > dropChance) {
    console.log('[LootGenerator] No drop this time');
    return null;
  }

  // Generate the item
  const rarity = selectRarity();
  const item = getRandomItemByRarity(rarity);
  
  if (!item) {
    console.warn('[LootGenerator] No item found for rarity:', rarity);
    return null;
  }

  // Calculate tile position
  const tileX = Math.floor(enemyX / tileSize);
  const tileY = Math.floor(enemyY / tileSize);

  const droppedItem: DroppedItem = {
    id: `drop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    item,
    x: enemyX,
    y: enemyY,
    tileX,
    tileY,
    dropTime: Date.now(),
    pickedUp: false,
  };

  console.log(`[LootGenerator] Dropped ${rarity} ${item.name} at tile (${tileX}, ${tileY})`);

  return droppedItem;
}

/**
 * Generate loot for a treasure chest
 * @param tileX Tile position X
 * @param tileY Tile position Y
 * @param tileSize Size of a tile in pixels
 * @returns DroppedItem
 */
export function generateTreasureLoot(
  tileX: number,
  tileY: number,
  tileSize: number
): DroppedItem {
  // Treasure chests always drop common items
  const item = getRandomItemByRarity('common');
  
  if (!item) {
    // Fallback to first common item if none found
    throw new Error('No common items available in database');
  }

  // Calculate world position (center of tile)
  const worldX = tileX * tileSize + tileSize / 2;
  const worldY = tileY * tileSize + tileSize / 2;

  const droppedItem: DroppedItem = {
    id: `treasure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    item,
    x: worldX,
    y: worldY,
    tileX,
    tileY,
    dropTime: Date.now(),
    pickedUp: false,
  };

  console.log(`[LootGenerator] Treasure dropped ${item.name} at tile (${tileX}, ${tileY})`);

  return droppedItem;
}
