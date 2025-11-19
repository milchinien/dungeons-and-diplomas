import styled from 'styled-components';
import { motion } from 'framer-motion';
import { theme } from '../../styles/theme';
import { useGameStore } from '../../store/gameStore';

interface PauseMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(5px);
`;

const MenuPanel = styled(motion.div)`
  background-color: ${theme.colors.uiDark};
  border: 3px solid ${theme.colors.playerGreen};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.xl};
  min-width: 400px;
  box-shadow: 0 0 40px rgba(0, 255, 0, 0.5);
`;

const Title = styled.h1`
  font-size: ${theme.fontSize.xxl};
  color: ${theme.colors.playerGreen};
  margin: 0 0 ${theme.spacing.xl} 0;
  text-align: center;
  font-family: monospace;
  text-shadow: 0 0 20px rgba(0, 255, 0, 0.8);
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const MenuButton = styled(motion.button)`
  width: 100%;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  font-size: ${theme.fontSize.lg};
  font-weight: bold;
  background-color: ${theme.colors.background};
  color: ${theme.colors.textPrimary};
  border: 2px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s;
  font-family: monospace;

  &:hover {
    border-color: ${theme.colors.playerGreen};
    color: ${theme.colors.playerGreen};
    transform: translateX(10px);
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
  }
`;

const Stats = styled.div`
  margin-top: ${theme.spacing.xl};
  padding-top: ${theme.spacing.lg};
  border-top: 2px solid ${theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const StatLine = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${theme.fontSize.md};
  color: ${theme.colors.textSecondary};
  font-family: monospace;

  span:last-child {
    color: ${theme.colors.playerGreen};
    font-weight: bold;
  }
`;

export function PauseMenu({ isOpen, onClose }: PauseMenuProps) {
  const { player, currentFloor, resetGame } = useGameStore();

  if (!isOpen) return null;

  const handleResume = () => {
    onClose();
  };

  const handleRestart = () => {
    if (confirm('Möchtest du wirklich neu starten? Der Fortschritt geht verloren!')) {
      resetGame();
      onClose();
    }
  };

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <MenuPanel
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Title>PAUSE</Title>

        <ButtonGroup>
          <MenuButton
            onClick={handleResume}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ▶ Fortsetzen
          </MenuButton>
          <MenuButton
            onClick={handleRestart}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            🔄 Neustart
          </MenuButton>
        </ButtonGroup>

        <Stats>
          <StatLine>
            <span>Etage:</span>
            <span>{currentFloor?.level || 1}</span>
          </StatLine>
          <StatLine>
            <span>HP:</span>
            <span>{player.currentHp} / {player.maxHp}</span>
          </StatLine>
          <StatLine>
            <span>Gold:</span>
            <span>{player.gold}</span>
          </StatLine>
          <StatLine>
            <span>Items:</span>
            <span>{player.inventory.length}</span>
          </StatLine>
        </Stats>
      </MenuPanel>
    </Overlay>
  );
}
