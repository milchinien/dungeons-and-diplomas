import { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { MathQuestion as MathQuestionType } from '../../types/game';

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
  border: 3px solid ${theme.colors.playerGreen};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.xl};
  min-width: 400px;
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
  z-index: 10;
`;

const QuestionText = styled.div`
  font-size: ${theme.fontSize.xl};
  color: ${theme.colors.textPrimary};
  text-align: center;
  margin-bottom: ${theme.spacing.lg};
  font-weight: bold;
  font-family: monospace;
`;

const InputContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  align-items: center;
  justify-content: center;
`;

const AnswerInput = styled.input`
  width: 150px;
  height: 50px;
  font-size: ${theme.fontSize.lg};
  text-align: center;
  border: 2px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  background-color: ${theme.colors.background};
  color: ${theme.colors.textPrimary};
  font-family: monospace;
  font-weight: bold;

  &:focus {
    outline: none;
    border-color: ${theme.colors.playerGreen};
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  }
`;

const SubmitButton = styled.button`
  height: 50px;
  padding: 0 ${theme.spacing.lg};
  font-size: ${theme.fontSize.md};
  font-weight: bold;
  background-color: ${theme.colors.playerGreen};
  color: #000;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Hint = styled.div`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textSecondary};
  text-align: center;
  margin-top: ${theme.spacing.md};
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
