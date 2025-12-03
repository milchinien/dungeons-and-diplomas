import styled from 'styled-components';
import { theme } from '../../styles/theme';
import type { Player as GamePlayer, Enemy as GameEnemy } from '../../types/game';

interface CombatUIProps {
  player: GamePlayer;
  enemy: GameEnemy;
}

const UIContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
`;

const HPPanel = styled.div<{ $isPlayer: boolean }>`
  position: absolute;
  bottom: 280px;
  ${(props) => (props.$isPlayer ? 'left: 50px;' : 'right: 50px;')}
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing.md};
  pointer-events: none;
`;

const NameLabel = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: ${theme.colors.textPrimary};
  text-transform: uppercase;
  font-family: monospace;
  letter-spacing: 3px;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.9);
  margin-bottom: ${theme.spacing.sm};
`;

const HPBarContainer = styled.div`
  width: 280px;
  height: 45px;
  background-color: rgba(20, 20, 20, 0.9);
  border: 3px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.8);
`;

const HPBarFill = styled.div<{ $color: string; $width: number }>`
  height: 100%;
  background: linear-gradient(180deg, ${(props) => props.$color} 0%, ${(props) => props.$color}dd 100%);
  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => props.$width}%;
  transition: width 0.3s ease-out;
  box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3);
`;

const HPBarText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 22px;
  font-weight: bold;
  color: ${theme.colors.textPrimary};
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9);
  z-index: 1;
  font-family: monospace;
`;

function CustomHPBar({ current, max, color }: { current: number; max: number; color: string }) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <HPBarContainer>
      <HPBarFill $color={color} $width={percentage} />
      <HPBarText>
        {current} / {max}
      </HPBarText>
    </HPBarContainer>
  );
}

export function CombatUI({ player, enemy }: CombatUIProps) {
  return (
    <UIContainer>
      {/* Player HP */}
      <HPPanel $isPlayer={true}>
        <NameLabel>ICH</NameLabel>
        <CustomHPBar current={player.currentHp} max={player.maxHp} color={theme.colors.hpGreen} />
      </HPPanel>

      {/* Enemy HP */}
      <HPPanel $isPlayer={false}>
        <NameLabel>{enemy.name}</NameLabel>
        <CustomHPBar current={enemy.currentHp} max={enemy.maxHp} color={theme.colors.hpRed} />
      </HPPanel>
    </UIContainer>
  );
}
