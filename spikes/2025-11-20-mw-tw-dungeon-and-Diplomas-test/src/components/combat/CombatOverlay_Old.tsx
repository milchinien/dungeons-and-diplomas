import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import type { Question } from './QuestionUI';
import { CombatUI } from './CombatUI';
import { QuestionUI } from './QuestionUI';
import { QUESTION_DATABASE } from '../../lib/questions';
import type { Enemy } from '../../lib/Enemy';

const COMBAT_TIME_LIMIT = 10;
const DAMAGE_CORRECT = 10;
const DAMAGE_WRONG = 15;

interface CombatOverlayProps {
  enemy: Enemy;
  playerHp: number;
  playerMaxHp: number;
  onPlayerDamage: (damage: number) => void;
  onEnemyDamage: (damage: number) => void;
  onCombatEnd: (victory: boolean) => void;
}

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 1000;
`;

const VictoryContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.95);
  border: 4px solid #4CAF50;
  border-radius: 12px;
  padding: 40px 60px;
  text-align: center;
`;

const VictoryText = styled.div<{ $victory: boolean }>`
  font-size: 48px;
  font-weight: bold;
  color: ${(props) => (props.$victory ? '#4CAF50' : '#FF4444')};
  margin-bottom: 20px;
  text-shadow: 0 0 20px ${(props) => (props.$victory ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)')};
`;

const ContinueButton = styled.button`
  padding: 15px 30px;
  font-size: 20px;
  font-weight: bold;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
  }
`;

export function CombatOverlay({
  enemy,
  playerHp,
  playerMaxHp,
  onPlayerDamage,
  onEnemyDamage,
  onCombatEnd,
}: CombatOverlayProps) {
  const [currentQuestion, setCurrentQuestion] = useState<Question & { shuffledAnswers: string[]; correctIndex: number } | null>(null);
  const [currentSubject, setCurrentSubject] = useState('');
  const [feedback, setFeedback] = useState('');
  const [combatEnded, setCombatEnded] = useState(false);
  const [victory, setVictory] = useState(false);

  const askQuestion = useCallback(() => {
    if (enemy.hp <= 0 || playerHp <= 0) {
      return;
    }

    // Select random subject
    const subjects = Object.keys(QUESTION_DATABASE);
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    setCurrentSubject(QUESTION_DATABASE[subject].subject);

    // Select random question
    const questionPool = QUESTION_DATABASE[subject].questions;
    const questionData = questionPool[Math.floor(Math.random() * questionPool.length)];

    // Shuffle answers
    const correctAnswerText = questionData.answers[questionData.correct];
    const indices = questionData.answers.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const shuffledAnswers = indices.map((i) => questionData.answers[i]);
    const correctIndex = shuffledAnswers.indexOf(correctAnswerText);

    setCurrentQuestion({
      ...questionData,
      shuffledAnswers,
      correctIndex,
    });
    setFeedback('');
  }, [enemy.hp, playerHp]);

  useEffect(() => {
    askQuestion();
  }, [askQuestion]);

  const handleAnswer = (answerIndex: number) => {
    if (!currentQuestion) return;

    if (answerIndex === currentQuestion.correctIndex) {
      setFeedback('✓ Richtig!');
      onEnemyDamage(DAMAGE_CORRECT);

      if (enemy.hp - DAMAGE_CORRECT <= 0) {
        setTimeout(() => {
          setCombatEnded(true);
          setVictory(true);
        }, 1500);
      } else {
        setTimeout(() => askQuestion(), 1500);
      }
    } else {
      const correctAnswerText = currentQuestion.shuffledAnswers[currentQuestion.correctIndex];
      setFeedback(
        answerIndex === -1
          ? `✗ Zeit abgelaufen! Richtige Antwort: ${correctAnswerText}`
          : `✗ Falsch! Richtige Antwort: ${correctAnswerText}`
      );
      onPlayerDamage(DAMAGE_WRONG);

      if (playerHp - DAMAGE_WRONG <= 0) {
        setTimeout(() => {
          setCombatEnded(true);
          setVictory(false);
        }, 1500);
      } else {
        setTimeout(() => askQuestion(), 1500);
      }
    }
  };

  const handleContinue = () => {
    onCombatEnd(victory);
  };

  if (combatEnded) {
    return (
      <Overlay>
        <VictoryContainer>
          <VictoryText $victory={victory}>{victory ? 'SIEG!' : 'NIEDERLAGE!'}</VictoryText>
          <ContinueButton onClick={handleContinue}>Weiter</ContinueButton>
        </VictoryContainer>
      </Overlay>
    );
  }

  return (
    <Overlay>
      <CombatUI
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        enemyHp={enemy.hp}
        enemyMaxHp={enemy.maxHp}
        enemyName="Goblin"
        isBoss={false}
      />

      {currentQuestion && (
        <QuestionUI
          question={currentQuestion}
          subject={currentSubject}
          timeLimit={COMBAT_TIME_LIMIT}
          onAnswer={handleAnswer}
          feedback={feedback}
        />
      )}
    </Overlay>
  );
}
