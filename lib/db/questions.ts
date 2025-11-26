/**
 * Question-related database operations
 */
import { getDatabase } from './connection';
import { calculateEloOrNull, calculateProgressiveElo, type AnswerRecord } from '../scoring/EloCalculator';
import type { SubjectEloScore } from '../types/api';

// Re-export type for convenience
export type { SubjectEloScore };

// Row types
export interface QuestionRow {
  id: number;
  subject_key: string;
  subject_name: string;
  question: string;
  answers: string; // JSON string
  correct_index: number;
  difficulty: number;
  created_at: string;
}

// DTOs
export interface QuestionDTO {
  id: number;
  question: string;
  answers: string[];
  correct: number;
}

export interface SubjectDTO {
  subject: string;
  questions: QuestionDTO[];
}

export interface QuestionDatabaseDTO {
  [key: string]: SubjectDTO;
}

export interface QuestionWithElo {
  id: number;
  question: string;
  answers: string[];
  correct: number;
  elo: number | null;
  correctCount: number;
  wrongCount: number;
  timeoutCount: number;
}

/**
 * Get all questions grouped by subject
 */
export function getAllQuestions(): QuestionDatabaseDTO {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM questions ORDER BY id').all() as QuestionRow[];

  // Transform to the expected format
  const result: QuestionDatabaseDTO = {};

  for (const row of rows) {
    if (!result[row.subject_key]) {
      result[row.subject_key] = {
        subject: row.subject_name,
        questions: []
      };
    }

    result[row.subject_key].questions.push({
      id: row.id,
      question: row.question,
      answers: JSON.parse(row.answers),
      correct: row.correct_index
    });
  }

  return result;
}

/**
 * Get a question by ID
 */
export function getQuestionById(id: number): QuestionRow | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as QuestionRow | undefined;
}

/**
 * Get all distinct subjects
 */
export function getAllSubjects(): string[] {
  const db = getDatabase();
  const rows = db.prepare('SELECT DISTINCT subject_key FROM questions').all() as { subject_key: string }[];
  return rows.map(row => row.subject_key);
}

/**
 * Get questions with ELO scores for a specific subject and user
 */
export function getQuestionsWithEloBySubject(subjectKey: string, userId: number): QuestionWithElo[] {
  const db = getDatabase();

  // Get all questions for this subject
  const questionsQuery = `
    SELECT
      q.id,
      q.question,
      q.answers,
      q.correct_index
    FROM questions q
    WHERE q.subject_key = ?
    ORDER BY q.id
  `;

  const questions = db.prepare(questionsQuery).all(subjectKey) as any[];

  // Get answer history for each question
  const answersQuery = `
    SELECT
      is_correct,
      timeout_occurred
    FROM answer_log
    WHERE question_id = ? AND user_id = ?
    ORDER BY answered_at
  `;

  const answersStmt = db.prepare(answersQuery);

  return questions.map(q => {
    const answerRecords = answersStmt.all(q.id, userId) as Array<{
      is_correct: number;
      timeout_occurred: number;
    }>;

    // Convert to AnswerRecord format
    const answers: AnswerRecord[] = answerRecords.map(record => ({
      is_correct: record.is_correct === 1,
      timeout_occurred: record.timeout_occurred === 1
    }));

    // Calculate progressive ELO
    const elo = calculateEloOrNull(answers);

    // Calculate counts for display
    const correctCount = answers.filter(a => a.is_correct).length;
    const wrongCount = answers.filter(a => !a.is_correct && !a.timeout_occurred).length;
    const timeoutCount = answers.filter(a => a.timeout_occurred).length;

    return {
      id: q.id,
      question: q.question,
      answers: JSON.parse(q.answers),
      correct: q.correct_index,
      elo,
      correctCount,
      wrongCount,
      timeoutCount
    };
  });
}

/**
 * Get average ELO per subject for session tracking
 */
export function getSessionEloScores(userId: number): SubjectEloScore[] {
  const db = getDatabase();

  // Get all questions grouped by subject
  const questionsQuery = `
    SELECT
      q.subject_key,
      q.subject_name,
      q.id
    FROM questions q
    ORDER BY q.subject_key, q.id
  `;

  const questions = db.prepare(questionsQuery).all() as Array<{
    subject_key: string;
    subject_name: string;
    id: number;
  }>;

  // Get answer history for user
  const answersQuery = `
    SELECT
      question_id,
      is_correct,
      timeout_occurred
    FROM answer_log
    WHERE user_id = ?
    ORDER BY question_id, answered_at
  `;

  const allAnswers = db.prepare(answersQuery).all(userId) as Array<{
    question_id: number;
    is_correct: number;
    timeout_occurred: number;
  }>;

  // Group answers by question
  const answersByQuestion = new Map<number, AnswerRecord[]>();
  for (const answer of allAnswers) {
    if (!answersByQuestion.has(answer.question_id)) {
      answersByQuestion.set(answer.question_id, []);
    }
    answersByQuestion.get(answer.question_id)!.push({
      is_correct: answer.is_correct === 1,
      timeout_occurred: answer.timeout_occurred === 1
    });
  }

  // Calculate ELO per question, then average per subject
  const subjectElos: { [key: string]: { name: string; elos: number[] } } = {};

  for (const q of questions) {
    if (!subjectElos[q.subject_key]) {
      subjectElos[q.subject_key] = {
        name: q.subject_name,
        elos: []
      };
    }

    const answers = answersByQuestion.get(q.id) || [];
    // Use unrounded progressive ELO for accurate averaging
    const elo = answers.length > 0 ? calculateProgressiveElo(answers) : 5;
    subjectElos[q.subject_key].elos.push(elo);
  }

  // Calculate average ELO per subject (average first, then round)
  return Object.entries(subjectElos).map(([key, data]) => {
    const avg = data.elos.reduce((sum, elo) => sum + elo, 0) / data.elos.length;
    return {
      subjectKey: key,
      subjectName: data.name,
      averageElo: Math.round(avg)
    };
  });
}
