/**
 * Gold-related database operations
 *
 * Uses database adapter for backend-agnostic operations.
 */

import { getAdapter } from './adapters';
import type { GoldLogEntry } from '../types/api';

// Re-export type for convenience
export type { GoldLogEntry };

/**
 * Add gold to a user and log the transaction
 */
export async function addGold(entry: GoldLogEntry): Promise<void> {
  const adapter = await getAdapter();
  return adapter.addGold(entry);
}

/**
 * Get current gold balance for a user
 */
export async function getUserGold(userId: number): Promise<number> {
  const adapter = await getAdapter();
  return adapter.getUserGold(userId);
}
