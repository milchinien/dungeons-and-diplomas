/**
 * Unit Tests for Tiletheme Label and Symbol Corrections
 *
 * Verifies that labels and symbols are correctly oriented after fix
 */

import { describe, it, expect } from 'vitest';
import { getSlotLabel, getSlotSymbol } from '../../lib/tiletheme/ThemeValidator';

describe('Tiletheme Labels and Symbols', () => {
  describe('Wall Labels', () => {
    it('should label horizontal wall as top-bottom with ↕ arrow', () => {
      const label = getSlotLabel('wall', 'horizontal');
      expect(label).toContain('↕');
      expect(label).toContain('top-bottom');
    });

    it('should label vertical wall as left-right with ↔ arrow', () => {
      const label = getSlotLabel('wall', 'vertical');
      expect(label).toContain('↔');
      expect(label).toContain('left-right');
    });

    it('should have clear corner labels with symbols', () => {
      expect(getSlotLabel('wall', 'corner_tl')).toContain('╔');
      expect(getSlotLabel('wall', 'corner_tr')).toContain('╗');
      expect(getSlotLabel('wall', 'corner_bl')).toContain('╚');
      expect(getSlotLabel('wall', 'corner_br')).toContain('╝');
    });

    it('should have clear T-piece labels with symbols', () => {
      expect(getSlotLabel('wall', 't_up')).toContain('╩');
      expect(getSlotLabel('wall', 't_down')).toContain('╦');
      expect(getSlotLabel('wall', 't_left')).toContain('╣');
      expect(getSlotLabel('wall', 't_right')).toContain('╠');
    });

    it('should label cross with symbol', () => {
      expect(getSlotLabel('wall', 'cross')).toContain('╬');
    });

    it('should mark optional walls as (opt.)', () => {
      expect(getSlotLabel('wall', 'isolated')).toContain('(opt.)');
      expect(getSlotLabel('wall', 'end_left')).toContain('(opt.)');
      expect(getSlotLabel('wall', 'end_right')).toContain('(opt.)');
      expect(getSlotLabel('wall', 'end_top')).toContain('(opt.)');
      expect(getSlotLabel('wall', 'end_bottom')).toContain('(opt.)');
    });
  });

  describe('Wall Symbols', () => {
    it('should use vertical line ║ for horizontal wall (top-bottom)', () => {
      const symbol = getSlotSymbol('wall', 'horizontal');
      expect(symbol).toBe('║');
    });

    it('should use horizontal line ═══ for vertical wall (left-right)', () => {
      const symbol = getSlotSymbol('wall', 'vertical');
      expect(symbol).toBe('═══');
    });

    it('should have correct corner symbols', () => {
      expect(getSlotSymbol('wall', 'corner_tl')).toBe('╔');
      expect(getSlotSymbol('wall', 'corner_tr')).toBe('╗');
      expect(getSlotSymbol('wall', 'corner_bl')).toBe('╚');
      expect(getSlotSymbol('wall', 'corner_br')).toBe('╝');
    });

    it('should have correct T-piece symbols', () => {
      expect(getSlotSymbol('wall', 't_up')).toBe('╩');
      expect(getSlotSymbol('wall', 't_down')).toBe('╦');
      expect(getSlotSymbol('wall', 't_left')).toBe('╣');
      expect(getSlotSymbol('wall', 't_right')).toBe('╠');
    });

    it('should have cross symbol', () => {
      expect(getSlotSymbol('wall', 'cross')).toBe('╬');
    });

    it('should have isolated symbol', () => {
      expect(getSlotSymbol('wall', 'isolated')).toBe('▢');
    });

    it('should use horizontal line for left/right ends', () => {
      expect(getSlotSymbol('wall', 'end_left')).toBe('═');
      expect(getSlotSymbol('wall', 'end_right')).toBe('═');
    });

    it('should use vertical line for top/bottom ends', () => {
      expect(getSlotSymbol('wall', 'end_top')).toBe('║');
      expect(getSlotSymbol('wall', 'end_bottom')).toBe('║');
    });
  });

  describe('Door Labels', () => {
    it('should label horizontal doors with ↔ arrow', () => {
      expect(getSlotLabel('door', 'horizontal_closed')).toContain('↔');
      expect(getSlotLabel('door', 'horizontal_open')).toContain('↔');
    });

    it('should label vertical doors with ↕ arrow', () => {
      expect(getSlotLabel('door', 'vertical_closed')).toContain('↕');
      expect(getSlotLabel('door', 'vertical_open')).toContain('↕');
    });
  });

  describe('Door Symbols', () => {
    it('should use horizontal line ─── for horizontal doors (left-right)', () => {
      expect(getSlotSymbol('door', 'horizontal_closed')).toBe('───');
    });

    it('should use vertical line ┋┋┋ for vertical doors (top-bottom)', () => {
      expect(getSlotSymbol('door', 'vertical_closed')).toBe('┋┋┋');
    });

    it('should use ░░░ for open doors', () => {
      expect(getSlotSymbol('door', 'horizontal_open')).toBe('░░░');
      expect(getSlotSymbol('door', 'vertical_open')).toBe('░░░');
    });
  });

  describe('Floor Label', () => {
    it('should have floor label', () => {
      expect(getSlotLabel('floor', 'default')).toBe('Floor');
    });

    it('should have floor symbol', () => {
      expect(getSlotSymbol('floor', 'default')).toBe('▓');
    });
  });

  describe('Orientation Consistency', () => {
    it('wall.horizontal should be consistent (↕ symbol and label)', () => {
      const label = getSlotLabel('wall', 'horizontal');
      const symbol = getSlotSymbol('wall', 'horizontal');

      // Label should say "top-bottom" with ↕
      expect(label).toContain('↕');
      expect(label).toContain('top-bottom');

      // Symbol should be vertical line ║
      expect(symbol).toBe('║');
    });

    it('wall.vertical should be consistent (↔ symbol and label)', () => {
      const label = getSlotLabel('wall', 'vertical');
      const symbol = getSlotSymbol('wall', 'vertical');

      // Label should say "left-right" with ↔
      expect(label).toContain('↔');
      expect(label).toContain('left-right');

      // Symbol should be horizontal line ═══
      expect(symbol).toBe('═══');
    });

    it('door.horizontal should be consistent (↔ label, ─── symbol)', () => {
      const label = getSlotLabel('door', 'horizontal_closed');
      const symbol = getSlotSymbol('door', 'horizontal_closed');

      // Label should have ↔ (left-right)
      expect(label).toContain('↔');

      // Symbol should be horizontal line ───
      expect(symbol).toBe('───');
    });

    it('door.vertical should be consistent (↕ label, ┋┋┋ symbol)', () => {
      const label = getSlotLabel('door', 'vertical_closed');
      const symbol = getSlotSymbol('door', 'vertical_closed');

      // Label should have ↕ (top-bottom)
      expect(label).toContain('↕');

      // Symbol should be vertical line ┋┋┋
      expect(symbol).toBe('┋┋┋');
    });
  });

  describe('Label Clarity', () => {
    it('all wall labels should have clear orientation or direction', () => {
      const wallTypes = [
        'horizontal', 'vertical',
        'corner_tl', 'corner_tr', 'corner_bl', 'corner_br',
        't_up', 't_down', 't_left', 't_right',
        'cross', 'isolated',
        'end_left', 'end_right', 'end_top', 'end_bottom'
      ];

      const failedTypes: string[] = [];

      for (const type of wallTypes) {
        const label = getSlotLabel('wall', type);
        // Label should not be empty or just the type
        expect(label.length, `Label for ${type} should be longer than type name`).toBeGreaterThan(type.length);
        // Label should contain either an arrow, direction word, or symbol
        const hasDirectionIndicator =
          label.includes('↕') || label.includes('↔') ||
          label.includes('top') || label.includes('bottom') ||
          label.includes('left') || label.includes('right') ||
          label.includes('up') || label.includes('down') ||
          label.includes('╔') || label.includes('╗') ||
          label.includes('╚') || label.includes('╝') ||
          label.includes('╩') || label.includes('╦') ||
          label.includes('╣') || label.includes('╠') ||
          label.includes('╬') || label.includes('▢') ||
          label.includes('←') || label.includes('→') ||
          label.includes('↑') || label.includes('↓');

        if (!hasDirectionIndicator) {
          failedTypes.push(`${type} -> "${label}"`);
        }
      }

      if (failedTypes.length > 0) {
        console.log('Failed types:', failedTypes);
      }
      expect(failedTypes.length, `These types have no direction indicator: ${failedTypes.join(', ')}`).toBe(0);
    });

    it('all door labels should have clear orientation', () => {
      const doorTypes = ['horizontal_closed', 'horizontal_open', 'vertical_closed', 'vertical_open'];

      for (const type of doorTypes) {
        const label = getSlotLabel('door', type);
        // Label should contain either ↕ or ↔
        const hasDirectionIndicator = label.includes('↕') || label.includes('↔');
        expect(hasDirectionIndicator).toBe(true);
      }
    });
  });
});
