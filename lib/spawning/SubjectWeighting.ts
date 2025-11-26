/**
 * Subject Weighting Utilities for Enemy Spawning
 *
 * Provides functions for calculating and selecting subjects based on
 * player ELO - weaker subjects get more enemies.
 */

import type { SeededRandom } from '../dungeon/SeededRandom';

/**
 * Calculate subject distribution based on inverse ELO
 * Weaker subjects get more enemies
 *
 * @param subjectElos Map of subject key to average ELO
 * @returns Map of subject key to spawn weight (normalized to 0-1)
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
 * @param rng Optional seeded random generator (for reproducible dungeons)
 * @returns Selected subject key
 */
export function selectWeightedSubject(subjectWeights: { [key: string]: number }, rng?: SeededRandom): string {
  const subjects = Object.keys(subjectWeights);
  if (subjects.length === 0) return 'mathe'; // Fallback

  let random = rng ? rng.next() : Math.random();

  for (const subject of subjects) {
    random -= subjectWeights[subject];
    if (random <= 0) return subject;
  }

  // Fallback to first subject
  return subjects[0];
}
