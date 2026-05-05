/**
 * Unit Tests for Wall End Piece Detection
 *
 * Verifies that end pieces are correctly detected after HORIZONTAL/VERTICAL swap
 */

import { describe, it, expect } from 'vitest';
import { detectWallType, WALL_TYPE_FALLBACKS } from '../../lib/tiletheme/WallTypeDetector';
import { WALL_TYPE } from '../../lib/tiletheme/types';
import { TILE } from '../../lib/constants';

describe('Wall End Piece Detection', () => {
  describe('End Piece Detection Logic', () => {
    it('should return END_LEFT when wall has neighbor to RIGHT only', () => {
      // Wall extends to the right, end is on the left
      // F F F
      // F W═F (wall with right neighbor)
      // F F F
      const dungeon = [
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
        [TILE.FLOOR, TILE.WALL, TILE.WALL],
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
      ];

      const result = detectWallType(dungeon, 1, 1);
      expect(result).toBe(WALL_TYPE.END_LEFT);
    });

    it('should return END_RIGHT when wall has neighbor to LEFT only', () => {
      // Wall extends to the left, end is on the right
      // F F F
      // F═W F (wall with left neighbor)
      // F F F
      const dungeon = [
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
        [TILE.WALL, TILE.WALL, TILE.FLOOR],
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
      ];

      const result = detectWallType(dungeon, 1, 1);
      expect(result).toBe(WALL_TYPE.END_RIGHT);
    });

    it('should return END_TOP when wall has neighbor BELOW only', () => {
      // Wall extends down, end is on top
      // F F F
      // F ║ F (wall with bottom neighbor)
      // F ║ F
      const dungeon = [
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
        [TILE.FLOOR, TILE.WALL, TILE.FLOOR],
        [TILE.FLOOR, TILE.WALL, TILE.FLOOR],
      ];

      const result = detectWallType(dungeon, 1, 1);
      expect(result).toBe(WALL_TYPE.END_TOP);
    });

    it('should return END_BOTTOM when wall has neighbor ABOVE only', () => {
      // Wall extends up, end is on bottom
      // F ║ F
      // F ║ F (wall with top neighbor)
      // F F F
      const dungeon = [
        [TILE.FLOOR, TILE.WALL, TILE.FLOOR],
        [TILE.FLOOR, TILE.WALL, TILE.FLOOR],
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
      ];

      const result = detectWallType(dungeon, 1, 1);
      expect(result).toBe(WALL_TYPE.END_BOTTOM);
    });
  });

  describe('End Piece Fallbacks (Swapped System)', () => {
    it('END_LEFT should fallback to VERTICAL (horizontal-looking tile)', () => {
      // After swap: VERTICAL slot contains horizontal-looking tiles (═══)
      // END_LEFT should use horizontal line (═)
      expect(WALL_TYPE_FALLBACKS[WALL_TYPE.END_LEFT]).toBe(WALL_TYPE.VERTICAL);
    });

    it('END_RIGHT should fallback to VERTICAL (horizontal-looking tile)', () => {
      // After swap: VERTICAL slot contains horizontal-looking tiles (═══)
      // END_RIGHT should use horizontal line (═)
      expect(WALL_TYPE_FALLBACKS[WALL_TYPE.END_RIGHT]).toBe(WALL_TYPE.VERTICAL);
    });

    it('END_TOP should fallback to HORIZONTAL (vertical-looking tile)', () => {
      // After swap: HORIZONTAL slot contains vertical-looking tiles (║)
      // END_TOP should use vertical line (║)
      expect(WALL_TYPE_FALLBACKS[WALL_TYPE.END_TOP]).toBe(WALL_TYPE.HORIZONTAL);
    });

    it('END_BOTTOM should fallback to HORIZONTAL (vertical-looking tile)', () => {
      // After swap: HORIZONTAL slot contains vertical-looking tiles (║)
      // END_BOTTOM should use vertical line (║)
      expect(WALL_TYPE_FALLBACKS[WALL_TYPE.END_BOTTOM]).toBe(WALL_TYPE.HORIZONTAL);
    });
  });

  describe('Main Wall Types (Verification)', () => {
    it('should return VERTICAL for left-right walls', () => {
      // Left-right wall should use VERTICAL type (horizontal-looking tiles)
      // F F F
      // ═W═ (wall with left and right neighbors)
      // F F F
      const dungeon = [
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
        [TILE.WALL, TILE.WALL, TILE.WALL],
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
      ];

      const result = detectWallType(dungeon, 1, 1);
      expect(result).toBe(WALL_TYPE.VERTICAL);
    });

    it('should return HORIZONTAL for top-bottom walls', () => {
      // Top-bottom wall should use HORIZONTAL type (vertical-looking tiles)
      // F ║ F
      // F W F (wall with top and bottom neighbors)
      // F ║ F
      const dungeon = [
        [TILE.FLOOR, TILE.WALL, TILE.FLOOR],
        [TILE.FLOOR, TILE.WALL, TILE.FLOOR],
        [TILE.FLOOR, TILE.WALL, TILE.FLOOR],
      ];

      const result = detectWallType(dungeon, 1, 1);
      expect(result).toBe(WALL_TYPE.HORIZONTAL);
    });
  });

  describe('Complex Scenarios', () => {
    it('should correctly detect end pieces in a horizontal corridor', () => {
      // Horizontal corridor with ends
      // F F F F F
      // F═W═W═F (left end at [1,1], right end at [3,1])
      // F F F F F
      const dungeon = [
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
        [TILE.FLOOR, TILE.WALL, TILE.WALL, TILE.WALL, TILE.FLOOR],
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
      ];

      // Left end (has right neighbor only)
      expect(detectWallType(dungeon, 1, 1)).toBe(WALL_TYPE.END_LEFT);

      // Middle piece (has left and right neighbors)
      expect(detectWallType(dungeon, 2, 1)).toBe(WALL_TYPE.VERTICAL);

      // Right end (has left neighbor only)
      expect(detectWallType(dungeon, 3, 1)).toBe(WALL_TYPE.END_RIGHT);
    });

    it('should correctly detect end pieces in a vertical corridor', () => {
      // Vertical corridor with ends
      // F F F
      // F ║ F
      // F W F (top end at [1,1], bottom end at [1,3])
      // F ║ F
      // F F F
      const dungeon = [
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
        [TILE.FLOOR, TILE.WALL, TILE.FLOOR],
        [TILE.FLOOR, TILE.WALL, TILE.FLOOR],
        [TILE.FLOOR, TILE.WALL, TILE.FLOOR],
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
      ];

      // Top end (has bottom neighbor only)
      expect(detectWallType(dungeon, 1, 1)).toBe(WALL_TYPE.END_TOP);

      // Middle piece (has top and bottom neighbors)
      expect(detectWallType(dungeon, 1, 2)).toBe(WALL_TYPE.HORIZONTAL);

      // Bottom end (has top neighbor only)
      expect(detectWallType(dungeon, 1, 3)).toBe(WALL_TYPE.END_BOTTOM);
    });

    it('should detect isolated wall correctly', () => {
      // Isolated wall (no neighbors)
      // F F F
      // F W F
      // F F F
      const dungeon = [
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
        [TILE.FLOOR, TILE.WALL, TILE.FLOOR],
        [TILE.FLOOR, TILE.FLOOR, TILE.FLOOR],
      ];

      const result = detectWallType(dungeon, 1, 1);
      expect(result).toBe(WALL_TYPE.ISOLATED);
    });
  });
});
