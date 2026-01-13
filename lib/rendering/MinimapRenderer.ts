import {
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  TILE
} from '../constants';
import type { TileType, Room, Shrine } from '../constants';
import type { Player, Enemy } from '../enemy';
import { getEntityTilePosition } from '../physics/TileCoordinates';
import { getContext2D, clearCanvas } from './canvasUtils';
import { RENDER_COLORS } from '../ui/colors';

// Shop room color (cyan/turquoise)
const SHOP_COLOR = '#00CED1';

export interface MinimapRenderOptions {
  canvas: HTMLCanvasElement;
  player: Player;
  dungeon: TileType[][];
  roomMap: number[][];
  rooms: Room[];
  tileSize: number;
  // Optional entity data for enhanced minimap
  enemies?: Enemy[];
  shrines?: Shrine[];
  treasures?: Set<string>;
}

export class MinimapRenderer {
  render(options: MinimapRenderOptions) {
    const {
      canvas,
      player,
      dungeon,
      roomMap,
      rooms,
      tileSize,
      enemies = [],
      shrines = [],
      treasures = new Set()
    } = options;

    const ctx = getContext2D(canvas);
    if (!ctx) return;

    clearCanvas(ctx);

    const scaleX = canvas.width / DUNGEON_WIDTH;
    const scaleY = canvas.height / DUNGEON_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (canvas.width - DUNGEON_WIDTH * scale) / 2;
    const offsetY = (canvas.height - DUNGEON_HEIGHT * scale) / 2;

    // Render dungeon tiles
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
            } else if (roomType === 'shop') {
              ctx.fillStyle = SHOP_COLOR;
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

    // Render shop room icons ($ symbol)
    rooms.forEach(room => {
      if (room.type === 'shop' && room.visible) {
        const centerX = offsetX + (room.x + room.width / 2) * scale;
        const centerY = offsetY + (room.y + room.height / 2) * scale;
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold ' + Math.max(8, scale * 2) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', centerX, centerY);
        ctx.restore();
      }
    });

    // Render treasures (yellow diamonds) - only in visible rooms
    treasures.forEach(treasureKey => {
      const [tx, ty] = treasureKey.split(',').map(Number);
      const roomId = roomMap[ty]?.[tx];
      if (roomId >= 0 && rooms[roomId]?.visible) {
        ctx.fillStyle = RENDER_COLORS.minimap.treasureItem;
        const centerX = offsetX + tx * scale + scale / 2;
        const centerY = offsetY + ty * scale + scale / 2;
        const size = Math.max(3, scale * 1.5);

        // Draw diamond shape
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - size);
        ctx.lineTo(centerX + size, centerY);
        ctx.lineTo(centerX, centerY + size);
        ctx.lineTo(centerX - size, centerY);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Render shrines (gold/orange stars) - only in visible rooms
    shrines.forEach(shrine => {
      const roomId = shrine.roomId;
      if (roomId >= 0 && rooms[roomId]?.visible) {
        const color = shrine.isActive
          ? RENDER_COLORS.minimap.shrineActive
          : (shrine.isActivated ? RENDER_COLORS.minimap.empty : RENDER_COLORS.minimap.shrine);

        if (!shrine.isActivated) {
          ctx.fillStyle = color;
          const centerX = offsetX + shrine.x * scale;
          const centerY = offsetY + shrine.y * scale;
          const size = Math.max(4, scale * 2);

          // Draw star shape
          this.drawStar(ctx, centerX, centerY, 5, size, size / 2);
        }
      }
    });

    // Render enemies (red circles) - only in visible rooms
    enemies.forEach(enemy => {
      const { tx: enemyTileX, ty: enemyTileY } = getEntityTilePosition(enemy, tileSize);
      const roomId = roomMap[enemyTileY]?.[enemyTileX];

      if (roomId >= 0 && rooms[roomId]?.visible) {
        ctx.fillStyle = RENDER_COLORS.minimap.enemy;
        const centerX = offsetX + enemyTileX * scale + scale / 2;
        const centerY = offsetY + enemyTileY * scale + scale / 2;
        const radius = Math.max(2, scale * 1.2);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Render player (cyan square - larger and on top)
    const { tx: playerTileX, ty: playerTileY } = getEntityTilePosition(player, tileSize);

    ctx.fillStyle = RENDER_COLORS.minimap.player;
    ctx.fillRect(
      offsetX + playerTileX * scale - scale,
      offsetY + playerTileY * scale - scale,
      Math.max(2, scale * 3),
      Math.max(2, scale * 3)
    );
  }

  /**
   * Draw a star shape
   */
  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Legacy render method for backwards compatibility
   */
  renderLegacy(
    canvas: HTMLCanvasElement,
    player: Player,
    dungeon: TileType[][],
    roomMap: number[][],
    rooms: Room[],
    tileSize: number
  ) {
    this.render({
      canvas,
      player,
      dungeon,
      roomMap,
      rooms,
      tileSize
    });
  }
}
