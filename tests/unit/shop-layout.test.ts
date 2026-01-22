/**
 * Unit tests for ShopLayout calculation
 * Tests the fixes for small room handling and item centering
 */

import { describe, it, expect } from '@jest/globals';
import { calculateShopLayout } from '../../lib/shop/ShopLayout';
import type { Room } from '../../lib/constants';
import { TILE_SOURCE_SIZE } from '../../lib/spriteConfig';

describe('ShopLayout', () => {
  describe('Small room handling (width < 7)', () => {
    it('should use single counter for 4-tile wide room', () => {
      const room: Room = {
        id: 1,
        x: 10,
        y: 10,
        width: 4,
        height: 5,
        visible: true,
        neighbors: [],
        type: 'shop' as const,
        shopInventory: null
      };

      const layout = calculateShopLayout(room);

      // Should have only left counter (used as single counter)
      expect(layout.leftCounterTiles.length).toBe(2);
      // Right counter should be empty
      expect(layout.rightCounterTiles.length).toBe(0);

      // Should have 2 items and 2 perks on the single counter
      expect(layout.itemPositions.length).toBe(2);
      expect(layout.perkPositions.length).toBe(2);

      console.log('4-tile room layout:');
      console.log('  Left counter tiles:', layout.leftCounterTiles.length);
      console.log('  Right counter tiles:', layout.rightCounterTiles.length);
      console.log('  Items:', layout.itemPositions.length);
      console.log('  Perks:', layout.perkPositions.length);
    });

    it('should use single counter for 6-tile wide room', () => {
      const room: Room = {
        id: 2,
        x: 10,
        y: 10,
        width: 6,
        height: 5,
        visible: true,
        neighbors: [],
        type: 'shop' as const,
        shopInventory: null
      };

      const layout = calculateShopLayout(room);

      expect(layout.leftCounterTiles.length).toBe(2);
      expect(layout.rightCounterTiles.length).toBe(0);
      expect(layout.itemPositions.length).toBe(2);
      expect(layout.perkPositions.length).toBe(2);
    });

    it('should space items evenly on single counter', () => {
      const room: Room = {
        id: 3,
        x: 10,
        y: 10,
        width: 5,
        height: 5,
        visible: true,
        neighbors: [],
        type: 'shop' as const,
        shopInventory: null
      };

      const layout = calculateShopLayout(room);

      // Counter is 2 tiles wide
      const counterStartX = layout.leftCounterTiles[0].x;
      const counterEndX = counterStartX + 2;

      // All items should be within counter bounds
      const allPositions = [...layout.itemPositions, ...layout.perkPositions];
      for (const pos of allPositions) {
        const tileX = pos.x / TILE_SOURCE_SIZE;
        expect(tileX).toBeGreaterThanOrEqual(counterStartX);
        expect(tileX).toBeLessThanOrEqual(counterEndX);
      }

      console.log('\nSingle counter item spacing:');
      console.log('  Counter X range:', counterStartX, '-', counterEndX);
      allPositions.forEach((pos, i) => {
        console.log(`  Item ${i}: x=${(pos.x / TILE_SOURCE_SIZE).toFixed(2)}`);
      });
    });
  });

  describe('Large room handling (width >= 7)', () => {
    it('should use two counters for 7-tile wide room', () => {
      const room: Room = {
        id: 4,
        x: 10,
        y: 10,
        width: 7,
        height: 5,
        visible: true,
        neighbors: [],
        type: 'shop' as const,
        shopInventory: null
      };

      const layout = calculateShopLayout(room);

      // Should have both counters
      expect(layout.leftCounterTiles.length).toBe(2);
      expect(layout.rightCounterTiles.length).toBe(2);

      // Items on left, perks on right
      expect(layout.itemPositions.length).toBe(2);
      expect(layout.perkPositions.length).toBe(2);

      console.log('\n7-tile room layout:');
      console.log('  Left counter tiles:', layout.leftCounterTiles.length);
      console.log('  Right counter tiles:', layout.rightCounterTiles.length);
    });

    it('should use two counters for 8-tile wide room', () => {
      const room: Room = {
        id: 5,
        x: 10,
        y: 10,
        width: 8,
        height: 6,
        visible: true,
        neighbors: [],
        type: 'shop' as const,
        shopInventory: null
      };

      const layout = calculateShopLayout(room);

      expect(layout.leftCounterTiles.length).toBe(2);
      expect(layout.rightCounterTiles.length).toBe(2);
    });

    it('should center items on left counter', () => {
      const room: Room = {
        id: 6,
        x: 10,
        y: 10,
        width: 8,
        height: 6,
        visible: true,
        neighbors: [],
        type: 'shop' as const,
        shopInventory: null
      };

      const layout = calculateShopLayout(room);

      const leftCounterStartX = layout.leftCounterTiles[0].x;
      const leftCounterEndX = leftCounterStartX + 2;

      // All items should be within left counter bounds
      for (const pos of layout.itemPositions) {
        const tileX = pos.x / TILE_SOURCE_SIZE;
        expect(tileX).toBeGreaterThanOrEqual(leftCounterStartX);
        expect(tileX).toBeLessThanOrEqual(leftCounterEndX);
      }

      // Check centering: items should be roughly at 1/3 and 2/3 of counter width
      const item0X = layout.itemPositions[0].x / TILE_SOURCE_SIZE;
      const item1X = layout.itemPositions[1].x / TILE_SOURCE_SIZE;

      // Expected positions: spacing = 2 / (2 + 1) = 0.667
      // Item 0: startX + 0.667
      // Item 1: startX + 1.333
      const expectedItem0X = leftCounterStartX + 2 / 3;
      const expectedItem1X = leftCounterStartX + 4 / 3;

      expect(Math.abs(item0X - expectedItem0X)).toBeLessThan(0.1);
      expect(Math.abs(item1X - expectedItem1X)).toBeLessThan(0.1);

      console.log('\nItem centering on left counter:');
      console.log('  Counter X range:', leftCounterStartX, '-', leftCounterEndX);
      console.log(`  Item 0: x=${item0X.toFixed(2)} (expected ~${expectedItem0X.toFixed(2)})`);
      console.log(`  Item 1: x=${item1X.toFixed(2)} (expected ~${expectedItem1X.toFixed(2)})`);
    });

    it('should center perks on right counter', () => {
      const room: Room = {
        id: 7,
        x: 10,
        y: 10,
        width: 8,
        height: 6,
        visible: true,
        neighbors: [],
        type: 'shop' as const,
        shopInventory: null
      };

      const layout = calculateShopLayout(room);

      const rightCounterStartX = layout.rightCounterTiles[0].x;
      const rightCounterEndX = rightCounterStartX + 2;

      // All perks should be within right counter bounds
      for (const pos of layout.perkPositions) {
        const tileX = pos.x / TILE_SOURCE_SIZE;
        expect(tileX).toBeGreaterThanOrEqual(rightCounterStartX);
        expect(tileX).toBeLessThanOrEqual(rightCounterEndX);
      }

      console.log('\nPerk centering on right counter:');
      console.log('  Counter X range:', rightCounterStartX, '-', rightCounterEndX);
      layout.perkPositions.forEach((pos, i) => {
        console.log(`  Perk ${i}: x=${(pos.x / TILE_SOURCE_SIZE).toFixed(2)}`);
      });
    });
  });

  describe('Counter collision prevention', () => {
    it('should not overlap counters in any room size', () => {
      const roomSizes = [4, 5, 6, 7, 8, 10, 12];

      for (const width of roomSizes) {
        const room: Room = {
          id: 100 + width,
          x: 10,
          y: 10,
          width,
          height: 6,
          visible: true,
          neighbors: [],
          type: 'shop' as const,
          shopInventory: null
        };

        const layout = calculateShopLayout(room);

        if (width >= 7) {
          // Two counters: check they don't overlap
          const leftMaxX = Math.max(...layout.leftCounterTiles.map(t => t.x));
          const rightMinX = Math.min(...layout.rightCounterTiles.map(t => t.x));

          expect(rightMinX).toBeGreaterThan(leftMaxX);
          console.log(`\nRoom width ${width}: counters separated (left=${leftMaxX}, right=${rightMinX})`);
        } else {
          // Single counter: right counter should be empty
          expect(layout.rightCounterTiles.length).toBe(0);
          console.log(`\nRoom width ${width}: single counter mode`);
        }
      }
    });

    it('should keep counters within room bounds', () => {
      const room: Room = {
        id: 200,
        x: 5,
        y: 5,
        width: 8,
        height: 6,
        visible: true,
        neighbors: [],
        type: 'shop' as const,
        shopInventory: null
      };

      const layout = calculateShopLayout(room);

      // Check all counter tiles are within room bounds
      const allCounters = [...layout.leftCounterTiles, ...layout.rightCounterTiles];
      for (const tile of allCounters) {
        expect(tile.x).toBeGreaterThanOrEqual(room.x);
        expect(tile.x).toBeLessThan(room.x + room.width);
        expect(tile.y).toBeGreaterThanOrEqual(room.y);
        expect(tile.y).toBeLessThan(room.y + room.height);
      }

      console.log('\nCounters within bounds check passed');
    });
  });
});
