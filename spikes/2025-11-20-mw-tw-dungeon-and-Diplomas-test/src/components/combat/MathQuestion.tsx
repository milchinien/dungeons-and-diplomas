import { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import type { MathQuestion as MathQuestionType } from '../../types/game';

interface MathQuestionProps {
  question: MathQuestionType;
  onAnswer: (answer: number) => void;
  disabled?: boolean;
}

const QuestionContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(42, 42, 42, 0.95);
  border: 4px solid ${theme.colors.playerGreen};
  border-radius: ${theme.borderRadius.lg};
  padding: 40px;
  min-width: 550px;
  box-shadow: 0 0 40px rgba(0, 255, 0, 0.4);
  z-index: 10;
`;

const QuestionText = styled.div`
  font-size: 48px;
  color: ${theme.colors.textPrimary};
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
  font-weight: bold;
  font-family: monospace;
`;

const InputContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};
  align-items: center;
  justify-content: center;
`;

const AnswerInput = styled.input`
  width: 200px;
  height: 70px;
  font-size: 32px;
  text-align: center;
  border: 3px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background-color: ${theme.colors.background};
  color: ${theme.colors.textPrimary};
  font-family: monospace;
  font-weight: bold;

  &:focus {
    outline: none;
    border-color: ${theme.colors.playerGreen};
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.4);
  }
`;

const SubmitButton = styled.button`
  height: 70px;
  padding: 0 32px;
  font-size: 24px;
  font-weight: bold;
  background-color: ${theme.colors.playerGreen};
  color: #000;
  border: none;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.6);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Hint = styled.div`
  font-size: 18px;
  color: ${theme.colors.textSecondary};
  text-align: center;
  margin-top: ${theme.spacing.lg};
`;

export function MathQuestion({ question, onAnswer, disabled }: MathQuestionProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    const numAnswer = parseInt(answer, 10);
    if (!isNaN(numAnswer)) {
      onAnswer(numAnswer);
      setAnswer('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      handleSubmit();
    }
  };

  return (
    <QuestionContainer>
      <QuestionText>{question.question} = ?</QuestionText>
      <InputContainer>
        <AnswerInput
          type="number"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          autoFocus
          placeholder="Antwort"
        />
        <SubmitButton onClick={handleSubmit} disabled={disabled || !answer}>
          Antworten
        </SubmitButton>
      </InputContainer>
      <Hint>Gib die richtige Antwort ein und drücke Enter oder klicke auf Antworten</Hint>
    </QuestionContainer>
  );
}
