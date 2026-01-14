/**
 * Damage Calculator for dynamic combat damage based on player ELO vs enemy level
 *
 * Formula: 10 + (PlayerELO - EnemyLevel) * 2 + damageBonus
 * Clamped between 5 (min) and 50 (max)
 *
 * Examples:
 * - Player ELO 10 vs Level 1 enemy: 10 + (10-1)*2 = 28 damage
 * - Player ELO 1 vs Level 10 enemy: 10 + (1-10)*2 = -8 → 5 damage (min)
 * - Player ELO 5 vs Level 5 enemy: 10 + (5-5)*2 = 10 damage
 * - With +5 damage bonus: 10 + 5 = 15 damage
 */

import type { BonusStats } from '../constants';
import { DEFAULT_BONUS_STATS } from '../constants';

/**
 * Calculate damage dealt by player to enemy (correct answer)
 * @param playerElo Player's ELO rating
 * @param enemyLevel Enemy's level
 * @param damageBonus Bonus damage from equipment (default 0)
 */
export function calculatePlayerDamage(
  playerElo: number,
  enemyLevel: number,
  damageBonus: number = 0
): number {
  const damage = 10 + (playerElo - enemyLevel) * 2 + damageBonus;
  return Math.max(5, Math.min(50, damage));
}

/**
 * Calculate damage dealt by enemy to player (wrong answer/timeout)
 * @param playerElo Player's ELO rating
 * @param enemyLevel Enemy's level
 * @param damageReduction Damage reduction from equipment (default 0)
 */
export function calculateEnemyDamage(
  playerElo: number,
  enemyLevel: number,
  damageReduction: number = 0
): number {
  // Enemy damage is inverse: uses enemyLevel - playerElo
  const damage = 10 + (enemyLevel - playerElo) * 2 - damageReduction;
  return Math.max(3, Math.min(50, damage)); // Min 3 damage always gets through
}

// =============================================================================
// Shop BonusStats-based damage calculations
// =============================================================================

export interface ShopDamageResult {
  damage: number;
  isCritical: boolean;
}

export interface ShopDefenseResult {
  damage: number;
  isBlocked: boolean;
}

/**
 * Apply shop bonuses to player damage (correct answer).
 * Applies damageFlat, damagePercent, and criticalChance.
 *
 * @param baseDamage - The damage before shop bonuses
 * @param bonusStats - The player's BonusStats from shop items/perks
 * @param randomFn - Optional random function for testing
 * @returns Damage result with critical hit flag
 */
export function applyShopDamageBonus(
  baseDamage: number,
  bonusStats: BonusStats = DEFAULT_BONUS_STATS,
  randomFn: () => number = Math.random
): ShopDamageResult {
  // 1. Add flat damage bonus
  let damage = baseDamage + bonusStats.damageFlat;

  // 2. Apply percentage damage increase
  damage = damage * (1 + bonusStats.damagePercent / 100);

  // 3. Check for critical hit
  let isCritical = false;
  if (randomFn() * 100 < bonusStats.criticalChance) {
    damage = damage * 2;
    isCritical = true;
  }

  // 4. Round and enforce minimum
  damage = Math.max(Math.round(damage), 1);

  return { damage, isCritical };
}

/**
 * Apply shop bonuses to enemy damage (wrong answer).
 * Applies damageReduction and blockChance.
 *
 * @param baseDamage - The damage before shop bonuses
 * @param bonusStats - The player's BonusStats from shop items/perks
 * @param randomFn - Optional random function for testing
 * @returns Defense result with blocked flag
 */
export function applyShopDefenseBonus(
  baseDamage: number,
  bonusStats: BonusStats = DEFAULT_BONUS_STATS,
  randomFn: () => number = Math.random
): ShopDefenseResult {
  // 1. Check block chance
  if (randomFn() * 100 < bonusStats.blockChance) {
    return { damage: 0, isBlocked: true };
  }

  // 2. Apply damage reduction
  let damage = baseDamage * (1 - bonusStats.damageReduction / 100);

  // 3. Round and enforce minimum
  damage = Math.max(Math.round(damage), 1);

  return { damage, isBlocked: false };
}

/**
 * Calculate time limit with shop time bonus.
 *
 * @param baseTimeLimit - Base time limit in seconds
 * @param bonusStats - The player's BonusStats from shop items/perks
 * @returns Total time limit in seconds
 */
export function calculateTimeWithBonus(
  baseTimeLimit: number,
  bonusStats: BonusStats = DEFAULT_BONUS_STATS
): number {
  return baseTimeLimit + bonusStats.timeBonus;
}

/**
 * Check if player has extra lives and consume one.
 *
 * @param bonusStats - The player's BonusStats (will be mutated!)
 * @returns True if an extra life was used
 */
export function consumeExtraLife(bonusStats: BonusStats): boolean {
  if (bonusStats.extraLives > 0) {
    bonusStats.extraLives -= 1;
    return true;
  }
  return false;
}

/**
 * Calculate HP to restore on revival (50% of max HP).
 *
 * @param maxHp - The player's maximum HP
 * @returns HP to restore
 */
export function calculateReviveHp(maxHp: number): number {
  return Math.round(maxHp * 0.5);
}
