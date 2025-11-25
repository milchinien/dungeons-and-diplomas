import { useReducer, useRef, useCallback, useEffect } from 'react';
import type { Enemy } from '@/lib/enemy';
import type { Player } from '@/lib/enemy';
import type { QuestionDatabase } from '@/lib/questions';
import { COMBAT_FEEDBACK_DELAY, PLAYER_MAX_HP } from '@/lib/constants';
import { selectQuestionFromPool } from '@/lib/combat/QuestionSelector';
import { calculateEnemyXpReward } from '@/lib/scoring/LevelCalculator';
import { CombatEngine } from '@/lib/combat/CombatEngine';
import { combatReducer, initialCombatState, isInCombat } from '@/lib/combat/combatReducer';
import { api } from '@/lib/api';
import { loadSubjectElo, findSubjectElo, DEFAULT_ELO } from '@/lib/scoring/EloService';
import { useTimer } from './useTimer';
import { type Clock, defaultClock } from '@/lib/time';
import { logHookError } from '@/lib/hooks';
import { generateEnemyLoot, type DroppedItem } from '@/lib/items';

interface UseCombatProps {
  questionDatabase: QuestionDatabase | null;
  userId: number | null;
  playerRef: React.MutableRefObject<Player>;
  onUpdateSessionScores: (subjectKey: string) => void;
  onPlayerHpUpdate: (hp: number) => void;
  onGameRestart: () => void;
  onXpGained?: (amount: number) => void;
  onItemDropped?: (item: DroppedItem) => void;
  tileSize?: number;
  clock?: Clock;
}

