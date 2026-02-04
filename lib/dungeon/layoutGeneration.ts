/**
 * Layout-based dungeon generation
 * Replaces BSP algorithm with pre-generated room layouts
 */

import type { Room, TileType } from '../constants';
import { TILE, DUNGEON_WIDTH, DUNGEON_HEIGHT } from '../constants';
import { getLayoutPool } from '../roomlayouts/LayoutPool';
import type { RoomLayout } from '../roomlayouts/types';

interface PlacedRoom {
  layout: RoomLayout;
  x: number;  // Top-left position in dungeon grid
  y: number;
  roomId: number;
}

interface DoorConnection {
  roomId: number;
  side: 'north' | 'south' | 'east' | 'west';
  x: number;  // Door position in dungeon grid
  y: number;
}

/**
 * Generates a dungeon from room layouts
 */
export function generateDungeonFromLayouts(
  targetRoomCount: number = 20,
  seed?: number
): {
  dungeon: TileType[][];
  rooms: Room[];
  roomMap: number[][];
} {
  const pool = getLayoutPool();

  if (pool.getCount() === 0) {
    throw new Error('No room layouts available in pool. Please seed layouts first.');
  }

  // Initialize empty dungeon
  const dungeon: TileType[][] = Array(DUNGEON_HEIGHT).fill(null).map(() =>
    Array(DUNGEON_WIDTH).fill(TILE.EMPTY)
  );

  const roomMap: number[][] = Array(DUNGEON_HEIGHT).fill(null).map(() =>
    Array(DUNGEON_WIDTH).fill(-1)
  );

  const placedRooms: PlacedRoom[] = [];
  const openDoors: DoorConnection[] = [];
  const rooms: Room[] = [];

  // Step 1: Place first room in center
  const firstLayout = pool.getRandomLayout();
  if (!firstLayout) {
    throw new Error('Failed to get initial room layout');
  }

  const startX = Math.floor((DUNGEON_WIDTH - firstLayout.width) / 2);
  const startY = Math.floor((DUNGEON_HEIGHT - firstLayout.height) / 2);

  placeRoomInDungeon(dungeon, roomMap, firstLayout, startX, startY, 0, placedRooms, openDoors, rooms, undefined);

  // Step 2: Expand from doors
  let attempts = 0;
  const maxAttempts = targetRoomCount * 10;

  while (placedRooms.length < targetRoomCount && openDoors.length > 0 && attempts < maxAttempts) {
    attempts++;

    // Pick random open door
    const doorIndex = Math.floor(Math.random() * openDoors.length);
    const door = openDoors[doorIndex];

    // Get opposite side for new layout
    const oppositeSide = getOppositeSide(door.side);

    // Bug #4 Fix: 20% chance to use dead-end layout if close to target room count
    const roomsRemaining = targetRoomCount - placedRooms.length;
    const useDeadEnd = roomsRemaining <= 5 && Math.random() < 0.2;

    // Try to get layout with matching door (prefer dead-end if conditions met)
    let newLayout: RoomLayout | null = null;
    if (useDeadEnd) {
      newLayout = pool.getRandomDeadEndLayout(oppositeSide);
      if (newLayout) {
        console.log(`[layoutGeneration] Using dead-end layout: ${newLayout.name}`);
      }
    }

    // Fallback to normal layout
    if (!newLayout) {
      newLayout = pool.getLayoutWithDoor(oppositeSide);
    }

    if (!newLayout) {
      // No matching layout, remove door from open list
      openDoors.splice(doorIndex, 1);
      continue;
    }

    // Calculate position for new room
    const { x: newX, y: newY } = calculateNewRoomPosition(door, newLayout, oppositeSide);

    // Check if room would fit (allow shared wall on connection side)
    if (!canPlaceRoom(dungeon, newLayout, newX, newY, oppositeSide)) {
      // Can't place here, try next attempt but keep door for retry
      continue;
    }

    // Place the room (don't copy walls on shared side)
    const newRoomId = placedRooms.length;
    placeRoomInDungeon(dungeon, roomMap, newLayout, newX, newY, newRoomId, placedRooms, openDoors, rooms, oppositeSide);

    // Remove the used door
    openDoors.splice(doorIndex, 1);

    // Connect rooms as neighbors
    rooms[door.roomId].neighbors.push(newRoomId);
    rooms[newRoomId].neighbors.push(door.roomId);
  }

  // Step 3: Remove double walls between connected rooms
  removeDoubleWalls(dungeon, rooms);

  // Step 3.5: Update roomMap after wall removal
  updateRoomMapAfterWallRemoval(dungeon, roomMap, rooms);

  // Step 3.6: Validate and fix doors
  const doorErrors = validateAllDoors(dungeon, rooms);
  if (doorErrors.length > 0) {
    console.warn(`Fixed ${doorErrors.length} invalid doors`);
  }

  // Step 4: Assign room types
  assignRoomTypes(rooms);

  return { dungeon, rooms, roomMap };
}

