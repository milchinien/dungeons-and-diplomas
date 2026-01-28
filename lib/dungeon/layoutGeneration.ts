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

  placeRoomInDungeon(dungeon, roomMap, firstLayout, startX, startY, 0, placedRooms, openDoors, rooms);

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

    // Try to get layout with matching door
    const newLayout = pool.getLayoutWithDoor(oppositeSide);

    if (!newLayout) {
      // No matching layout, remove door from open list
      openDoors.splice(doorIndex, 1);
      continue;
    }

    // Calculate position for new room
    const { x: newX, y: newY } = calculateNewRoomPosition(door, newLayout, oppositeSide);

    // Check if room would fit
    if (!canPlaceRoom(dungeon, newLayout, newX, newY)) {
      // Can't place here, try next attempt but keep door for retry
      continue;
    }

    // Place the room
    const newRoomId = placedRooms.length;
    placeRoomInDungeon(dungeon, roomMap, newLayout, newX, newY, newRoomId, placedRooms, openDoors, rooms);

    // Remove the used door
    openDoors.splice(doorIndex, 1);

    // Connect rooms as neighbors
    rooms[door.roomId].neighbors.push(newRoomId);
    rooms[newRoomId].neighbors.push(door.roomId);
  }

  // Step 3: Assign room types
  assignRoomTypes(rooms);

  return { dungeon, rooms, roomMap };
}

/**
 * Places a room layout into the dungeon grid
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
  rooms: Room[]
): void {
  // Copy tiles from layout to dungeon
  for (let ly = 0; ly < layout.height; ly++) {
    for (let lx = 0; lx < layout.width; lx++) {
      const dungeonX = x + lx;
      const dungeonY = y + ly;

      if (dungeonX >= 0 && dungeonX < DUNGEON_WIDTH && dungeonY >= 0 && dungeonY < DUNGEON_HEIGHT) {
        dungeon[dungeonY][dungeonX] = layout.tileGrid[ly][lx];

        // Mark in roomMap (only floors and doors, not walls)
        if (layout.tileGrid[ly][lx] === TILE.FLOOR) {
          roomMap[dungeonY][dungeonX] = roomId;
        } else if (layout.tileGrid[ly][lx] === TILE.DOOR) {
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
    type: 'empty' // Will be assigned later
  };
  rooms.push(room);

  // Add open doors
  if (layout.doorPositions.north) {
    // Find door tile in north edge
    for (let lx = 0; lx < layout.width; lx++) {
      if (layout.tileGrid[0][lx] === TILE.DOOR) {
        openDoors.push({
          roomId,
          side: 'north',
          x: x + lx,
          y: y
        });
      }
    }
  }
  if (layout.doorPositions.south) {
    for (let lx = 0; lx < layout.width; lx++) {
      if (layout.tileGrid[layout.height - 1][lx] === TILE.DOOR) {
        openDoors.push({
          roomId,
          side: 'south',
          x: x + lx,
          y: y + layout.height - 1
        });
      }
    }
  }
  if (layout.doorPositions.west) {
    for (let ly = 0; ly < layout.height; ly++) {
      if (layout.tileGrid[ly][0] === TILE.DOOR) {
        openDoors.push({
          roomId,
          side: 'west',
          x: x,
          y: y + ly
        });
      }
    }
  }
  if (layout.doorPositions.east) {
    for (let ly = 0; ly < layout.height; ly++) {
      if (layout.tileGrid[ly][layout.width - 1] === TILE.DOOR) {
        openDoors.push({
          roomId,
          side: 'east',
          x: x + layout.width - 1,
          y: y + ly
        });
      }
    }
  }
}

/**
 * Checks if a room can be placed at given position without overlapping existing tiles.
 */
function canPlaceRoom(
  dungeon: TileType[][],
  layout: RoomLayout,
  x: number,
  y: number
): boolean {
  // Check bounds
  if (x < 0 || y < 0) return false;
  if (x + layout.width > DUNGEON_WIDTH) return false;
  if (y + layout.height > DUNGEON_HEIGHT) return false;

  // Check for overlap
  for (let ly = 0; ly < layout.height; ly++) {
    for (let lx = 0; lx < layout.width; lx++) {
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
 */
function calculateNewRoomPosition(
  door: DoorConnection,
  newLayout: RoomLayout,
  doorSide: 'north' | 'south' | 'east' | 'west'
): { x: number; y: number } {
  let x = 0;
  let y = 0;

  // Find door position in new layout
  let doorX = 0, doorY = 0;

  switch (doorSide) {
    case 'north':
      // New layout has north door (top row) → placed one row BELOW existing south door
      for (let lx = 0; lx < newLayout.width; lx++) {
        if (newLayout.tileGrid[0][lx] === TILE.DOOR) {
          doorX = lx;
          break;
        }
      }
      x = door.x - doorX;
      y = door.y + 1; // new room's top row starts one below existing south door
      break;

    case 'south':
      // New layout has south door (bottom row) → placed one row ABOVE existing north door
      for (let lx = 0; lx < newLayout.width; lx++) {
        if (newLayout.tileGrid[newLayout.height - 1][lx] === TILE.DOOR) {
          doorX = lx;
          break;
        }
      }
      x = door.x - doorX;
      y = door.y - newLayout.height; // new room's bottom row ends one above existing north door
      break;

    case 'west':
      // New layout has west door (left column) → placed one column RIGHT of existing east door
      for (let ly = 0; ly < newLayout.height; ly++) {
        if (newLayout.tileGrid[ly][0] === TILE.DOOR) {
          doorY = ly;
          break;
        }
      }
      x = door.x + 1; // new room's left column starts one right of existing east door
      y = door.y - doorY;
      break;

    case 'east':
      // New layout has east door (right column) → placed one column LEFT of existing west door
      for (let ly = 0; ly < newLayout.height; ly++) {
        if (newLayout.tileGrid[ly][newLayout.width - 1] === TILE.DOOR) {
          doorY = ly;
          break;
        }
      }
      x = door.x - newLayout.width; // new room's right column ends one left of existing west door
      y = door.y - doorY;
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
