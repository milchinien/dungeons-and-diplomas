import {
  TileTheme,
  ValidationResult,
  REQUIRED_WALL_TYPES,
  OPTIONAL_WALL_TYPES,
  REQUIRED_DOOR_TYPES,
  WALL_TYPE,
  WallType
} from './types';

// Re-export ValidationResult for convenience
export type { ValidationResult } from './types';
import { WALL_TYPE_FALLBACKS } from './WallTypeDetector';

/**
 * Validate a TileTheme for completeness
 * A theme is valid if all required slots are filled
 */
export function validateTileTheme(theme: TileTheme): ValidationResult {
  const missingSlots: string[] = [];
  const warnings: string[] = [];

  // Check floor (at least 1 variant required)
  if (!theme.floor.default || theme.floor.default.length === 0) {
    missingSlots.push('floor.default');
  }

  // Check required wall types
  for (const wallType of REQUIRED_WALL_TYPES) {
    const variants = theme.wall[wallType];
    if (!variants || variants.length === 0) {
      missingSlots.push(`wall.${wallType}`);
    }
  }

  // Check optional wall types (generate warnings, not errors)
  for (const wallType of OPTIONAL_WALL_TYPES) {
    const variants = theme.wall[wallType];
    if (!variants || variants.length === 0) {
      const fallback = WALL_TYPE_FALLBACKS[wallType];
      if (fallback) {
        warnings.push(`wall.${wallType} not filled - will use ${fallback} as fallback`);
      }
    }
  }

  // Check required door types
  for (const doorType of REQUIRED_DOOR_TYPES) {
    const variants = theme.door[doorType];
    if (!variants || variants.length === 0) {
      missingSlots.push(`door.${doorType}`);
    }
  }

  return {
    isValid: missingSlots.length === 0,
    missingSlots,
    warnings
  };
}

/**
 * Get a list of all slots with their fill status
 */
export interface SlotStatus {
  category: 'floor' | 'wall' | 'door';
  type: string;
  required: boolean;
  filled: boolean;
  variantCount: number;
}

export function getSlotStatuses(theme: TileTheme): SlotStatus[] {
  const statuses: SlotStatus[] = [];

  // Floor
  statuses.push({
    category: 'floor',
    type: 'default',
    required: true,
    filled: (theme.floor.default?.length ?? 0) > 0,
    variantCount: theme.floor.default?.length ?? 0
  });

  // Required walls
  for (const wallType of REQUIRED_WALL_TYPES) {
    const variants = theme.wall[wallType];
    statuses.push({
      category: 'wall',
      type: wallType,
      required: true,
      filled: (variants?.length ?? 0) > 0,
      variantCount: variants?.length ?? 0
    });
  }

  // Optional walls
  for (const wallType of OPTIONAL_WALL_TYPES) {
    const variants = theme.wall[wallType];
    statuses.push({
      category: 'wall',
      type: wallType,
      required: false,
      filled: (variants?.length ?? 0) > 0,
      variantCount: variants?.length ?? 0
    });
  }

  // Doors
  for (const doorType of REQUIRED_DOOR_TYPES) {
    const variants = theme.door[doorType];
    statuses.push({
      category: 'door',
      type: doorType,
      required: true,
      filled: (variants?.length ?? 0) > 0,
      variantCount: variants?.length ?? 0
    });
  }

  return statuses;
}

/**
 * Create an empty theme structure
 */
export function createEmptyTheme(name: string = 'New Theme'): Omit<TileTheme, 'id' | 'created_at' | 'updated_at'> {
  return {
    name,
    floor: {
      default: []
    },
    wall: {},
    door: {}
  };
}

/**
 * Get human-readable label for a slot type
 */
export function getSlotLabel(category: string, type: string): string {
  const labels: { [key: string]: string } = {
    // Floor
    'floor.default': 'Floor',

    // Walls (INTUITIVE: horizontal = left-right ↔, vertical = top-bottom ↕)
    'wall.horizontal': 'Wall ↔ (left-right)',
    'wall.vertical': 'Wall ↕ (top-bottom)',
    'wall.corner_tl': 'Corner ╔ (top-left)',
    'wall.corner_tr': 'Corner ╗ (top-right)',
    'wall.corner_bl': 'Corner ╚ (bottom-left)',
    'wall.corner_br': 'Corner ╝ (bottom-right)',
    'wall.t_up': 'T-Piece ╩ (up)',
    'wall.t_down': 'T-Piece ╦ (down)',
    'wall.t_left': 'T-Piece ╣ (left)',
    'wall.t_right': 'T-Piece ╠ (right)',
    'wall.cross': 'Cross ╬',
    'wall.isolated': 'Isolated ▢ (opt.)',
    'wall.end_left': 'End ← (opt.)',
    'wall.end_right': 'End → (opt.)',
    'wall.end_top': 'End ↑ (opt.)',
    'wall.end_bottom': 'End ↓ (opt.)',

    // Doors (horizontal = left-right, vertical = top-bottom)
    'door.horizontal_closed': 'Door ↔ Closed',
    'door.horizontal_open': 'Door ↔ Open',
    'door.vertical_closed': 'Door ↕ Closed',
    'door.vertical_open': 'Door ↕ Open',
  };

  return labels[`${category}.${type}`] || `${category}.${type}`;
}

/**
 * Get symbol for visual representation of a slot type
 */
export function getSlotSymbol(category: string, type: string): string {
  const symbols: { [key: string]: string } = {
    // Walls (INTUITIVE: horizontal = ↔, vertical = ↕)
    'wall.horizontal': '═══',      // Left-right tile
    'wall.vertical': '║',          // Top-bottom tile
    'wall.corner_tl': '╔',
    'wall.corner_tr': '╗',
    'wall.corner_bl': '╚',
    'wall.corner_br': '╝',
    'wall.t_up': '╩',
    'wall.t_down': '╦',
    'wall.t_left': '╣',
    'wall.t_right': '╠',
    'wall.cross': '╬',
    'wall.isolated': '▢',
    'wall.end_left': '═',        // Left end (horizontal line)
    'wall.end_right': '═',       // Right end (horizontal line)
    'wall.end_top': '║',         // Top end (vertical line)
    'wall.end_bottom': '║',      // Bottom end (vertical line)

    // Doors (horizontal = ↔, vertical = ↕)
    'door.horizontal_closed': '───',  // Left-right door
    'door.horizontal_open': '░░░',
    'door.vertical_closed': '┋┋┋',    // Top-bottom door
    'door.vertical_open': '░░░',

    // Floor
    'floor.default': '▓',
  };

  return symbols[`${category}.${type}`] || '?';
}
