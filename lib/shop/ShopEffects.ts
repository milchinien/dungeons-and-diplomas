/**
 * Shop Effects System
 *
 * Handles runtime effects from shop items and perks:
 * - HP Regeneration
 * - Movement speed bonus
 * - Combat time bonus (handled in DamageCalculator)
 * - Extra lives (handled in DamageCalculator)
 */

import type { BonusStats } from '../constants';
import { PLAYER_SPEED_TILES } from '../constants';
import type { Player } from '../enemy';

// =============================================================================
// Regeneration System
// =============================================================================

/** Tracks accumulated time for regeneration */
let regenAccumulator = 0;

/** Regeneration interval in seconds */
const REGEN_INTERVAL = 5;

/**
 * Updates HP regeneration based on shop bonus.
 * Should be called every frame with delta time.
 *
 * @param player - The player to regenerate
 * @param bonusStats - Current bonus stats from shop
 * @param dt - Delta time in seconds
 * @returns Amount of HP regenerated this frame (0 if no regen tick occurred)
 */
export function updateShopRegeneration(
  player: Player,
  bonusStats: BonusStats,
  dt: number
): number {
  // No regeneration if no bonus
  if (bonusStats.regeneration <= 0) return 0;

  // No regeneration if at full HP
  if (player.hp >= player.maxHp) {
    regenAccumulator = 0;
    return 0;
  }

  regenAccumulator += dt;

  // Check if it's time for a regen tick
  if (regenAccumulator >= REGEN_INTERVAL) {
    regenAccumulator = 0;
    const regenAmount = bonusStats.regeneration;
    const oldHp = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + regenAmount);
    const actualRegen = player.hp - oldHp;

    if (actualRegen > 0) {
      console.log(`[ShopEffects] Regenerated ${actualRegen} HP (${player.hp}/${player.maxHp})`);
    }

    return actualRegen;
  }

  return 0;
}

/**
 * Resets the regeneration timer (call on new game/dungeon).
 */
export function resetShopRegenTimer(): void {
  regenAccumulator = 0;
}

// =============================================================================
// Speed System
// =============================================================================

/**
 * Calculates effective movement speed with shop bonus.
 *
 * @param bonusStats - Current bonus stats from shop
 * @returns Effective speed in tiles per second
 */
export function getEffectiveSpeed(bonusStats: BonusStats): number {
  return PLAYER_SPEED_TILES * bonusStats.speedMultiplier;
}

/**
 * Calculates speed multiplier from shop bonus.
 * Useful when you need just the multiplier, not absolute speed.
 *
 * @param bonusStats - Current bonus stats from shop
 * @returns Speed multiplier (1.0 = normal speed)
 */
export function getSpeedMultiplier(bonusStats: BonusStats): number {
  return bonusStats.speedMultiplier;
}

// =============================================================================
// Max HP System
// =============================================================================

/**
 * Calculates effective max HP with shop bonus.
 *
 * @param baseMaxHp - Base max HP without bonuses
 * @param bonusStats - Current bonus stats from shop
 * @returns Effective max HP
 */
export function getEffectiveMaxHp(baseMaxHp: number, bonusStats: BonusStats): number {
  return baseMaxHp + bonusStats.maxHpBonus;
}
