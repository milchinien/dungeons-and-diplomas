import styled from 'styled-components';
import { useGameStore } from '../../store/gameStore';
import { RoomNode } from './RoomNode';
import { theme } from '../../styles/theme';
import { RoomType, GameScene } from '../../types/game';
import { generateEnemy } from '../../data/enemies';
import { generateQuestion, getDifficultyForFloor } from '../../utils/mathGenerator';
import { generateFloor } from '../../utils/floorGenerator';
import { useEffect, useCallback } from 'react';
import {
  PlayerIcon,
  DoorIcon,
  SwordIcon,
  MonsterIcon,
  ChestIcon,
  CoinIcon,
  StairsIcon,
} from '../ui/Icons';

// Generate random positions for dust particles outside component
const DUST_PARTICLE_POSITIONS = Array.from({ length: 35 }).map(() => ({
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 30}%`,
}));

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  background:
    linear-gradient(180deg,
      rgba(165, 165, 170, 1) 0%,
      rgba(148, 148, 152, 1) 20%,
      rgba(140, 140, 145, 1) 40%,
      rgba(145, 145, 150, 1) 60%,
      rgba(152, 152, 157, 1) 80%,
      rgba(160, 160, 165, 1) 100%
    );
  position: relative;
  overflow: hidden;

  /* Multi-layered animated fog effect */
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background-image:
      radial-gradient(circle at 25% 35%, rgba(180, 180, 185, 0.2) 0%, transparent 45%),
      radial-gradient(circle at 75% 65%, rgba(170, 170, 175, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 45% 75%, rgba(185, 185, 190, 0.18) 0%, transparent 48%),
      radial-gradient(circle at 60% 20%, rgba(175, 175, 180, 0.12) 0%, transparent 52%),
      radial-gradient(circle at 15% 80%, rgba(180, 180, 185, 0.15) 0%, transparent 46%);
    animation: fogMove 80s ease-in-out infinite;
    pointer-events: none;
  }

  /* Additional atmospheric layer */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
      radial-gradient(ellipse at top, rgba(200, 200, 205, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at bottom, rgba(180, 180, 185, 0.08) 0%, transparent 60%);
    pointer-events: none;
  }

  @keyframes fogMove {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(-8%, -6%) rotate(1deg); }
    50% { transform: translate(-15%, 8%) rotate(-1deg); }
    75% { transform: translate(-7%, 12%) rotate(0.5deg); }
  }
`;

const MapContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const RoomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 120px);
  grid-template-rows: repeat(3, 120px);
  gap: 10px;
  position: relative;
`;

const RoomSlot = styled.div<{ $gridColumn: number; $gridRow: number }>`
  grid-column: ${(props) => props.$gridColumn};
  grid-row: ${(props) => props.$gridRow};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const PathLine = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
`;

const CloudLayer = styled.div<{ $index: number; $size?: number }>`
  position: absolute;
  width: ${props => props.$size || 300}px;
  height: ${props => (props.$size || 300) * 0.5}px;
  background: radial-gradient(ellipse at center, rgba(180, 180, 185, 0.35) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(${props => 15 + props.$index * 5}px);
  opacity: ${props => 0.3 + props.$index * 0.08};
  animation: float${props => props.$index} ${props => 25 + props.$index * 8}s ease-in-out infinite;

  @keyframes float${props => props.$index} {
    0%, 100% {
      transform: translate(${props => props.$index * 80}px, ${props => props.$index * 40}px) scale(1);
    }
    33% {
      transform: translate(${props => props.$index * 120}px, ${props => props.$index * 60}px) scale(1.1);
    }
    66% {
      transform: translate(${props => props.$index * 90}px, ${props => props.$index * 30}px) scale(0.95);
    }
  }
`;

// Fog particles
const FogParticle = styled.div<{ $index: number }>`
  position: absolute;
  width: ${props => 100 + props.$index * 50}px;
  height: ${props => 100 + props.$index * 50}px;
  background: radial-gradient(circle at center, rgba(170, 170, 175, 0.25) 0%, transparent 60%);
  border-radius: 50%;
  filter: blur(${props => 30 + props.$index * 10}px);
  opacity: 0;
  animation: fogDrift${props => props.$index} ${props => 40 + props.$index * 15}s ease-in-out infinite;

  @keyframes fogDrift${props => props.$index} {
    0%, 100% {
      transform: translate(${props => -100 + props.$index * 200}px, ${props => 100 + props.$index * 100}px);
      opacity: 0;
    }
    10% {
      opacity: ${props => 0.5 + props.$index * 0.15};
    }
    50% {
      transform: translate(${props => 800 + props.$index * 100}px, ${props => 50 + props.$index * 50}px);
      opacity: ${props => 0.6 + props.$index * 0.15};
    }
    90% {
      opacity: ${props => 0.4 + props.$index * 0.1};
    }
  }
`;

// Dust particles for wind effect
const DustParticle = styled.div<{ $delay: number }>`
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(160, 160, 165, 0.5);
  border-radius: 50%;
  animation: windDrift 15s linear infinite;
  animation-delay: ${props => props.$delay}s;
  opacity: 0;

  @keyframes windDrift {
    0% {
      transform: translate(0, 0);
      opacity: 0;
    }
    10% {
      opacity: 0.7;
    }
    90% {
      opacity: 0.5;
    }
    100% {
      transform: translate(1200px, -100px);
      opacity: 0;
    }
  }
`;

const Legend = styled.div`
  position: absolute;
  bottom: ${theme.spacing.md};
  right: ${theme.spacing.md};
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 248, 248, 0.94) 100%);
  border: 2px solid rgba(90, 90, 90, 0.35);
  border-radius: 8px;
  padding: 12px 14px;
  color: #2a2a2a;
  font-size: 12px;
  backdrop-filter: blur(6px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
`;

const LegendTitle = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: #2a2a2a;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: monospace;
  border-bottom: 1.5px solid rgba(0, 0, 0, 0.2);
  padding-bottom: 6px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  padding: 3px 0;
  font-family: monospace;
  font-size: 11px;
  transition: all 0.2s;

  &:hover {
    color: #000;
    transform: translateX(3px);
  }

  svg {
    flex-shrink: 0;
  }
`;

const Controls = styled.div`
  position: absolute;
  top: ${theme.spacing.md};
  left: ${theme.spacing.md};
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 248, 248, 0.94) 100%);
  border: 2px solid rgba(90, 90, 90, 0.35);
  border-radius: 8px;
  padding: 12px 14px;
  color: #2a2a2a;
  font-size: 12px;
  font-family: monospace;
  backdrop-filter: blur(6px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);

  strong {
    color: #2a2a2a;
    font-size: 13px;
  }

  div:not(:first-child) {
    margin-top: 4px;
    padding-left: 8px;
    font-size: 11px;
  }
`;

const PlayerMarker = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 15;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
`;

export function MapScene() {
  const { currentFloor, setScene, moveToRoom, setCurrentEnemy, setCurrentQuestion } =
    useGameStore();

  const handleRoomClick = useCallback((roomId: string) => {
    if (!currentFloor) return;
    const room = currentFloor.rooms.find((r) => r.id === roomId);
    if (!room) return;

    const currentRoom = currentFloor.rooms.find((r) => r.id === currentFloor.currentRoomId);
    if (!currentRoom) return;

    // Check if room is connected to current room
    if (!currentRoom.connections.includes(roomId)) {
      return; // Can't move to unconnected room
    }

    // Move to the room
    moveToRoom(roomId);

    // Handle room entry
    switch (room.type) {
      case RoomType.COMBAT:
      case RoomType.BOSS: {
        const enemy = generateEnemy(currentFloor.level, room.type === RoomType.BOSS);
        const difficulty = getDifficultyForFloor(currentFloor.level);
        const question = generateQuestion(difficulty);
        setCurrentEnemy(enemy);
        setCurrentQuestion(question);
        setScene(GameScene.COMBAT);
        break;
      }
      case RoomType.TREASURE:
        setScene(GameScene.TREASURE);
        break;
      case RoomType.SHOP:
        setScene(GameScene.SHOP);
        break;
      case RoomType.EXIT: {
        // Floor transition
        const nextLevel = currentFloor.level + 1;
        const newFloor = generateFloor(nextLevel);
        setTimeout(() => {
          const { nextFloor: setNextFloor } = useGameStore.getState();
          setNextFloor(newFloor);
        }, 1000);
        break;
      }
    }
  }, [currentFloor, moveToRoom, setCurrentEnemy, setCurrentQuestion, setScene]);

  useEffect(() => {
    // Add keyboard navigation
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentFloor) return;

      const currentRoom = currentFloor.rooms.find((r) => r.id === currentFloor.currentRoomId);
      if (!currentRoom) return;

      // Simple navigation: move to next connected room
      if (e.key === 'd' || e.key === 'D') {
        // Move forward
        if (currentRoom.connections.length > 0) {
          const nextRoomId = currentRoom.connections[0];
          handleRoomClick(nextRoomId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentFloor, handleRoomClick]);

  if (!currentFloor) {
    return <MapContainer>Loading floor...</MapContainer>;
  }

  const getRoomGridPosition = (roomId: string): { column: number; row: number } => {
    // Map room IDs to grid positions based on the structure
    const positions: Record<string, { column: number; row: number }> = {
      entrance: { column: 1, row: 2 },
      combat1: { column: 2, row: 2 },
      combat2: { column: 3, row: 2 },
      fork: { column: 4, row: 2 },
      'combat3-top': { column: 5, row: 1 },
      'combat3-bottom': { column: 5, row: 3 },
      treasure: { column: 6, row: 1 },
      boss: { column: 6, row: 3 },
      shop: { column: 7, row: 2 },
      exit: { column: 8, row: 2 },
    };
    return positions[roomId] || { column: 1, row: 1 };
  };

  // Helper function to draw path connections
  const drawConnections = () => {
    const paths: React.JSX.Element[] = [];

    currentFloor.rooms.forEach((room) => {
      const startPos = getRoomGridPosition(room.id);
      room.connections.forEach((targetId) => {
        const targetRoom = currentFloor.rooms.find(r => r.id === targetId);
        if (targetRoom) {
          const endPos = getRoomGridPosition(targetId);

          // Calculate positions (approximate center of grid cells)
          const startX = (startPos.column - 1) * 130 + 60;
          const startY = (startPos.row - 1) * 130 + 60;
          const endX = (endPos.column - 1) * 130 + 60;
          const endY = (endPos.row - 1) * 130 + 60;

          paths.push(
            <line
              key={`${room.id}-${targetId}`}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="#555"
              strokeWidth="2"
              strokeDasharray="6,3"
              opacity="0.5"
            />
          );
        }
      });
    });

    return paths;
  };

  return (
    <MapContainer>
      {/* Multiple layers of clouds for intense depth */}
      <CloudLayer $index={1} $size={450} style={{ top: '2%', left: '-5%' }} />
      <CloudLayer $index={2} $size={380} style={{ top: '18%', left: '45%' }} />
      <CloudLayer $index={3} $size={320} style={{ top: '40%', left: '5%' }} />
      <CloudLayer $index={4} $size={500} style={{ top: '8%', left: '65%' }} />
      <CloudLayer $index={5} $size={350} style={{ top: '55%', left: '35%' }} />
      <CloudLayer $index={1} $size={280} style={{ top: '75%', left: '15%' }} />
      <CloudLayer $index={2} $size={400} style={{ top: '30%', left: '70%' }} />
      <CloudLayer $index={3} $size={340} style={{ top: '85%', left: '50%' }} />

      {/* Dense fog particles for intense atmosphere */}
      <FogParticle $index={1} style={{ top: '15%', left: '-15%' }} />
      <FogParticle $index={2} style={{ top: '45%', left: '5%' }} />
      <FogParticle $index={3} style={{ top: '8%', left: '25%' }} />
      <FogParticle $index={4} style={{ top: '65%', left: '-8%' }} />
      <FogParticle $index={1} style={{ top: '28%', left: '60%' }} />
      <FogParticle $index={2} style={{ top: '72%', left: '40%' }} />
      <FogParticle $index={3} style={{ top: '35%', left: '80%' }} />
      <FogParticle $index={4} style={{ top: '90%', left: '20%' }} />

      {/* Intense wind dust particles */}
      {DUST_PARTICLE_POSITIONS.map((position, i) => (
        <DustParticle
          key={`dust-${i}`}
          $delay={i * 0.4}
          style={position}
        />
      ))}

      <Controls>
        <div>
          <strong>Steuerung:</strong>
        </div>
        <div>D - Vorwärts bewegen</div>
        <div>Klick auf Raum - Raum betreten</div>
      </Controls>

      <MapContent>
        <RoomGrid>
          <PathLine viewBox="0 0 1200 400">
            {drawConnections()}
          </PathLine>

          {currentFloor.rooms
            .filter((room) => room.id !== 'fork')
            .map((room) => {
              const position = getRoomGridPosition(room.id);
              const isActive = room.id === currentFloor.currentRoomId;
              const isCleared = room.cleared;
              const currentRoom = currentFloor.rooms.find(
                (r) => r.id === currentFloor.currentRoomId,
              );
              const isLocked = !currentRoom?.connections.includes(room.id) && !isActive;

              return (
                <RoomSlot key={room.id} $gridColumn={position.column} $gridRow={position.row}>
                  <RoomNode
                    room={room}
                    isActive={isActive}
                    isCleared={isCleared}
                    isLocked={isLocked}
                    onClick={() => handleRoomClick(room.id)}
                  />
                  {isActive && (
                    <PlayerMarker>
                      <PlayerIcon size={70} />
                    </PlayerMarker>
                  )}
                </RoomSlot>
              );
            })}
        </RoomGrid>
      </MapContent>

      <Legend>
        <LegendTitle>Raumtypen</LegendTitle>
        <LegendItem>
          <DoorIcon size={18} /> Eingang
        </LegendItem>
        <LegendItem>
          <SwordIcon size={18} /> Kampf
        </LegendItem>
        <LegendItem>
          <MonsterIcon size={18} /> Boss
        </LegendItem>
        <LegendItem>
          <ChestIcon size={18} /> Schatz
        </LegendItem>
        <LegendItem>
          <CoinIcon size={18} /> Shop
        </LegendItem>
        <LegendItem>
          <StairsIcon size={18} /> Ausgang
        </LegendItem>
      </Legend>
    </MapContainer>
  );
}
