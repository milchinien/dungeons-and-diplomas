/**
 * Shop purchase system.
 * Handles buying items/perks and applying their effects to the player.
 */

import type { BonusStats } from '../constants';
import { DEFAULT_BONUS_STATS } from '../constants';
import type { Item } from './Item';
import { ItemEffectType } from './Item';
import type { Perk } from './Perk';
import { PerkType } from './Perk';
import type { ShopInventory } from './ShopInventory';
import { purchaseItem, purchasePerk } from './ShopInventory';

/**
 * Player shop data - tracks items and perks bought from shops.
 * These are separate from the existing equipment/buff systems.
 */
export interface PlayerShopData {
  equippedItems: Item[];
  activePerks: Perk[];
  bonusStats: BonusStats;
}

/**
 * Creates empty shop data for a new player.
 */
export function createPlayerShopData(): PlayerShopData {
  return {
    equippedItems: [],
    activePerks: [],
    bonusStats: { ...DEFAULT_BONUS_STATS }
  };
}

/**
 * Calculates all bonus stats from items and perks.
 */
export function calculateBonusStats(
  items: Item[],
  perks: Perk[]
): BonusStats {
  const stats: BonusStats = { ...DEFAULT_BONUS_STATS };

  // Process items
  for (const item of items) {
    switch (item.definition.effectType) {
      case ItemEffectType.DAMAGE_FLAT:
        stats.damageFlat += item.effectValue;
        break;
      case ItemEffectType.DAMAGE_REDUCTION:
        stats.damageReduction += item.effectValue;
        break;
      case ItemEffectType.HP_FLAT:
        stats.maxHpBonus += item.effectValue;
        break;
      case ItemEffectType.BLOCK_CHANCE:
        stats.blockChance += item.effectValue;
        break;
      case ItemEffectType.SPEED:
        stats.speedMultiplier += item.effectValue / 100;
        break;
      case ItemEffectType.ALL_STATS:
        // Increases everything by X%
        stats.damagePercent += item.effectValue;
        stats.maxHpBonus += item.effectValue;
        break;
    }
  }

  // Process perks
  for (const perk of perks) {
    switch (perk.definition.type) {
      case PerkType.HP_FLAT:
        stats.maxHpBonus += perk.effectValue;
        break;
      case PerkType.HP_PERCENT:
        // Simplified: treat as flat bonus
        stats.maxHpBonus += perk.effectValue;
        break;
      case PerkType.DAMAGE_FLAT:
        stats.damageFlat += perk.effectValue;
        break;
      case PerkType.DAMAGE_PERCENT:
        stats.damagePercent += perk.effectValue;
        break;
      case PerkType.REGENERATION:
        stats.regeneration += perk.effectValue;
        break;
      case PerkType.CRITICAL:
        stats.criticalChance += perk.effectValue;
        break;
      case PerkType.TIME_BONUS:
        stats.timeBonus += perk.effectValue;
        break;
      case PerkType.EXTRA_LIFE:
        stats.extraLives += perk.effectValue;
        break;
      case PerkType.ELO_BOOST:
        stats.eloBonus += perk.effectValue;
        break;
    }
  }

  // Apply caps
  stats.blockChance = Math.min(stats.blockChance, 75);       // Max 75%
  stats.criticalChance = Math.min(stats.criticalChance, 50); // Max 50%
  stats.damageReduction = Math.min(stats.damageReduction, 50); // Max 50%

  return stats;
}

/**
 * Applies an item to the player's shop data.
 * @returns Updated shop data and HP increase
 */
export function applyItemToShopData(
  shopData: PlayerShopData,
  item: Item
): { shopData: PlayerShopData; hpIncrease: number } {
  const newItems = [...shopData.equippedItems, item];
  const newStats = calculateBonusStats(newItems, shopData.activePerks);

  const hpIncrease = newStats.maxHpBonus - shopData.bonusStats.maxHpBonus;

  return {
    shopData: {
      equippedItems: newItems,
      activePerks: shopData.activePerks,
      bonusStats: newStats
    },
    hpIncrease
  };
}

/**
 * Applies a perk to the player's shop data.
 * @returns Updated shop data and HP increase
 */
export function applyPerkToShopData(
  shopData: PlayerShopData,
  perk: Perk
): { shopData: PlayerShopData; hpIncrease: number } {
  const newPerks = [...shopData.activePerks, perk];
  const newStats = calculateBonusStats(shopData.equippedItems, newPerks);

  const hpIncrease = newStats.maxHpBonus - shopData.bonusStats.maxHpBonus;

  return {
    shopData: {
      equippedItems: shopData.equippedItems,
      activePerks: newPerks,
      bonusStats: newStats
    },
    hpIncrease
  };
}

/**
 * Executes an item purchase.
 * @returns New shop data, whether purchase was successful, HP increase, and the purchased item
 */
export function executeItemPurchase(
  shopData: PlayerShopData,
  inventory: ShopInventory,
  itemIndex: number
): { shopData: PlayerShopData; success: boolean; hpIncrease: number; item: Item | null } {
  const item = purchaseItem(inventory, itemIndex);

  if (!item) {
    return { shopData, success: false, hpIncrease: 0, item: null };
  }

  const result = applyItemToShopData(shopData, item);
  return {
    shopData: result.shopData,
    success: true,
    hpIncrease: result.hpIncrease,
    item
  };
}

/**
 * Executes a perk purchase.
 * @returns New shop data, whether purchase was successful, HP increase, and the purchased perk
 */
export function executePerkPurchase(
  shopData: PlayerShopData,
  inventory: ShopInventory,
  perkIndex: number
): { shopData: PlayerShopData; success: boolean; hpIncrease: number; perk: Perk | null } {
  const perk = purchasePerk(inventory, perkIndex);

  if (!perk) {
    return { shopData, success: false, hpIncrease: 0, perk: null };
  }

  const result = applyPerkToShopData(shopData, perk);
  return {
    shopData: result.shopData,
    success: true,
    hpIncrease: result.hpIncrease,
    perk
  };
}
