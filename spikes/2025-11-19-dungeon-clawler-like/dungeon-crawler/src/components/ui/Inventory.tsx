import styled from 'styled-components';
import { useGameStore } from '../../store/gameStore';
import { Item } from '../../types/game';
import { theme } from '../../styles/theme';

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const InventoryOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const InventoryPanel = styled.div`
  background-color: ${theme.colors.uiDark};
  border: 3px solid ${theme.colors.playerGreen};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.xl};
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(0, 255, 0, 0.5);
`;

const InventoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
`;

const Title = styled.h2`
  font-size: ${theme.fontSize.xl};
  color: ${theme.colors.playerGreen};
  margin: 0;
  font-family: monospace;
`;

const CloseButton = styled.button`
  background: none;
  border: 2px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSize.lg};
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${theme.colors.playerGreen};
    color: ${theme.colors.playerGreen};
    transform: scale(1.1);
  }
`;

const ItemGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${theme.spacing.md};
`;

const ItemCard = styled.div`
  background-color: ${theme.colors.background};
  border: 2px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  transition: all 0.2s;

  &:hover {
    border-color: ${theme.colors.playerGreen};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 255, 0, 0.2);
  }
`;

const ItemName = styled.div`
  font-size: ${theme.fontSize.md};
  font-weight: bold;
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.xs};
  font-family: monospace;
`;

const ItemDescription = styled.div`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textSecondary};
  margin-bottom: ${theme.spacing.md};
`;

const UseButton = styled.button`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background-color: ${theme.colors.playerGreen};
  color: #000;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  font-family: monospace;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSize.lg};
  padding: ${theme.spacing.xl};
  font-family: monospace;
`;

const PlayerStats = styled.div`
  background-color: ${theme.colors.background};
  border: 2px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  justify-content: space-around;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textSecondary};
  margin-bottom: ${theme.spacing.xs};
`;

const StatValue = styled.div`
  font-size: ${theme.fontSize.lg};
  font-weight: bold;
  color: ${theme.colors.playerGreen};
  font-family: monospace;
`;

export function Inventory({ isOpen, onClose }: InventoryProps) {
  const { player, useItem } = useGameStore();

  const handleUseItem = (item: Item) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useItem(item);
  };

  return (
    <InventoryOverlay $isOpen={isOpen} onClick={onClose}>
      <InventoryPanel onClick={(e) => e.stopPropagation()}>
        <InventoryHeader>
          <Title>Inventar</Title>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </InventoryHeader>

        <PlayerStats>
          <StatItem>
            <StatLabel>HP</StatLabel>
            <StatValue>
              {player.currentHp} / {player.maxHp}
            </StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Gold</StatLabel>
            <StatValue>{player.gold} 💰</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Items</StatLabel>
            <StatValue>{player.inventory.length}</StatValue>
          </StatItem>
        </PlayerStats>

        {player.inventory.length === 0 ? (
          <EmptyMessage>Inventar ist leer</EmptyMessage>
        ) : (
          <ItemGrid>
            {player.inventory.map((item, index) => (
              <ItemCard key={`${item.id}-${index}`}>
                <ItemName>{item.name}</ItemName>
                <ItemDescription>{item.description}</ItemDescription>
                <UseButton onClick={() => handleUseItem(item)}>Benutzen</UseButton>
              </ItemCard>
            ))}
          </ItemGrid>
        )}
      </InventoryPanel>
    </InventoryOverlay>
  );
}
