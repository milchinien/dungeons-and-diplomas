/**
 * Answer logging database operations
 *
 * Uses database adapter for backend-agnostic operations.
 */

import { getAdapter } from './adapters';
import type { AnswerLogEntry } from '../types/api';

// Re-export type for convenience
export type { AnswerLogEntry };

/**
 * Log an answer to the database
 */
export async function logAnswer(entry: AnswerLogEntry): Promise<void> {
  const adapter = await getAdapter();
  return adapter.logAnswer(entry);
}
