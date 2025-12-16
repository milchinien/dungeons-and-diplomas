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

  /**
   * Calculate fog intensity for a tile based on room state and player distance.
   * Used for the new fog-of-war system with exploration mechanics.
   *
   * @param tileX - Tile X coordinate
   * @param tileY - Tile Y coordinate
   * @param playerTileX - Player's tile X coordinate
   * @param playerTileY - Player's tile Y coordinate
   * @param room - The room this tile belongs to
   * @param viewRadius - Player's visibility radius in tiles (default 4)
   * @returns Fog intensity from 0 (clear) to 1 (full fog)
   */
  static getTileFogIntensity(
    tileX: number,
    tileY: number,
    playerTileX: number,
    playerTileY: number,
    room: Room | null,
    viewRadius: number = 4
  ): number {
    // No room = unexplored area (full fog)
    if (!room) return 1;

    // Explored rooms have no fog
    if (room.state === 'explored') return 0;

    // Unexplored rooms have full fog
    if (room.state === 'unexplored') return 1;

    // Exploring rooms: calculate distance-based fog
    const dx = tileX - playerTileX;
    const dy = tileY - playerTileY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Within view radius: no fog
    if (distance <= viewRadius) return 0;

    // Fade distance for smooth transition
    const fadeDistance = 2;

    // Calculate fog intensity based on distance beyond view radius
    const fogIntensity = Math.min(1, (distance - viewRadius) / fadeDistance);

    return fogIntensity;
  }

  /**
   * Get fog intensity for walls and doors based on adjacent rooms.
   * Uses the most favorable (lowest) fog intensity from adjacent rooms.
   */
  static getWallFogIntensity(
    tileX: number,
    tileY: number,
    playerTileX: number,
    playerTileY: number,
    roomMap: number[][],
    rooms: Room[],
    dungeonWidth: number,
    dungeonHeight: number,
    viewRadius: number = 4
  ): number {
    let minFog = 1;

    // Check all adjacent tiles
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const ny = tileY + dy;
        const nx = tileX + dx;

        if (ny >= 0 && ny < dungeonHeight && nx >= 0 && nx < dungeonWidth) {
          const neighborRoomId = roomMap[ny][nx];
          if (neighborRoomId >= 0 && rooms[neighborRoomId]) {
            const fog = this.getTileFogIntensity(
              tileX, tileY,
              playerTileX, playerTileY,
              rooms[neighborRoomId],
              viewRadius
            );
            minFog = Math.min(minFog, fog);
          }
        }
      }
    }

    return minFog;
  }
}
