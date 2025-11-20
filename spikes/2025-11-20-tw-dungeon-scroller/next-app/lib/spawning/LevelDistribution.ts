/**
 * Level Distribution Utilities for Enemy Spawning
 *
 * Provides functions for generating enemy levels based on player ELO
 * using normal distribution and weighted random selection.
 */

/**
 * Generate a normally distributed random number around a mean with given standard deviation
 * Uses Box-Muller transform
 *
 * @param mean Center of the distribution
 * @param stdDev Standard deviation (spread)
 * @returns Random number from normal distribution
 */
function randomNormal(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * Generate enemy level for normal (empty) rooms
 * Level 1-6 based on player's ELO in the subject
 *
 * @param playerElo Player's ELO in this subject (1-10)
 * @returns Enemy level (1-6), clamped and rounded
 */
export function generateNormalRoomLevel(playerElo: number): number {
  // Map player ELO (1-10) to target level range (1-6)
  // Player ELO 1 → target ~1-2
  // Player ELO 5 → target ~3-4
  // Player ELO 10 → target ~5-6
  const targetLevel = 1 + (playerElo - 1) * (5 / 9);

  // Standard deviation increases slightly with player ELO (more variety for advanced players)
  const stdDev = 1.0 + (playerElo / 10) * 0.5;

  // Generate level with normal distribution
  let level = Math.round(randomNormal(targetLevel, stdDev));

  // Clamp to 1-6 range
  level = Math.max(1, Math.min(6, level));

  return level;
}

/**
 * Generate enemy level for combat rooms
 * High levels (6-10) with strong bias toward 8+
 *
 * @param guaranteeHard If true, guarantee level 8+
 * @returns Enemy level (6-10)
 */
export function generateCombatRoomLevel(guaranteeHard: boolean = false): number {
  if (guaranteeHard) {
    // Guaranteed hard enemy: Level 8-10 with bias toward 8
    const weights = [
      { level: 8, weight: 5 },
      { level: 9, weight: 3 },
      { level: 10, weight: 2 }
    ];

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const w of weights) {
      random -= w.weight;
      if (random <= 0) return w.level;
    }
    return 8; // Fallback
  } else {
    // Non-guaranteed enemy: Level 6-10 with normal distribution around 8
    let level = Math.round(randomNormal(8, 1.5));
    level = Math.max(6, Math.min(10, level));
    return level;
  }
}

/**
 * Calculate subject distribution based on inverse ELO
 * Weaker subjects get more enemies
 *
 * @param subjectElos Map of subject key to average ELO
 * @returns Map of subject key to spawn weight
 */
export function calculateSubjectWeights(subjectElos: { [key: string]: number }): { [key: string]: number } {
  const subjects = Object.keys(subjectElos);
  if (subjects.length === 0) return {};

  // Calculate inverse weights (lower ELO = higher weight)
  // Formula: weight = (11 - ELO) to ensure positive weights
  const weights: { [key: string]: number } = {};
  let totalWeight = 0;

  for (const subject of subjects) {
    const elo = subjectElos[subject];
    const weight = 11 - elo; // ELO 1 → weight 10, ELO 10 → weight 1
    weights[subject] = weight;
    totalWeight += weight;
  }

  // Normalize to probabilities (0-1)
  for (const subject of subjects) {
    weights[subject] = weights[subject] / totalWeight;
  }

  return weights;
}

/**
 * Select a subject based on weighted probabilities
 *
 * @param subjectWeights Map of subject key to probability (0-1)
 * @returns Selected subject key
 */
export function selectWeightedSubject(subjectWeights: { [key: string]: number }): string {
  const subjects = Object.keys(subjectWeights);
  if (subjects.length === 0) return 'mathe'; // Fallback

  let random = Math.random();

  for (const subject of subjects) {
    random -= subjectWeights[subject];
    if (random <= 0) return subject;
  }

  // Fallback to first subject
  return subjects[0];
}