/**
 * Places a room layout into the dungeon grid
 * @param sharedWallSide - The side where walls are shared with existing room (don't copy walls here)
 */
function placeRoomInDungeon(
  dungeon: TileType[][],
  roomMap: number[][],
  layout: RoomLayout,
  x: number,
  y: number,
  roomId: number,
  placedRooms: PlacedRoom[],
  openDoors: DoorConnection[],
  rooms: Room[],
  sharedWallSide?: 'north' | 'south' | 'east' | 'west'
): void {
  // Copy tiles from layout to dungeon
  for (let ly = 0; ly < layout.height; ly++) {
    for (let lx = 0; lx < layout.width; lx++) {
      const dungeonX = x + lx;
      const dungeonY = y + ly;

      if (dungeonX >= 0 && dungeonX < DUNGEON_WIDTH && dungeonY >= 0 && dungeonY < DUNGEON_HEIGHT) {
        const tile = layout.tileGrid[ly][lx];

        // Convert walls on shared wall side to FLOOR (opening between rooms)
        let finalTile = tile;
        if (tile === TILE.WALL && sharedWallSide) {
          let onSharedEdge = false;
          if (sharedWallSide === 'north' && ly === 0) onSharedEdge = true;
          if (sharedWallSide === 'south' && ly === layout.height - 1) onSharedEdge = true;
          if (sharedWallSide === 'west' && lx === 0) onSharedEdge = true;
          if (sharedWallSide === 'east' && lx === layout.width - 1) onSharedEdge = true;

          if (onSharedEdge) {
            finalTile = TILE.FLOOR; // Convert wall to floor at connection
          }
        }

        dungeon[dungeonY][dungeonX] = finalTile;

        // Mark in roomMap (only floors and doors, not walls)
        if (finalTile === TILE.FLOOR) {
          roomMap[dungeonY][dungeonX] = roomId;
        } else if (finalTile === TILE.DOOR) {
          roomMap[dungeonY][dungeonX] = -2; // Door marker
        }
      }
    }
  }

  // Add to placed rooms
  placedRooms.push({ layout, x, y, roomId });

  // Create Room object
  const room: Room = {
    id: roomId,
    x,
    y,
    width: layout.width,
    height: layout.height,
    visible: roomId === 0, // First room is visible
    neighbors: [],
    type: 'empty', // Will be assigned later
    state: roomId === 0 ? 'exploring' : 'unexplored' // First room is being explored
  };
  rooms.push(room);

  // Add open doors using exact positions (no searching required)
  if (layout.doorPositions.north !== null) {
    openDoors.push({
      roomId,
      side: 'north',
      x: x + layout.doorPositions.north,
      y: y
    });
  }

  if (layout.doorPositions.south !== null) {
    openDoors.push({
      roomId,
      side: 'south',
      x: x + layout.doorPositions.south,
      y: y + layout.height - 1
    });
  }

  if (layout.doorPositions.west !== null) {
    openDoors.push({
      roomId,
      side: 'west',
      x: x,
      y: y + layout.doorPositions.west
    });
  }

  if (layout.doorPositions.east !== null) {
    openDoors.push({
      roomId,
      side: 'east',
      x: x + layout.width - 1,
      y: y + layout.doorPositions.east
    });
  }
}

/**
 * Checks if a room can be placed at given position without overlapping existing tiles.
 * @param sharedWallSide - The side where walls are shared with existing room (allowed to overlap)
 */
