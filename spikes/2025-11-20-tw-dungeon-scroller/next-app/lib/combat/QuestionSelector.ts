import type { QuestionWithElo } from '../questions';
import { shuffleAnswers } from './AnswerShuffler';

export interface SelectedQuestion extends QuestionWithElo {
  shuffledAnswers: string[];
  correctIndex: number;
}

/**
 * Pure function to select a question from a pool based on enemy level and ELO.
 *
 * Selection algorithm:
 * 1. Filter out already asked questions
 * 2. Calculate difficulty threshold: Question-ELO <= (11 - MonsterLevel)
 * 3. Pick hardest matching question (lowest ELO)
 * 4. Fallback 1: Unanswered questions (ELO = null)
 * 5. Fallback 2: Next hardest available question
 *
 * @param questions - Pool of questions with ELO data
 * @param enemyLevel - Enemy level (1-10)
 * @param askedQuestions - Set of already asked question IDs (will be mutated)
 * @param randomFn - Optional random function for deterministic testing (default: Math.random)
 * @returns Selected question with shuffled answers, or null if no questions available
 */
export function selectQuestionFromPool(
  questions: QuestionWithElo[],
  enemyLevel: number,
  askedQuestions: Set<number>,
  randomFn: () => number = Math.random
): SelectedQuestion | null {
  if (questions.length === 0) {
    return null;
  }

  // 1. Filter out already asked questions
  let availableQuestions = questions.filter((q) => !askedQuestions.has(q.id));

  if (availableQuestions.length === 0) {
    console.warn('No more questions available, reusing questions');
    askedQuestions.clear();
    availableQuestions = questions;
  }

  // 2. Calculate difficulty threshold: Question-ELO <= (11 - MonsterLevel)
  const maxElo = 11 - enemyLevel;

  // 3. Filter questions by difficulty
  const suitableQuestions = availableQuestions.filter((q) => {
    if (q.elo !== null) {
      return q.elo <= maxElo;
    }
    return false;
  });

  // 4. Select question with fallback chain
  let selectedQuestion: QuestionWithElo;

  if (suitableQuestions.length > 0) {
    // Pick from suitable questions (hardest first = lowest ELO)
    suitableQuestions.sort((a, b) => (a.elo ?? 0) - (b.elo ?? 0));
    selectedQuestion = suitableQuestions[0];
  } else {
    // Fallback 1: Unanswered questions (ELO = null)
    const unansweredQuestions = availableQuestions.filter((q) => q.elo === null);
    if (unansweredQuestions.length > 0) {
      selectedQuestion = unansweredQuestions[Math.floor(randomFn() * unansweredQuestions.length)];
    } else {
      // Fallback 2: Next hardest question
      availableQuestions.sort((a, b) => (a.elo ?? 0) - (b.elo ?? 0));
      selectedQuestion = availableQuestions[0];
    }
  }

  // Mark question as asked
  askedQuestions.add(selectedQuestion.id);

  // Shuffle answers
  const { shuffledAnswers, correctIndex } = shuffleAnswers(
    selectedQuestion.answers,
    selectedQuestion.correct
  );

  return {
    ...selectedQuestion,
    shuffledAnswers,
    correctIndex
  };
}
