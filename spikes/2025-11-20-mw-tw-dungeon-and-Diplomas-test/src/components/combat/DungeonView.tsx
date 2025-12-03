import { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { CharacterSprite } from './CharacterSprite';
import { TILE_SOURCE_SIZE, TILESET_COORDS } from '../../lib/constants';

interface DungeonViewProps {
  isPlayerAttacking?: boolean;
  isEnemyHurt?: boolean;
}

const flicker = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
`;

const DungeonContainer = styled.div`
  width: 100%;
  height: 500px;
  position: relative;
  overflow: hidden;
  background: #1a1a1a;
`;

const DungeonCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  position: absolute;
  top: 0;
  left: 0;
`;

const Torch = styled.div<{ $left: number; $top: number }>`
  position: absolute;
  left: ${(props) => props.$left}px;
  top: ${(props) => props.$top}px;
  width: 40px;
  height: 80px;
  z-index: 5;
`;

const TorchStick = styled.div`
  width: 12px;
  height: 55px;
  background-color: #8b4513;
  margin: 0 auto;
  border-radius: 3px;
`;

const TorchFlame = styled.div`
  width: 40px;
  height: 45px;
  background: radial-gradient(ellipse at center, #ffff00 0%, #ffcc00 30%, #ff9933 60%, #ff6600 100%);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  animation: ${flicker} 0.5s ease-in-out infinite;
  position: relative;
  top: -10px;
  box-shadow:
    0 0 25px rgba(255, 153, 51, 0.7),
    0 0 50px rgba(255, 102, 0, 0.5);
  filter: blur(1px);

  &::before {
    content: '';
    position: absolute;
    top: 7px;
    left: 7px;
    right: 7px;
    bottom: 7px;
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
    border-radius: 50%;
  }
`;

export function DungeonView({ isPlayerAttacking, isEnemyHurt }: DungeonViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load tileset
    const tileset = new Image();
    tileset.onload = () => {
      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const tileSize = 64;
      const tilesX = Math.ceil(canvas.width / tileSize);
      const tilesY = Math.ceil(canvas.height / tileSize);

      // Draw floor
      for (let y = 0; y < tilesY; y++) {
        for (let x = 0; x < tilesX; x++) {
          const floorCoords = TILESET_COORDS.FLOOR_VARIANTS[0];
          const srcX = floorCoords.x * TILE_SOURCE_SIZE;
          const srcY = floorCoords.y * TILE_SOURCE_SIZE;

          ctx.drawImage(
            tileset,
            srcX,
            srcY,
            TILE_SOURCE_SIZE,
            TILE_SOURCE_SIZE,
            x * tileSize,
            y * tileSize,
            tileSize,
            tileSize
          );
        }
      }

      // Draw walls on the sides
      const wallHeight = 5;
      for (let y = 0; y < wallHeight; y++) {
        // Left wall
        for (let x = 0; x < 2; x++) {
          const wallCoords = TILESET_COORDS.WALL_TOP;
          const srcX = wallCoords.x * TILE_SOURCE_SIZE;
          const srcY = wallCoords.y * TILE_SOURCE_SIZE;

          ctx.drawImage(
            tileset,
            srcX,
            srcY,
            TILE_SOURCE_SIZE,
            TILE_SOURCE_SIZE,
            x * tileSize,
            y * tileSize,
            tileSize,
            tileSize
          );
        }

        // Right wall
        for (let x = 0; x < 2; x++) {
          const wallCoords = TILESET_COORDS.WALL_TOP;
          const srcX = wallCoords.x * TILE_SOURCE_SIZE;
          const srcY = wallCoords.y * TILE_SOURCE_SIZE;

          ctx.drawImage(
            tileset,
            srcX,
            srcY,
            TILE_SOURCE_SIZE,
            TILE_SOURCE_SIZE,
            canvas.width - (x + 1) * tileSize,
            y * tileSize,
            tileSize,
            tileSize
          );
        }
      }

      // Draw back wall
      for (let x = 0; x < tilesX; x++) {
        const wallCoords = TILESET_COORDS.WALL_TOP;
        const srcX = wallCoords.x * TILE_SOURCE_SIZE;
        const srcY = wallCoords.y * TILE_SOURCE_SIZE;

        ctx.drawImage(
          tileset,
          srcX,
          srcY,
          TILE_SOURCE_SIZE,
          TILE_SOURCE_SIZE,
          x * tileSize,
          0,
          tileSize,
          tileSize
        );
      }

      // Add some shadow/fog at the top
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    };

    tileset.src = '/assets/Castle-Dungeon2_Tiles/Tileset.png';
  }, []);

  return (
    <DungeonContainer>
      <DungeonCanvas ref={canvasRef} />

      {/* Torches */}
      <Torch $left={100} $top={50}>
        <TorchFlame />
        <TorchStick />
      </Torch>
      <Torch $left={window.innerWidth - 130} $top={50}>
        <TorchFlame />
        <TorchStick />
      </Torch>

      {/* Characters */}
      <CharacterSprite isPlayer={true} isAttacking={isPlayerAttacking} />
      <CharacterSprite isPlayer={false} isHurt={isEnemyHurt} />
    </DungeonContainer>
  );
}
