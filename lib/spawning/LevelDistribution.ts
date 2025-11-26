/**
 * Level Distribution Utilities for Enemy Spawning
 *
 * Provides functions for generating enemy levels based on player ELO
 * using normal distribution and weighted random selection.
 */

import type { SeededRandom } from '../dungeon/SeededRandom';

// Re-export from split modules for backwards compatibility
export { calculateSubjectWeights, selectWeightedSubject } from './SubjectWeighting';
export {
  calculateEnemySpawns,
  type EnemySpawnConfig,
  type SpawnCalculationInput
} from './SpawnCalculator';

/**
 * Generate a normally distributed random number around a mean with given standard deviation
 * Uses Box-Muller transform
 *
 * @param mean Center of the distribution
 * @param stdDev Standard deviation (spread)
 * @param rng Optional seeded random generator (for reproducible dungeons)
 * @returns Random number from normal distribution
 */
export function randomNormal(mean: number, stdDev: number, rng?: SeededRandom): number {
  // Box-Muller transform
  const u1 = rng ? rng.next() : Math.random();
  const u2 = rng ? rng.next() : Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Generate enemy level for normal (empty) rooms
 * Level 1-6 based on player's ELO in the subject
 *
 * @param playerElo Player's ELO in this subject (1-10)
 * @param rng Optional seeded random generator (for reproducible dungeons)
 * @returns Enemy level (1-6), clamped and rounded
 */
export function generateNormalRoomLevel(playerElo: number, rng?: SeededRandom): number {
  // Map player ELO (1-10) to target level range (1-6)
  // Player ELO 1 → target ~1-2
  // Player ELO 5 → target ~3-4
  // Player ELO 10 → target ~5-6
  const targetLevel = 1 + (playerElo - 1) * (5 / 9);

  // Standard deviation increases slightly with player ELO (more variety for advanced players)
  const stdDev = 1.0 + (playerElo / 10) * 0.5;

  // Generate level with normal distribution
  let level = Math.round(randomNormal(targetLevel, stdDev, rng));

  // Clamp to 1-6 range
  level = Math.max(1, Math.min(6, level));

  return level;
}

/**
 * Generate enemy level for combat rooms
 * High levels (6-10) with strong bias toward 8+
 *
 * @param guaranteeHard If true, guarantee level 8+
 * @param rng Optional seeded random generator (for reproducible dungeons)
 * @returns Enemy level (6-10)
 */
export function generateCombatRoomLevel(guaranteeHard: boolean = false, rng?: SeededRandom): number {
  if (guaranteeHard) {
    // Guaranteed hard enemy: Level 8-10 with bias toward 8
    const weights = [
      { level: 8, weight: 5 },
      { level: 9, weight: 3 },
      { level: 10, weight: 2 }
    ];

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = (rng ? rng.next() : Math.random()) * totalWeight;

    for (const w of weights) {
      random -= w.weight;
      if (random <= 0) return w.level;
    }
    return 8; // Fallback
  } else {
    // Non-guaranteed enemy: Level 6-10 with normal distribution around 8
    let level = Math.round(randomNormal(8, 1.5, rng));
    level = Math.max(6, Math.min(10, level));
    return level;
  }
}
