import { TILE, type TileType } from '../constants';

/**
 * Generate a test map that contains ALL tile types for live preview.
 *
 * Layout (15x11):
 *
 * ╔═══════════╦═══╗
 * ║           ║   ║
 * ║  FLOOR    ╠═══╣
 * ║           ║   ║
 * ╠═══╦═══════╬═══╣
 * ║   ║       ┋   ║
 * ║   ║  FL   ─   ║
 * ║   ║       ║   ║
 * ╚═══╩═══════╩═══╝
 *
 * Contains:
 * - All 4 corners (╔ ╗ ╚ ╝)
 * - All 4 T-pieces (╦ ╩ ╠ ╣)
 * - Cross (╬)
 * - Horizontal and vertical walls (═ ║)
 * - Horizontal and vertical doors (┋ ─)
 * - Floor tiles
 */
export function generateTestMap(): {
  dungeon: TileType[][];
  width: number;
  height: number;
} {
  const width = 15;
  const height = 11;

  // W=Wall, F=Floor, D=Door
  const layout = [
    'WWWWWWWWWWWWWWW',  // Row 0: Top wall with corners
    'WFFFFFFFFFWFFFW',  // Row 1: Floor area
    'WFFFFFFFFFWFFFW',  // Row 2: Floor area
    'WFFFFFFFFFWWDWW',  // Row 3: Floor area with vertical door
    'WWWWDWWWWWWFFFW',  // Row 4: Horizontal wall with door, T-pieces
    'WFFWFFFFFFFDFFW',  // Row 5: Floor with horizontal door
    'WFFWFFFFFFFWFFW',  // Row 6: Floor area
    'WFFWFFFFFFFWFFW',  // Row 7: Floor area
    'WFFDFFFFFFFFFFFFW', // Row 8: Floor with vertical door (note: this line is 16 chars, will be trimmed)
    'WFFDFFFFFFWFFFW',  // Row 8 (fixed): Floor with vertical door
    'WWWWWWWWWWWWWWW',  // Row 9: Bottom wall
  ];

  // Fixed layout - ensure correct dimensions
  const fixedLayout = [
    'WWWWWWWWWWWWWWW',  // 0: Top edge
    'WFFFFFFFFFWFFFW',  // 1
    'WFFFFFFFFFWFFFW',  // 2
    'WFFFFFFFFFWWDWW',  // 3: Right side with door
    'WWWWDWWWWWWFFFW',  // 4: T-pieces, cross in middle area
    'WFFWFFFFFFFDFFW',  // 5: Horizontal door
    'WFFWFFFFFFFWFFW',  // 6
    'WFFWFFFFFFFWFFW',  // 7
    'WFFDFFFFFFWFFFW',  // 8: Vertical door on left
    'WFFFFFFFFFFFWWW',  // 9
    'WWWWWWWWWWWWWWW',  // 10: Bottom edge
  ];

  const dungeon: TileType[][] = [];

  for (let y = 0; y < height; y++) {
    dungeon[y] = [];
    for (let x = 0; x < width; x++) {
      const char = fixedLayout[y]?.[x] || 'W';
      switch (char) {
        case 'W':
          dungeon[y][x] = TILE.WALL;
          break;
        case 'F':
          dungeon[y][x] = TILE.FLOOR;
          break;
        case 'D':
          dungeon[y][x] = TILE.DOOR;
          break;
        default:
          dungeon[y][x] = TILE.EMPTY;
          break;
      }
    }
  }

  return { dungeon, width, height };
}

/**
 * Generate a smaller test map focused on showing all wall types
 * Good for compact preview
 */
export function generateCompactTestMap(): {
  dungeon: TileType[][];
  width: number;
  height: number;
} {
  const width = 9;
  const height = 9;

  // This layout is designed to show all autotile types
  const layout = [
    'WWWWWWWWW',  // Top edge
    'WFFFFFFFWW',  // Adjusted
    'WFFFFFFFWW',
    'WFFFFFWWW',
    'WWWDWWFFW',  // T-pieces, door
    'WFFFFFFFW',
    'WFFFFFFFW',
    'WFFFFFFFW',
    'WWWWWWWWW',  // Bottom edge
  ];

  // Better compact layout ensuring all types
  const fixedLayout = [
    'WWWDWWWWW',  // 0: Horizontal door at top
    'WFFFFFFFF',  // 1
    'WFFFWFFFF',  // 2: Isolated wall in middle
    'WFFFWFFFW',  // 3
    'WWWWWWWWW',  // 4: Full horizontal (T pieces at intersections)
    'WFFFFFFFWW', // 5
    'WFFFDFWWWW', // 6: Vertical door
    'WFFFFFFFWW', // 7
    'WWWWWWWWW',  // 8: Bottom edge
  ];

  const dungeon: TileType[][] = [];

  for (let y = 0; y < height; y++) {
    dungeon[y] = [];
    for (let x = 0; x < width; x++) {
      const char = fixedLayout[y]?.[x] || 'W';
      switch (char) {
        case 'W':
          dungeon[y][x] = TILE.WALL;
          break;
        case 'F':
          dungeon[y][x] = TILE.FLOOR;
          break;
        case 'D':
          dungeon[y][x] = TILE.DOOR;
          break;
        default:
          dungeon[y][x] = TILE.EMPTY;
          break;
      }
    }
  }

  return { dungeon, width, height };
}

/**
 * Generate a test map specifically designed to showcase ALL wall types
 * Each wall type appears at least once
 */
export function generateAllWallTypesTestMap(): {
  dungeon: TileType[][];
  width: number;
  height: number;
} {
  const width = 13;
  const height = 9;

  // Designed to show:
  // - 4 Corners (TL, TR, BL, BR)
  // - 4 T-pieces (Up, Down, Left, Right)
  // - 1 Cross
  // - Horizontal and Vertical walls
  // - End pieces (isolated walls)
  // - Doors (horizontal and vertical)
  const layout = [
    'WWWWWWWWWWWWW',  // 0: Top edge with corners TL, TR
    'WFFFFWFFFFWFW',  // 1: Floor, vertical wall, isolated
    'WFFFFWFFFFWWW',  // 2
    'WWWWWWWWWWFFW',  // 3: T-down, horizontal, T-right
    'WFFFFDFFFFWFW',  // 4: Horizontal door, cross area
    'WWDWWWWWWWWWW',  // 5: Vertical door, T-up, T-left
    'WFFFFFFFFFFF',   // 6
    'WFFFFFFFFFFF',   // 7
    'WWWWWWWWWWWWW',  // 8: Bottom edge with corners BL, BR
  ];

  const dungeon: TileType[][] = [];

  for (let y = 0; y < height; y++) {
    dungeon[y] = [];
    for (let x = 0; x < width; x++) {
      const char = layout[y]?.[x] || 'W';
      switch (char) {
        case 'W':
          dungeon[y][x] = TILE.WALL;
          break;
        case 'F':
          dungeon[y][x] = TILE.FLOOR;
          break;
        case 'D':
          dungeon[y][x] = TILE.DOOR;
          break;
        default:
          dungeon[y][x] = TILE.EMPTY;
          break;
      }
    }
  }

  return { dungeon, width, height };
}
