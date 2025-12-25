/**
 * XP-related database operations
 *
 * Uses database adapter for backend-agnostic operations.
 */

import { getAdapter } from './adapters';
import type { XpLogEntry } from '../types/api';

// Re-export type for convenience
export type { XpLogEntry };

/**
 * Add XP to a user and log the gain
 */
export async function addXp(entry: XpLogEntry): Promise<void> {
  const adapter = await getAdapter();
  return adapter.addXp(entry);
}
