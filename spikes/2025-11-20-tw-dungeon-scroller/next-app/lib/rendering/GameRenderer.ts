import {
  TILE,
  TILE_SOURCE_SIZE
} from '../constants';
import type { TileType, Room } from '../constants';
import type { Player } from '../Enemy';
import { SpriteSheetLoader } from '../SpriteSheetLoader';
import { Enemy } from '../Enemy';
import type { RenderMap, TileTheme } from '../tiletheme/types';
import { getThemeRenderer } from '../tiletheme/ThemeRenderer';
import { detectDoorType } from '../tiletheme/WallTypeDetector';

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
        const directions = [
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];

        for (const { dx, dy } of directions) {
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
      const directions = [
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
      ];

      for (const { dx, dy } of directions) {
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
   * Get player's current room ID
   */
  private getPlayerRoomId(player: Player, tileSize: number, roomMap: number[][], dungeonWidth: number, dungeonHeight: number): number {
    const playerTileX = Math.floor((player.x + tileSize / 2) / tileSize);
    const playerTileY = Math.floor((player.y + tileSize / 2) / tileSize);

    if (playerTileX >= 0 && playerTileX < dungeonWidth && playerTileY >= 0 && playerTileY < dungeonHeight) {
      return roomMap[playerTileY][playerTileX];
    }
    return -1;
  }

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

    const themeRenderer = getThemeRenderer();

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

    const startCol = Math.floor(camX / tileSize);
    const endCol = startCol + Math.ceil(canvas.width / tileSize) + 1;
    const startRow = Math.floor(camY / tileSize);
    const endRow = startRow + Math.ceil(canvas.height / tileSize) + 1;

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        // Outside dungeon bounds - skip (black from clear)
        if (x < 0 || x >= dungeonWidth || y < 0 || y >= dungeonHeight) {
          continue;
        }

        const tile = dungeon[y][x];
        const roomId = roomMap[y][x];

        // Empty tiles - skip
        if (tile === TILE.EMPTY) continue;

        // Check visibility (fog of war)
        let isVisible = false;
        if (roomId >= 0 && rooms[roomId]) {
          isVisible = rooms[roomId].visible;
        } else if (roomId === -1 || roomId === -2) {
          // Walls/doors - visible if any adjacent room is visible
          outer: for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < dungeonHeight && nx >= 0 && nx < dungeonWidth) {
                const neighborRoomId = roomMap[ny][nx];
                if (neighborRoomId >= 0 && rooms[neighborRoomId]?.visible) {
                  isVisible = true;
                  break outer;
                }
              }
            }
          }
        }

        // Not visible - draw black
        if (!isVisible) {
          ctx.fillStyle = '#000000';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
          continue;
        }

        // Special handling for doors - render dynamically based on open/closed state
        if (tile === TILE.DOOR && darkTheme) {
          const doorKey = `${x},${y}`;
          const isOpen = doorStates.get(doorKey) ?? false;
          const doorType = detectDoorType(dungeon, x, y, isOpen);
          const doorVariants = darkTheme.door[doorType];

          if (doorVariants && doorVariants.length > 0) {
            const variant = doorVariants[0]; // Use first variant
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

        // Get pre-computed render tile (for non-door tiles)
        const renderTile = renderMap.tiles[y]?.[x];
        if (!renderTile) continue;

        // Determine bright/dark based on enemy presence
        const useBright = this.shouldUseBrightTileset(
          x, y, tile, roomMap, rooms, enemies, dungeonWidth, dungeonHeight
        );

        // Select light or dark tile
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
          // Missing tileset - pink placeholder (indicates configuration error)
          ctx.fillStyle = '#FF00FF';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }

    // Get player's current room for enemy visibility and fog of war
    const playerRoomId = this.getPlayerRoomId(player, tileSize, roomMap, dungeonWidth, dungeonHeight);

    // Fog of War: Dim visible rooms where player is NOT present
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        if (x < 0 || x >= dungeonWidth || y < 0 || y >= dungeonHeight) continue;

        const tile = dungeon[y][x];
        if (tile === TILE.EMPTY) continue;

        const roomId = roomMap[y][x];

        // Check if tile is visible
        let isVisible = false;
        if (roomId >= 0 && rooms[roomId]) {
          isVisible = rooms[roomId].visible;
        } else if (roomId === -1 || roomId === -2) {
          // Walls/doors - visible if any adjacent room is visible
          outer: for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < dungeonHeight && nx >= 0 && nx < dungeonWidth) {
                const neighborRoomId = roomMap[ny][nx];
                if (neighborRoomId >= 0 && rooms[neighborRoomId]?.visible) {
                  isVisible = true;
                  break outer;
                }
              }
            }
          }
        }

        if (!isVisible) continue;

        // Dim tiles that are NOT in the player's current room
        // For walls/doors (roomId < 0), dim if not adjacent to player's room
        let shouldDim = false;
        if (roomId >= 0) {
          shouldDim = roomId !== playerRoomId;
        } else {
          // Wall/door: dim if not adjacent to player's room
          let adjacentToPlayerRoom = false;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < dungeonHeight && nx >= 0 && nx < dungeonWidth) {
                if (roomMap[ny][nx] === playerRoomId) {
                  adjacentToPlayerRoom = true;
                  break;
                }
              }
            }
            if (adjacentToPlayerRoom) break;
          }
          shouldDim = !adjacentToPlayerRoom;
        }

        if (shouldDim) {
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }

    // Draw enemies (only in player's current room)
    for (const enemy of enemies) {
      enemy.draw(ctx, rooms, tileSize, player, playerRoomId);
    }

    // Draw player
    playerSprite?.draw(ctx, player.x, player.y, tileSize, tileSize);

    ctx.restore();
  }
}
