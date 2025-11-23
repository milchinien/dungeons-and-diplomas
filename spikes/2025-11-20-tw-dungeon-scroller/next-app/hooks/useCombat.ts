import { useState, useRef } from 'react';
import type { Enemy } from '@/lib/enemy';
import type { Player } from '@/lib/enemy';
import type { QuestionDatabase } from '@/lib/questions';
import { COMBAT_TIME_LIMIT, COMBAT_FEEDBACK_DELAY, PLAYER_MAX_HP } from '@/lib/constants';
import { selectQuestionFromPool, type SelectedQuestion } from '@/lib/combat/QuestionSelector';
import { calculateEnemyXpReward } from '@/lib/scoring/LevelCalculator';
import { CombatEngine } from '@/lib/combat/CombatEngine';
import { api } from '@/lib/api';
import { useTimer } from './useTimer';
import { type Clock, defaultClock } from '@/lib/time';

interface UseCombatProps {
  questionDatabase: QuestionDatabase | null;
  userId: number | null;
  playerRef: React.MutableRefObject<Player>;
  onUpdateSessionScores: (subjectKey: string) => void;
  onPlayerHpUpdate: (hp: number) => void;
  onGameRestart: () => void;
  onXpGained?: (amount: number) => void;
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
  clock = defaultClock
}: UseCombatProps) {
  const [inCombat, setInCombat] = useState(false);
  const inCombatRef = useRef(false);
  const [combatSubject, setCombatSubject] = useState('');
  const [combatQuestion, setCombatQuestion] = useState<SelectedQuestion | null>(null);
  const [combatFeedback, setCombatFeedback] = useState('');
  const [enemyHp, setEnemyHp] = useState(0);
  const [showVictory, setShowVictory] = useState(false);
  const [victoryXp, setVictoryXp] = useState(0);
  const [showDefeat, setShowDefeat] = useState(false);

  const currentEnemyRef = useRef<Enemy | null>(null);
  const currentSubjectRef = useRef('');
  const questionStartTimeRef = useRef<number>(0);
  const askedQuestionsRef = useRef<Set<number>>(new Set());
  const currentPlayerEloRef = useRef<number>(5); // Default to middle ELO
  const handleTimeoutRef = useRef<() => void>(() => {});

  // Timer hook - callback uses ref to access current answerQuestion
  const { timeRemaining: combatTimer, start: startTimer, stop: stopTimer } = useTimer({
    initialDuration: COMBAT_TIME_LIMIT,
    onExpire: () => handleTimeoutRef.current()
  });

  const startCombat = async (enemy: Enemy) => {
    if (!questionDatabase || !userId) {
      console.error('Question database or user not loaded yet');
      return;
    }

    setInCombat(true);
    inCombatRef.current = true;
    currentEnemyRef.current = enemy;

    currentSubjectRef.current = enemy.subject;
    setCombatSubject(questionDatabase[enemy.subject]?.subject || enemy.subject);

    askedQuestionsRef.current = new Set();

    // Load current player ELO for this subject
    await loadPlayerElo(enemy.subject);

    askQuestion();
  };

  const loadPlayerElo = async (subjectKey: string) => {
    if (!userId) return;

    try {
      const eloScores = await api.elo.getSessionElo(userId);
      const subjectElo = eloScores.find((s) => s.subjectKey === subjectKey);
      currentPlayerEloRef.current = subjectElo?.averageElo || 5;
    } catch (error) {
      console.error('Failed to load player ELO:', error);
      currentPlayerEloRef.current = 5; // Default fallback
    }
  };

  const askQuestion = async () => {
    if (!currentEnemyRef.current?.alive || playerRef.current.hp <= 0) {
      endCombat();
      return;
    }

    if (!questionDatabase || !userId) {
      console.error('Question database or user not loaded');
      endCombat();
      return;
    }

    const enemy = currentEnemyRef.current;

    try {
      // Fetch questions with ELO from API
      const questionsWithElo = await api.questions.getQuestionsWithElo(enemy.subject, userId);

      // Use pure function to select question
      const question = selectQuestionFromPool(questionsWithElo, enemy.level, askedQuestionsRef.current);

      if (!question) {
        console.error('No questions available');
        endCombat();
        return;
      }

      // Calculate dynamic time limit using CombatEngine
      const dynamicTimeLimit = CombatEngine.calculateDynamicTimeLimit(enemy.level, question.elo);

      setCombatQuestion(question);
      setCombatFeedback('');
      setEnemyHp(enemy.hp);

      questionStartTimeRef.current = clock.now();

      // Update timeout handler ref and start timer with dynamic duration
      handleTimeoutRef.current = () => answerQuestion(-1);
      startTimer(dynamicTimeLimit);
    } catch (error) {
      console.error('Error fetching questions:', error);
      endCombat();
    }
  };

  const answerQuestion = async (selectedIndex: number) => {
    stopTimer();

    if (!combatQuestion || !currentEnemyRef.current) return;

    const answerTimeMs = clock.now() - questionStartTimeRef.current;
    const isTimeout = selectedIndex === -1;

    // Process answer using CombatEngine
    const playerElo = currentPlayerEloRef.current;
    const enemyLevel = currentEnemyRef.current.level;
    const result = CombatEngine.processAnswer(selectedIndex, combatQuestion, playerElo, enemyLevel);

    // Track answer in database
    if (userId && combatQuestion.id) {
      try {
        await api.answers.logAnswer({
          user_id: userId,
          question_id: combatQuestion.id,
          selected_answer_index: isTimeout ? -1 : selectedIndex,
          is_correct: result.isCorrect,
          answer_time_ms: answerTimeMs,
          timeout_occurred: result.isTimeout
        });

        onUpdateSessionScores(currentSubjectRef.current);

        // Reload player ELO after answer to update damage calculations
        await loadPlayerElo(currentSubjectRef.current);
      } catch (error) {
        console.error('Failed to track answer:', error);
      }
    }

    // Apply damage based on result
    setCombatFeedback(result.feedbackMessage);

    if (result.targetedPlayer) {
      // Enemy damages player
      playerRef.current.hp -= result.damage;
      if (playerRef.current.hp < 0) playerRef.current.hp = 0;
      onPlayerHpUpdate(playerRef.current.hp);
    } else {
      // Player damages enemy
      currentEnemyRef.current.takeDamage(result.damage);
    }

    setEnemyHp(currentEnemyRef.current.hp);

    // Check combat outcome using CombatEngine
    if (CombatEngine.shouldEndCombat(currentEnemyRef.current.alive, playerRef.current.hp)) {
      setTimeout(() => endCombat(), COMBAT_FEEDBACK_DELAY);
    } else {
      setTimeout(() => askQuestion(), COMBAT_FEEDBACK_DELAY);
    }
  };

  const endCombat = async () => {
    stopTimer();

    // Award XP if enemy was defeated
    const enemy = currentEnemyRef.current;
    if (enemy && !enemy.alive && userId) {
      const playerElo = currentPlayerEloRef.current;
      const xpReward = calculateEnemyXpReward(enemy.level, playerElo);

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

        // Show victory overlay
        setVictoryXp(xpReward);
        setShowVictory(true);
      } catch (error) {
        console.error('Failed to award XP:', error);
      }
    }

    setInCombat(false);
    inCombatRef.current = false;
    setCombatQuestion(null);
    setCombatFeedback('');

    if (playerRef.current.hp <= 0) {
      // Show defeat overlay instead of alert
      setShowDefeat(true);
    }

    currentEnemyRef.current = null;
  };

  const handleVictoryComplete = () => {
    setShowVictory(false);
    setVictoryXp(0);
  };

  const handleDefeatRestart = () => {
    setShowDefeat(false);
    playerRef.current.hp = PLAYER_MAX_HP;
    onPlayerHpUpdate(PLAYER_MAX_HP);
    onGameRestart();
  };

  return {
    inCombat,
    inCombatRef,
    combatSubject,
    combatQuestion,
    combatTimer,
    combatFeedback,
    enemyHp,
    currentEnemyRef,
    startCombat,
    answerQuestion,
    showVictory,
    victoryXp,
    showDefeat,
    handleVictoryComplete,
    handleDefeatRestart
  };
}
