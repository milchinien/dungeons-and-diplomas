/**
 * ELO Service - Centralized ELO loading and transformation
 *
 * Eliminates duplication between useCombat and useScoring hooks.
 */

import { api, type SubjectEloScore } from '@/lib/api';

/** Default ELO value for new players or when no data available */
export const DEFAULT_ELO = 5;

/**
 * Loads all ELO scores for a user
 */
export async function loadAllEloScores(userId: number): Promise<SubjectEloScore[]> {
  return api.elo.getSessionElo(userId);
}

/**
 * Loads ELO for a specific subject
 * @returns The subject's ELO or DEFAULT_ELO if not found
 */
export async function loadSubjectElo(
  userId: number,
  subjectKey: string
): Promise<number> {
  try {
    const eloScores = await loadAllEloScores(userId);
    const subjectElo = eloScores.find((s) => s.subjectKey === subjectKey);
    return subjectElo?.averageElo ?? DEFAULT_ELO;
  } catch (error) {
    console.error('Failed to load subject ELO:', error);
    return DEFAULT_ELO;
  }
}

/**
 * Finds a specific subject's ELO from an already-loaded score array
 */
export function findSubjectElo(
  eloScores: SubjectEloScore[],
  subjectKey: string
): number {
  const subjectElo = eloScores.find((s) => s.subjectKey === subjectKey);
  return subjectElo?.averageElo ?? DEFAULT_ELO;
}
