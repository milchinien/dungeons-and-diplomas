import { useEffect, useRef } from 'react';
import { DUNGEON_WIDTH, DUNGEON_HEIGHT, TILE } from '../../lib/constants';
import type { TileType, Room } from '../../lib/constants';

interface MinimapProps {
  dungeon: TileType[][];
  roomMap: number[][];
  rooms: Room[];
  playerX: number;
  playerY: number;
  tileSize: number;
  width?: number;
  height?: number;
}

export function Minimap({
  dungeon,
  roomMap,
  rooms,
  playerX,
  playerY,
  tileSize,
  width = 200,
  height = 200,
}: MinimapProps) {
  const minimapRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const renderMinimap = () => {
      const minimap = minimapRef.current;
      const minimapCtx = minimap?.getContext('2d');
      if (!minimap || !minimapCtx) return;

      minimapCtx.fillStyle = '#000000';
      minimapCtx.fillRect(0, 0, minimap.width, minimap.height);

      const scaleX = minimap.width / DUNGEON_WIDTH;
      const scaleY = minimap.height / DUNGEON_HEIGHT;
      const scale = Math.min(scaleX, scaleY);

      const offsetX = (minimap.width - DUNGEON_WIDTH * scale) / 2;
      const offsetY = (minimap.height - DUNGEON_HEIGHT * scale) / 2;

      for (let y = 0; y < DUNGEON_HEIGHT; y++) {
        for (let x = 0; x < DUNGEON_WIDTH; x++) {
          const tile = dungeon[y][x];
          const roomId = roomMap[y][x];

          let isVisible = false;
          if (roomId >= 0 && rooms[roomId]) {
            isVisible = rooms[roomId].visible;
          } else if (roomId === -1 || roomId === -2) {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < DUNGEON_HEIGHT && nx >= 0 && nx < DUNGEON_WIDTH) {
                  const neighborRoomId = roomMap[ny][nx];
                  if (neighborRoomId >= 0 && rooms[neighborRoomId]?.visible) {
                    isVisible = true;
                    break;
                  }
                }
              }
              if (isVisible) break;
            }
          }

          if (!isVisible) continue;

          if (tile === TILE.FLOOR) {
            if (roomId >= 0 && rooms[roomId]) {
              const roomType = rooms[roomId].type;
              if (roomType === 'treasure') {
                minimapCtx.fillStyle = '#FFD700';
              } else if (roomType === 'combat') {
                minimapCtx.fillStyle = '#FF4444';
              } else {
                minimapCtx.fillStyle = '#888888';
              }
            } else {
              minimapCtx.fillStyle = '#888888';
            }
          } else if (tile === TILE.WALL) {
            minimapCtx.fillStyle = '#444444';
          } else if (tile === TILE.DOOR) {
            minimapCtx.fillStyle = '#4CAF50';
          } else {
            continue;
          }

          minimapCtx.fillRect(offsetX + x * scale, offsetY + y * scale, Math.max(1, scale), Math.max(1, scale));
        }
      }

      const playerTileX = Math.floor((playerX + tileSize / 2) / tileSize);
      const playerTileY = Math.floor((playerY + tileSize / 2) / tileSize);

      minimapCtx.fillStyle = '#00FFFF';
      minimapCtx.fillRect(
        offsetX + playerTileX * scale - scale,
        offsetY + playerTileY * scale - scale,
        Math.max(2, scale * 3),
        Math.max(2, scale * 3)
      );
    };

    renderMinimap();
  }, [dungeon, roomMap, rooms, playerX, playerY, tileSize, width, height]);

  return (
    <canvas
      ref={minimapRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        border: '3px solid #4CAF50',
        borderRadius: '4px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 100,
        imageRendering: 'pixelated',
      }}
    />
  );
}
