import { motion } from 'framer-motion';
import styled from 'styled-components';

interface CharacterSpriteProps {
  isPlayer: boolean;
  isAttacking?: boolean;
  isHurt?: boolean;
}

const SpriteContainer = styled(motion.div)<{ $isPlayer: boolean }>`
  width: 150px;
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: absolute;
  bottom: 100px;
  ${(props) => (props.$isPlayer ? 'left: 150px;' : 'right: 150px;')}
  filter: drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.5));
`;

const StickFigure = styled.svg`
  width: 140px;
  height: 180px;
`;

const GoblinSprite = styled.svg`
  width: 120px;
  height: 140px;
`;

export function CharacterSprite({ isPlayer, isAttacking, isHurt }: CharacterSpriteProps) {
  if (isPlayer) {
    return (
      <SpriteContainer
        $isPlayer={isPlayer}
        animate={{
          x: isAttacking ? 20 : 0,
          rotate: isHurt ? [0, -5, 5, -5, 0] : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <StickFigure viewBox="0 0 60 80" fill="none">
          {/* Head */}
          <circle cx="30" cy="15" r="10" fill="#ffcc99" stroke="#000" strokeWidth="2" />
          {/* Eyes */}
          <circle cx="26" cy="14" r="2" fill="#000" />
          <circle cx="34" cy="14" r="2" fill="#000" />
          {/* Smile */}
          <path d="M 24 18 Q 30 20 36 18" stroke="#000" strokeWidth="1.5" fill="none" />
          {/* Body */}
          <line x1="30" y1="25" x2="30" y2="50" stroke="#000" strokeWidth="3" />
          {/* Arms */}
          <line x1="30" y1="30" x2="15" y2="40" stroke="#000" strokeWidth="3" />
          <line x1="30" y1="30" x2="45" y2="35" stroke="#000" strokeWidth="3" />
          {/* Sword in right hand */}
          <rect x="43" y="28" width="3" height="15" fill="#888" stroke="#000" strokeWidth="1" />
          <polygon points="44,25 45,28 43,28" fill="#ccc" />
          {/* Legs */}
          <line x1="30" y1="50" x2="20" y2="70" stroke="#000" strokeWidth="3" />
          <line x1="30" y1="50" x2="40" y2="70" stroke="#000" strokeWidth="3" />
        </StickFigure>
      </SpriteContainer>
    );
  }

  // Enemy (Goblin)
  return (
    <SpriteContainer
      $isPlayer={isPlayer}
      animate={{
        x: isHurt ? [-10, 10, -10, 0] : 0,
        scale: isHurt ? [1, 0.95, 1] : 1,
      }}
      transition={{ duration: 0.4 }}
    >
      <GoblinSprite viewBox="0 0 50 60" fill="none">
        {/* Body */}
        <ellipse cx="25" cy="40" rx="15" ry="12" fill="#33cc66" stroke="#000" strokeWidth="2" />
        {/* Head */}
        <circle cx="25" cy="20" r="12" fill="#33cc66" stroke="#000" strokeWidth="2" />
        {/* Eyes */}
        <circle cx="21" cy="18" r="3" fill="#fff" />
        <circle cx="29" cy="18" r="3" fill="#fff" />
        <circle cx="21" cy="18" r="1.5" fill="#000" />
        <circle cx="29" cy="18" r="1.5" fill="#000" />
        {/* Evil grin */}
        <path d="M 18 24 Q 25 28 32 24" stroke="#000" strokeWidth="2" fill="none" />
        {/* Ears */}
        <ellipse cx="12" cy="18" rx="4" ry="6" fill="#33cc66" stroke="#000" strokeWidth="1" />
        <ellipse cx="38" cy="18" rx="4" ry="6" fill="#33cc66" stroke="#000" strokeWidth="1" />
        {/* Arms */}
        <ellipse cx="10" cy="38" rx="4" ry="8" fill="#33cc66" stroke="#000" strokeWidth="1" />
        <ellipse cx="40" cy="38" rx="4" ry="8" fill="#33cc66" stroke="#000" strokeWidth="1" />
        {/* Legs */}
        <ellipse cx="18" cy="52" rx="4" ry="8" fill="#33cc66" stroke="#000" strokeWidth="1" />
        <ellipse cx="32" cy="52" rx="4" ry="8" fill="#33cc66" stroke="#000" strokeWidth="1" />
      </GoblinSprite>
    </SpriteContainer>
  );
}
