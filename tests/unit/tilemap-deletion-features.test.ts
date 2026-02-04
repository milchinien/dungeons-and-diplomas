/**
 * Unit Tests for Tilemap Editor Deletion Features
 *
 * Tests the new "Clear All" and individual slot clearing features
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { TileTheme, TileVariant, SlotCategory } from '@/lib/tiletheme/types';

// Mock implementation of clearAllVariants
function clearAllVariants(theme: TileTheme): TileTheme {
  return {
    ...theme,
    floor: { default: [] },
    wall: {},
    door: {}
  };
}

// Mock implementation of clearSlotVariants
function clearSlotVariants(
  theme: TileTheme,
  category: SlotCategory,
  type: string
): TileTheme {
  const updated = { ...theme };

  if (category === 'floor') {
    updated.floor = { ...updated.floor, default: [] };
  } else if (category === 'wall') {
    updated.wall = { ...updated.wall, [type]: [] };
  } else if (category === 'door') {
    updated.door = { ...updated.door, [type]: [] };
  }

  return updated;
}

describe('Tilemap Editor Deletion Features', () => {
  let testTheme: TileTheme;
  let sampleVariant: TileVariant;

  beforeEach(() => {
    // Create a fresh theme before each test
    testTheme = {
      id: 1,
      name: 'Test Theme',
      floor: { default: [] },
      wall: {},
      door: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as TileTheme;

    // Create a sample variant
    sampleVariant = {
      source: { tilesetId: 1, x: 0, y: 0 },
      weight: 50
    };
  });

  describe('Clear All Variants', () => {
    it('should clear all floor variants', () => {
      // Add floor variants
      testTheme.floor.default = [sampleVariant, sampleVariant];

      // Clear all
      const result = clearAllVariants(testTheme);

      expect(result.floor.default).toEqual([]);
    });

    it('should clear all wall variants', () => {
      // Add wall variants
      testTheme.wall = {
        horizontal: [sampleVariant],
        vertical: [sampleVariant, sampleVariant],
        corner_tl: [sampleVariant]
      };

      // Clear all
      const result = clearAllVariants(testTheme);

      expect(result.wall).toEqual({});
    });

    it('should clear all door variants', () => {
      // Add door variants
      testTheme.door = {
        horizontal_closed: [sampleVariant],
        vertical_open: [sampleVariant, sampleVariant]
      };

      // Clear all
      const result = clearAllVariants(testTheme);

      expect(result.door).toEqual({});
    });

    it('should clear all variants across all categories at once', () => {
      // Populate all categories
      testTheme.floor.default = [sampleVariant, sampleVariant];
      testTheme.wall = {
        horizontal: [sampleVariant],
        vertical: [sampleVariant]
      };
      testTheme.door = {
        horizontal_closed: [sampleVariant],
        vertical_open: [sampleVariant]
      };

      // Clear all
      const result = clearAllVariants(testTheme);

      expect(result.floor.default).toEqual([]);
      expect(result.wall).toEqual({});
      expect(result.door).toEqual({});
    });

    it('should preserve theme metadata when clearing', () => {
      testTheme.floor.default = [sampleVariant];

      const result = clearAllVariants(testTheme);

      expect(result.id).toBe(testTheme.id);
      expect(result.name).toBe(testTheme.name);
      expect(result.created_at).toBe(testTheme.created_at);
    });
  });

  describe('Clear Single Slot Variants', () => {
    it('should clear only floor variants when specified', () => {
      testTheme.floor.default = [sampleVariant, sampleVariant];
      testTheme.wall.horizontal = [sampleVariant];

      const result = clearSlotVariants(testTheme, 'floor', 'default');

      expect(result.floor.default).toEqual([]);
      expect(result.wall.horizontal).toEqual([sampleVariant]); // Should remain
    });

    it('should clear only specified wall slot', () => {
      testTheme.wall = {
        horizontal: [sampleVariant, sampleVariant],
        vertical: [sampleVariant],
        corner_tl: [sampleVariant]
      };

      const result = clearSlotVariants(testTheme, 'wall', 'horizontal');

      expect(result.wall.horizontal).toEqual([]);
      expect(result.wall.vertical).toEqual([sampleVariant]); // Should remain
      expect(result.wall.corner_tl).toEqual([sampleVariant]); // Should remain
    });

    it('should clear only specified door slot', () => {
      testTheme.door = {
        horizontal_closed: [sampleVariant],
        horizontal_open: [sampleVariant],
        vertical_closed: [sampleVariant]
      };

      const result = clearSlotVariants(testTheme, 'door', 'horizontal_closed');

      expect(result.door.horizontal_closed).toEqual([]);
      expect(result.door.horizontal_open).toEqual([sampleVariant]); // Should remain
      expect(result.door.vertical_closed).toEqual([sampleVariant]); // Should remain
    });

    it('should handle clearing empty slots gracefully', () => {
      const result = clearSlotVariants(testTheme, 'wall', 'horizontal');

      expect(result.wall.horizontal).toEqual([]);
    });

    it('should not affect other categories when clearing a slot', () => {
      testTheme.floor.default = [sampleVariant];
      testTheme.wall.horizontal = [sampleVariant];
      testTheme.door.horizontal_closed = [sampleVariant];

      const result = clearSlotVariants(testTheme, 'wall', 'horizontal');

      expect(result.floor.default).toEqual([sampleVariant]); // Should remain
      expect(result.wall.horizontal).toEqual([]);
      expect(result.door.horizontal_closed).toEqual([sampleVariant]); // Should remain
    });
  });

  describe('Edge Cases', () => {
    it('should handle clearing all from already empty theme', () => {
      const result = clearAllVariants(testTheme);

      expect(result.floor.default).toEqual([]);
      expect(result.wall).toEqual({});
      expect(result.door).toEqual({});
    });

    it('should handle clearing a non-existent wall slot', () => {
      const result = clearSlotVariants(testTheme, 'wall', 'corner_br');

      expect(result.wall.corner_br).toEqual([]);
    });

    it('should handle clearing a non-existent door slot', () => {
      const result = clearSlotVariants(testTheme, 'door', 'vertical_open');

      expect(result.door.vertical_open).toEqual([]);
    });
  });

  describe('Multiple Operations', () => {
    it('should support sequential slot clearing', () => {
      testTheme.wall = {
        horizontal: [sampleVariant],
        vertical: [sampleVariant],
        corner_tl: [sampleVariant]
      };

      let result = clearSlotVariants(testTheme, 'wall', 'horizontal');
      result = clearSlotVariants(result, 'wall', 'vertical');

      expect(result.wall.horizontal).toEqual([]);
      expect(result.wall.vertical).toEqual([]);
      expect(result.wall.corner_tl).toEqual([sampleVariant]); // Should remain
    });

    it('should support clear all followed by individual slot clears', () => {
      testTheme.floor.default = [sampleVariant];
      testTheme.wall.horizontal = [sampleVariant];

      let result = clearAllVariants(testTheme);

      // Add new variants
      result.floor.default = [sampleVariant, sampleVariant];

      // Clear just floor
      result = clearSlotVariants(result, 'floor', 'default');

      expect(result.floor.default).toEqual([]);
      expect(result.wall).toEqual({});
    });
  });

  describe('Variant Count Verification', () => {
    it('should reduce variant count to 0 when clearing all', () => {
      testTheme.floor.default = [sampleVariant, sampleVariant, sampleVariant];

      const result = clearAllVariants(testTheme);

      expect(result.floor.default.length).toBe(0);
    });

    it('should reduce specific slot variant count to 0', () => {
      testTheme.wall.horizontal = [
        sampleVariant,
        sampleVariant,
        sampleVariant,
        sampleVariant
      ];

      const result = clearSlotVariants(testTheme, 'wall', 'horizontal');

      expect(result.wall.horizontal.length).toBe(0);
    });

    it('should preserve variant counts in other slots', () => {
      testTheme.wall = {
        horizontal: [sampleVariant, sampleVariant, sampleVariant],
        vertical: [sampleVariant, sampleVariant]
      };

      const result = clearSlotVariants(testTheme, 'wall', 'horizontal');

      expect(result.wall.horizontal.length).toBe(0);
      expect(result.wall.vertical.length).toBe(2); // Should remain
    });
  });
});
