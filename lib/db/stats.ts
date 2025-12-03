/**
 * Statistics-related database operations
 *
 * Provides aggregated statistics for user performance tracking.
 */
import { getDatabase } from './connection';
import { calculateRoundedElo, calculateProgressiveElo, type AnswerRecord } from '../scoring/EloCalculator';

/**
 * Statistics for a single question
 */
export interface QuestionStats {
  id: number;
  question: string;
  correct: number;
  wrong: number;
  timeout: number;
  elo: number;
}

/**
 * Statistics for a subject
 */
export interface SubjectStats {
  subject_name: string;
  questions: QuestionStats[];
  average_elo: number;
}

/**
 * Full user statistics grouped by subject
 */
export interface UserStats {
  [subjectKey: string]: SubjectStats;
}

/**
 * Internal structure for aggregating question data
 */
interface QuestionAggregation {
  id: number;
  subject_key: string;
  subject_name: string;
  question: string;
  answers: AnswerRecord[];
  correct: number;
  wrong: number;
  timeout: number;
}

/**
 * Get comprehensive user statistics grouped by subject
 *
 * This function:
 * 1. Fetches all answers for a user with question details
 * 2. Groups answers by question and calculates counts
 * 3. Calculates progressive ELO per question
 * 4. Groups by subject and calculates average ELO
 *
 * @param userId User ID to get stats for
 * @returns Statistics grouped by subject
 */
export function getUserStats(userId: number): UserStats {
  const db = getDatabase();

  // Get all answers for this user with question details
  const query = `
    SELECT
      q.id,
      q.subject_key,
      q.subject_name,
      q.question,
      a.is_correct,
      a.timeout_occurred
    FROM answer_log a
    JOIN questions q ON a.question_id = q.id
    WHERE a.user_id = ?
    ORDER BY q.subject_key, q.id, a.answered_at
  `;

  const rows = db.prepare(query).all(userId) as Array<{
    id: number;
    subject_key: string;
    subject_name: string;
    question: string;
    is_correct: number;
    timeout_occurred: number;
  }>;

  // Group by question and build answer history
  const questionStats = new Map<number, QuestionAggregation>();

  for (const row of rows) {
    if (!questionStats.has(row.id)) {
      questionStats.set(row.id, {
        id: row.id,
        subject_key: row.subject_key,
        subject_name: row.subject_name,
        question: row.question,
        answers: [],
        correct: 0,
        wrong: 0,
        timeout: 0
      });
    }

    const stats = questionStats.get(row.id)!;

    // Add answer to history
    stats.answers.push({
      is_correct: row.is_correct === 1,
      timeout_occurred: row.timeout_occurred === 1
    });

    // Update counts
    if (row.timeout_occurred) {
      stats.timeout++;
    } else if (row.is_correct) {
      stats.correct++;
    } else {
      stats.wrong++;
    }
  }

  // Group by subject and calculate ELOs
  const bySubject: {
    [key: string]: {
      subject_name: string;
      questions: QuestionStats[];
      question_elos: number[];
    };
  } = {};

  questionStats.forEach((stats) => {
    if (!bySubject[stats.subject_key]) {
      bySubject[stats.subject_key] = {
        subject_name: stats.subject_name,
        questions: [],
        question_elos: []
      };
    }

    // Calculate ELO using progressive algorithm
    const roundedElo = calculateRoundedElo(stats.answers);
    const progressiveElo = calculateProgressiveElo(stats.answers);

    bySubject[stats.subject_key].questions.push({
      id: stats.id,
      question: stats.question,
      correct: stats.correct,
      wrong: stats.wrong,
      timeout: stats.timeout,
      elo: roundedElo
    });

    // Store unrounded ELO for accurate averaging
    bySubject[stats.subject_key].question_elos.push(progressiveElo);
  });

  // Calculate average ELO for each subject and build final result
  const result: UserStats = {};

  for (const [key, subject] of Object.entries(bySubject)) {
    const average =
      subject.question_elos.reduce((sum, elo) => sum + elo, 0) /
      subject.question_elos.length;

    result[key] = {
      subject_name: subject.subject_name,
      questions: subject.questions,
      average_elo: Math.round(average)
    };
  }

  return result;
}
