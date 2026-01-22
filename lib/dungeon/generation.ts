import { DUNGEON_WIDTH, DUNGEON_HEIGHT, TILE, FLOOR_VARIANTS, WALL_VARIANTS, DEFAULT_DUNGEON_CONFIG, SHOP_SPAWN_CHANCE, SHOP_MIN_ROOM_SIZE, SHOP_MAX_ROOM_SIZE, SHOP_MIN_PER_DUNGEON, SHOP_MAX_PER_DUNGEON } from '../constants';
import type { TileType, TileVariant, Room, TileCoord, DungeonConfig } from '../constants';
import { BSPNode } from './BSPNode';
import { UnionFind } from './UnionFind';
import { getDecorationRng, getStructureRng } from './DungeonRNG';
import { generateShopInventory } from '../shop/ShopInventory';

// Weighted random selection function
export function getWeightedRandomVariant(variants: { x: number; y: number; weight: number }[]): TileCoord {
  const rng = getDecorationRng();

  // Calculate total weight
  const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);

  // Generate random number between 0 and totalWeight
  let random = rng.next() * totalWeight;

  // Select variant based on weight
  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) {
      return { x: variant.x, y: variant.y };
    }
  }

  // Fallback (should never reach here)
  return { x: variants[0].x, y: variants[0].y };
}

export function createEmptyDungeon(config?: Partial<DungeonConfig>): TileType[][] {
  const width = config?.width ?? DUNGEON_WIDTH;
  const height = config?.height ?? DUNGEON_HEIGHT;

  const grid: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      grid[y][x] = TILE.EMPTY;
    }
  }
  return grid;
}

export function generateTileVariants(config?: Partial<DungeonConfig>): TileVariant[][] {
  const width = config?.width ?? DUNGEON_WIDTH;
  const height = config?.height ?? DUNGEON_HEIGHT;

  const tileVariants: TileVariant[][] = [];
  for (let y = 0; y < height; y++) {
    tileVariants[y] = [];
    for (let x = 0; x < width; x++) {
      tileVariants[y][x] = {
        floor: getWeightedRandomVariant(FLOOR_VARIANTS),
        wall: getWeightedRandomVariant(WALL_VARIANTS)
      };
    }
  }
  return tileVariants;
}

