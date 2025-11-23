import { DIRECTION_OFFSETS } from '../constants';
import type { Room } from '../constants';
import type { Player } from '../enemy';
import { getEntityTilePosition } from '../physics/TileCoordinates';

/**
 * Handles fog-of-war visibility calculations for dungeon tiles and rooms.
 * Extracted from GameRenderer and DungeonView to eliminate code duplication.
 */
export class VisibilityCalculator {
  /**
   * Check if a tile is visible (fog of war check).
   * Floor tiles are visible if their room is visible.
   * Walls/doors are visible if any adjacent room is visible.
   */
  static isTileVisible(
    x: number,
    y: number,
    roomId: number,
    roomMap: number[][],
    rooms: Room[],
    dungeonWidth: number,
    dungeonHeight: number
  ): boolean {
    // Floor tiles in a valid room: check room visibility
    if (roomId >= 0 && rooms[roomId]) {
      return rooms[roomId].visible;
    }

    // Walls (-1) or doors (-2): visible if any adjacent room is visible
    if (roomId === -1 || roomId === -2) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < dungeonHeight && nx >= 0 && nx < dungeonWidth) {
            const neighborRoomId = roomMap[ny][nx];
            if (neighborRoomId >= 0 && rooms[neighborRoomId]?.visible) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Get the player's current room ID(s).
   * Returns a Set because player might be on a door (adjacent to multiple rooms).
   */
  static getPlayerRoomIds(
    player: Player,
    tileSize: number,
    roomMap: number[][],
    dungeonWidth: number,
    dungeonHeight: number
  ): Set<number> {
    const { tx: playerTileX, ty: playerTileY } = getEntityTilePosition(player, tileSize);
    const roomIds = new Set<number>();

    if (playerTileX < 0 || playerTileX >= dungeonWidth || playerTileY < 0 || playerTileY >= dungeonHeight) {
      return roomIds;
    }

    const directRoomId = roomMap[playerTileY][playerTileX];

    // If player is in a valid room, just return that
    if (directRoomId >= 0) {
      roomIds.add(directRoomId);
      return roomIds;
    }

    // Player is on a door/wall (roomId < 0) - find adjacent rooms
    for (const { dx, dy } of DIRECTION_OFFSETS) {
      const nx = playerTileX + dx;
      const ny = playerTileY + dy;
      if (nx >= 0 && nx < dungeonWidth && ny >= 0 && ny < dungeonHeight) {
        const neighborRoomId = roomMap[ny][nx];
        if (neighborRoomId >= 0) {
          roomIds.add(neighborRoomId);
        }
      }
    }

    return roomIds;
  }

  /**
   * Determine if a tile should be dimmed (player not in that room).
   * Floor tiles are dimmed if player is not in that room.
   * Walls/doors are dimmed if not adjacent to any of the player's rooms.
   */
  static shouldDimTile(
    x: number,
    y: number,
    roomId: number,
    roomMap: number[][],
    playerRoomIds: Set<number>,
    dungeonWidth: number,
    dungeonHeight: number
  ): boolean {
    // Floor tiles in a valid room: dim if player not in that room
    if (roomId >= 0) {
      return !playerRoomIds.has(roomId);
    }

    // Wall/door: dim if not adjacent to any of the player's rooms
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < dungeonHeight && nx >= 0 && nx < dungeonWidth) {
          if (playerRoomIds.has(roomMap[ny][nx])) {
            return false; // Adjacent to player's room - don't dim
          }
        }
      }
    }

    return true; // Not adjacent to any player room - dim
  }
}
