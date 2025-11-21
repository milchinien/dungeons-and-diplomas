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
  private tilesetBrightImage: HTMLImageElement | null = null;

  async loadTileset() {
    // Load dark tileset
    const tilesetImage = new Image();
    await new Promise<void>((resolve) => {
      tilesetImage.onload = () => resolve();
      tilesetImage.src = '/Assets/Castle-Dungeon2_Tiles/Tileset.png';
    });
    this.tilesetImage = tilesetImage;

    // Load bright tileset
    const tilesetBrightImage = new Image();
    await new Promise<void>((resolve) => {
      tilesetBrightImage.onload = () => resolve();
      tilesetBrightImage.src = '/Assets/Castle-Dungeon2_Tiles/Tileset_Bright.png';
    });
    this.tilesetBrightImage = tilesetBrightImage;
  }

  /**
   * Check if a room has living enemies in it
   */
  private hasEnemiesInRoom(roomId: number, enemies: Enemy[]): boolean {
    if (roomId < 0) return false;

    return enemies.some(enemy => enemy.roomId === roomId && enemy.alive);
  }

  /**
   * Get all spatially adjacent room IDs (rooms that share a border)
   * Uses the pre-computed spatialNeighbors array from dungeon generation
   */
  private getSpatialNeighbors(roomId: number, rooms: Room[], roomMap: number[][]): Set<number> {
    const room = rooms[roomId];
    if (!room) return new Set<number>();

    // Use the pre-computed spatial neighbors from calculateSpatialNeighbors()
    const spatialNeighbors = (room as any).spatialNeighbors || [];
    return new Set(spatialNeighbors);
  }

  /**
   * Check if a room is "clear" - meaning neither the room itself nor any of its
   * spatially neighboring rooms contain living enemies.
   * This prevents "half bright" walls and makes the visual state clearer.
   */
  private isRoomClear(roomId: number, rooms: Room[], roomMap: number[][], enemies: Enemy[]): boolean {
    if (roomId < 0) return false;

    // Check if the room itself has enemies
    if (this.hasEnemiesInRoom(roomId, enemies)) {
      return false;
    }

    // Check if any spatially neighboring room has enemies
    const neighbors = this.getSpatialNeighbors(roomId, rooms, roomMap);

    for (const neighborId of neighbors) {
      if (this.hasEnemiesInRoom(neighborId, enemies)) {
        return false;
      }
    }

    return true; // Room and all spatial neighbors are clear
  }

  /**
   * Determine if bright tileset should be used for a tile
   * - Floor tiles: use bright if room is "clear" (no enemies in room or neighbors)
   * - Wall/Door/Corner tiles: use bright if ANY adjacent room is "clear"
   */
  private shouldUseBrightTileset(
    x: number,
    y: number,
    tile: TileType,
    roomMap: number[][],
    rooms: Room[],
    enemies: Enemy[]
  ): boolean {
    // TILE.FLOOR = 1
    if (tile === 1) {
      const roomId = roomMap[y][x];

      // Special case: Floor tiles with invalid roomId (e.g., converted doors with roomId=-2)
      // Treat them like walls/doors and check adjacent rooms
      if (roomId < 0) {
        const adjacentRoomIds = new Set<number>();
        const directions = [
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];

        for (const { dx, dy } of directions) {
          const nx = x + dx;
          const ny = y + dy;
          if (ny >= 0 && ny < DUNGEON_HEIGHT && nx >= 0 && nx < DUNGEON_WIDTH) {
            const neighborRoomId = roomMap[ny][nx];
            if (neighborRoomId >= 0) {
              adjacentRoomIds.add(neighborRoomId);
            }
          }
        }

        if (adjacentRoomIds.size === 0) return false;

        // Use bright if ANY adjacent room is clear
        for (const adjRoomId of adjacentRoomIds) {
          if (this.isRoomClear(adjRoomId, rooms, roomMap, enemies)) {
            return true;
          }
        }
        return false;
      }

      // Normal floor tile with valid roomId
      return this.isRoomClear(roomId, rooms, roomMap, enemies);
    }

    // TILE.DOOR = 3, TILE.WALL = 2, TILE.CORNER = 4
    // Doors, walls, and corners: use bright if any adjacent room is clear
    if (tile === 2 || tile === 3 || tile === 4) {
      const adjacentRoomIds = new Set<number>();

      // Check all 4 cardinal directions for adjacent rooms
      const directions = [
        { dx: 0, dy: -1 }, // up
        { dx: 0, dy: 1 },  // down
        { dx: -1, dy: 0 }, // left
        { dx: 1, dy: 0 }   // right
      ];

      for (const { dx, dy } of directions) {
        const nx = x + dx;
        const ny = y + dy;
        if (ny >= 0 && ny < DUNGEON_HEIGHT && nx >= 0 && nx < DUNGEON_WIDTH) {
          const neighborRoomId = roomMap[ny][nx];
          if (neighborRoomId >= 0) {
            adjacentRoomIds.add(neighborRoomId);
          }
        }
      }

      // If no adjacent rooms found, use dark (default)
      if (adjacentRoomIds.size === 0) return false;

      // Use bright if ANY adjacent room is clear
      for (const roomId of adjacentRoomIds) {
        if (this.isRoomClear(roomId, rooms, roomMap, enemies)) {
          return true;
        }
      }

      return false; // Use dark if no adjacent room is clear
    }

    return false; // Default to dark for other tile types
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

            // Select tileset based on enemy presence
            const useBright = this.shouldUseBrightTileset(x, y, tile, roomMap, rooms, enemies);
            const selectedTileset = useBright ? this.tilesetBrightImage : this.tilesetImage;

            ctx.drawImage(
              selectedTileset!,
              srcX, srcY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
              x * tileSize, y * tileSize, tileSize, tileSize
            );
          }
        } else {
          // Tiles outside dungeon bounds - always use dark tileset
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
