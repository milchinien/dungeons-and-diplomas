/**
 * Damage Calculator for dynamic combat damage based on player ELO vs enemy level
 *
 * Formula: 10 + (PlayerELO - EnemyLevel) * 2
 * Clamped between 5 (min) and 30 (max)
 *
 * Examples:
 * - Player ELO 10 vs Level 1 enemy: 10 + (10-1)*2 = 28 damage
 * - Player ELO 1 vs Level 10 enemy: 10 + (1-10)*2 = -8 → 5 damage (min)
 * - Player ELO 5 vs Level 5 enemy: 10 + (5-5)*2 = 10 damage
 */

export function calculatePlayerDamage(playerElo: number, enemyLevel: number): number {
  const damage = 10 + (playerElo - enemyLevel) * 2;
  return Math.max(5, Math.min(30, damage));
}

export function calculateEnemyDamage(playerElo: number, enemyLevel: number): number {
  // Enemy damage is inverse: uses enemyLevel - playerElo
  const damage = 10 + (enemyLevel - playerElo) * 2;
  return Math.max(5, Math.min(30, damage));
}
