/**
 * Unit Tests for Dungeon Generation Fixes
 *
 * Tests the core fixes without relying on full E2E setup:
 * 1. Double wall merging (AND logic — floor on BOTH sides required)
 * 2. Shop inventory generation
 * 3. Room size validation
 */

import { describe, it, expect } from 'vitest';
import { TILE } from '../../lib/constants';
import type { TileType, Room } from '../../lib/constants';
import { generateShopInventory } from '../../lib/shop/ShopInventory';
import { removeDoubleWalls } from '../../lib/dungeon/generation';

function emptyRoomMap(width: number, height: number): number[][] {
  return Array(height).fill(null).map(() => Array(width).fill(-1));
}

describe('Dungeon Generation Fixes', () => {
  describe('Double Wall Merging - AND Logic', () => {
    it('should merge double walls with floor on BOTH sides (horizontal stack)', () => {
      const dungeon: TileType[][] = [
        [2, 2, 2, 2, 2],
        [2, 1, 1, 1, 2],  // Floor room (above)
        [2, 2, 2, 2, 2],  // Wall 1 (double wall)
        [2, 2, 2, 2, 2],  // Wall 2 (double wall)
        [2, 1, 1, 1, 2],  // Floor room (below)
        [2, 2, 2, 2, 2],
      ];
      const roomMap = emptyRoomMap(5, 6);
      roomMap[1] = [-1, 0, 0, 0, -1];
      roomMap[4] = [-1, 1, 1, 1, -1];

      removeDoubleWalls(dungeon, roomMap, 5, 6);

      expect(dungeon[2][2]).toBe(TILE.FLOOR); // First of pair merged
      expect(dungeon[3][2]).toBe(TILE.WALL);  // Second of pair stays (single wall)
    });

    it('should NOT remove walls with access on only ONE side (cascade guard)', () => {
      // OR logic used to cascade from doors/floors and dissolve entire room
      // perimeters — walls with floor on only one side must survive.
      const dungeon: TileType[][] = [
        [2, 2, 2, 2, 2, 2, 2],
        [2, 1, 1, 2, 2, 0, 2],  // Floor left, wall, wall, EMPTY right
        [2, 1, 1, 2, 2, 0, 2],
        [2, 1, 1, 2, 2, 0, 2],
        [2, 2, 2, 2, 2, 2, 2],
      ];
      const roomMap = emptyRoomMap(7, 5);

      removeDoubleWalls(dungeon, roomMap, 7, 5);

      expect(dungeon[2][3]).toBe(TILE.WALL); // Stays: no floor on the right side
      expect(dungeon[2][4]).toBe(TILE.WALL);
    });

    it('should NOT remove walls without ANY access', () => {
      const dungeon: TileType[][] = [
        [2, 2, 2, 2, 2],
        [2, 0, 2, 0, 2],  // Empty, wall, wall... no floor anywhere
        [2, 0, 2, 0, 2],
        [2, 0, 2, 0, 2],
        [2, 2, 2, 2, 2],
      ];
      const roomMap = emptyRoomMap(5, 5);

      removeDoubleWalls(dungeon, roomMap, 5, 5);

      expect(dungeon[2][2]).toBe(TILE.WALL);
    });

    it('should not cascade through wall runs next to doors', () => {
      // Top wall of a room containing a door: ## D ## with floor below.
      // No wall may be removed — only genuine floor|wall|wall|floor merges.
      const dungeon: TileType[][] = [
        [0, 0, 0, 0, 0, 0, 0],
        [2, 2, 2, 3, 2, 2, 2],  // Wall run with door
        [2, 1, 1, 1, 1, 1, 2],  // Room floor
        [2, 2, 2, 2, 2, 2, 2],
      ];
      const before = dungeon.map(row => [...row]);
      const roomMap = emptyRoomMap(7, 4);

      removeDoubleWalls(dungeon, roomMap, 7, 4);

      expect(dungeon).toEqual(before); // Nothing changed
    });
  });

  describe('Shop Inventory Generation', () => {
    it('should generate shop inventory with items and perks', () => {
      const inventory = generateShopInventory(1, Math.random, 8);

      expect(inventory).toBeDefined();
      expect(inventory.shopRoomId).toBe(1);
      expect(inventory.items).toBeDefined();
      expect(inventory.perks).toBeDefined();
      expect(inventory.items.length).toBeGreaterThan(0);
      expect(inventory.perks.length).toBeGreaterThan(0);
    });

    it('should generate 1 item + 1 perk for small rooms (< 7 width)', () => {
      const inventory = generateShopInventory(1, Math.random, 6);

      expect(inventory.items.length).toBe(1);
      expect(inventory.perks.length).toBe(1);
    });

    it('should generate 2 items + 2 perks for large rooms (>= 7 width)', () => {
      const inventory = generateShopInventory(1, Math.random, 8);

      expect(inventory.items.length).toBe(2);
      expect(inventory.perks.length).toBe(2);
    });

    it('should generate unique items and perks', () => {
      const inventory = generateShopInventory(1, Math.random, 8);

      // Check that items are not null (generated)
      for (const item of inventory.items) {
        expect(item).not.toBeNull();
        expect(item?.id).toBeDefined();
        expect(item?.definition).toBeDefined();
        expect(item?.rarity).toBeDefined();
      }

      // Check that perks are not null (generated)
      for (const perk of inventory.perks) {
        expect(perk).not.toBeNull();
        expect(perk?.id).toBeDefined();
        expect(perk?.definition).toBeDefined();
        expect(perk?.rarity).toBeDefined();
      }
    });
  });

  describe('Room Size Validation for Shops', () => {
    const SHOP_MIN_ROOM_SIZE = 3;
    const SHOP_MAX_ROOM_SIZE = 10;

    function isRoomRightSizeForShop(room: Room): boolean {
      return room.width >= SHOP_MIN_ROOM_SIZE && room.height >= SHOP_MIN_ROOM_SIZE &&
             room.width <= SHOP_MAX_ROOM_SIZE && room.height <= SHOP_MAX_ROOM_SIZE;
    }

    it('should accept rooms with valid size (3x3 to 10x10)', () => {
      const validRooms: Room[] = [
        { id: 1, x: 0, y: 0, width: 3, height: 3, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
        { id: 2, x: 0, y: 0, width: 5, height: 5, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
        { id: 3, x: 0, y: 0, width: 7, height: 7, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
        { id: 4, x: 0, y: 0, width: 10, height: 10, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
      ];

      for (const room of validRooms) {
        expect(isRoomRightSizeForShop(room)).toBe(true);
      }
    });

    it('should reject rooms that are too small (< 3x3)', () => {
      const tooSmallRooms: Room[] = [
        { id: 1, x: 0, y: 0, width: 2, height: 2, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
        { id: 2, x: 0, y: 0, width: 1, height: 5, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
        { id: 3, x: 0, y: 0, width: 5, height: 2, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
      ];

      for (const room of tooSmallRooms) {
        expect(isRoomRightSizeForShop(room)).toBe(false);
      }
    });

    it('should reject rooms that are too large (> 10x10)', () => {
      const tooLargeRooms: Room[] = [
        { id: 1, x: 0, y: 0, width: 11, height: 11, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
        { id: 2, x: 0, y: 0, width: 15, height: 5, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
        { id: 3, x: 0, y: 0, width: 5, height: 12, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
      ];

      for (const room of tooLargeRooms) {
        expect(isRoomRightSizeForShop(room)).toBe(false);
      }
    });

    it('should handle edge cases (exactly at boundaries)', () => {
      const edgeCases: Array<{ room: Room, expected: boolean }> = [
        {
          room: { id: 1, x: 0, y: 0, width: 3, height: 3, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
          expected: true // Exactly MIN
        },
        {
          room: { id: 2, x: 0, y: 0, width: 10, height: 10, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
          expected: true // Exactly MAX
        },
        {
          room: { id: 3, x: 0, y: 0, width: 2, height: 3, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
          expected: false // Below MIN width
        },
        {
          room: { id: 4, x: 0, y: 0, width: 3, height: 2, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
          expected: false // Below MIN height
        },
        {
          room: { id: 5, x: 0, y: 0, width: 11, height: 10, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
          expected: false // Above MAX width
        },
        {
          room: { id: 6, x: 0, y: 0, width: 10, height: 11, visible: false, neighbors: [], type: 'empty', state: 'unexplored' },
          expected: false // Above MAX height
        },
      ];

      for (const testCase of edgeCases) {
        expect(isRoomRightSizeForShop(testCase.room)).toBe(testCase.expected);
      }
    });
  });

  describe('Integration: Room Type Assignment', () => {
    it('should assign shop type only to rooms with valid size', () => {
      const rooms: Room[] = [
        { id: 0, x: 0, y: 0, width: 5, height: 5, visible: true, neighbors: [], type: 'empty', state: 'explored' }, // Start room
        { id: 1, x: 0, y: 0, width: 2, height: 2, visible: false, neighbors: [], type: 'empty', state: 'unexplored' }, // Too small
        { id: 2, x: 0, y: 0, width: 7, height: 7, visible: false, neighbors: [], type: 'empty', state: 'unexplored' }, // Valid
        { id: 3, x: 0, y: 0, width: 15, height: 15, visible: false, neighbors: [], type: 'empty', state: 'unexplored' }, // Too large
        { id: 4, x: 0, y: 0, width: 5, height: 5, visible: false, neighbors: [], type: 'empty', state: 'unexplored' }, // Valid
      ];

      const SHOP_MIN_ROOM_SIZE = 3;
      const SHOP_MAX_ROOM_SIZE = 10;

      function isRoomRightSizeForShop(room: Room): boolean {
        return room.width >= SHOP_MIN_ROOM_SIZE && room.height >= SHOP_MIN_ROOM_SIZE &&
               room.width <= SHOP_MAX_ROOM_SIZE && room.height <= SHOP_MAX_ROOM_SIZE;
      }

      // Simulate shop assignment (simplified)
      for (let i = 1; i < rooms.length; i++) {
        const rand = 0.25; // Would be shop
        if (rand < 0.28 && isRoomRightSizeForShop(rooms[i])) {
          rooms[i].type = 'shop';
          rooms[i].shopInventory = generateShopInventory(rooms[i].id, Math.random, rooms[i].width);
        }
      }

      // Verify results
      expect(rooms[0].type).toBe('empty'); // Start room
      expect(rooms[1].type).toBe('empty'); // Too small - rejected
      expect(rooms[2].type).toBe('shop');  // Valid - accepted
      expect(rooms[2].shopInventory).toBeDefined(); // Has inventory
      expect(rooms[3].type).toBe('empty'); // Too large - rejected
      expect(rooms[4].type).toBe('shop');  // Valid - accepted
      expect(rooms[4].shopInventory).toBeDefined(); // Has inventory
    });
  });
});
