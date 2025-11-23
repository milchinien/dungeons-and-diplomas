import {
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  TILE
} from '../constants';
import type { TileType, Room } from '../constants';
import type { Player } from '../enemy';

export class MinimapRenderer {
  render(
    canvas: HTMLCanvasElement,
    player: Player,
    dungeon: TileType[][],
    roomMap: number[][],
    rooms: Room[],
    tileSize: number
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / DUNGEON_WIDTH;
    const scaleY = canvas.height / DUNGEON_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (canvas.width - DUNGEON_WIDTH * scale) / 2;
    const offsetY = (canvas.height - DUNGEON_HEIGHT * scale) / 2;

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
              ctx.fillStyle = '#FFD700';
            } else if (roomType === 'combat') {
              ctx.fillStyle = '#FF4444';
            } else {
              ctx.fillStyle = '#888888';
            }
          } else {
            ctx.fillStyle = '#888888';
          }
        } else if (tile === TILE.WALL) {
          ctx.fillStyle = '#444444';
        } else if (tile === TILE.DOOR) {
          ctx.fillStyle = '#4CAF50';
        } else {
          continue;
        }

        ctx.fillRect(
          offsetX + x * scale,
          offsetY + y * scale,
          Math.max(1, scale),
          Math.max(1, scale)
        );
      }
    }

    const playerTileX = Math.floor((player.x + tileSize / 2) / tileSize);
    const playerTileY = Math.floor((player.y + tileSize / 2) / tileSize);

    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(
      offsetX + playerTileX * scale - scale,
      offsetY + playerTileY * scale - scale,
      Math.max(2, scale * 3),
      Math.max(2, scale * 3)
    );
  }
}
