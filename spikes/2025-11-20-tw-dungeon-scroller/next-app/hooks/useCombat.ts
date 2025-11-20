import { useState, useRef } from 'react';
import type { Enemy } from '@/lib/Enemy';
import type { Player } from '@/lib/Enemy';
import type { Question, QuestionDatabase } from '@/lib/questions';
import { COMBAT_TIME_LIMIT, COMBAT_FEEDBACK_DELAY, DAMAGE_CORRECT, DAMAGE_WRONG, PLAYER_MAX_HP } from '@/lib/constants';
import { selectQuestion } from '@/lib/combat/QuestionSelector';
import { calculateEnemyXpReward } from '@/lib/scoring/LevelCalculator';

interface UseCombatProps {
  questionDatabase: QuestionDatabase | null;
  userId: number | null;
  playerRef: React.MutableRefObject<Player>;
  onUpdateSessionScores: (subjectKey: string) => void;
  onPlayerHpUpdate: (hp: number) => void;
  onGameRestart: () => void;
  onXpGained?: (amount: number) => void;
}

export function useCombat({
  questionDatabase,
  userId,
  playerRef,
  onUpdateSessionScores,
  onPlayerHpUpdate,
  onGameRestart,
  onXpGained
}: UseCombatProps) {
  const [inCombat, setInCombat] = useState(false);
  const inCombatRef = useRef(false);
  const [combatSubject, setCombatSubject] = useState('');
  const [combatQuestion, setCombatQuestion] = useState<Question & { shuffledAnswers: string[]; correctIndex: number; elo: number | null } | null>(null);
  const [combatTimer, setCombatTimer] = useState(COMBAT_TIME_LIMIT);
  const [combatFeedback, setCombatFeedback] = useState('');
  const [enemyHp, setEnemyHp] = useState(0);

  const currentEnemyRef = useRef<Enemy | null>(null);
  const combatTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSubjectRef = useRef('');
  const questionStartTimeRef = useRef<number>(0);
  const askedQuestionsRef = useRef<Set<number>>(new Set());

  const startCombat = (enemy: Enemy) => {
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

    askQuestion();
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
      const question = await selectQuestion(enemy, userId, askedQuestionsRef.current);

      setCombatQuestion(question);
      setCombatFeedback('');
      setCombatTimer(COMBAT_TIME_LIMIT);
      setEnemyHp(enemy.hp);

      questionStartTimeRef.current = Date.now();

      if (combatTimerIntervalRef.current) clearInterval(combatTimerIntervalRef.current);
      combatTimerIntervalRef.current = setInterval(() => {
        setCombatTimer(prev => {
          if (prev <= 1) {
            if (combatTimerIntervalRef.current) clearInterval(combatTimerIntervalRef.current);
            answerQuestion(-1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error fetching questions:', error);
      endCombat();
    }
  };

  const answerQuestion = async (selectedIndex: number) => {
    if (combatTimerIntervalRef.current) {
      clearInterval(combatTimerIntervalRef.current);
      combatTimerIntervalRef.current = null;
    }

    if (!combatQuestion || !currentEnemyRef.current) return;

    const answerTimeMs = Date.now() - questionStartTimeRef.current;
    const isTimeout = selectedIndex === -1;
    const isCorrect = selectedIndex === combatQuestion.correctIndex;

    // Track answer in database
    if (userId && combatQuestion.id) {
      try {
        await fetch('/api/answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            question_id: combatQuestion.id,
            selected_answer_index: isTimeout ? -1 : selectedIndex,
            is_correct: isCorrect,
            answer_time_ms: answerTimeMs,
            timeout_occurred: isTimeout
          })
        });

        onUpdateSessionScores(currentSubjectRef.current);
      } catch (error) {
        console.error('Failed to track answer:', error);
      }
    }

    if (isCorrect) {
      setCombatFeedback('✓ Richtig!');
      currentEnemyRef.current.takeDamage(DAMAGE_CORRECT);
    } else {
      const correctAnswerText = combatQuestion.shuffledAnswers[combatQuestion.correctIndex];
      setCombatFeedback(
        isTimeout
          ? `✗ Zeit abgelaufen! Richtige Antwort: ${correctAnswerText}`
          : `✗ Falsch! Richtige Antwort: ${correctAnswerText}`
      );
      playerRef.current.hp -= DAMAGE_WRONG;
      if (playerRef.current.hp < 0) playerRef.current.hp = 0;
      onPlayerHpUpdate(playerRef.current.hp);
    }

    setEnemyHp(currentEnemyRef.current.hp);

    if (!currentEnemyRef.current.alive || playerRef.current.hp <= 0) {
      setTimeout(() => endCombat(), COMBAT_FEEDBACK_DELAY);
    } else {
      setTimeout(() => askQuestion(), COMBAT_FEEDBACK_DELAY);
    }
  };

  const endCombat = async () => {
    if (combatTimerIntervalRef.current) {
      clearInterval(combatTimerIntervalRef.current);
      combatTimerIntervalRef.current = null;
    }

    // Award XP if enemy was defeated
    const enemy = currentEnemyRef.current;
    if (enemy && !enemy.alive && userId) {
      const xpReward = calculateEnemyXpReward(enemy.level);

      try {
        await fetch('/api/xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            xp_amount: xpReward,
            reason: 'enemy_defeated',
            enemy_level: enemy.level
          })
        });

        if (onXpGained) {
          onXpGained(xpReward);
        }
      } catch (error) {
        console.error('Failed to award XP:', error);
      }
    }

    setInCombat(false);
    inCombatRef.current = false;
    setCombatQuestion(null);
    setCombatFeedback('');

    if (playerRef.current.hp <= 0) {
      setTimeout(() => {
        alert('Du wurdest besiegt! Das Spiel wird neu gestartet.');
        onGameRestart();
      }, 500);
    }

    currentEnemyRef.current = null;
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
    answerQuestion
  };
}
