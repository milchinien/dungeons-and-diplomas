import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

export interface Question {
  question: string;
  answers: string[];
  correct: number;
}

interface QuestionUIProps {
  question: Question;
  subject: string;
  timeLimit: number;
  onAnswer: (answerIndex: number) => void;
  feedback?: string;
}

const QuestionContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(26, 26, 26, 0.98) 0%, rgba(42, 42, 42, 0.95) 100%);
  border-top: 4px solid ${theme.colors.border};
  padding: ${theme.spacing.xl};
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.5);
  z-index: 10;
`;

const SubjectBadge = styled.div`
  display: inline-block;
  background: ${theme.colors.shopBlue};
  color: ${theme.colors.textPrimary};
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.sm};
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: ${theme.spacing.md};
`;

const TimerContainer = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.lg};
`;

const TimerText = styled.div<{ $warning: boolean }>`
  font-size: ${theme.fontSize.xxl};
  font-weight: bold;
  color: ${(props) => (props.$warning ? theme.colors.hpRed : theme.colors.gold)};
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  font-family: monospace;
`;

const QuestionText = styled.div`
  font-size: ${theme.fontSize.lg};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.lg};
  line-height: 1.4;
  text-align: center;
`;

const AnswersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;

const AnswerButton = styled.button<{ $disabled: boolean }>`
  padding: ${theme.spacing.md};
  font-size: ${theme.fontSize.md};
  background-color: ${theme.colors.uiDark};
  color: ${theme.colors.textPrimary};
  border: 2px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s;
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};

  &:hover:not(:disabled) {
    background-color: ${theme.colors.stone};
    border-color: ${theme.colors.playerGreen};
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const FeedbackText = styled.div<{ $isCorrect: boolean }>`
  text-align: center;
  font-size: ${theme.fontSize.lg};
  font-weight: bold;
  color: ${(props) => (props.$isCorrect ? theme.colors.hpGreen : theme.colors.hpRed)};
  margin-top: ${theme.spacing.md};
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
`;

export function QuestionUI({ question, subject, timeLimit, onAnswer, feedback }: QuestionUIProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    setTimeLeft(timeLimit);
    setAnswered(false);
  }, [question, timeLimit]);

  useEffect(() => {
    if (answered || feedback) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAnswered(true);
          onAnswer(-1); // Timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [answered, feedback, onAnswer]);

  const handleAnswer = (index: number) => {
    if (answered || feedback) return;
    setAnswered(true);
    onAnswer(index);
  };

  return (
    <QuestionContainer>
      <SubjectBadge>{subject}</SubjectBadge>

      <TimerContainer>
        <TimerText $warning={timeLeft <= 3}>Zeit: {timeLeft}s</TimerText>
      </TimerContainer>

      <QuestionText>{question.question}</QuestionText>

      <AnswersGrid>
        {question.answers.map((answer, index) => (
          <AnswerButton key={index} onClick={() => handleAnswer(index)} $disabled={answered || !!feedback}>
            {answer}
          </AnswerButton>
        ))}
      </AnswersGrid>

      {feedback && <FeedbackText $isCorrect={feedback.startsWith('✓')}>{feedback}</FeedbackText>}
    </QuestionContainer>
  );
}
