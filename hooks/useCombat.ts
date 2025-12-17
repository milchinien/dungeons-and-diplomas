import { useReducer, useRef, useCallback, useEffect } from 'react';
import type { Enemy } from '@/lib/enemy';
import type { Player } from '@/lib/enemy';
import type { QuestionDatabase } from '@/lib/questions';
import { COMBAT_FEEDBACK_DELAY, PLAYER_MAX_HP } from '@/lib/constants';
import { selectQuestionFromPool } from '@/lib/combat/QuestionSelector';
import { calculateEnemyXpReward } from '@/lib/scoring/LevelCalculator';
import { CombatEngine, calculateHint } from '@/lib/combat/CombatEngine';
import { combatReducer, initialCombatState, isInCombat } from '@/lib/combat/combatReducer';
import { api } from '@/lib/api';
import { loadSubjectElo, findSubjectElo, DEFAULT_ELO } from '@/lib/scoring/EloService';
import { useTimer } from './useTimer';
import { type Clock, defaultClock } from '@/lib/time';
import { logHookError } from '@/lib/hooks';
import { generateEnemyLoot, generateBossLoot, isBoss, type DroppedItem, type EquipmentBonuses, DEFAULT_BONUSES } from '@/lib/items';
import { applyDamageToPlayer, getTimeBonus, getDamageBoost, getDamageReduction } from '@/lib/buff';
import { getEffectsManager } from '@/lib/effects';

