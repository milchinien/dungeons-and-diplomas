import {
  TILE,
  TILE_SOURCE_SIZE,
  DIRECTION_OFFSETS
} from '../constants';
import type { TileType, Room } from '../constants';
import type { Player } from '../enemy';
import { SpriteSheetLoader } from '../SpriteSheetLoader';
import { Enemy } from '../enemy';
import type { RenderMap, TileTheme } from '../tiletheme/types';
import { getThemeRenderer } from '../tiletheme/ThemeRenderer';
import { detectDoorType } from '../tiletheme/WallTypeDetector';
import { VisibilityCalculator } from '../visibility';

export class GameRenderer {
  /**
   * Check if a room has living enemies in it
   */
  private hasEnemiesInRoom(roomId: number, enemies: Enemy[]): boolean {
    if (roomId < 0) return false;
    return enemies.some(enemy => enemy.roomId === roomId && enemy.alive);
  }

  /**
   * Get all spatially adjacent room IDs (rooms that share a border)
   */
  private getSpatialNeighbors(roomId: number, rooms: Room[]): Set<number> {
    const room = rooms[roomId];
    if (!room) return new Set<number>();
    const spatialNeighbors = (room as any).spatialNeighbors || [];
    return new Set(spatialNeighbors);
  }

  /**
   * Check if a room is "clear" - no enemies in room or neighbors
   */
  private isRoomClear(roomId: number, rooms: Room[], roomMap: number[][], enemies: Enemy[]): boolean {
    if (roomId < 0) return false;
    if (this.hasEnemiesInRoom(roomId, enemies)) return false;

    const neighbors = this.getSpatialNeighbors(roomId, rooms);
    for (const neighborId of neighbors) {
      if (this.hasEnemiesInRoom(neighborId, enemies)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Determine if bright/light tileset should be used for a tile
   */
  private shouldUseBrightTileset(
    x: number,
    y: number,
    tile: TileType,
    roomMap: number[][],
    rooms: Room[],
    enemies: Enemy[],
    dungeonWidth: number,
    dungeonHeight: number
  ): boolean {
    // Floor tiles: check room clearance
    if (tile === TILE.FLOOR) {
      const roomId = roomMap[y][x];

      if (roomId < 0) {
        // Floor with invalid roomId - check adjacent rooms
        const adjacentRoomIds = new Set<number>();

        for (const { dx, dy } of DIRECTION_OFFSETS) {
          const nx = x + dx;
          const ny = y + dy;
          if (ny >= 0 && ny < dungeonHeight && nx >= 0 && nx < dungeonWidth) {
            const neighborRoomId = roomMap[ny][nx];
            if (neighborRoomId >= 0) adjacentRoomIds.add(neighborRoomId);
          }
        }

        if (adjacentRoomIds.size === 0) return false;

        for (const adjRoomId of adjacentRoomIds) {
          if (this.isRoomClear(adjRoomId, rooms, roomMap, enemies)) return true;
        }
        return false;
      }

      return this.isRoomClear(roomId, rooms, roomMap, enemies);
    }

    // Walls/Doors/Corners: bright if any adjacent room is clear
    if (tile === TILE.WALL || tile === TILE.DOOR || tile === TILE.CORNER) {
      const adjacentRoomIds = new Set<number>();

      for (const { dx, dy } of DIRECTION_OFFSETS) {
        const nx = x + dx;
        const ny = y + dy;
        if (ny >= 0 && ny < dungeonHeight && nx >= 0 && nx < dungeonWidth) {
          const neighborRoomId = roomMap[ny][nx];
          if (neighborRoomId >= 0) adjacentRoomIds.add(neighborRoomId);
        }
      }

      if (adjacentRoomIds.size === 0) return false;

      for (const roomId of adjacentRoomIds) {
        if (this.isRoomClear(roomId, rooms, roomMap, enemies)) return true;
      }
      return false;
    }

    return false;
  }



  /**
   * Render all tiles in the visible area
   */
  private renderTiles(
    ctx: CanvasRenderingContext2D,
    dungeon: TileType[][],
    roomMap: number[][],
    rooms: Room[],
    enemies: Enemy[],
    tileSize: number,
    renderMap: RenderMap,
    doorStates: Map<string, boolean>,
    darkTheme: TileTheme | null,
    startCol: number,
    endCol: number,
    startRow: number,
    endRow: number,
    dungeonWidth: number,
    dungeonHeight: number
  ): void {
    const themeRenderer = getThemeRenderer();

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        if (x < 0 || x >= dungeonWidth || y < 0 || y >= dungeonHeight) {
          continue;
        }

        const tile = dungeon[y][x];
        const roomId = roomMap[y][x];

        if (tile === TILE.EMPTY) continue;

        const isVisible = VisibilityCalculator.isTileVisible(x, y, roomId, roomMap, rooms, dungeonWidth, dungeonHeight);

        if (!isVisible) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          continue;
        }

        // Special handling for doors
        if (tile === TILE.DOOR && darkTheme) {
          const doorKey = `${x},${y}`;
          const isOpen = doorStates.get(doorKey) ?? false;
          const doorType = detectDoorType(dungeon, x, y, isOpen);
          const doorVariants = darkTheme.door[doorType];

          if (doorVariants && doorVariants.length > 0) {
            const variant = doorVariants[0];
            const tileset = themeRenderer.getTilesetImage(variant.source.tilesetId);

            if (tileset) {
              ctx.drawImage(
                tileset,
                variant.source.x * TILE_SOURCE_SIZE,
                variant.source.y * TILE_SOURCE_SIZE,
                TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
                x * tileSize, y * tileSize, tileSize, tileSize
              );
            } else {
              ctx.fillStyle = '#FF00FF';
              ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
          }
          continue;
        }

        // Get pre-computed render tile
        const renderTile = renderMap.tiles[y]?.[x];
        if (!renderTile) continue;

        const useBright = this.shouldUseBrightTileset(
          x, y, tile, roomMap, rooms, enemies, dungeonWidth, dungeonHeight
        );

        const useLight = useBright && renderTile.lightTilesetId !== null;
        const tilesetId = useLight ? renderTile.lightTilesetId! : renderTile.darkTilesetId;
        const srcX = useLight ? renderTile.lightSrcX! : renderTile.darkSrcX;
        const srcY = useLight ? renderTile.lightSrcY! : renderTile.darkSrcY;

        const tileset = themeRenderer.getTilesetImage(tilesetId);

        if (tileset) {
          ctx.drawImage(
            tileset,
            srcX, srcY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
            x * tileSize, y * tileSize, tileSize, tileSize
          );
        } else {
          ctx.fillStyle = '#FF00FF';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }
  }

  /**
   * Render fog of war dimming effect for rooms where player is not present
   */
  private renderFogOfWar(
    ctx: CanvasRenderingContext2D,
    dungeon: TileType[][],
    roomMap: number[][],
    rooms: Room[],
    playerRoomIds: Set<number>,
    tileSize: number,
    startCol: number,
    endCol: number,
    startRow: number,
    endRow: number,
    dungeonWidth: number,
    dungeonHeight: number
  ): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        if (x < 0 || x >= dungeonWidth || y < 0 || y >= dungeonHeight) continue;

        const tile = dungeon[y][x];
        if (tile === TILE.EMPTY) continue;

        const roomId = roomMap[y][x];

        const isVisible = VisibilityCalculator.isTileVisible(x, y, roomId, roomMap, rooms, dungeonWidth, dungeonHeight);
        if (!isVisible) continue;

        // Determine if tile should be dimmed using VisibilityCalculator
        const shouldDim = VisibilityCalculator.shouldDimTile(
          x, y, roomId, roomMap, playerRoomIds, dungeonWidth, dungeonHeight
        );

        if (shouldDim) {
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }
  }

  /**
   * Render all enemies visible in player's rooms
   */
  private renderEnemies(
    ctx: CanvasRenderingContext2D,
    enemies: Enemy[],
    rooms: Room[],
    tileSize: number,
    player: Player,
    playerRoomIds: Set<number>
  ): void {
    for (const enemy of enemies) {
      enemy.draw(ctx, rooms, tileSize, player, playerRoomIds);
    }
  }

  /**
   * Render the player sprite
   */
  private renderPlayer(
    ctx: CanvasRenderingContext2D,
    playerSprite: SpriteSheetLoader | null,
    player: Player,
    tileSize: number
  ): void {
    playerSprite?.draw(ctx, player.x, player.y, tileSize, tileSize);
  }

  /**
   * Main render method - orchestrates all rendering passes
   */
  render(
    canvas: HTMLCanvasElement,
    player: Player,
    dungeon: TileType[][],
    roomMap: number[][],
    rooms: Room[],
    enemies: Enemy[],
    playerSprite: SpriteSheetLoader | null,
    tileSize: number,
    renderMap: RenderMap,
    doorStates: Map<string, boolean>,
    darkTheme: TileTheme | null
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const dungeonWidth = renderMap.width;
    const dungeonHeight = renderMap.height;

    const camX = player.x + tileSize / 2 - canvas.width / 2;
    const camY = player.y + tileSize / 2 - canvas.height / 2;

    ctx.save();
    ctx.translate(-Math.floor(camX), -Math.floor(camY));

    // Clear with black
    ctx.fillStyle = '#000000';
    ctx.fillRect(Math.floor(camX), Math.floor(camY), canvas.width, canvas.height);

    // Calculate visible tile range
    const startCol = Math.floor(camX / tileSize);
    const endCol = startCol + Math.ceil(canvas.width / tileSize) + 1;
    const startRow = Math.floor(camY / tileSize);
    const endRow = startRow + Math.ceil(canvas.height / tileSize) + 1;

    // Get player's current room(s) for visibility calculations
    const playerRoomIds = VisibilityCalculator.getPlayerRoomIds(player, tileSize, roomMap, dungeonWidth, dungeonHeight);

    // Pass 1: Render tiles
    this.renderTiles(
      ctx, dungeon, roomMap, rooms, enemies, tileSize, renderMap, doorStates, darkTheme,
      startCol, endCol, startRow, endRow, dungeonWidth, dungeonHeight
    );

    // Pass 2: Render fog of war dimming
    this.renderFogOfWar(
      ctx, dungeon, roomMap, rooms, playerRoomIds, tileSize,
      startCol, endCol, startRow, endRow, dungeonWidth, dungeonHeight
    );

    // Pass 3: Render enemies
    this.renderEnemies(ctx, enemies, rooms, tileSize, player, playerRoomIds);

    // Pass 4: Render player
    this.renderPlayer(ctx, playerSprite, player, tileSize);

    ctx.restore();
  }
}
