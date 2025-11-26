import { TILE, DIRECTION_OFFSETS } from '../constants';
import type { TileType, Room } from '../constants';
import type { Enemy } from '../enemy';

/**
 * Calculates brightness/lighting state for tiles based on room clearance.
 * Extracted from GameRenderer for better separation of concerns.
 */
export class BrightnessCalculator {
  /**
   * Check if a room has living enemies in it
   */
  static hasEnemiesInRoom(roomId: number, enemies: Enemy[]): boolean {
    if (roomId < 0) return false;
    return enemies.some(enemy => enemy.roomId === roomId && enemy.alive);
  }

  /**
   * Get all spatially adjacent room IDs (rooms that share a border)
   */
  static getSpatialNeighbors(roomId: number, rooms: Room[]): Set<number> {
    const room = rooms[roomId];
    if (!room) return new Set<number>();
    const spatialNeighbors = (room as any).spatialNeighbors || [];
    return new Set(spatialNeighbors);
  }

  /**
   * Check if a room is "clear" - no enemies in room or neighbors
   */
  static isRoomClear(roomId: number, rooms: Room[], roomMap: number[][], enemies: Enemy[]): boolean {
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
   * Determine if bright/light tileset should be used for a tile.
   * Bright tiles are shown when the room (and neighbors) are clear of enemies.
   */
  static shouldUseBrightTileset(
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
        const adjacentRoomIds = this.getAdjacentRoomIds(x, y, roomMap, dungeonWidth, dungeonHeight);

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
      const adjacentRoomIds = this.getAdjacentRoomIds(x, y, roomMap, dungeonWidth, dungeonHeight);

      if (adjacentRoomIds.size === 0) return false;

      for (const roomId of adjacentRoomIds) {
        if (this.isRoomClear(roomId, rooms, roomMap, enemies)) return true;
      }
      return false;
    }

    return false;
  }

  /**
   * Get all adjacent room IDs for a given tile position
   */
  private static getAdjacentRoomIds(
    x: number,
    y: number,
    roomMap: number[][],
    dungeonWidth: number,
    dungeonHeight: number
  ): Set<number> {
    const adjacentRoomIds = new Set<number>();

    for (const { dx, dy } of DIRECTION_OFFSETS) {
      const nx = x + dx;
      const ny = y + dy;
      if (ny >= 0 && ny < dungeonHeight && nx >= 0 && nx < dungeonWidth) {
        const neighborRoomId = roomMap[ny][nx];
        if (neighborRoomId >= 0) adjacentRoomIds.add(neighborRoomId);
      }
    }

    return adjacentRoomIds;
  }
}
