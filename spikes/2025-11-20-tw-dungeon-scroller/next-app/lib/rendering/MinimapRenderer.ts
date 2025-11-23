import {
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  TILE
} from '../constants';
import type { TileType, Room } from '../constants';
import type { Player } from '../enemy';
import { getEntityTilePosition } from '../physics/TileCoordinates';
import { getContext2D, clearCanvas } from './canvasUtils';
import { RENDER_COLORS } from '../ui/colors';

export class MinimapRenderer {
  render(
    canvas: HTMLCanvasElement,
    player: Player,
    dungeon: TileType[][],
    roomMap: number[][],
    rooms: Room[],
    tileSize: number
  ) {
    const ctx = getContext2D(canvas);
    if (!ctx) return;

    clearCanvas(ctx);

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
              ctx.fillStyle = RENDER_COLORS.minimap.treasure;
            } else if (roomType === 'combat') {
              ctx.fillStyle = RENDER_COLORS.minimap.combat;
            } else {
              ctx.fillStyle = RENDER_COLORS.minimap.empty;
            }
          } else {
            ctx.fillStyle = RENDER_COLORS.minimap.empty;
          }
        } else if (tile === TILE.WALL) {
          ctx.fillStyle = RENDER_COLORS.minimap.wall;
        } else if (tile === TILE.DOOR) {
          ctx.fillStyle = RENDER_COLORS.minimap.door;
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

    const { tx: playerTileX, ty: playerTileY } = getEntityTilePosition(player, tileSize);

    ctx.fillStyle = RENDER_COLORS.minimap.player;
    ctx.fillRect(
      offsetX + playerTileX * scale - scale,
      offsetY + playerTileY * scale - scale,
      Math.max(2, scale * 3),
      Math.max(2, scale * 3)
    );
  }
}
