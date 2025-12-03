/**
 * Answer shuffling utility for quiz questions
 *
 * Shuffles answer options to prevent memorization and tracks
 * the correct answer index in the shuffled array.
 */

export interface ShuffledQuestion {
  shuffledAnswers: string[];
  correctIndex: number;
}

/**
 * Shuffle answers using Fisher-Yates algorithm
 *
 * Takes an array of answers and the index of the correct answer,
 * shuffles the answers randomly, and returns the shuffled array
 * along with the new position of the correct answer.
 *
 * @param answers Array of answer strings
 * @param correctIndex Index of correct answer in original array
 * @returns Object containing shuffled answers and new correct index
 */
export function shuffleAnswers(answers: string[], correctIndex: number): ShuffledQuestion {
  // Store the correct answer text to find it later
  const correctAnswerText = answers[correctIndex];

  // Create array of indices [0, 1, 2, 3, ...]
  const indices = answers.map((_, i) => i);

  // Fisher-Yates shuffle of indices
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Map shuffled indices to answers
  const shuffledAnswers = indices.map(i => answers[i]);

  // Find new position of correct answer
  const newCorrectIndex = shuffledAnswers.indexOf(correctAnswerText);

  return {
    shuffledAnswers,
    correctIndex: newCorrectIndex
  };
}