export function generateRooms(dungeon: TileType[][], roomMap: number[][], config?: Partial<DungeonConfig>): Room[] {
  const width = config?.width ?? dungeon[0]?.length ?? DUNGEON_WIDTH;
  const height = config?.height ?? dungeon.length ?? DUNGEON_HEIGHT;

  const rooms: Room[] = [];

  // Initialize roomMap
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      dungeon[y][x] = TILE.FLOOR;
      roomMap[y][x] = -1;
    }
  }

  // Create BSP tree
  const root = new BSPNode(0, 0, width, height, config);
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
export function calculateSpatialNeighbors(dungeon: TileType[][], roomMap: number[][], rooms: Room[], config?: Partial<DungeonConfig>) {
  const width = config?.width ?? dungeon[0]?.length ?? DUNGEON_WIDTH;
  const height = config?.height ?? dungeon.length ?? DUNGEON_HEIGHT;

  // Create a Set for each room to store unique neighbor IDs
  const spatialNeighbors: Set<number>[] = rooms.map(() => new Set<number>());

  // Scan all walls to find adjacent rooms
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (dungeon[y][x] === TILE.WALL) {
        // Check vertical neighbors (Room Above <-> Room Below)
        if (y > 0 && y < height - 1) {
          const roomAbove = roomMap[y - 1][x];
          const roomBelow = roomMap[y + 1][x];

          if (roomAbove >= 0 && roomBelow >= 0 && roomAbove !== roomBelow) {
            spatialNeighbors[roomAbove].add(roomBelow);
            spatialNeighbors[roomBelow].add(roomAbove);
          }
        }

        // Check horizontal neighbors (Room Left <-> Room Right)
        if (x > 0 && x < width - 1) {
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

export function connectRooms(dungeon: TileType[][], roomMap: number[][], rooms: Room[], config?: Partial<DungeonConfig>) {
  const width = config?.width ?? dungeon[0]?.length ?? DUNGEON_WIDTH;
  const height = config?.height ?? dungeon.length ?? DUNGEON_HEIGHT;

  // 1. Identify all possible connections (adjacent rooms)
  const possibleConnections: Connection[] = [];

  // Scan horizontal walls
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (dungeon[y][x] === TILE.WALL) {
        // Check vertical neighbors (Room Above <-> Room Below)
        if (y > 0 && y < height - 1) {
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
        if (x > 0 && x < width - 1) {
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
  const rng = getStructureRng();
  for (let i = possibleConnections.length - 1; i > 0; i--) {
    const j = rng.nextIntMax(i + 1);
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
    if (rng.nextBoolean(0.02)) { // 2% chance for extra doors
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

export function addWalls(dungeon: TileType[][], config?: Partial<DungeonConfig>) {
  const width = config?.width ?? dungeon[0]?.length ?? DUNGEON_WIDTH;
  const height = config?.height ?? dungeon.length ?? DUNGEON_HEIGHT;

  // Walls are already created by the room generation algorithm
  // This function now only adds outer boundary walls if needed
  for (let x = 0; x < width; x++) {
    if (dungeon[0][x] === TILE.EMPTY) dungeon[0][x] = TILE.WALL;
    if (dungeon[height - 1][x] === TILE.EMPTY) dungeon[height - 1][x] = TILE.WALL;
  }
  for (let y = 0; y < height; y++) {
    if (dungeon[y][0] === TILE.EMPTY) dungeon[y][0] = TILE.WALL;
    if (dungeon[y][width - 1] === TILE.EMPTY) dungeon[y][width - 1] = TILE.WALL;
  }
}


// =============================================================================
// Shop Room Assignment
// =============================================================================

/**
 * Checks if a room has the right size for a shop (not too small, not too large).
 */
function isRoomRightSizeForShop(room: Room): boolean {
  return room.width >= SHOP_MIN_ROOM_SIZE && room.height >= SHOP_MIN_ROOM_SIZE &&
         room.width <= SHOP_MAX_ROOM_SIZE && room.height <= SHOP_MAX_ROOM_SIZE;
}

/**
 * Assigns shop rooms after normal room types have been assigned.
 * Guarantees at least SHOP_MIN_PER_DUNGEON shops if enough suitable rooms exist.
 * @param rooms - Array of all rooms
 * @param startRoomIndex - Index of the start room (never becomes a shop)
 * @param randomFn - Random function
 */
export function assignShopRooms(
  rooms: Room[],
  startRoomIndex: number,
  randomFn: () => number = Math.random
): void {
  // Debug: Log room size distribution
  const roomSizes = rooms.map(r => ({ w: r.width, h: r.height }));
  const tooSmall = roomSizes.filter(s => s.w < SHOP_MIN_ROOM_SIZE || s.h < SHOP_MIN_ROOM_SIZE).length;
  const tooLarge = roomSizes.filter(s => s.w > SHOP_MAX_ROOM_SIZE || s.h > SHOP_MAX_ROOM_SIZE).length;
  const justRight = roomSizes.filter(s =>
    s.w >= SHOP_MIN_ROOM_SIZE && s.h >= SHOP_MIN_ROOM_SIZE &&
    s.w <= SHOP_MAX_ROOM_SIZE && s.h <= SHOP_MAX_ROOM_SIZE
  ).length;
  console.log(`[Shop Debug] Rooms: ${rooms.length}, Too small: ${tooSmall}, Too large: ${tooLarge}, Just right: ${justRight}`);
  console.log(`[Shop Debug] Size range needed: ${SHOP_MIN_ROOM_SIZE}-${SHOP_MAX_ROOM_SIZE}`);

  // Find all eligible rooms (right size, not start room)
  const eligibleRooms: number[] = [];
  for (let i = 0; i < rooms.length; i++) {
    if (i === startRoomIndex) continue;
    if (isRoomRightSizeForShop(rooms[i])) {
      eligibleRooms.push(i);
    }
  }

  // Shuffle eligible rooms for random selection
  for (let i = eligibleRooms.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [eligibleRooms[i], eligibleRooms[j]] = [eligibleRooms[j], eligibleRooms[i]];
  }

  let shopCount = 0;

  // First pass: Guarantee minimum shops
  const guaranteedCount = Math.min(SHOP_MIN_PER_DUNGEON, eligibleRooms.length);
  for (let i = 0; i < guaranteedCount; i++) {
    const roomIndex = eligibleRooms[i];
    rooms[roomIndex].type = 'shop';
    rooms[roomIndex].shopInventory = generateShopInventory(rooms[roomIndex].id, randomFn, rooms[roomIndex].width);
    rooms[roomIndex].shopDoorOpen = false;
    shopCount++;
  }

  // Second pass: Random additional shops up to maximum
  for (let i = guaranteedCount; i < eligibleRooms.length && shopCount < SHOP_MAX_PER_DUNGEON; i++) {
    if (randomFn() < SHOP_SPAWN_CHANCE) {
      const roomIndex = eligibleRooms[i];
      rooms[roomIndex].type = 'shop';
      rooms[roomIndex].shopInventory = generateShopInventory(rooms[roomIndex].id, randomFn, rooms[roomIndex].width);
      rooms[roomIndex].shopDoorOpen = false;
      shopCount++;
    }
  }

  // Debug log
  console.log(`[Dungeon Generation] ${rooms.length} rooms, ${shopCount} shop(s) assigned (min: ${SHOP_MIN_PER_DUNGEON}, max: ${SHOP_MAX_PER_DUNGEON}, eligible: ${eligibleRooms.length})`);
}