export function useCombat({
  questionDatabase,
  userId,
  playerRef,
  onUpdateSessionScores,
  onPlayerHpUpdate,
  onGameRestart,
  onXpGained,
  onItemDropped,
  tileSize = 64,
  clock = defaultClock
}: UseCombatProps) {
  const [state, dispatch] = useReducer(combatReducer, initialCombatState);

  // Ref to track current inCombat state for synchronous access in game loop
  const inCombatRef = useRef(false);

  // Keep inCombatRef in sync with reducer state
  useEffect(() => {
    inCombatRef.current = isInCombat(state);
  }, [state.phase]);

  // Timeout handler ref for timer callback
  const handleTimeoutRef = useRef<() => void>(() => {});

  // Timer hook
  const { timeRemaining: combatTimer, start: startTimer, stop: stopTimer } = useTimer({
    initialDuration: 10,
    onExpire: () => handleTimeoutRef.current()
  });

  const loadPlayerElo = useCallback(async (subjectKey: string) => {
    if (!userId) return;

    const elo = await loadSubjectElo(userId, subjectKey);
    dispatch({ type: 'SET_PLAYER_ELO', elo });
  }, [userId]);

  const endCombat = useCallback(async () => {
    stopTimer();

    const enemy = state.enemy;
    if (enemy && !enemy.alive && userId) {
      const xpReward = calculateEnemyXpReward(enemy.level, state.playerElo);

      try {
        await api.xp.addXp({
          user_id: userId,
          xp_amount: xpReward,
          reason: 'enemy_defeated',
          enemy_level: enemy.level
        });

        if (onXpGained) {
          onXpGained(xpReward);
        }

        // Generate loot drop
        const droppedItem = generateEnemyLoot(enemy.level, enemy.x, enemy.y, tileSize);
        if (droppedItem && onItemDropped) {
          console.log(`[useCombat] Item dropped: ${droppedItem.item.name}`);
          onItemDropped(droppedItem);
        }

        dispatch({ type: 'SHOW_VICTORY', xp: xpReward });
        return;
      } catch (error) {
        logHookError('useCombat', error, 'Failed to award XP');
      }
    }

    if (playerRef.current.hp <= 0) {
      dispatch({ type: 'SHOW_DEFEAT' });
    } else {
      dispatch({ type: 'END_COMBAT' });
    }
  }, [state.enemy, state.playerElo, userId, onXpGained, onItemDropped, tileSize, stopTimer, playerRef]);

  const askQuestion = useCallback(async () => {
    const enemy = state.enemy;
    if (!enemy?.alive || playerRef.current.hp <= 0) {
      endCombat();
      return;
    }

    if (!questionDatabase || !userId) {
      logHookError('useCombat', new Error('Question database or user not loaded'), 'Combat prerequisites not met');
      dispatch({ type: 'END_COMBAT' });
      return;
    }

    try {
      const questionsWithElo = await api.questions.getQuestionsWithElo(enemy.subject, userId);
      const question = selectQuestionFromPool(questionsWithElo, enemy.level, state.askedQuestionIds);

      if (!question) {
        logHookError('useCombat', new Error('No questions available for combat'), 'Question pool exhausted');
        dispatch({ type: 'END_COMBAT' });
        return;
      }

      const dynamicTimeLimit = CombatEngine.calculateDynamicTimeLimit(enemy.level, question.elo);

      dispatch({
        type: 'ASK_QUESTION',
        question,
        questionStartTime: clock.now()
      });

      handleTimeoutRef.current = () => answerQuestion(-1);
      startTimer(dynamicTimeLimit);
    } catch (error) {
      logHookError('useCombat', error, 'Failed to fetch questions');
      dispatch({ type: 'END_COMBAT' });
    }
  }, [state.enemy, state.askedQuestionIds, questionDatabase, userId, playerRef, clock, startTimer, endCombat]);

  const answerQuestion = useCallback(async (selectedIndex: number) => {
    stopTimer();

    const question = state.question;
    const enemy = state.enemy;
    if (!question || !enemy) return;

    const answerTimeMs = clock.now() - state.questionStartTime;
    const isTimeout = selectedIndex === -1;

    const result = CombatEngine.processAnswer(selectedIndex, question, state.playerElo, enemy.level);

    // Track answer in database
    if (userId && question.id) {
      try {
        await api.answers.logAnswer({
          user_id: userId,
          question_id: question.id,
          selected_answer_index: isTimeout ? -1 : selectedIndex,
          is_correct: result.isCorrect,
          answer_time_ms: answerTimeMs,
          timeout_occurred: result.isTimeout
        });

        onUpdateSessionScores(state.subject);
        await loadPlayerElo(state.subject);
      } catch (error) {
        logHookError('useCombat', error, 'Failed to track answer');
      }
    }

    // Apply damage
    if (result.targetedPlayer) {
      playerRef.current.hp -= result.damage;
      if (playerRef.current.hp < 0) playerRef.current.hp = 0;
      onPlayerHpUpdate(playerRef.current.hp);
    } else {
      enemy.takeDamage(result.damage);
    }

    dispatch({
      type: 'SHOW_FEEDBACK',
      feedback: result.feedbackMessage,
      enemyHp: enemy.hp
    });

    // Check combat outcome
    if (CombatEngine.shouldEndCombat(enemy.alive, playerRef.current.hp)) {
      setTimeout(() => endCombat(), COMBAT_FEEDBACK_DELAY);
    } else {
      setTimeout(() => askQuestion(), COMBAT_FEEDBACK_DELAY);
    }
  }, [state.question, state.enemy, state.questionStartTime, state.subject, state.playerElo, userId, clock, stopTimer, loadPlayerElo, onUpdateSessionScores, onPlayerHpUpdate, playerRef, endCombat, askQuestion]);

  // Update timeout ref when answerQuestion changes
  useEffect(() => {
    if (state.phase === 'active') {
      handleTimeoutRef.current = () => answerQuestion(-1);
    }
  }, [state.phase, answerQuestion]);

  const startCombat = useCallback(async (enemy: Enemy) => {
    if (!questionDatabase || !userId) {
      logHookError('useCombat', new Error('Question database or user not loaded yet'), 'Cannot start combat');
      return;
    }

    const subjectDisplay = questionDatabase[enemy.subject]?.subject || enemy.subject;
    dispatch({ type: 'START_COMBAT', enemy, subjectDisplay });

    // Load ELO then ask first question
    const elo = await loadSubjectElo(userId, enemy.subject);
    dispatch({ type: 'SET_PLAYER_ELO', elo });

    // Need to ask question after state is updated - use immediate invocation
    setTimeout(async () => {
      if (!enemy.alive || playerRef.current.hp <= 0) return;

      try {
        const questionsWithElo = await api.questions.getQuestionsWithElo(enemy.subject, userId);
        const question = selectQuestionFromPool(questionsWithElo, enemy.level, new Set());

        if (!question) {
          logHookError('useCombat', new Error('No questions available for initial combat'), 'Question pool exhausted');
          dispatch({ type: 'END_COMBAT' });
          return;
        }

        const dynamicTimeLimit = CombatEngine.calculateDynamicTimeLimit(enemy.level, question.elo);

        dispatch({
          type: 'ASK_QUESTION',
          question,
          questionStartTime: clock.now()
        });

        handleTimeoutRef.current = () => answerQuestion(-1);
        startTimer(dynamicTimeLimit);
      } catch (error) {
        logHookError('useCombat', error, 'Failed to start combat');
        dispatch({ type: 'END_COMBAT' });
      }
    }, 0);
  }, [questionDatabase, userId, playerRef, clock, startTimer, answerQuestion]);

  const handleVictoryComplete = useCallback(() => {
    dispatch({ type: 'DISMISS_VICTORY' });
  }, []);

  const handleDefeatRestart = useCallback(() => {
    dispatch({ type: 'DISMISS_DEFEAT' });
    playerRef.current.hp = PLAYER_MAX_HP;
    onPlayerHpUpdate(PLAYER_MAX_HP);
    onGameRestart();
  }, [playerRef, onPlayerHpUpdate, onGameRestart]);

  // Derived state for backwards compatibility
  const inCombat = isInCombat(state);
  const showVictory = state.phase === 'victory';
  const showDefeat = state.phase === 'defeat';

  return {
    inCombat,
    inCombatRef,
    combatSubject: state.subjectDisplay,
    combatQuestion: state.question,
    combatTimer,
    combatFeedback: state.feedback,
    enemyHp: state.enemyHp,
    currentEnemyRef: { current: state.enemy } as React.MutableRefObject<Enemy | null>,
    startCombat,
    answerQuestion,
    showVictory,
    victoryXp: state.victoryXp,
    showDefeat,
    handleVictoryComplete,
    handleDefeatRestart
  };
}
