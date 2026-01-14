/**
 * Balancing configuration for the shop system.
 * All tunable parameters in one place for easy adjustments.
 */

import { Rarity } from './Rarity';

/**
 * Shop spawn configuration
 */
export const SHOP_SPAWN_CONFIG = {
  /** Probability that a room becomes a shop (0.0 - 1.0) */
  spawnChance: 0.08,  // 8%

  /** Maximum number of shops per dungeon */
  maxShopsPerDungeon: 2,

  /** Minimum room size to be eligible for a shop (in tiles) */
  minRoomSize: 6,

  /** Never spawn shop as starting room */
  noStartRoom: true
};

/**
 * Shop inventory configuration
 */
export const SHOP_INVENTORY_CONFIG = {
  /** Number of items per shop */
  itemsCount: 3,

  /** Number of perks per shop */
  perksCount: 3
};

/**
 * Rarity spawn weights.
 * Higher weight = more common.
 * Total weight: 100
 */
export const RARITY_WEIGHTS = {
  [Rarity.COMMON]: 50,      // 50% chance
  [Rarity.UNCOMMON]: 25,    // 25% chance
  [Rarity.RARE]: 15,        // 15% chance
  [Rarity.EPIC]: 8,         // 8% chance
  [Rarity.LEGENDARY]: 2     // 2% chance
};

/**
 * Rarity effect multipliers.
 * These scale the base effect values of items and perks.
 */
export const RARITY_MULTIPLIERS = {
  [Rarity.COMMON]: 1.0,
  [Rarity.UNCOMMON]: 1.5,
  [Rarity.RARE]: 2.0,
  [Rarity.EPIC]: 3.0,
  [Rarity.LEGENDARY]: 5.0
};

/**
 * Effect caps to prevent game-breaking combinations.
 */
export const EFFECT_CAPS = {
  /** Maximum block chance (percentage) */
  maxBlockChance: 75,

  /** Maximum critical hit chance (percentage) */
  maxCriticalChance: 50,

  /** Maximum damage reduction (percentage) */
  maxDamageReduction: 50,

  /** Maximum extra lives */
  maxExtraLives: 3,

  /** Maximum speed multiplier */
  maxSpeedMultiplier: 2.0,

  /** Maximum time bonus (seconds) */
  maxTimeBonus: 10
};

/**
 * Animation and visual effect timings
 */
export const VISUAL_EFFECTS_CONFIG = {
  /** Duration of purchase animation (ms) */
  purchaseAnimationDuration: 500,

  /** Duration of floating text (ms) */
  floatingTextDuration: 1500,

  /** Floating item amplitude (tile multiplier) */
  floatingItemAmplitude: 0.2,

  /** Floating item speed (cycles per second) */
  floatingItemSpeed: 0.5,

  /** Legendary pulse speed (cycles per second) */
  legendaryPulseSpeed: 1.0
};

/**
 * Shop door behavior
 */
export const SHOP_DOOR_CONFIG = {
  /** Lock shop doors if enemies in adjacent rooms */
  lockWithEnemies: true,

  /** Unlock shop doors automatically when enemies defeated */
  autoUnlock: true
};

/**
 * Combat effect multipliers for shop items/perks
 */
export const COMBAT_EFFECT_CONFIG = {
  /** Critical hit damage multiplier */
  criticalDamageMultiplier: 2.0,

  /** Regeneration tick interval (seconds) */
  regenerationTickInterval: 5.0,

  /** Extra life message duration (ms) */
  extraLifeMessageDuration: 2000
};

/**
 * Validates and applies effect caps.
 * Returns the capped value.
 */
export function applyEffectCap(effectType: keyof typeof EFFECT_CAPS, value: number): number {
  const cap = EFFECT_CAPS[effectType];
  return Math.min(value, cap);
}

/**
 * Returns the total weight of all rarities.
 * Used for probability calculations.
 */
export function getTotalRarityWeight(): number {
  return Object.values(RARITY_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
}

/**
 * Calculates the spawn probability for a specific rarity.
 */
export function getRarityProbability(rarity: Rarity): number {
  const totalWeight = getTotalRarityWeight();
  return RARITY_WEIGHTS[rarity] / totalWeight;
}

/**
 * Balancing tips for common issues.
 */
export const BALANCING_TIPS = {
  playerTooStrong: 'Reduce rarity weights for Epic/Legendary, or lower effect multipliers',
  shopsTooRare: 'Increase SHOP_SPAWN_CONFIG.spawnChance',
  shopsTooCommon: 'Decrease SHOP_SPAWN_CONFIG.spawnChance or reduce maxShopsPerDungeon',
  effectsTooWeak: 'Increase base effect values in Item.ts and Perk.ts',
  legendaryTooCommon: 'Reduce RARITY_WEIGHTS.LEGENDARY to 1 or 0',
  gameTooEasy: 'Reduce effect caps and rarity multipliers'
};
