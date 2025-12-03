import styled from 'styled-components';
import { useGameStore } from '../../store/gameStore';
import { GameScene } from '../../types/game';
import { theme } from '../../styles/theme';
import { shopItems } from '../../data/items';
import { Item } from '../../types/game';

const ShopContainer = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1a2a3a 0%, #2a3a4a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${theme.spacing.xl};
  overflow-y: auto;
`;

const ShopTitle = styled.div`
  font-size: 48px;
  color: ${theme.colors.shopBlue};
  font-weight: bold;
  margin-bottom: ${theme.spacing.lg};
  text-shadow: 0 0 20px rgba(102, 153, 204, 0.8);
`;

const GoldDisplay = styled.div`
  font-size: ${theme.fontSize.xl};
  color: ${theme.colors.gold};
  margin-bottom: ${theme.spacing.xl};
  font-weight: bold;
`;

const ItemGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  max-width: 800px;
`;

const ItemCard = styled.div<{ $canAfford: boolean }>`
  background-color: rgba(42, 42, 42, 0.9);
  border: 3px solid
    ${(props) => (props.$canAfford ? theme.colors.shopBlue : theme.colors.border)};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  opacity: ${(props) => (props.$canAfford ? 1 : 0.6)};
  transition: all 0.2s;

  &:hover {
    ${(props) =>
      props.$canAfford &&
      `
      transform: scale(1.05);
      box-shadow: 0 0 20px rgba(102, 153, 204, 0.5);
    `}
  }
`;

const ItemName = styled.div`
  font-size: ${theme.fontSize.lg};
  color: ${theme.colors.textPrimary};
  font-weight: bold;
`;

const ItemDescription = styled.div`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textSecondary};
`;

const ItemPrice = styled.div`
  font-size: ${theme.fontSize.md};
  color: ${theme.colors.gold};
  font-weight: bold;
`;

const BuyButton = styled.button<{ $canAfford: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  font-size: ${theme.fontSize.md};
  font-weight: bold;
  background-color: ${(props) =>
    props.$canAfford ? theme.colors.shopBlue : theme.colors.border};
  color: ${(props) => (props.$canAfford ? '#fff' : theme.colors.textSecondary)};
  border: none;
  border-radius: ${theme.borderRadius.sm};
  cursor: ${(props) => (props.$canAfford ? 'pointer' : 'not-allowed')};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 10px rgba(102, 153, 204, 0.5);
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const ContinueButton = styled.button`
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  font-size: ${theme.fontSize.lg};
  font-weight: bold;
  background-color: ${theme.colors.playerGreen};
  color: #000;
  border: none;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
  }
`;

export function ShopScene() {
  const { player, setScene, buyItem } = useGameStore();

  const handleBuyItem = (item: Item) => {
    if (player.gold >= item.price) {
      buyItem(item);
    }
  };

  const handleContinue = () => {
    setScene(GameScene.MAP);
  };

  return (
    <ShopContainer>
      <ShopTitle>🛒 SHOP</ShopTitle>
      <GoldDisplay>💰 {player.gold} Gold</GoldDisplay>

      <ItemGrid>
        {shopItems.map((item) => {
          const canAfford = player.gold >= item.price;
          return (
            <ItemCard key={item.id} $canAfford={canAfford}>
              <ItemName>{item.name}</ItemName>
              <ItemDescription>{item.description}</ItemDescription>
              <ItemPrice>💰 {item.price} Gold</ItemPrice>
              <BuyButton
                $canAfford={canAfford}
                disabled={!canAfford}
                onClick={() => handleBuyItem(item)}
              >
                {canAfford ? 'Kaufen' : 'Zu teuer'}
              </BuyButton>
            </ItemCard>
          );
        })}
      </ItemGrid>

      <ContinueButton onClick={handleContinue}>Weiter</ContinueButton>
    </ShopContainer>
  );
}