interface UseCombatProps {
  questionDatabase: QuestionDatabase | null;
  userId: number | null;
  playerRef: React.MutableRefObject<Player>;
  onUpdateSessionScores: (subjectKey: string) => void;
  onPlayerHpUpdate: (hp: number) => void;
  onGameRestart: () => void;
  onXpGained?: (amount: number) => void;
  onItemDropped?: (item: DroppedItem) => void;
  /** Called when any enemy is defeated - used for session stats tracking */
  onEnemyDefeated?: () => void;
  /** Called when an enemy is defeated flawlessly (no wrong answers) - used for combo tracking */
  onEnemyDefeatedFlawless?: () => void;
  /** Called when combo should be reset (wrong answer breaks combo) */
  onComboBreak?: () => void;
  /** Called when a shrine enemy is defeated - used for shrine completion tracking */
  onShrineEnemyDefeated?: (enemyId: number, shrineId: number) => void;
  /** Equipment bonuses from currently equipped items */
  equipmentBonuses?: EquipmentBonuses;
  /** Bonus damage from combo system */
  comboBonus?: number;
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
  onEnemyDefeated,
  onEnemyDefeatedFlawless,
  onComboBreak,
  onShrineEnemyDefeated,
  equipmentBonuses = DEFAULT_BONUSES,
  comboBonus = 0,
  tileSize = 64,
  clock = defaultClock
}: UseCombatProps) {
  const [state, dispatch] = useReducer(combatReducer, initialCombatState);

  // Ref to track current inCombat state for synchronous access in game loop
  const inCombatRef = useRef(false);

  // Ref to track if current combat is flawless (no wrong answers)
  const flawlessCombatRef = useRef(true);

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
      const baseXpReward = calculateEnemyXpReward(enemy.level, state.playerElo);
      // Apply XP bonus from equipment (xpBonus is a percentage, e.g., 10 = +10% XP)
      const xpMultiplier = 1 + (equipmentBonuses.xpBonus / 100);
      const xpReward = Math.round(baseXpReward * xpMultiplier);

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

        // Track enemy defeat for session stats
        if (onEnemyDefeated) {
          onEnemyDefeated();
        }

        // Generate loot drop - bosses (level 8+) always drop uncommon+ items
        let droppedItem: DroppedItem | null;
        if (isBoss(enemy.level)) {
          // Boss always drops uncommon (green) or better
          droppedItem = generateBossLoot(enemy.level, enemy.x, enemy.y, tileSize);
          console.log(`[useCombat] Boss dropped: ${droppedItem.item.name} (${droppedItem.item.rarity})`);
        } else {
          // Regular enemy has chance-based drop
          droppedItem = generateEnemyLoot(enemy.level, enemy.x, enemy.y, tileSize);
          if (droppedItem) {
            console.log(`[useCombat] Enemy dropped: ${droppedItem.item.name} (${droppedItem.item.rarity})`);
          }
        }

        if (droppedItem && onItemDropped) {
          onItemDropped(droppedItem);
        }

        // Trigger combo increment only if combat was flawless (no wrong answers)
        if (flawlessCombatRef.current && onEnemyDefeatedFlawless) {
          onEnemyDefeatedFlawless();
        }

        // Notify shrine system if this was a shrine enemy
        if (enemy.isFromShrine && enemy.shrineId !== null && onShrineEnemyDefeated) {
          console.log(`[useCombat] Shrine enemy defeated: id=${enemy.id}, shrineId=${enemy.shrineId}`);
          onShrineEnemyDefeated(enemy.id, enemy.shrineId);
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
  }, [state.enemy, state.playerElo, userId, onXpGained, onEnemyDefeated, onItemDropped, onEnemyDefeatedFlawless, onShrineEnemyDefeated, tileSize, stopTimer, playerRef, equipmentBonuses.xpBonus]);

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

      // Apply time bonus from equipment + buffs
      const totalTimeBonus = equipmentBonuses.timeBonus + getTimeBonus(playerRef.current);
      const dynamicTimeLimit = CombatEngine.calculateDynamicTimeLimit(enemy.level, question.elo, totalTimeBonus);

      // Calculate hint based on hint chance from equipment
      const hintedAnswerIndex = calculateHint(question, equipmentBonuses.hintChance);

      dispatch({
        type: 'ASK_QUESTION',
        question,
        questionStartTime: clock.now(),
        hintedAnswerIndex
      });

      handleTimeoutRef.current = () => answerQuestion(-1);
      startTimer(dynamicTimeLimit);
    } catch (error) {
      logHookError('useCombat', error, 'Failed to fetch questions');
      dispatch({ type: 'END_COMBAT' });
    }
  }, [state.enemy, state.askedQuestionIds, questionDatabase, userId, playerRef, clock, startTimer, endCombat, equipmentBonuses.timeBonus, equipmentBonuses.hintChance]);

  const answerQuestion = useCallback(async (selectedIndex: number) => {
    stopTimer();

    const question = state.question;
    const enemy = state.enemy;
    if (!question || !enemy) return;

    const answerTimeMs = clock.now() - state.questionStartTime;
    const isTimeout = selectedIndex === -1;

    // Combine equipment bonuses with buff bonuses
    const combinedBonuses: EquipmentBonuses = {
      ...equipmentBonuses,
      damageBonus: equipmentBonuses.damageBonus + getDamageBoost(playerRef.current),
      damageReduction: equipmentBonuses.damageReduction + getDamageReduction(playerRef.current),
      timeBonus: equipmentBonuses.timeBonus + getTimeBonus(playerRef.current),
    };

    // Apply equipment bonuses and combo bonus to combat calculations
    const result = CombatEngine.processAnswer(selectedIndex, question, state.playerElo, enemy.level, combinedBonuses, comboBonus);

    // Track flawless status - wrong answer or timeout breaks the combo
    if (!result.isCorrect) {
      flawlessCombatRef.current = false;
      // Break combo immediately on wrong answer
      if (onComboBreak) {
        onComboBreak();
      }
    }

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
      // Use buff system for damage with shield absorption
      applyDamageToPlayer(playerRef.current, result.damage);
      onPlayerHpUpdate(playerRef.current.hp);

      // Trigger player damage effects (red particles + screen shake)
      const effectsManager = getEffectsManager();
      const playerCenterX = playerRef.current.x + playerRef.current.width / 2;
      const playerCenterY = playerRef.current.y + playerRef.current.height / 2;
      effectsManager.onPlayerDamage(playerCenterX, playerCenterY, result.damage);
    } else {
      enemy.takeDamage(result.damage);

      // Trigger enemy hit effects (sparks)
      const effectsManager = getEffectsManager();
      const enemyCenterX = enemy.x * tileSize + tileSize / 2;
      const enemyCenterY = enemy.y * tileSize + tileSize / 2;
      effectsManager.onEnemyHit(enemyCenterX, enemyCenterY);
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
  }, [state.question, state.enemy, state.questionStartTime, state.subject, state.playerElo, userId, clock, stopTimer, loadPlayerElo, onUpdateSessionScores, onPlayerHpUpdate, playerRef, endCombat, askQuestion, equipmentBonuses, onComboBreak]);

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

    // Reset flawless tracking for new combat
    flawlessCombatRef.current = true;

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

        // Apply time bonus from equipment + buffs
        const totalTimeBonus = equipmentBonuses.timeBonus + getTimeBonus(playerRef.current);
        const dynamicTimeLimit = CombatEngine.calculateDynamicTimeLimit(enemy.level, question.elo, totalTimeBonus);

        // Calculate hint based on hint chance from equipment
        const hintedAnswerIndex = calculateHint(question, equipmentBonuses.hintChance);

        dispatch({
          type: 'ASK_QUESTION',
          question,
          questionStartTime: clock.now(),
          hintedAnswerIndex
        });

        handleTimeoutRef.current = () => answerQuestion(-1);
        startTimer(dynamicTimeLimit);
      } catch (error) {
        logHookError('useCombat', error, 'Failed to start combat');
        dispatch({ type: 'END_COMBAT' });
      }
    }, 0);
  }, [questionDatabase, userId, playerRef, clock, startTimer, answerQuestion, equipmentBonuses.timeBonus, equipmentBonuses.hintChance]);

  const handleVictoryComplete = useCallback(() => {
    dispatch({ type: 'DISMISS_VICTORY' });
  }, []);

  const handleDefeatRestart = useCallback(() => {
    dispatch({ type: 'DISMISS_DEFEAT' });
    playerRef.current.hp = PLAYER_MAX_HP;
    onPlayerHpUpdate(PLAYER_MAX_HP);
    onGameRestart();
  }, [playerRef, onPlayerHpUpdate, onGameRestart]);

  // Trigger defeat from outside combat (e.g., trashmob damage)
  const triggerDefeat = useCallback(() => {
    dispatch({ type: 'SHOW_DEFEAT' });
  }, []);

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
    handleDefeatRestart,
    hintedAnswerIndex: state.hintedAnswerIndex,
    triggerDefeat
  };
}