function canPlaceRoom(
  dungeon: TileType[][],
  layout: RoomLayout,
  x: number,
  y: number,
  sharedWallSide?: 'north' | 'south' | 'east' | 'west'
): boolean {
  // Check bounds
  if (x < 0 || y < 0) return false;
  if (x + layout.width > DUNGEON_WIDTH) return false;
  if (y + layout.height > DUNGEON_HEIGHT) return false;

  // Check for overlap (allow shared wall on connection side)
  for (let ly = 0; ly < layout.height; ly++) {
    for (let lx = 0; lx < layout.width; lx++) {
      // Skip the shared wall edge (these tiles are allowed to overlap)
      if (sharedWallSide === 'north' && ly === 0) continue;
      if (sharedWallSide === 'south' && ly === layout.height - 1) continue;
      if (sharedWallSide === 'west' && lx === 0) continue;
      if (sharedWallSide === 'east' && lx === layout.width - 1) continue;

      const dungeonX = x + lx;
      const dungeonY = y + ly;

      if (dungeon[dungeonY][dungeonX] !== TILE.EMPTY) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Calculates position for new room based on door connection
 * Uses exact door positions (no searching required)
 */
function calculateNewRoomPosition(
  door: DoorConnection,
  newLayout: RoomLayout,
  doorSide: 'north' | 'south' | 'east' | 'west'
): { x: number; y: number } {
  let x = 0;
  let y = 0;

  const newDoorPos = newLayout.doorPositions[doorSide];

  // Safety check: layout should have door on specified side
  if (newDoorPos === null) {
    console.warn(`Layout ${newLayout.name} does not have door on ${doorSide} side`);
    return { x: 0, y: 0 }; // Fallback (will fail canPlaceRoom check)
  }

  switch (doorSide) {
    case 'north':
      // New layout has north door (top row) → share the wall with existing south door
      x = door.x - newDoorPos;
      y = door.y; // Same row = shared wall
      break;

    case 'south':
      // New layout has south door (bottom row) → share the wall with existing north door
      x = door.x - newDoorPos;
      y = door.y - newLayout.height + 1; // Overlap by one row = shared wall
      break;

    case 'west':
      // New layout has west door (left column) → share the wall with existing east door
      x = door.x; // Same column = shared wall
      y = door.y - newDoorPos;
      break;

    case 'east':
      // New layout has east door (right column) → share the wall with existing west door
      x = door.x - newLayout.width + 1; // Overlap by one column = shared wall
      y = door.y - newDoorPos;
      break;
  }

  return { x, y };
}

/**
 * Gets opposite door side
 */
function getOppositeSide(side: 'north' | 'south' | 'east' | 'west'): 'north' | 'south' | 'east' | 'west' {
  switch (side) {
    case 'north': return 'south';
    case 'south': return 'north';
    case 'east': return 'west';
    case 'west': return 'east';
  }
}

/**
 * Removes double walls between adjacent rooms
 * Scans the entire dungeon grid for wall-wall patterns between rooms
 */
/**
 * Remove ALL double walls by converting sequences of walls into single walls.
 * Multi-pass algorithm: repeatedly finds and removes double walls until none remain.
 * Same algorithm as in generation.ts to ensure consistency.
 * IMPORTANT: Only removes walls when there are floors/doors on BOTH sides (AND logic)
 */
function removeDoubleWalls(dungeon: TileType[][], rooms: Room[]): void {
  console.log('[layoutGeneration] Removing all double walls...');

  let totalRemoved = 0;
  let iteration = 0;
  let removedThisIteration = 0;

  // Keep looping until no more double walls are found
  do {
    removedThisIteration = 0;
    iteration++;

    // Find and remove horizontal double walls (vertical stacks)
    for (let y = 0; y < DUNGEON_HEIGHT - 1; y++) {
      for (let x = 0; x < DUNGEON_WIDTH; x++) {
        if (dungeon[y][x] === TILE.WALL && dungeon[y + 1][x] === TILE.WALL) {
          // CRITICAL: Only remove if floors/doors on BOTH sides (AND not OR)
          const hasAccessAbove = y > 0 && (dungeon[y - 1][x] === TILE.FLOOR || dungeon[y - 1][x] === TILE.DOOR);
          const hasAccessBelow = y + 2 < DUNGEON_HEIGHT && (dungeon[y + 2][x] === TILE.FLOOR || dungeon[y + 2][x] === TILE.DOOR);

          if (hasAccessAbove && hasAccessBelow) {  // Changed from OR to AND
            // Remove the first wall
            dungeon[y][x] = TILE.FLOOR;
            removedThisIteration++;
            totalRemoved++;
          }
        }
      }
    }

    // Find and remove vertical double walls (horizontal pairs)
    for (let y = 0; y < DUNGEON_HEIGHT; y++) {
      for (let x = 0; x < DUNGEON_WIDTH - 1; x++) {
        if (dungeon[y][x] === TILE.WALL && dungeon[y][x + 1] === TILE.WALL) {
          // CRITICAL: Only remove if floors/doors on BOTH sides (AND not OR)
          const hasAccessLeft = x > 0 && (dungeon[y][x - 1] === TILE.FLOOR || dungeon[y][x - 1] === TILE.DOOR);
          const hasAccessRight = x + 2 < DUNGEON_WIDTH && (dungeon[y][x + 2] === TILE.FLOOR || dungeon[y][x + 2] === TILE.DOOR);

          if (hasAccessLeft && hasAccessRight) {  // Changed from OR to AND
            // Remove the first wall
            dungeon[y][x] = TILE.FLOOR;
            removedThisIteration++;
            totalRemoved++;
          }
        }
      }
    }

    console.log(`[layoutGeneration] Iteration ${iteration}: Removed ${removedThisIteration} double walls`);
  } while (removedThisIteration > 0 && iteration < 10); // Max 10 iterations

  console.log(`[layoutGeneration] Total removed: ${totalRemoved} double walls in ${iteration} iteration(s)`);
}

/**
 * Assigns room types to rooms
 */
function assignRoomTypes(rooms: Room[]): void {
  // First room is always empty (player start)
  if (rooms.length > 0) {
    rooms[0].type = 'empty';
  }

  // Assign types to remaining rooms
  for (let i = 1; i < rooms.length; i++) {
    const rand = Math.random();

    if (rand < 0.1) {
      rooms[i].type = 'treasure';
    } else if (rand < 0.2) {
      rooms[i].type = 'combat';
    } else if (rand < 0.28) {
      rooms[i].type = 'shop';
    } else {
      rooms[i].type = 'empty';
    }
  }

  // Ensure at least one shop (max 2)
  const shopCount = rooms.filter(r => r.type === 'shop').length;
  if (shopCount === 0 && rooms.length > 5) {
    // Make a random room (not first) a shop
    const randomIndex = Math.floor(Math.random() * (rooms.length - 1)) + 1;
    rooms[randomIndex].type = 'shop';
  } else if (shopCount > 2) {
    // Remove excess shops
    const shopRooms = rooms.filter(r => r.type === 'shop');
    for (let i = 2; i < shopCount; i++) {
      shopRooms[i].type = 'empty';
    }
  }
}

/**
 * Updates roomMap after walls have been removed
 * Converts removed walls (now EMPTY) to proper room IDs or -1
 */
function updateRoomMapAfterWallRemoval(
  dungeon: TileType[][],
  roomMap: number[][],
  rooms: Room[]
): void {
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      const tile = dungeon[y][x];
      const currentRoomId = roomMap[y][x];

      // If tile is EMPTY but roomMap says it's a wall (-1), reset it
      if (tile === TILE.EMPTY && currentRoomId === -1) {
        roomMap[y][x] = -1; // Keep as -1 (empty space)
      }

      // If tile became FLOOR after wall removal, find which room it should belong to
      else if (tile === TILE.FLOOR && currentRoomId === -1) {
        // Check neighbors to find room ID
        const neighbors = [
          { x: x - 1, y },
          { x: x + 1, y },
          { x, y: y - 1 },
          { x, y: y + 1 }
        ];

        for (const neighbor of neighbors) {
          if (neighbor.x >= 0 && neighbor.x < DUNGEON_WIDTH &&
              neighbor.y >= 0 && neighbor.y < DUNGEON_HEIGHT) {
            const neighborRoomId = roomMap[neighbor.y][neighbor.x];
            if (neighborRoomId >= 0) {
              roomMap[y][x] = neighborRoomId;
              break;
            }
          }
        }
      }
    }
  }
}

/**
 * Validates that a door connects two floor tiles
 */
function validateDoorConnection(
  dungeon: TileType[][],
  doorX: number,
  doorY: number
): boolean {
  const width = dungeon[0]?.length || 0;
  const height = dungeon.length;

  // Check all 4 neighbors
  const neighbors = {
    top: doorY > 0 ? dungeon[doorY - 1][doorX] : TILE.EMPTY,
    bottom: doorY < height - 1 ? dungeon[doorY + 1][doorX] : TILE.EMPTY,
    left: doorX > 0 ? dungeon[doorY][doorX - 1] : TILE.EMPTY,
    right: doorX < width - 1 ? dungeon[doorY][doorX + 1] : TILE.EMPTY
  };

  // Count floor neighbors
  const floorCount = Object.values(neighbors).filter(
    tile => tile === TILE.FLOOR || tile === TILE.EMPTY // EMPTY for future rooms
  ).length;

  // Must have at least 2 floor neighbors (one on each side)
  return floorCount >= 2;
}

/**
 * Validates all doors and removes invalid ones
 */
export function validateAllDoors(
  dungeon: TileType[][],
  rooms: Room[]
): Array<{x: number, y: number, error: string}> {
  const errors: Array<{x: number, y: number, error: string}> = [];
  const width = dungeon[0]?.length || 0;
  const height = dungeon.length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (dungeon[y][x] === TILE.DOOR) {
        if (!validateDoorConnection(dungeon, x, y)) {
          errors.push({
            x, y,
            error: 'Door does not connect two valid areas'
          });

          // Convert invalid door to wall
          dungeon[y][x] = TILE.WALL;
          console.warn(`Removed invalid door at (${x}, ${y})`);
        }
      }
    }
  }

  return errors;
}
