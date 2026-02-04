import { DIRECTION_OFFSETS } from '../constants';
import type { Room, TileType } from '../constants';
import type { Player } from '../enemy';
import { getEntityTilePosition } from '../physics/TileCoordinates';
import { hasLineOfSight } from '../physics/LineOfSight';

// Maximum fog intensity distance for tiles seen through doors (for fog gradient)
const DOOR_FOG_MAX_DISTANCE = 8;

// Maximum distance (in tiles) from a door to be considered "near" the door
const DOOR_PROXIMITY_DISTANCE = 4;

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

        if (connectsToVisibleRoom) {
          // Entire room is visible through this open door
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
        // Closer to door = less fog. At door = 0.15, increases with distance up to 0.45
        const distance = Math.abs(tileX - doorX) + Math.abs(tileY - doorY);
        const normalizedDist = Math.min(distance / DOOR_FOG_MAX_DISTANCE, 1);
        const fogIntensity = 0.15 + normalizedDist * 0.3;
        minFogIntensity = Math.min(minFogIntensity, fogIntensity);
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

  /**
   * Check if an enemy is visible through an open door.
   * Returns true if:
   * 1. Both player AND enemy are near the same open door
   * 2. There is a clear line of sight from the player to the enemy
   *
   * @param enemyX - Enemy X position in pixels
   * @param enemyY - Enemy Y position in pixels
   * @param enemyRoomId - The room ID the enemy is in
   * @param playerX - Player X position in pixels
   * @param playerY - Player Y position in pixels
   * @param playerRoomIds - Set of room IDs the player is currently in
   * @param tileSize - Size of a tile in pixels
   * @param roomMap - 2D array mapping tiles to room IDs
   * @param rooms - Array of all rooms
   * @param dungeon - The dungeon tile grid
   * @param doorStates - Map of door states (true = open)
   * @param proximityDistance - Max distance from door to be "near" (default: DOOR_PROXIMITY_DISTANCE)
   */
  static isEnemyVisibleThroughDoor(
    enemyX: number,
    enemyY: number,
    enemyRoomId: number,
    playerX: number,
    playerY: number,
    playerRoomIds: Set<number>,
    tileSize: number,
    roomMap: number[][],
    rooms: Room[],
    dungeon: TileType[][],
    doorStates: Map<string, boolean>,
    proximityDistance: number = DOOR_PROXIMITY_DISTANCE
  ): boolean {
    const dungeonWidth = roomMap[0]?.length ?? 0;
    const dungeonHeight = roomMap.length;

    // Check if enemy room is valid
    const enemyRoom = enemyRoomId >= 0 ? rooms[enemyRoomId] : null;
    if (!enemyRoom) return false;

    // If player is already in the enemy's room, no need for door check
    if (playerRoomIds.has(enemyRoomId)) return false;

    // Calculate center positions
    const enemyCenterX = enemyX + tileSize / 2;
    const enemyCenterY = enemyY + tileSize / 2;
    const playerCenterX = playerX + tileSize / 2;
    const playerCenterY = playerY + tileSize / 2;

    // Find open doors between player's room(s) and enemy's room
    // where BOTH player and enemy are within proximity distance
    let foundValidDoor = false;

    // Check all player rooms for connecting doors
    for (const playerRoomId of playerRoomIds) {
      if (foundValidDoor) break;

      const playerRoom = rooms[playerRoomId];
      if (!playerRoom) continue;

      // Check if enemy room is a neighbor
      if (!playerRoom.neighbors.includes(enemyRoomId)) continue;

      // Find the door(s) between these rooms
      // Scan the perimeter of the player's room for doors
      for (let doorY = playerRoom.y - 1; doorY <= playerRoom.y + playerRoom.height; doorY++) {
        if (foundValidDoor) break;

        for (let doorX = playerRoom.x - 1; doorX <= playerRoom.x + playerRoom.width; doorX++) {
          if (doorY < 0 || doorY >= dungeonHeight || doorX < 0 || doorX >= dungeonWidth) continue;

          // Check if this is a door tile
          if (roomMap[doorY][doorX] !== -2) continue;

          const doorKey = `${doorX},${doorY}`;
          const isOpen = doorStates.get(doorKey) ?? false;
          if (!isOpen) continue;

          // Check if this door connects to the enemy's room
          let connectsToEnemyRoom = false;
          for (const { dx: ddx, dy: ddy } of DIRECTION_OFFSETS) {
            const adjX = doorX + ddx;
            const adjY = doorY + ddy;
            if (adjX >= 0 && adjX < dungeonWidth && adjY >= 0 && adjY < dungeonHeight) {
              if (roomMap[adjY][adjX] === enemyRoomId) {
                connectsToEnemyRoom = true;
                break;
              }
            }
          }

          if (!connectsToEnemyRoom) continue;

          // Calculate door center position
          const doorCenterX = doorX * tileSize + tileSize / 2;
          const doorCenterY = doorY * tileSize + tileSize / 2;

          // Check if player is near this door
          const playerDistToDoor = Math.sqrt(
            (playerCenterX - doorCenterX) ** 2 + (playerCenterY - doorCenterY) ** 2
          ) / tileSize;

          if (playerDistToDoor > proximityDistance) continue;

          // Check if enemy is near this door
          const enemyDistToDoor = Math.sqrt(
            (enemyCenterX - doorCenterX) ** 2 + (enemyCenterY - doorCenterY) ** 2
          ) / tileSize;

          if (enemyDistToDoor > proximityDistance) continue;

          // Both player and enemy are near this open door!
          foundValidDoor = true;
          break;
        }
      }
    }

    if (!foundValidDoor) {
      return false;
    }

    // Finally, check line of sight from player to enemy
    return hasLineOfSight(
      playerCenterX,
      playerCenterY,
      enemyCenterX,
      enemyCenterY,
      dungeon,
      tileSize,
      doorStates
    );
  }

  /**
   * Check if an entity standing ON a door tile is visible to the player.
   * Returns true if:
   * 1. The door is open
   * 2. The player is near the door (in an adjacent room)
   * 3. There is line of sight
   *
   * @param entityX - Entity X position in pixels
   * @param entityY - Entity Y position in pixels
   * @param doorTileX - Door tile X coordinate
   * @param doorTileY - Door tile Y coordinate
   * @param playerX - Player X position in pixels
   * @param playerY - Player Y position in pixels
   * @param playerRoomIds - Set of room IDs the player is in
   * @param tileSize - Size of a tile in pixels
   * @param roomMap - 2D array mapping tiles to room IDs
   * @param rooms - Array of all rooms
   * @param dungeon - The dungeon tile grid
   * @param doorStates - Map of door states (true = open)
   * @param proximityDistance - Max distance from door to be "near" (default: DOOR_PROXIMITY_DISTANCE)
   */
  static isEntityOnDoorVisible(
    entityX: number,
    entityY: number,
    doorTileX: number,
    doorTileY: number,
    playerX: number,
    playerY: number,
    playerRoomIds: Set<number>,
    tileSize: number,
    roomMap: number[][],
    rooms: Room[],
    dungeon: TileType[][],
    doorStates: Map<string, boolean>,
    proximityDistance: number = DOOR_PROXIMITY_DISTANCE
  ): boolean {
    const dungeonWidth = roomMap[0]?.length ?? 0;
    const dungeonHeight = roomMap.length;

    // Calculate positions
    const entityCenterX = entityX + tileSize / 2;
    const entityCenterY = entityY + tileSize / 2;
    const playerCenterX = playerX + tileSize / 2;
    const playerCenterY = playerY + tileSize / 2;
    const doorCenterX = doorTileX * tileSize + tileSize / 2;
    const doorCenterY = doorTileY * tileSize + tileSize / 2;

    // Check if player is near this door
    const playerDistToDoor = Math.sqrt(
      (playerCenterX - doorCenterX) ** 2 + (playerCenterY - doorCenterY) ** 2
    ) / tileSize;

    if (playerDistToDoor > proximityDistance) {
      return false;
    }

    // Check if player is in a room adjacent to this door
    let playerAdjacentToDoor = false;
    for (const { dx, dy } of DIRECTION_OFFSETS) {
      const adjX = doorTileX + dx;
      const adjY = doorTileY + dy;
      if (adjX >= 0 && adjX < dungeonWidth && adjY >= 0 && adjY < dungeonHeight) {
        const adjRoomId = roomMap[adjY][adjX];
        if (adjRoomId >= 0 && playerRoomIds.has(adjRoomId)) {
          playerAdjacentToDoor = true;
          break;
        }
      }
    }

    if (!playerAdjacentToDoor) {
      return false;
    }

    // Check line of sight
    return hasLineOfSight(
      playerCenterX,
      playerCenterY,
      entityCenterX,
      entityCenterY,
      dungeon,
      tileSize,
      doorStates
    );
  }
}
