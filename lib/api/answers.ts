/**
 * Answers API endpoints
 */

import { post } from './client';
import type { AnswerLogEntry, LogAnswerResponse } from '../types/api';

// Re-export types for convenience
export type { AnswerLogEntry, LogAnswerResponse };

export async function logAnswer(entry: AnswerLogEntry): Promise<LogAnswerResponse> {
  return post<LogAnswerResponse>('/api/answers', entry);
}
