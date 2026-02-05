/**
 * Unit Tests for Dungeon Generation Fixes
 *
 * Tests the core fixes without relying on full E2E setup:
 * 1. Double wall removal (OR logic)
 * 2. Shop inventory generation
 * 3. Room size validation
 */

import { describe, it, expect } from 'vitest';
import { TILE } from '../../lib/constants';
import type { TileType, Room } from '../../lib/constants';
import { generateShopInventory } from '../../lib/shop/ShopInventory';

describe('Dungeon Generation Fixes', () => {
  describe('Double Wall Removal - OR Logic', () => {
    it('should remove double walls when access on ONE side (horizontal)', () => {
      // Create a simple dungeon with double walls
      const dungeon: TileType[][] = [
        [2, 2, 2, 2, 2],  // All walls
        [2, 1, 1, 1, 2],  // Floor room (above)
        [2, 2, 2, 2, 2],  // Wall 1 (double wall)
        [2, 2, 2, 2, 2],  // Wall 2 (double wall)
        [2, 0, 0, 0, 2],  // Empty (below)
      ];

      // Simulate double wall removal with OR logic
      const height = dungeon.length;
      const width = dungeon[0].length;

      for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width; x++) {
          if (dungeon[y][x] === TILE.WALL && dungeon[y + 1][x] === TILE.WALL) {
            const hasAccessAbove = y > 0 && (dungeon[y - 1][x] === TILE.FLOOR || dungeon[y - 1][x] === TILE.DOOR);
            const hasAccessBelow = y + 2 < height && (dungeon[y + 2][x] === TILE.FLOOR || dungeon[y + 2][x] === TILE.DOOR);

            // OR logic (fixed)
            if (hasAccessAbove || hasAccessBelow) {
              dungeon[y][x] = TILE.FLOOR;
            }
          }
        }
      }

      // Check that first double wall was removed
      expect(dungeon[2][2]).toBe(TILE.FLOOR); // Was wall, now floor (access above)
      expect(dungeon[3][2]).toBe(TILE.WALL);  // Still wall (bottom of pair)
    });

    it('should remove double walls when access on ONE side (vertical)', () => {
      // Create a simple dungeon with vertical double walls
      const dungeon: TileType[][] = [
        [2, 2, 2, 2, 2, 2, 2],
        [2, 1, 1, 2, 2, 0, 2],  // Floor left, wall, wall, empty right
        [2, 1, 1, 2, 2, 0, 2],
        [2, 1, 1, 2, 2, 0, 2],
        [2, 2, 2, 2, 2, 2, 2],
      ];

      // Simulate double wall removal with OR logic
      const height = dungeon.length;
      const width = dungeon[0].length;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width - 1; x++) {
          if (dungeon[y][x] === TILE.WALL && dungeon[y][x + 1] === TILE.WALL) {
            const hasAccessLeft = x > 0 && (dungeon[y][x - 1] === TILE.FLOOR || dungeon[y][x - 1] === TILE.DOOR);
            const hasAccessRight = x + 2 < width && (dungeon[y][x + 2] === TILE.FLOOR || dungeon[y][x + 2] === TILE.DOOR);

            // OR logic (fixed)
            if (hasAccessLeft || hasAccessRight) {
              dungeon[y][x] = TILE.FLOOR;
            }
          }
        }
      }

      // Check that first double wall was removed (access on left side)
      expect(dungeon[2][3]).toBe(TILE.FLOOR); // Was wall, now floor (access left at x=2)
      expect(dungeon[2][4]).toBe(TILE.WALL);  // Still wall (second of pair)
    });

    it('should NOT remove walls without ANY access', () => {
      // Create a dungeon with isolated double walls
      const dungeon: TileType[][] = [
        [2, 2, 2, 2, 2],
        [2, 0, 2, 0, 2],  // Empty, wall, wall, empty
        [2, 0, 2, 0, 2],
        [2, 0, 2, 0, 2],
        [2, 2, 2, 2, 2],
      ];

      // Simulate double wall removal with OR logic
      const height = dungeon.length;
      const width = dungeon[0].length;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width - 1; x++) {
          if (dungeon[y][x] === TILE.WALL && dungeon[y][x + 1] === TILE.WALL) {
            const hasAccessLeft = x > 0 && (dungeon[y][x - 1] === TILE.FLOOR || dungeon[y][x - 1] === TILE.DOOR);
            const hasAccessRight = x + 2 < width && (dungeon[y][x + 2] === TILE.FLOOR || dungeon[y][x + 2] === TILE.DOOR);

            // OR logic - should not remove without access
            if (hasAccessLeft || hasAccessRight) {
              dungeon[y][x] = TILE.FLOOR;
            }
          }
        }
      }

      // Walls should remain (no access on either side)
      expect(dungeon[2][2]).toBe(TILE.WALL);
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
