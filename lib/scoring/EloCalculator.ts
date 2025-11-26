/**
 * ELO Calculator for question difficulty tracking
 *
 * Uses progressive update algorithm that gradually adjusts ELO based on answer history.
 * ELO scale: 1-10, where 1 = hardest (player struggles) and 10 = easiest (player masters)
 *
 * Algorithm:
 * - Starts at 5 (middle difficulty)
 * - Correct answer: moves towards 10 (becomes easier for player)
 * - Wrong/Timeout: moves towards 1 (becomes harder for player)
 * - Updates are incremental and gradual to prevent wild swings
 */

export interface AnswerRecord {
  is_correct: boolean;
  timeout_occurred: boolean;
}

/**
 * Calculate ELO from a sequence of answer records
 * Uses progressive updates to track how difficulty changes over time
 *
 * @param answers Array of answer records in chronological order
 * @param startingElo Initial ELO (default: 5)
 * @returns Final ELO rounded to 1 decimal place
 */
export function calculateProgressiveElo(answers: AnswerRecord[], startingElo: number = 5): number {
  let elo = startingElo;

  for (const answer of answers) {
    if (answer.timeout_occurred) {
      // Timeout: decrease ELO (question becomes harder)
      elo = Math.floor((elo - (elo - 1) / 4) * 10) / 10;
    } else if (answer.is_correct) {
      // Correct: increase ELO (question becomes easier)
      elo = Math.ceil((elo + (10 - elo) / 3) * 10) / 10;
    } else {
      // Wrong: decrease ELO (question becomes harder)
      elo = Math.floor((elo - (elo - 1) / 4) * 10) / 10;
    }
  }

  return elo;
}

/**
 * Calculate rounded ELO for display purposes
 *
 * @param answers Array of answer records
 * @param startingElo Initial ELO (default: 5)
 * @returns Final ELO rounded to nearest integer (1-10)
 */
export function calculateRoundedElo(answers: AnswerRecord[], startingElo: number = 5): number {
  return Math.round(calculateProgressiveElo(answers, startingElo));
}

/**
 * Calculate ELO or return null if no answers exist
 *
 * @param answers Array of answer records
 * @param startingElo Initial ELO (default: 5)
 * @returns ELO rounded to nearest integer or null if no answers
 */
export function calculateEloOrNull(answers: AnswerRecord[], startingElo: number = 5): number | null {
  if (answers.length === 0) {
    return null;
  }
  return calculateRoundedElo(answers, startingElo);
}

/**
 * Calculate average ELO across multiple questions
 *
 * This method calculates the ELO for each question individually,
 * then averages the results and rounds at the end.
 * This is more accurate than rounding individual ELOs first.
 *
 * @param questionAnswers Array of answer record arrays (one per question)
 * @param startingElo Initial ELO for questions with no answers (default: 5)
 * @returns Average ELO rounded to nearest integer
 */
export function calculateAverageElo(
  questionAnswers: AnswerRecord[][],
  startingElo: number = 5
): number {
  if (questionAnswers.length === 0) {
    return startingElo;
  }

  // Calculate ELO for each question (use startingElo if never answered)
  const elos = questionAnswers.map(answers => {
    if (answers.length === 0) {
      return startingElo;
    }
    return calculateProgressiveElo(answers, startingElo);
  });

  // Average first, then round (more accurate)
  const average = elos.reduce((sum, elo) => sum + elo, 0) / elos.length;
  return Math.round(average);
}
