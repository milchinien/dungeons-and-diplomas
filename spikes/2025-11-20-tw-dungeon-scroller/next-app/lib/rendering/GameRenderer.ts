import {
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  TILE,
  TILE_SOURCE_SIZE,
  TILESET_COORDS
} from '../constants';
import type { TileType, TileVariant, TileCoord, Room } from '../constants';
import type { Player } from '../Enemy';
import { SpriteSheetLoader } from '../SpriteSheetLoader';
import { Enemy } from '../Enemy';

export class GameRenderer {
  private tilesetImage: HTMLImageElement | null = null;

  async loadTileset() {
    const tilesetImage = new Image();
    await new Promise<void>((resolve) => {
      tilesetImage.onload = () => resolve();
      tilesetImage.src = '/Assets/Castle-Dungeon2_Tiles/Tileset.png';
    });
    this.tilesetImage = tilesetImage;
  }

  private getTileCoords(
    x: number,
    y: number,
    tile: TileType,
    tileVariants: TileVariant[][],
    roomMap: number[][],
    rooms: Room[],
    dungeon: TileType[][]
  ): TileCoord | null {
    if (tile === TILE.EMPTY) {
      return null;
    }

    if (tile === TILE.FLOOR) {
      const roomId = roomMap[y][x];
      if (roomId >= 0 && rooms[roomId]) {
        const roomType = rooms[roomId].type;

        if (roomType === 'treasure') {
          return { x: 18, y: 11 };
        } else if (roomType === 'combat') {
          return { x: 7, y: 12 };
        }
      }

      return tileVariants[y][x].floor;
    }

    if (tile === TILE.DOOR) {
      const hasWallLeft = x > 0 && dungeon[y][x - 1] === TILE.WALL;
      const hasWallRight = x < DUNGEON_WIDTH - 1 && dungeon[y][x + 1] === TILE.WALL;
      const hasWallAbove = y > 0 && dungeon[y - 1][x] === TILE.WALL;
      const hasWallBelow = y < DUNGEON_HEIGHT - 1 && dungeon[y + 1][x] === TILE.WALL;

      if (hasWallLeft || hasWallRight) {
        return TILESET_COORDS.DOOR_VERTICAL;
      } else if (hasWallAbove || hasWallBelow) {
        return TILESET_COORDS.DOOR_HORIZONTAL;
      } else {
        const hasFloorLeft = x > 0 && dungeon[y][x - 1] === TILE.FLOOR;
        const hasFloorRight = x < DUNGEON_WIDTH - 1 && dungeon[y][x + 1] === TILE.FLOOR;

        if (hasFloorLeft && hasFloorRight) {
          return TILESET_COORDS.DOOR_HORIZONTAL;
        } else {
          return TILESET_COORDS.DOOR_VERTICAL;
        }
      }
    }

    if (tile === TILE.WALL || tile === TILE.CORNER) {
      return tileVariants[y][x].wall;
    }

    return tileVariants[y][x].floor;
  }

  render(
    canvas: HTMLCanvasElement,
    player: Player,
    dungeon: TileType[][],
    tileVariants: TileVariant[][],
    roomMap: number[][],
    rooms: Room[],
    enemies: Enemy[],
    playerSprite: SpriteSheetLoader | null,
    tileSize: number,
    treasures?: Set<string>
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx || !this.tilesetImage) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let camX = player.x + tileSize / 2 - canvas.width / 2;
    let camY = player.y + tileSize / 2 - canvas.height / 2;

    ctx.save();
    ctx.translate(-Math.floor(camX), -Math.floor(camY));

    ctx.fillStyle = '#000000';
    ctx.fillRect(Math.floor(camX), Math.floor(camY), canvas.width, canvas.height);

    const startCol = Math.floor(camX / tileSize);
    const endCol = startCol + (canvas.width / tileSize) + 1;
    const startRow = Math.floor(camY / tileSize);
    const endRow = startRow + (canvas.height / tileSize) + 1;

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        if (x >= 0 && x < DUNGEON_WIDTH && y >= 0 && y < DUNGEON_HEIGHT) {
          const tile = dungeon[y][x];
          const roomId = roomMap[y][x];

          if (tile === TILE.EMPTY) continue;

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

          if (!isVisible) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            continue;
          }

          const coords = this.getTileCoords(x, y, tile, tileVariants, roomMap, rooms, dungeon);
          if (coords) {
            const srcX = coords.x * TILE_SOURCE_SIZE;
            const srcY = coords.y * TILE_SOURCE_SIZE;

            ctx.drawImage(
              this.tilesetImage,
              srcX, srcY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
              x * tileSize, y * tileSize, tileSize, tileSize
            );
          }
        } else {
          const wallCoords = TILESET_COORDS.WALL_TOP;
          const srcX = wallCoords.x * TILE_SOURCE_SIZE;
          const srcY = wallCoords.y * TILE_SOURCE_SIZE;

          ctx.drawImage(
            this.tilesetImage,
            srcX, srcY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
            x * tileSize, y * tileSize, tileSize, tileSize
          );
        }
      }
    }

    // Draw treasures
    if (treasures) {
      for (const treasureKey of treasures) {
        const [tx, ty] = treasureKey.split(',').map(Number);
        const roomId = roomMap[ty]?.[tx];

        // Only draw if room is visible
        if (roomId >= 0 && rooms[roomId]?.visible) {
          // Draw treasure chest sprite (10, 12)
          const treasureCoords = { x: 10, y: 12 };
          const srcX = treasureCoords.x * TILE_SOURCE_SIZE;
          const srcY = treasureCoords.y * TILE_SOURCE_SIZE;

          ctx.drawImage(
            this.tilesetImage,
            srcX, srcY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
            tx * tileSize, ty * tileSize, tileSize, tileSize
          );
        }
      }
    }

    for (const enemy of enemies) {
      enemy.draw(ctx, rooms, tileSize, player);
    }

    playerSprite?.draw(ctx, player.x, player.y, tileSize, tileSize);

    ctx.restore();
  }
}
