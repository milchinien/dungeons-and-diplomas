import styled from 'styled-components';
import { Room, RoomType } from '../../types/game';
import { theme } from '../../styles/theme';
import {
  DoorIcon,
  SwordIcon,
  MonsterIcon,
  ChestIcon,
  CoinIcon,
  StairsIcon,
} from '../ui/Icons';

interface RoomNodeProps {
  room: Room;
  isActive: boolean;
  isCleared: boolean;
  isLocked: boolean;
  onClick?: () => void;
}

const NodeContainer = styled.div<{ $isActive: boolean; $isCleared: boolean; $isLocked: boolean }>`
  width: 110px;
  height: 110px;
  border: 3px solid
    ${(props) =>
      props.$isActive
        ? '#555'
        : props.$isLocked
          ? '#999'
          : '#777'};
  border-radius: ${theme.borderRadius.lg};
  background: ${(props) =>
    props.$isCleared
      ? 'linear-gradient(135deg, #b8b8b8 0%, #a5a5a5 100%)'
      : props.$isLocked
        ? 'linear-gradient(135deg, #d0d0d0 0%, #c0c0c0 100%)'
        : 'linear-gradient(135deg, #e0e0e0 0%, #d0d0d0 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(props) => (props.$isLocked ? 'not-allowed' : 'pointer')};
  opacity: ${(props) => (props.$isLocked ? 0.6 : 1)};
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.25);

  /* Subtle 3D effect */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: ${theme.borderRadius.lg};
    box-shadow:
      inset -1px -1px 3px rgba(0, 0, 0, 0.2),
      inset 1px 1px 3px rgba(255, 255, 255, 0.3);
    pointer-events: none;
  }

  &:hover {
    ${(props) =>
      !props.$isLocked &&
      `
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
    `}
  }
`;

const RoomLabel = styled.div`
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: #4a4a4a;
  white-space: nowrap;
  font-weight: 500;
  font-family: monospace;
`;

function getRoomIcon(type: RoomType, size: number = 58) {
  switch (type) {
    case RoomType.ENTRANCE:
      return <DoorIcon size={size} />;
    case RoomType.COMBAT:
      return <SwordIcon size={size} />;
    case RoomType.BOSS:
      return <MonsterIcon size={size} />;
    case RoomType.TREASURE:
      return <ChestIcon size={size} />;
    case RoomType.SHOP:
      return <CoinIcon size={size} />;
    case RoomType.EXIT:
      return <StairsIcon size={size} />;
    default:
      return null;
  }
}

function getRoomLabel(type: RoomType): string {
  switch (type) {
    case RoomType.ENTRANCE:
      return 'Eingang';
    case RoomType.COMBAT:
      return 'Kampf';
    case RoomType.BOSS:
      return 'Boss';
    case RoomType.TREASURE:
      return 'Schatz';
    case RoomType.SHOP:
      return 'Shop';
    case RoomType.EXIT:
      return 'Ausgang';
    default:
      return '';
  }
}

export function RoomNode({ room, isActive, isCleared, isLocked, onClick }: RoomNodeProps) {
  return (
    <NodeContainer
      $isActive={isActive}
      $isCleared={isCleared}
      $isLocked={isLocked}
      onClick={!isLocked ? onClick : undefined}
    >
      {getRoomIcon(room.type)}
      <RoomLabel>{getRoomLabel(room.type)}</RoomLabel>
    </NodeContainer>
  );
}
