/**
 * Answer logging database operations
 */
import { getDatabase } from './connection';
import type { AnswerLogEntry } from '../types/api';

// Re-export type for convenience
export type { AnswerLogEntry };

/**
 * Log an answer to the database
 */
export function logAnswer(entry: AnswerLogEntry): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO answer_log (user_id, question_id, selected_answer_index, is_correct, answer_time_ms, timeout_occurred)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    entry.user_id,
    entry.question_id,
    entry.selected_answer_index,
    entry.is_correct ? 1 : 0,
    entry.answer_time_ms || null,
    entry.timeout_occurred ? 1 : 0
  );
}
