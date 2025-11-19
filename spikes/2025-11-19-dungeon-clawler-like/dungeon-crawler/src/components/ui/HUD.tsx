import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { theme } from '../../styles/theme';

const HUDContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(26, 26, 26, 0.95) 0%, rgba(26, 26, 26, 0) 100%);
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 50;
  pointer-events: none;
`;

const StatGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};
  align-items: center;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: monospace;
`;

const StatValue = styled.div`
  font-size: ${theme.fontSize.lg};
  font-weight: bold;
  color: ${theme.colors.playerGreen};
  font-family: monospace;
  text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
`;

const FloorIndicator = styled.div`
  font-size: ${theme.fontSize.md};
  color: ${theme.colors.textPrimary};
  font-weight: bold;
  font-family: monospace;
  background-color: rgba(0, 255, 0, 0.1);
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 2px solid ${theme.colors.playerGreen};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
`;

const HPDisplay = styled.div<{ $percentage: number }>`
  font-size: ${theme.fontSize.lg};
  font-weight: bold;
  font-family: monospace;
  color: ${(props) =>
    props.$percentage > 50
      ? theme.colors.hpGreen
      : props.$percentage > 25
        ? theme.colors.gold
        : theme.colors.hpRed};
  text-shadow: 0 0 10px
    ${(props) =>
      props.$percentage > 50
        ? 'rgba(0, 255, 0, 0.5)'
        : props.$percentage > 25
          ? 'rgba(255, 204, 0, 0.5)'
          : 'rgba(255, 0, 0, 0.5)'};
`;

const Hint = styled.div`
  position: fixed;
  bottom: ${theme.spacing.lg};
  right: ${theme.spacing.lg};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textSecondary};
  font-family: monospace;
  background-color: rgba(26, 26, 26, 0.8);
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  z-index: 50;
  pointer-events: none;
`;

export function HUD() {
  const { player, currentFloor } = useGameStore();

  const hpPercentage = (player.currentHp / player.maxHp) * 100;

  return (
    <>
      <HUDContainer
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <StatGroup>
          <StatItem>
            <StatLabel>HP</StatLabel>
            <HPDisplay $percentage={hpPercentage}>
              {player.currentHp} / {player.maxHp}
            </HPDisplay>
          </StatItem>
          <StatItem>
            <StatLabel>Gold</StatLabel>
            <StatValue>{player.gold} 💰</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Items</StatLabel>
            <StatValue>{player.inventory.length}</StatValue>
          </StatItem>
        </StatGroup>

        {currentFloor && (
          <FloorIndicator>Etage {currentFloor.level}</FloorIndicator>
        )}
      </HUDContainer>

      <Hint>
        [I] Inventar | [ESC] Pause
      </Hint>
    </>
  );
}
