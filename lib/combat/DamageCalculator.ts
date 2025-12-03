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
