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
 * Calculate XP reward for defeating an enemy
 * Formula: (enemyLevel + 4) * 10
 *
 * Examples:
 * - Level 1 enemy: (1 + 4) * 10 = 50 XP
 * - Level 5 enemy: (5 + 4) * 10 = 90 XP
 * - Level 10 enemy: (10 + 4) * 10 = 140 XP
 */
export function calculateEnemyXpReward(enemyLevel: number): number {
  return (enemyLevel + 4) * 10;
}
