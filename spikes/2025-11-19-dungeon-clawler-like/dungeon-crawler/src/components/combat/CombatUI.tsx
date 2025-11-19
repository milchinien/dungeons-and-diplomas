import styled from 'styled-components';
import { theme } from '../../styles/theme';
import { HPBar } from '../ui/HPBar';
import { Player, Enemy } from '../../types/game';

interface CombatUIProps {
  player: Player;
  enemy: Enemy;
}

const UIContainer = styled.div`
  width: 100%;
  height: 200px;
  background:
    linear-gradient(180deg, rgba(42, 42, 42, 0.95) 0%, rgba(26, 26, 26, 0.98) 100%),
    repeating-linear-gradient(
      0deg,
      #555 0px,
      #555 20px,
      #444 20px,
      #444 21px
    );
  border-top: 4px solid ${theme.colors.border};
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: ${theme.spacing.xl};
  box-shadow: inset 0 4px 12px rgba(0, 0, 0, 0.5);
`;

const CharacterPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const Portrait = styled.div<{ $color: string }>`
  width: 100px;
  height: 100px;
  border-radius: ${theme.borderRadius.round};
  border: 4px solid ${(props) => props.$color};
  background: radial-gradient(circle at 30% 30%, #7a7a7a, ${theme.colors.stone});
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  box-shadow:
    0 0 20px ${(props) => props.$color}40,
    inset -3px -3px 8px rgba(0, 0, 0, 0.4),
    inset 3px 3px 8px rgba(255, 255, 255, 0.1);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: ${theme.borderRadius.round};
    box-shadow: 0 0 30px ${(props) => props.$color}60;
    pointer-events: none;
  }
`;

const NameLabel = styled.div`
  font-size: ${theme.fontSize.xl};
  font-weight: bold;
  color: ${theme.colors.textPrimary};
  text-transform: uppercase;
  font-family: monospace;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
`;

const HPContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing.xs};
`;

// Player portrait icon
const PlayerPortraitIcon = () => (
  <svg width="60" height="60" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" fill="${theme.colors.playerGreen}" stroke="#000" strokeWidth="1.5" />
    <circle cx="12" cy="14" r="2" fill="#000" />
    <circle cx="20" cy="14" r="2" fill="#000" />
    <path d="M 10 18 Q 16 22 22 18" stroke="#000" strokeWidth="2" fill="none" />
  </svg>
);

// Enemy portrait icon
const EnemyPortraitIcon = ({ isBoss }: { isBoss: boolean }) => (
  <svg width="60" height="60" viewBox="0 0 32 32" fill="none">
    {isBoss ? (
      // Boss icon - larger, scarier
      <>
        <ellipse cx="16" cy="20" rx="12" ry="10" fill="#cc3333" stroke="#000" strokeWidth="1.5" />
        <circle cx="12" cy="18" r="2.5" fill="#ff0000" />
        <circle cx="20" cy="18" r="2.5" fill="#ff0000" />
        <circle cx="12" cy="18" r="1.2" fill="#000" />
        <circle cx="20" cy="18" r="1.2" fill="#000" />
        <path d="M 10 24 Q 16 27 22 24" stroke="#000" strokeWidth="2" fill="none" />
        <polygon points="6,16 8,10 10,16" fill="#cc3333" stroke="#000" strokeWidth="1" />
        <polygon points="26,16 24,10 22,16" fill="#cc3333" stroke="#000" strokeWidth="1" />
      </>
    ) : (
      // Normal enemy - goblin
      <>
        <ellipse cx="16" cy="20" rx="10" ry="8" fill="#33cc66" stroke="#000" strokeWidth="1.5" />
        <circle cx="12" cy="18" r="2" fill="#fff" />
        <circle cx="20" cy="18" r="2" fill="#fff" />
        <circle cx="12" cy="18" r="1" fill="#000" />
        <circle cx="20" cy="18" r="1" fill="#000" />
        <path d="M 12 22 Q 16 24 20 22" stroke="#000" strokeWidth="1.5" fill="none" />
        <ellipse cx="10" cy="16" rx="3" ry="5" fill="#33cc66" stroke="#000" strokeWidth="1" />
        <ellipse cx="22" cy="16" rx="3" ry="5" fill="#33cc66" stroke="#000" strokeWidth="1" />
      </>
    )}
  </svg>
);

export function CombatUI({ player, enemy }: CombatUIProps) {
  return (
    <UIContainer>
      {/* Player Panel */}
      <CharacterPanel>
        <Portrait $color={theme.colors.hpGreen}>
          <PlayerPortraitIcon />
        </Portrait>
        <NameLabel>ICH</NameLabel>
        <HPContainer>
          <HPBar current={player.currentHp} max={player.maxHp} color={theme.colors.hpGreen} />
        </HPContainer>
      </CharacterPanel>

      {/* Enemy Panel */}
      <CharacterPanel>
        <Portrait $color={theme.colors.hpRed}>
          <EnemyPortraitIcon isBoss={enemy.isBoss} />
        </Portrait>
        <NameLabel>{enemy.name}</NameLabel>
        <HPContainer>
          <HPBar current={enemy.currentHp} max={enemy.maxHp} color={theme.colors.hpRed} />
        </HPContainer>
      </CharacterPanel>
    </UIContainer>
  );
}
