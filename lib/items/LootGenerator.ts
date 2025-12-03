/**
 * Loot Generator - generates item drops from enemies
 */

import type { ItemRarity, DroppedItem } from './types';
import { RARITY_WEIGHTS } from './types';
import { getRandomItemByRarity } from './itemDatabase';

// Drop chance per enemy level (percentage, 0-100)
// Lower drop rates to make items feel more valuable
const DROP_CHANCE_BY_LEVEL: Record<number, number> = {
  1: 5,
  2: 7,
  3: 10,
  4: 12,
  5: 15,
  6: 17,
  7: 20,
  8: 100, // Bosses (level 8+) handled separately with 100% drop
  9: 100,
  10: 100,
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

// Boss level threshold (enemies with level >= this are considered bosses)
const BOSS_LEVEL_THRESHOLD = 8;

/**
 * Check if an enemy is a boss based on level
 */
export function isBoss(enemyLevel: number): boolean {
  return enemyLevel >= BOSS_LEVEL_THRESHOLD;
}

/**
 * Select rarity for boss drops (uncommon or better, weighted towards rare)
 */
function selectBossRarity(): ItemRarity {
  // Boss drop weights: only uncommon, rare, epic, legendary
  const bossWeights: Record<ItemRarity, number> = {
    common: 0,      // Bosses never drop common
    uncommon: 40,   // 40% chance for green
    rare: 40,       // 40% chance for blue
    epic: 15,       // 15% chance for purple
    legendary: 5,   // 5% chance for orange
  };

  const rarities = Object.keys(bossWeights) as ItemRarity[];
  const totalWeight = Object.values(bossWeights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (const rarity of rarities) {
    random -= bossWeights[rarity];
    if (random <= 0) {
      return rarity;
    }
  }

  return 'uncommon'; // Fallback to uncommon (guaranteed green minimum)
}

/**
 * Generate loot for a defeated boss
 * Bosses always drop items with uncommon (green) rarity or better
 * @param bossLevel The level of the defeated boss
 * @param bossX World position X (pixels)
 * @param bossY World position Y (pixels)
 * @param tileSize Size of a tile in pixels
 * @returns DroppedItem - bosses always drop an item
 */
export function generateBossLoot(
  bossLevel: number,
  bossX: number,
  bossY: number,
  tileSize: number
): DroppedItem {
  // Bosses always drop uncommon (green) or better items
  const rarity = selectBossRarity();
  const item = getRandomItemByRarity(rarity);

  if (!item) {
    throw new Error(`No items available for rarity: ${rarity}`);
  }

  // Calculate tile position
  const tileX = Math.floor(bossX / tileSize);
  const tileY = Math.floor(bossY / tileSize);

  const droppedItem: DroppedItem = {
    id: `boss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    item,
    x: bossX,
    y: bossY,
    tileX,
    tileY,
    dropTime: Date.now(),
    pickedUp: false,
  };

  console.log(`[LootGenerator] Boss (level ${bossLevel}) dropped ${rarity} ${item.name} at tile (${tileX}, ${tileY})`);

  return droppedItem;
}
