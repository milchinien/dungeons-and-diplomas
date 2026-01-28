import { DIRECTION_OFFSETS } from '../constants';
import type { Room } from '../constants';
import type { Player } from '../enemy';
import { getEntityTilePosition } from '../physics/TileCoordinates';

// How many tiles into an adjacent room can be seen through an open door
const DOOR_VISION_DISTANCE = 3;

/**
 * Handles fog-of-war visibility calculations for dungeon tiles and rooms.
 * Extracted from GameRenderer and DungeonView to eliminate code duplication.
 */
export class VisibilityCalculator {
  /**
   * Check if a tile is visible (fog of war check).
   * Floor tiles are visible if their room is visible, or if visible through an open door.
   * Walls/doors are visible if any adjacent room is visible.
   *
   * @param doorStates - Optional map of door states for seeing through open doors
   */
  static isTileVisible(
    x: number,
    y: number,
    roomId: number,
    roomMap: number[][],
    rooms: Room[],
    dungeonWidth: number,
    dungeonHeight: number,
    doorStates?: Map<string, boolean>
  ): boolean {
    // Floor tiles in a valid room: check room visibility
    if (roomId >= 0 && rooms[roomId]) {
      if (rooms[roomId].visible) {
        return true;
      }
      // Room not directly visible - check if visible through an open door
      if (doorStates) {
        return this.isTileVisibleThroughDoor(
          x, y, roomId, roomMap, rooms, dungeonWidth, dungeonHeight, doorStates
        );
      }
      return false;
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
      // Check if wall/door is adjacent to a tile visible through a door
      if (doorStates) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < dungeonHeight && nx >= 0 && nx < dungeonWidth) {
              const neighborRoomId = roomMap[ny][nx];
              if (neighborRoomId >= 0 && !rooms[neighborRoomId]?.visible) {
                if (this.isTileVisibleThroughDoor(
                  nx, ny, neighborRoomId, roomMap, rooms, dungeonWidth, dungeonHeight, doorStates
                )) {
                  return true;
                }
              }
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Check if a tile in a non-visible room is visible through an open door.
   * Returns true if the tile is within DOOR_VISION_DISTANCE tiles of an open door
   * that connects to a visible room.
   */
  private static isTileVisibleThroughDoor(
    x: number,
    y: number,
    roomId: number,
    roomMap: number[][],
    rooms: Room[],
    dungeonWidth: number,
    dungeonHeight: number,
    doorStates: Map<string, boolean>
  ): boolean {
    const room = rooms[roomId];
    if (!room) return false;

    // Find all open doors adjacent to this room that connect to visible rooms
    for (let doorY = room.y - 1; doorY <= room.y + room.height; doorY++) {
      for (let doorX = room.x - 1; doorX <= room.x + room.width; doorX++) {
        if (doorY < 0 || doorY >= dungeonHeight || doorX < 0 || doorX >= dungeonWidth) continue;

        // Check if this is a door tile
        if (roomMap[doorY][doorX] !== -2) continue;

        const doorKey = `${doorX},${doorY}`;
        const isOpen = doorStates.get(doorKey) ?? false;
        if (!isOpen) continue;

        // Check if this door connects to a visible room
        let connectsToVisibleRoom = false;
        for (const { dx, dy } of DIRECTION_OFFSETS) {
          const adjX = doorX + dx;
          const adjY = doorY + dy;
          if (adjX >= 0 && adjX < dungeonWidth && adjY >= 0 && adjY < dungeonHeight) {
            const adjRoomId = roomMap[adjY][adjX];
            if (adjRoomId >= 0 && adjRoomId !== roomId && rooms[adjRoomId]?.visible) {
              connectsToVisibleRoom = true;
              break;
            }
          }
        }

        if (!connectsToVisibleRoom) continue;

        // Calculate distance from tile to door
        const distance = Math.abs(x - doorX) + Math.abs(y - doorY); // Manhattan distance
        if (distance <= DOOR_VISION_DISTANCE) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get the player's current room ID(s), including rooms visible through open doors.
   * Returns a Set because player might be on a door (adjacent to multiple rooms).
   *
   * @param includeAdjacentThroughDoors - If true, includes rooms connected by open doors
   * @param doorStates - Map of door states (required if includeAdjacentThroughDoors is true)
   * @param rooms - Array of all rooms (required if includeAdjacentThroughDoors is true)
   */
  static getPlayerRoomIds(
    player: Player,
    tileSize: number,
    roomMap: number[][],
    dungeonWidth: number,
    dungeonHeight: number,
    includeAdjacentThroughDoors: boolean = false,
    doorStates?: Map<string, boolean>,
    rooms?: Room[]
  ): Set<number> {
    const { tx: playerTileX, ty: playerTileY } = getEntityTilePosition(player, tileSize);
    const roomIds = new Set<number>();

    if (playerTileX < 0 || playerTileX >= dungeonWidth || playerTileY < 0 || playerTileY >= dungeonHeight) {
      return roomIds;
    }

    const directRoomId = roomMap[playerTileY][playerTileX];

    // If player is in a valid room, add it
    if (directRoomId >= 0) {
      roomIds.add(directRoomId);
    } else {
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
    }

    // Include rooms visible through open doors
    if (includeAdjacentThroughDoors && doorStates && rooms) {
      const initialRooms = Array.from(roomIds);
      for (const roomId of initialRooms) {
        const room = rooms[roomId];
        if (!room) continue;

        // Check all neighbors of this room for open doors
        for (const neighborId of room.neighbors) {
          // Find door tiles between these rooms
          // Check all tiles around the room perimeter for doors
          for (let y = room.y - 1; y <= room.y + room.height; y++) {
            for (let x = room.x - 1; x <= room.x + room.width; x++) {
              if (y < 0 || y >= dungeonHeight || x < 0 || x >= dungeonWidth) continue;

              const tileRoomId = roomMap[y][x];
              if (tileRoomId === -2) { // Door tile
                const doorKey = `${x},${y}`;
                const isOpen = doorStates.get(doorKey) ?? false;

                // Check if this door connects to the neighbor room
                if (isOpen) {
                  // Check adjacent tiles to see if any belong to the neighbor
                  for (const { dx, dy } of DIRECTION_OFFSETS) {
                    const adjX = x + dx;
                    const adjY = y + dy;
                    if (adjX >= 0 && adjX < dungeonWidth && adjY >= 0 && adjY < dungeonHeight) {
                      if (roomMap[adjY][adjX] === neighborId) {
                        roomIds.add(neighborId);
                        break;
                      }
                    }
                  }
                }
              }
            }
          }
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
   * @param doorStates - Optional door states for checking door visibility
   * @param roomMap - Required if doorStates is provided
   * @param rooms - Required if doorStates is provided
   * @param dungeonWidth - Required if doorStates is provided
   * @param dungeonHeight - Required if doorStates is provided
   * @returns Fog intensity from 0 (clear) to 1 (full fog)
   */
  static getTileFogIntensity(
    tileX: number,
    tileY: number,
    playerTileX: number,
    playerTileY: number,
    room: Room | null,
    viewRadius: number = 4,
    doorStates?: Map<string, boolean>,
    roomMap?: number[][],
    rooms?: Room[],
    dungeonWidth?: number,
    dungeonHeight?: number
  ): number {
    // No room = unexplored area (full fog)
    if (!room) return 1;

    // Explored rooms have no fog
    if (room.state === 'explored') return 0;

    // Unexplored rooms: check if visible through an open door
    if (room.state === 'unexplored') {
      if (doorStates && roomMap && rooms && dungeonWidth !== undefined && dungeonHeight !== undefined) {
        const doorFog = this.getDoorVisibilityFogIntensity(
          tileX, tileY, room, roomMap, rooms, dungeonWidth, dungeonHeight, doorStates
        );
        if (doorFog < 1) {
          return doorFog;
        }
      }
      return 1;
    }

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
   * Calculate fog intensity for a tile visible through an open door.
   * Returns fog intensity based on distance from the door (further = more fog).
   */
  private static getDoorVisibilityFogIntensity(
    tileX: number,
    tileY: number,
    room: Room,
    roomMap: number[][],
    rooms: Room[],
    dungeonWidth: number,
    dungeonHeight: number,
    doorStates: Map<string, boolean>
  ): number {
    let minFogIntensity = 1;

    // Find open doors connecting to visible rooms
    for (let doorY = room.y - 1; doorY <= room.y + room.height; doorY++) {
      for (let doorX = room.x - 1; doorX <= room.x + room.width; doorX++) {
        if (doorY < 0 || doorY >= dungeonHeight || doorX < 0 || doorX >= dungeonWidth) continue;
        if (roomMap[doorY][doorX] !== -2) continue;

        const doorKey = `${doorX},${doorY}`;
        const isOpen = doorStates.get(doorKey) ?? false;
        if (!isOpen) continue;

        // Check if this door connects to a visible room
        let connectsToVisibleRoom = false;
        for (const { dx, dy } of DIRECTION_OFFSETS) {
          const adjX = doorX + dx;
          const adjY = doorY + dy;
          if (adjX >= 0 && adjX < dungeonWidth && adjY >= 0 && adjY < dungeonHeight) {
            const adjRoomId = roomMap[adjY][adjX];
            if (adjRoomId >= 0 && adjRoomId !== room.id && rooms[adjRoomId]?.visible) {
              connectsToVisibleRoom = true;
              break;
            }
          }
        }

        if (!connectsToVisibleRoom) continue;

        // Calculate fog based on Manhattan distance from door
        const distance = Math.abs(tileX - doorX) + Math.abs(tileY - doorY);
        if (distance <= DOOR_VISION_DISTANCE) {
          // Closer to door = less fog. At door = 0.3, at max distance = 0.7
          const fogIntensity = 0.3 + (distance / DOOR_VISION_DISTANCE) * 0.4;
          minFogIntensity = Math.min(minFogIntensity, fogIntensity);
        }
      }
    }

    return minFogIntensity;
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
    viewRadius: number = 4,
    doorStates?: Map<string, boolean>
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
              viewRadius,
              doorStates, roomMap, rooms, dungeonWidth, dungeonHeight
            );
            minFog = Math.min(minFog, fog);
          }
        }
      }
    }

    return minFog;
  }
}
