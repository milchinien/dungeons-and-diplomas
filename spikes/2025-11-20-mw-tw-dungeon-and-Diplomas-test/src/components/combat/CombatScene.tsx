import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DungeonView } from './DungeonView';
import { CombatUI } from './CombatUI_Original';
import { MathQuestion } from './MathQuestion';
import { CombatState } from '../../types/game';
import type { Item } from '../../types/game';
import { theme } from '../../styles/theme';

const CombatContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${theme.colors.background};
  position: relative;
  display: flex;
  flex-direction: column;
`;

const VictoryOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
`;

const VictoryText = styled.div`
  font-size: 72px;
  font-weight: bold;
  color: ${theme.colors.playerGreen};
  margin-bottom: 40px;
  text-shadow: 0 0 30px rgba(0, 255, 0, 0.9);
`;

const DefeatText = styled(VictoryText)`
  color: ${theme.colors.hpRed};
  text-shadow: 0 0 30px rgba(255, 0, 0, 0.9);
`;

const ContinueButton = styled.button`
  padding: 20px 50px;
  font-size: 28px;
  font-weight: bold;
  background-color: ${theme.colors.playerGreen};
  color: #000;
  border: none;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 30px rgba(0, 255, 0, 0.9);
  }
`;

const RewardText = styled.div`
  font-size: 32px;
  color: ${theme.colors.gold};
  margin-bottom: 30px;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  margin-bottom: 30px;
`;

const ItemReward = styled.div`
  font-size: 22px;
  color: ${theme.colors.playerGreen};
  background-color: rgba(0, 255, 0, 0.1);
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  border: 2px solid ${theme.colors.playerGreen};
`;

interface CombatSceneProps {
  player: {
    currentHp: number;
    maxHp: number;
    gold: number;
    inventory: Item[];
  };
  enemy: {
    id: string;
    name: string;
    maxHp: number;
    currentHp: number;
    damage: number;
    isBoss: boolean;
  };
  question: {
    question: string;
    correctAnswer: number;
  };
  onPlayerDamage: (damage: number) => void;
  onEnemyDamage: (damage: number) => void;
  onCombatEnd: (victory: boolean) => void;
  onGenerateNewQuestion: () => void;
}

export function CombatScene({
  player,
  enemy,
  question,
  onPlayerDamage,
  onEnemyDamage,
  onCombatEnd,
  onGenerateNewQuestion
}: CombatSceneProps) {
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [isEnemyHurt, setIsEnemyHurt] = useState(false);
  const [combatState, setCombatState] = useState<CombatState>(CombatState.QUESTION_ACTIVE);
  const [lootRewards, setLootRewards] = useState<{ gold: number; items: Item[] } | null>(null);

  useEffect(() => {
    // When combat state changes, trigger animations
    if (combatState === CombatState.PLAYER_ATTACK) {
      setIsPlayerAttacking(true);
      setIsEnemyHurt(true);

      const timer = setTimeout(() => {
        setIsPlayerAttacking(false);
        setIsEnemyHurt(false);

        // Check if enemy is defeated
        if (enemy.currentHp <= 0) {
          // Generate loot (simplified - no loot for now)
          const loot = { gold: 50, items: [] };
          setLootRewards(loot);
          setCombatState(CombatState.VICTORY);
        } else {
          // Generate next question
          onGenerateNewQuestion();
          setCombatState(CombatState.QUESTION_ACTIVE);
        }
      }, 1000);

      return () => clearTimeout(timer);
    } else if (combatState === CombatState.ENEMY_ATTACK) {
      // Player took damage from wrong answer
      const timer = setTimeout(() => {
        // Check if player is defeated
        if (player.currentHp <= 0) {
          setCombatState(CombatState.DEFEAT);
        } else {
          // Generate next question
          onGenerateNewQuestion();
          setCombatState(CombatState.QUESTION_ACTIVE);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [combatState, enemy.currentHp, player.currentHp, onGenerateNewQuestion]);

  const handleAnswer = (answer: number) => {
    if (answer === question.correctAnswer) {
      // Correct answer - player attacks
      onEnemyDamage(10);
      setCombatState(CombatState.PLAYER_ATTACK);
    } else {
      // Wrong answer - enemy attacks
      onPlayerDamage(15);
      setCombatState(CombatState.ENEMY_ATTACK);
    }
  };

  const handleContinue = () => {
    onCombatEnd(true);
    setCombatState(CombatState.QUESTION_ACTIVE);
    setLootRewards(null);
  };

  const handleDefeat = () => {
    onCombatEnd(false);
  };

  return (
    <CombatContainer>
      <DungeonView isPlayerAttacking={isPlayerAttacking} isEnemyHurt={isEnemyHurt} />
      <CombatUI player={player} enemy={enemy} />

      {combatState === CombatState.QUESTION_ACTIVE && (
        <MathQuestion question={question} onAnswer={handleAnswer} />
      )}

      {combatState === CombatState.VICTORY && lootRewards && (
        <VictoryOverlay>
          <VictoryText>SIEG!</VictoryText>
          <RewardText>+{lootRewards.gold} Gold</RewardText>
          {lootRewards.items.length > 0 && (
            <ItemList>
              {lootRewards.items.map((item, index) => (
                <ItemReward key={index}>
                  {item.name} - {item.description}
                </ItemReward>
              ))}
            </ItemList>
          )}
          <ContinueButton onClick={handleContinue}>Weiter</ContinueButton>
        </VictoryOverlay>
      )}

      {combatState === CombatState.DEFEAT && (
        <VictoryOverlay>
          <DefeatText>NIEDERLAGE!</DefeatText>
          <ContinueButton onClick={handleDefeat}>Zurück zur Karte</ContinueButton>
        </VictoryOverlay>
      )}
    </CombatContainer>
  );
}
