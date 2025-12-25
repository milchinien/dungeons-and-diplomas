/**
 * Highscore-related database operations
 *
 * Uses database adapter for backend-agnostic operations.
 */

import { getAdapter } from './adapters';

export interface Highscore {
  id: number;
  user_id: number;
  username: string;
  score: number;
  enemies_defeated: number;
  rooms_explored: number;
  xp_gained: number;
  max_combo: number;
  play_time_seconds: number;
  created_at: string;
}

export interface HighscoreEntry {
  user_id: number;
  score: number;
  enemies_defeated: number;
  rooms_explored: number;
  xp_gained: number;
  max_combo: number;
  play_time_seconds: number;
}

/**
 * Save a new highscore entry
 */
export async function saveHighscore(entry: HighscoreEntry): Promise<Highscore> {
  const adapter = await getAdapter();
  return adapter.saveHighscore(entry);
}

/**
 * Get top highscores (default: top 10)
 */
export async function getTopHighscores(limit: number = 10): Promise<Highscore[]> {
  const adapter = await getAdapter();
  return adapter.getTopHighscores(limit);
}

/**
 * Get highscores for a specific user
 */
export async function getUserHighscores(userId: number, limit: number = 10): Promise<Highscore[]> {
  const adapter = await getAdapter();
  return adapter.getUserHighscores(userId, limit);
}

/**
 * Get the rank of a specific score
 */
export async function getScoreRank(score: number): Promise<number> {
  const adapter = await getAdapter();
  return adapter.getScoreRank(score);
}

/**
 * Check if a score is a new personal best for a user
 */
export async function isPersonalBest(userId: number, score: number): Promise<boolean> {
  const adapter = await getAdapter();
  return adapter.isPersonalBest(userId, score);
}

/**
 * Calculate score from game stats
 * Formula: XP + (enemies × 100) + (rooms × 50) + (max_combo × 25)
 */
export function calculateScore(stats: {
  xpGained: number;
  enemiesDefeated: number;
  roomsExplored: number;
  maxCombo: number;
}): number {
  return (
    stats.xpGained +
    stats.enemiesDefeated * 100 +
    stats.roomsExplored * 50 +
    stats.maxCombo * 25
  );
}
