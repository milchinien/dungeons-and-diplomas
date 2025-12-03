import type { Enemy } from '@/lib/enemy';
import type { SelectedQuestion } from './QuestionSelector';

/**
 * Combat state machine states
 */
export type CombatPhase = 'idle' | 'loading' | 'active' | 'feedback' | 'victory' | 'defeat';

/**
 * Consolidated combat state
 */
export interface CombatState {
  phase: CombatPhase;
  enemy: Enemy | null;
  subject: string;
  subjectDisplay: string;
  question: SelectedQuestion | null;
  feedback: string;
  enemyHp: number;
  victoryXp: number;
  askedQuestionIds: Set<number>;
  playerElo: number;
  questionStartTime: number;
}

/**
 * Initial combat state
 */
export const initialCombatState: CombatState = {
  phase: 'idle',
  enemy: null,
  subject: '',
  subjectDisplay: '',
  question: null,
  feedback: '',
  enemyHp: 0,
  victoryXp: 0,
  askedQuestionIds: new Set(),
  playerElo: 5, // Default middle ELO
  questionStartTime: 0
};

/**
 * Combat action types
 */
export type CombatAction =
  | { type: 'START_COMBAT'; enemy: Enemy; subjectDisplay: string }
  | { type: 'SET_PLAYER_ELO'; elo: number }
  | { type: 'ASK_QUESTION'; question: SelectedQuestion; questionStartTime: number }
  | { type: 'SHOW_FEEDBACK'; feedback: string; enemyHp: number }
  | { type: 'SHOW_VICTORY'; xp: number }
  | { type: 'SHOW_DEFEAT' }
  | { type: 'END_COMBAT' }
  | { type: 'DISMISS_VICTORY' }
  | { type: 'DISMISS_DEFEAT' };

/**
 * Combat state reducer
 *
 * State transitions:
 * - idle -> loading (START_COMBAT)
 * - loading -> active (ASK_QUESTION)
 * - active -> feedback (SHOW_FEEDBACK)
 * - feedback -> active (ASK_QUESTION) or victory/defeat
 * - victory -> idle (DISMISS_VICTORY)
 * - defeat -> idle (DISMISS_DEFEAT)
 */
export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  switch (action.type) {
    case 'START_COMBAT':
      return {
        ...initialCombatState,
        phase: 'loading',
        enemy: action.enemy,
        subject: action.enemy.subject,
        subjectDisplay: action.subjectDisplay,
        enemyHp: action.enemy.hp,
        askedQuestionIds: new Set()
      };

    case 'SET_PLAYER_ELO':
      return {
        ...state,
        playerElo: action.elo
      };

    case 'ASK_QUESTION':
      return {
        ...state,
        phase: 'active',
        question: action.question,
        feedback: '',
        questionStartTime: action.questionStartTime,
        askedQuestionIds: new Set([...state.askedQuestionIds, action.question.id])
      };

    case 'SHOW_FEEDBACK':
      return {
        ...state,
        phase: 'feedback',
        feedback: action.feedback,
        enemyHp: action.enemyHp
      };

    case 'SHOW_VICTORY':
      return {
        ...state,
        phase: 'victory',
        victoryXp: action.xp,
        question: null,
        feedback: ''
      };

    case 'SHOW_DEFEAT':
      return {
        ...state,
        phase: 'defeat',
        question: null,
        feedback: ''
      };

    case 'END_COMBAT':
      return {
        ...state,
        phase: 'idle',
        enemy: null,
        question: null,
        feedback: ''
      };

    case 'DISMISS_VICTORY':
      return {
        ...initialCombatState,
        phase: 'idle'
      };

    case 'DISMISS_DEFEAT':
      return {
        ...initialCombatState,
        phase: 'idle'
      };

    default:
      return state;
  }
}

/**
 * Helper to check if combat is currently active
 */
export function isInCombat(state: CombatState): boolean {
  return state.phase !== 'idle';
}

/**
 * Helper to check if waiting for player input (question displayed)
 */
export function isWaitingForAnswer(state: CombatState): boolean {
  return state.phase === 'active';
}
