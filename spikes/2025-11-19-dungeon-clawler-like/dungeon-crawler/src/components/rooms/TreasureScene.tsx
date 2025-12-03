import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGameStore } from '../../store/gameStore';
import { GameScene } from '../../types/game';
import { theme } from '../../styles/theme';

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const TreasureContainer = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #2a1a0a 0%, #3a2a1a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const ChestContainer = styled.div`
  position: relative;
  width: 300px;
  height: 250px;
  margin-bottom: ${theme.spacing.xl};
`;

const ChestBase = styled.div<{ $isOpen: boolean }>`
  width: 250px;
  height: 150px;
  background-color: #8b4513;
  border: 4px solid #654321;
  border-radius: ${theme.borderRadius.md};
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    background-color: ${(props) => (props.$isOpen ? 'transparent' : theme.colors.gold)};
    border: ${(props) => (props.$isOpen ? 'none' : '3px solid #b8860b')};
    border-radius: ${theme.borderRadius.sm};
  }
`;

const ChestLid = styled.div<{ $isOpen: boolean }>`
  width: 250px;
  height: 100px;
  background-color: #8b4513;
  border: 4px solid #654321;
  border-radius: ${theme.borderRadius.md} ${theme.borderRadius.md} 0 0;
  position: absolute;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  transform-origin: bottom center;
  transition: transform 0.5s ease;
  box-shadow: 0 -5px 10px rgba(0, 0, 0, 0.3);

  ${(props) =>
    props.$isOpen &&
    `
    transform: translateX(-50%) rotateX(-120deg);
  `}
`;

const Sparkles = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 48px;
  opacity: ${(props) => (props.$show ? 1 : 0)};
  animation: ${bounce} 1s ease-in-out infinite;
  transition: opacity 0.5s;
`;

const LootDisplay = styled.div`
  background-color: rgba(42, 42, 42, 0.9);
  border: 3px solid ${theme.colors.gold};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.xl};
  text-align: center;
  min-width: 300px;
`;

const LootTitle = styled.div`
  font-size: ${theme.fontSize.xl};
  color: ${theme.colors.gold};
  font-weight: bold;
  margin-bottom: ${theme.spacing.lg};
`;

const LootItem = styled.div`
  font-size: ${theme.fontSize.lg};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.md};
`;

const CollectButton = styled.button`
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  font-size: ${theme.fontSize.lg};
  font-weight: bold;
  background-color: ${theme.colors.gold};
  color: #000;
  border: none;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  margin-top: ${theme.spacing.lg};
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(255, 204, 0, 0.8);
  }
`;

export function TreasureScene() {
  const [isOpen, setIsOpen] = useState(false);
  const { setScene, collectLoot, currentFloor } = useGameStore();

  const goldAmount = 30 + (currentFloor?.level || 0) * 10;

  const handleOpenChest = () => {
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleCollect = () => {
    collectLoot(goldAmount, []);
    setScene(GameScene.MAP);
  };

  return (
    <TreasureContainer onClick={!isOpen ? handleOpenChest : undefined}>
      <ChestContainer>
        <Sparkles $show={isOpen}>✨</Sparkles>
        <ChestLid $isOpen={isOpen} />
        <ChestBase $isOpen={isOpen} />
      </ChestContainer>

      {!isOpen ? (
        <div style={{ color: theme.colors.textSecondary, fontSize: theme.fontSize.md }}>
          Klicke, um die Truhe zu öffnen
        </div>
      ) : (
        <LootDisplay>
          <LootTitle>Schatz gefunden!</LootTitle>
          <LootItem>💰 {goldAmount} Gold</LootItem>
          <CollectButton onClick={handleCollect}>Einsammeln</CollectButton>
        </LootDisplay>
      )}
    </TreasureContainer>
  );
}
