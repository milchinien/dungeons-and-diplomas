/**
 * Questions API endpoints
 */

import { get } from './client';
import type { QuestionDatabase, QuestionWithElo } from '../questions';

export async function getAllQuestions(): Promise<QuestionDatabase> {
  return get<QuestionDatabase>('/api/questions');
}

export async function getSubjects(): Promise<string[]> {
  return get<string[]>('/api/subjects');
}

export async function getQuestionsWithElo(subject: string, userId: number): Promise<QuestionWithElo[]> {
  return get<QuestionWithElo[]>(`/api/questions-with-elo?subject=${encodeURIComponent(subject)}&userId=${userId}`);
}
