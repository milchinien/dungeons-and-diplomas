import type { SelectedQuestion } from './QuestionSelector';
import { calculatePlayerDamage, calculateEnemyDamage } from './DamageCalculator';

/**
 * Result of processing a combat answer
 */
export interface AnswerResult {
  isCorrect: boolean;
  isTimeout: boolean;
  damage: number;
  targetedPlayer: boolean; // true if damage was dealt to player
  feedbackMessage: string;
  correctAnswerText: string;
}

/**
 * Pure function combat engine.
 * Extracts business logic from useCombat hook for better testability and reusability.
 */
export class CombatEngine {
  /**
   * Process a combat answer and calculate the result.
   * This is a pure function with no side effects.
   *
   * @param selectedIndex The index of the selected answer (-1 for timeout)
   * @param question The current question being answered
   * @param playerElo The player's current ELO for this subject
   * @param enemyLevel The enemy's level
   * @returns The result of the answer including damage and feedback
   */
  static processAnswer(
    selectedIndex: number,
    question: SelectedQuestion,
    playerElo: number,
    enemyLevel: number
  ): AnswerResult {
    const isTimeout = selectedIndex === -1;
    const isCorrect = selectedIndex === question.correctIndex;
    const correctAnswerText = question.shuffledAnswers[question.correctIndex];

    if (isCorrect) {
      const damage = calculatePlayerDamage(playerElo, enemyLevel);
      return {
        isCorrect: true,
        isTimeout: false,
        damage,
        targetedPlayer: false,
        feedbackMessage: `✓ Richtig! ${damage} Schaden!`,
        correctAnswerText
      };
    } else {
      const damage = calculateEnemyDamage(playerElo, enemyLevel);
      const feedbackMessage = isTimeout
        ? `✗ Zeit abgelaufen! Richtige Antwort: ${correctAnswerText} (-${damage} HP)`
        : `✗ Falsch! Richtige Antwort: ${correctAnswerText} (-${damage} HP)`;

      return {
        isCorrect: false,
        isTimeout,
        damage,
        targetedPlayer: true,
        feedbackMessage,
        correctAnswerText
      };
    }
  }

  /**
   * Calculate the dynamic time limit for a question based on enemy and question difficulty.
   *
   * @param enemyLevel The enemy's level (1-10)
   * @param questionElo The question's ELO (null if unanswered)
   * @returns Time limit in seconds (clamped between 3 and 25)
   */
  static calculateDynamicTimeLimit(
    enemyLevel: number,
    questionElo: number | null
  ): number {
    // Question level = 11 - ELO (lower ELO = harder question = higher level)
    const questionLevel = questionElo !== null ? 11 - questionElo : 6; // Default to middle if no ELO
    const levelDifference = enemyLevel - questionLevel;
    // Clamp between 3 and 25 seconds
    return Math.max(3, Math.min(25, 13 - levelDifference));
  }

  /**
   * Check if combat should end based on current HP values.
   *
   * @param enemyAlive Whether the enemy is still alive
   * @param playerHp The player's current HP
   * @returns true if combat should end
   */
  static shouldEndCombat(enemyAlive: boolean, playerHp: number): boolean {
    return !enemyAlive || playerHp <= 0;
  }

  /**
   * Determine the combat outcome.
   *
   * @param enemyAlive Whether the enemy is still alive
   * @param playerHp The player's current HP
   * @returns 'victory', 'defeat', or 'ongoing'
   */
  static getCombatOutcome(
    enemyAlive: boolean,
    playerHp: number
  ): 'victory' | 'defeat' | 'ongoing' {
    if (!enemyAlive) return 'victory';
    if (playerHp <= 0) return 'defeat';
    return 'ongoing';
  }
}
