import { DUNGEON_WIDTH, DUNGEON_HEIGHT, TILE, FLOOR_VARIANTS, WALL_VARIANTS } from '../constants';
import type { TileType, TileVariant, Room, TileCoord } from '../constants';
import { BSPNode } from './BSPNode';
import { UnionFind } from './UnionFind';

// Weighted random selection function
export function getWeightedRandomVariant(variants: { x: number; y: number; weight: number }[]): TileCoord {
  // Calculate total weight
  const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);

  // Generate random number between 0 and totalWeight
  let random = Math.random() * totalWeight;

  // Select variant based on weight
  for (let variant of variants) {
    random -= variant.weight;
    if (random <= 0) {
      return { x: variant.x, y: variant.y };
    }
  }

  // Fallback (should never reach here)
  return { x: variants[0].x, y: variants[0].y };
}

export function createEmptyDungeon(): TileType[][] {
  const grid: TileType[][] = [];
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    grid[y] = [];
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      grid[y][x] = TILE.EMPTY;
    }
  }
  return grid;
}

export function generateTileVariants(): TileVariant[][] {
  const tileVariants: TileVariant[][] = [];
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    tileVariants[y] = [];
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      tileVariants[y][x] = {
        floor: getWeightedRandomVariant(FLOOR_VARIANTS),
        wall: getWeightedRandomVariant(WALL_VARIANTS)
      };
    }
  }
  return tileVariants;
}

export function generateRooms(dungeon: TileType[][], roomMap: number[][]): Room[] {
  const rooms: Room[] = [];

  // Initialize roomMap
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      dungeon[y][x] = TILE.FLOOR;
      roomMap[y][x] = -1;
    }
  }

  // Create BSP tree
  const root = new BSPNode(0, 0, DUNGEON_WIDTH, DUNGEON_HEIGHT);
  root.split();
  root.fillRooms(dungeon, roomMap, rooms);

  // Make the first room visible by default
  if (rooms.length > 0) {
    rooms[0].visible = true;
  }

  return rooms;
}

interface Connection {
  x: number;
  y: number;
  roomA: number;
  roomB: number;
  orientation: 'horizontal' | 'vertical';
}

/**
 * Calculate all spatial neighbors for each room (rooms that share a wall)
 * This includes ALL adjacent rooms, not just those connected by doors
 */
export function calculateSpatialNeighbors(dungeon: TileType[][], roomMap: number[][], rooms: Room[]) {
  // Create a Set for each room to store unique neighbor IDs
  const spatialNeighbors: Set<number>[] = rooms.map(() => new Set<number>());

  // Scan all walls to find adjacent rooms
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      if (dungeon[y][x] === TILE.WALL) {
        // Check vertical neighbors (Room Above <-> Room Below)
        if (y > 0 && y < DUNGEON_HEIGHT - 1) {
          const roomAbove = roomMap[y - 1][x];
          const roomBelow = roomMap[y + 1][x];

          if (roomAbove >= 0 && roomBelow >= 0 && roomAbove !== roomBelow) {
            spatialNeighbors[roomAbove].add(roomBelow);
            spatialNeighbors[roomBelow].add(roomAbove);
          }
        }

        // Check horizontal neighbors (Room Left <-> Room Right)
        if (x > 0 && x < DUNGEON_WIDTH - 1) {
          const roomLeft = roomMap[y][x - 1];
          const roomRight = roomMap[y][x + 1];

          if (roomLeft >= 0 && roomRight >= 0 && roomLeft !== roomRight) {
            spatialNeighbors[roomLeft].add(roomRight);
            spatialNeighbors[roomRight].add(roomLeft);
          }
        }
      }
    }
  }

  // Store spatial neighbors in each room's spatialNeighbors array
  for (let i = 0; i < rooms.length; i++) {
    (rooms[i] as any).spatialNeighbors = Array.from(spatialNeighbors[i]);
  }
}

export function connectRooms(dungeon: TileType[][], roomMap: number[][], rooms: Room[]) {
  // 1. Identify all possible connections (adjacent rooms)
  const possibleConnections: Connection[] = [];

  // Scan horizontal walls
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      if (dungeon[y][x] === TILE.WALL) {
        // Check vertical neighbors (Room Above <-> Room Below)
        if (y > 0 && y < DUNGEON_HEIGHT - 1) {
          const roomAbove = roomMap[y - 1][x];
          const roomBelow = roomMap[y + 1][x];

          if (roomAbove >= 0 && roomBelow >= 0 && roomAbove !== roomBelow) {
            // Valid connection point
            possibleConnections.push({
              x: x,
              y: y,
              roomA: roomAbove,
              roomB: roomBelow,
              orientation: 'horizontal' // Wall is horizontal, door connects vertically
            });
          }
        }

        // Check horizontal neighbors (Room Left <-> Room Right)
        if (x > 0 && x < DUNGEON_WIDTH - 1) {
          const roomLeft = roomMap[y][x - 1];
          const roomRight = roomMap[y][x + 1];

          if (roomLeft >= 0 && roomRight >= 0 && roomLeft !== roomRight) {
            // Valid connection point
            possibleConnections.push({
              x: x,
              y: y,
              roomA: roomLeft,
              roomB: roomRight,
              orientation: 'vertical' // Wall is vertical, door connects horizontally
            });
          }
        }
      }
    }
  }

  // 2. Shuffle connections to ensure random dungeon layout
  for (let i = possibleConnections.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [possibleConnections[i], possibleConnections[j]] = [possibleConnections[j], possibleConnections[i]];
  }

  // 3. Use Union-Find to connect all rooms
  const uf = new UnionFind(rooms.length);
  const finalDoors: Connection[] = [];

  for (const conn of possibleConnections) {
    if (uf.union(conn.roomA, conn.roomB)) {
      // This connection merges two previously unconnected sets
      finalDoors.push(conn);

      // Add neighbors
      rooms[conn.roomA].neighbors.push(conn.roomB);
      rooms[conn.roomB].neighbors.push(conn.roomA);
    }
  }

  // Optional: Add a few random extra doors to create loops
  for (const conn of possibleConnections) {
    // Check if we already placed a door here
    if (dungeon[conn.y][conn.x] === TILE.DOOR) continue;

    // If rooms are already connected (which they are now), maybe add a shortcut
    if (Math.random() < 0.02) { // 2% chance for extra doors
      finalDoors.push(conn);
      // Add neighbors if not already there
      if (!rooms[conn.roomA].neighbors.includes(conn.roomB)) {
        rooms[conn.roomA].neighbors.push(conn.roomB);
        rooms[conn.roomB].neighbors.push(conn.roomA);
      }
    }
  }

  // 4. Place doors in the dungeon
  for (const door of finalDoors) {
    dungeon[door.y][door.x] = TILE.DOOR;
    roomMap[door.y][door.x] = -2; // -2 for doors
  }
}

export function addWalls(dungeon: TileType[][]) {
  // Walls are already created by the room generation algorithm
  // This function now only adds outer boundary walls if needed
  for (let x = 0; x < DUNGEON_WIDTH; x++) {
    if (dungeon[0][x] === TILE.EMPTY) dungeon[0][x] = TILE.WALL;
    if (dungeon[DUNGEON_HEIGHT - 1][x] === TILE.EMPTY) dungeon[DUNGEON_HEIGHT - 1][x] = TILE.WALL;
  }
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    if (dungeon[y][0] === TILE.EMPTY) dungeon[y][0] = TILE.WALL;
    if (dungeon[y][DUNGEON_WIDTH - 1] === TILE.EMPTY) dungeon[y][DUNGEON_WIDTH - 1] = TILE.WALL;
  }
}
