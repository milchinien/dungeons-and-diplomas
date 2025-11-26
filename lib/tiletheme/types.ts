// ============================================
// TILESET (imported PNG files)
// ============================================

export interface ImportedTileset {
  id: number;
  name: string;
  path: string;                 // e.g. "/Assets/tilesets/custom/castle.png"
  widthTiles: number;           // Number of tiles horizontal
  heightTiles: number;          // Number of tiles vertical
  created_at?: string;
}

// ============================================
// TILE SOURCE (reference to a tile in a tileset)
// ============================================

export interface TileSource {
  tilesetId: number;            // Which tileset?
  x: number;                    // Tile coordinate X (0-based)
  y: number;                    // Tile coordinate Y (0-based)
}

export interface TileVariant {
  source: TileSource;
  weight: number;               // Weight for random selection (1-100)
}

// ============================================
// WALL TYPES (for autotiling)
// ============================================

export const WALL_TYPE = {
  // Linear walls
  HORIZONTAL: 'horizontal',     // ═══ Walls left AND/OR right, none above/below
  VERTICAL: 'vertical',         // ║   Walls above AND/OR below, none left/right

  // Corners (exactly 2 adjacent walls at right angle)
  CORNER_TL: 'corner_tl',       // ╔   Wall right + below
  CORNER_TR: 'corner_tr',       // ╗   Wall left + below
  CORNER_BL: 'corner_bl',       // ╚   Wall right + above
  CORNER_BR: 'corner_br',       // ╝   Wall left + above

  // T-pieces (exactly 3 adjacent walls)
  T_UP: 't_up',                 // ╩   Opening upward (walls left, right, below)
  T_DOWN: 't_down',             // ╦   Opening downward (walls left, right, above)
  T_LEFT: 't_left',             // ╣   Opening leftward (walls above, below, right)
  T_RIGHT: 't_right',           // ╠   Opening rightward (walls above, below, left)

  // Cross (all 4 sides have walls)
  CROSS: 'cross',               // ╬

  // Special cases (optional - fallback to linear)
  ISOLATED: 'isolated',         // ▢   No neighbor walls
  END_LEFT: 'end_left',         // ═   Only wall right
  END_RIGHT: 'end_right',       // ═   Only wall left
  END_TOP: 'end_top',           // ║   Only wall below
  END_BOTTOM: 'end_bottom',     // ║   Only wall above
} as const;

export type WallType = typeof WALL_TYPE[keyof typeof WALL_TYPE];

// Required slots (must be filled)
export const REQUIRED_WALL_TYPES: WallType[] = [
  WALL_TYPE.HORIZONTAL,
  WALL_TYPE.VERTICAL,
  WALL_TYPE.CORNER_TL,
  WALL_TYPE.CORNER_TR,
  WALL_TYPE.CORNER_BL,
  WALL_TYPE.CORNER_BR,
  WALL_TYPE.T_UP,
  WALL_TYPE.T_DOWN,
  WALL_TYPE.T_LEFT,
  WALL_TYPE.T_RIGHT,
  WALL_TYPE.CROSS,
];

// Optional (fallback to others if not filled)
export const OPTIONAL_WALL_TYPES: WallType[] = [
  WALL_TYPE.ISOLATED,
  WALL_TYPE.END_LEFT,
  WALL_TYPE.END_RIGHT,
  WALL_TYPE.END_TOP,
  WALL_TYPE.END_BOTTOM,
];

// ============================================
// DOOR TYPES
// ============================================

export const DOOR_TYPE = {
  HORIZONTAL_CLOSED: 'horizontal_closed',
  HORIZONTAL_OPEN: 'horizontal_open',
  VERTICAL_CLOSED: 'vertical_closed',
  VERTICAL_OPEN: 'vertical_open',
} as const;

export type DoorType = typeof DOOR_TYPE[keyof typeof DOOR_TYPE];

export const REQUIRED_DOOR_TYPES: DoorType[] = [
  DOOR_TYPE.HORIZONTAL_CLOSED,
  DOOR_TYPE.HORIZONTAL_OPEN,
  DOOR_TYPE.VERTICAL_CLOSED,
  DOOR_TYPE.VERTICAL_OPEN,
];

// ============================================
// TILE THEME (single theme for Dark OR Light)
// ============================================

export interface TileTheme {
  id: number;
  name: string;

  floor: {
    default: TileVariant[];     // At least 1 variant
  };

  wall: {
    [key in WallType]?: TileVariant[];  // Required types must be filled
  };

  door: {
    [key in DoorType]?: TileVariant[];  // All 4 must be filled
  };

  created_at?: string;
  updated_at?: string;
}

// ============================================
// DUNGEON THEME (combination of Dark + Light TileTheme)
// ============================================

export interface DungeonTheme {
  id: number;
  name: string;
  darkThemeId: number;          // Reference to TileTheme
  lightThemeId: number;         // Reference to TileTheme
  created_at?: string;
  updated_at?: string;
}

// ============================================
// VALIDATION
// ============================================

export interface ValidationResult {
  isValid: boolean;
  missingSlots: string[];       // e.g. ["wall.corner_tl", "door.horizontal_open"]
  warnings: string[];           // e.g. ["wall.isolated not filled - fallback to horizontal"]
}

// ============================================
// RENDER MAP (pre-computed tile selection)
// ============================================

/**
 * Single tile reference for rendering
 * Contains Dark + Light variant (Light optional)
 * null = don't render (EMPTY)
 */
export interface RenderTile {
  // Dark tileset (default, always present)
  darkTilesetId: number;
  darkSrcX: number;             // Source X in pixels (pre-calculated!)
  darkSrcY: number;             // Source Y in pixels (pre-calculated!)

  // Light tileset (optional - null = fallback to Dark)
  lightTilesetId: number | null;
  lightSrcX: number | null;
  lightSrcY: number | null;
}

/**
 * Complete RenderMap for a dungeon
 */
export interface RenderMap {
  width: number;
  height: number;
  tiles: (RenderTile | null)[][];  // null = EMPTY, don't render
}

// ============================================
// EDITOR STATE TYPES
// ============================================

export type SlotCategory = 'floor' | 'wall' | 'door';

export interface SelectedSlot {
  category: SlotCategory;
  type: string;  // WallType, DoorType, or 'default' for floor
}

export interface DraggedTile {
  tilesetId: number;
  tilesetPath: string;
  x: number;
  y: number;
}
