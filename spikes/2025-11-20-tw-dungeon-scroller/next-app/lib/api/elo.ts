/**
 * ELO API endpoints
 */

import { get } from './client';
import type { SubjectEloScore } from '../types/api';

// Re-export types for convenience
export type { SubjectEloScore };

export async function getSessionElo(userId: number): Promise<SubjectEloScore[]> {
  return get<SubjectEloScore[]>(`/api/session-elo?userId=${userId}`);
}
