import styled from 'styled-components';
import { theme } from '../../styles/theme';

interface HPBarProps {
  current: number;
  max: number;
  color: string;
}

const BarContainer = styled.div`
  width: 200px;
  height: 30px;
  background-color: ${theme.colors.hpBackground};
  border: 2px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.sm};
  position: relative;
  overflow: hidden;
`;

const BarFill = styled.div<{ $color: string; $width: number }>`
  height: 100%;
  background-color: ${(props) => props.$color};
  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => props.$width}%;
  transition: width 0.3s ease-out;
`;

const BarText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: ${theme.fontSize.sm};
  font-weight: bold;
  color: ${theme.colors.textPrimary};
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 1;
`;

export function HPBar({ current, max, color }: HPBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <BarContainer>
      <BarFill $color={color} $width={percentage} />
      <BarText>
        {current} / {max}
      </BarText>
    </BarContainer>
  );
}
