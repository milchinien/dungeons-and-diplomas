import styled from 'styled-components';
import { theme } from '../../styles/theme';

const ResponsiveWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  overflow: hidden;
`;

const InnerContainer = styled.div`
  width: ${theme.game.width}px;
  height: ${theme.game.height}px;
  background-color: ${theme.colors.background};
  position: relative;
  overflow: hidden;
  border: 3px solid ${theme.colors.border};
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);

  /* Responsive scaling */
  @media (max-width: ${theme.game.width}px), (max-height: ${theme.game.height}px) {
    --scale: min(
      calc(100vw / ${theme.game.width}),
      calc(100vh / ${theme.game.height})
    );
    transform: scale(var(--scale));
    transform-origin: center center;
  }

  @media (max-width: 768px) {
    border-width: 2px;
  }
`;

interface GameContainerProps {
  children: React.ReactNode;
}

export function GameContainer({ children }: GameContainerProps) {
  return (
    <ResponsiveWrapper>
      <InnerContainer>{children}</InnerContainer>
    </ResponsiveWrapper>
  );
}
