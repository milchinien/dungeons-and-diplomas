/**
 * Level Calculator for Player XP System
 *
 * Level progression formula:
 * - Level 1: 0 - 499 XP
 * - Level 2: 500 - 1499 XP
 * - Level n: (n-1) * 500 to n * 500 - 1 XP
 */

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpIntoLevel: number;
  xpNeededForNextLevel: number;
  progressPercent: number;
}

/**
 * Calculate XP needed for a specific level
 */
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * 500;
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXp(xp: number): number {
  if (xp < 500) return 1;
  return Math.floor(xp / 500) + 1;
}

/**
 * Calculate complete level information from XP
 */
export function getLevelInfo(xp: number): LevelInfo {
  const level = getLevelFromXp(xp);
  const xpForCurrentLevel = getXpForLevel(level);
  const xpForNextLevel = getXpForLevel(level + 1);
  const xpIntoLevel = xp - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = (xpIntoLevel / xpNeededForNextLevel) * 100;

  return {
    level,
    currentXp: xp,
    xpForCurrentLevel,
    xpForNextLevel,
    xpIntoLevel,
    xpNeededForNextLevel,
    progressPercent
  };
}

/**
 * Calculate base XP reward for defeating an enemy
 * Formula: (enemyLevel + 4) * 10
 *
 * Examples:
 * - Level 1 enemy: (1 + 4) * 10 = 50 base XP
 * - Level 5 enemy: (5 + 4) * 10 = 90 base XP
 * - Level 10 enemy: (10 + 4) * 10 = 140 base XP
 */
export function calculateBaseEnemyXp(enemyLevel: number): number {
  return (enemyLevel + 4) * 10;
}

/**
 * Calculate XP reward for defeating an enemy with skill-based multiplier
 *
 * Base XP: (enemyLevel + 4) * 10
 * Multiplier: 1 + (enemyLevel - playerElo) / 10
 *
 * Multiplier ranges from 0.1 (easy kill) to 1.9 (hard kill)
 *
 * Examples:
 * - ELO 10 vs Level 1: 50 * 0.1 = 5 XP (very easy)
 * - ELO 5 vs Level 5: 90 * 1.0 = 90 XP (balanced)
 * - ELO 1 vs Level 10: 140 * 1.9 = 266 XP (very hard)
 */
export function calculateEnemyXpReward(enemyLevel: number, playerElo: number): number {
  const baseXp = calculateBaseEnemyXp(enemyLevel);
  const multiplier = 1 + (enemyLevel - playerElo) / 10;
  return Math.round(baseXp * multiplier);
}
