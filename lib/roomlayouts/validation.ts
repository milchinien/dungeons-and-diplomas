/**
 * Validation functions for room layouts
 */

import type { RoomLayoutInput } from './types';
import { TILE } from '../constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a room layout
 */
export function validateRoomLayout(layout: RoomLayoutInput): ValidationResult {
  const errors: string[] = [];

  // Size validation
  if (layout.width < 5 || layout.width > 15) {
    errors.push('Breite muss zwischen 5 und 15 liegen');
  }
  if (layout.height < 5 || layout.height > 15) {
    errors.push('Höhe muss zwischen 5 und 15 liegen');
  }

  // Grid size match
  if (layout.tileGrid.length !== layout.height) {
    errors.push('Tile-Grid Höhe stimmt nicht mit Layout-Höhe überein');
  }
  if (layout.tileGrid[0] && layout.tileGrid[0].length !== layout.width) {
    errors.push('Tile-Grid Breite stimmt nicht mit Layout-Breite überein');
  }

  // At least one door
  const { north, south, east, west } = layout.doorPositions;
  if (!north && !south && !east && !west) {
    errors.push('Mindestens eine Tür muss definiert sein');
  }

  // Doors must be at edges
  const doorErrors = validateDoorPositions(layout);
  errors.push(...doorErrors);

  // Must have walkable floor
  const hasFloor = layout.tileGrid.some(row =>
    row.some(tile => tile === TILE.FLOOR)
  );
  if (!hasFloor) {
    errors.push('Raum muss begehbaren Boden haben');
  }

  // All floor tiles must be reachable
  if (hasFloor && !areAllFloorsReachable(layout.tileGrid)) {
    errors.push('Nicht alle Boden-Tiles sind erreichbar (isolierte Bereiche)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates that doors are placed at room edges
 */
function validateDoorPositions(layout: RoomLayoutInput): string[] {
  const errors: string[] = [];
  const { tileGrid, doorPositions, width, height } = layout;

  // North door check
  if (doorPositions.north) {
    const hasDoorInNorth = tileGrid[0]?.some(tile => tile === TILE.DOOR);
    if (!hasDoorInNorth) {
      errors.push('Nord-Tür aktiviert aber kein Door-Tile in oberster Reihe');
    }
  }

  // South door check
  if (doorPositions.south) {
    const hasDoorInSouth = tileGrid[height - 1]?.some(tile => tile === TILE.DOOR);
    if (!hasDoorInSouth) {
      errors.push('Süd-Tür aktiviert aber kein Door-Tile in unterster Reihe');
    }
  }

  // East door check
  if (doorPositions.east) {
    const hasDoorInEast = tileGrid.some(row => row[width - 1] === TILE.DOOR);
    if (!hasDoorInEast) {
      errors.push('Ost-Tür aktiviert aber kein Door-Tile in rechter Spalte');
    }
  }

  // West door check
  if (doorPositions.west) {
    const hasDoorInWest = tileGrid.some(row => row[0] === TILE.DOOR);
    if (!hasDoorInWest) {
      errors.push('West-Tür aktiviert aber kein Door-Tile in linker Spalte');
    }
  }

  return errors;
}

/**
 * Flood-fill algorithm to check if all floor tiles are reachable
 */
function areAllFloorsReachable(grid: number[][]): boolean {
  const height = grid.length;
  const width = grid[0]?.length || 0;

  if (height === 0 || width === 0) return false;

  const visited: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));

  // Find first floor tile
  let startX = -1, startY = -1;
  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === TILE.FLOOR) {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }

  if (startX === -1) return false; // No floor tiles

  // Flood fill from first floor tile
  const queue: [number, number][] = [[startX, startY]];
  visited[startY][startX] = true;
  let reachableFloors = 1;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const [x, y] = current;

    // Check 4 neighbors
    const neighbors: [number, number][] = [
      [x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (!visited[ny][nx] && grid[ny][nx] === TILE.FLOOR) {
          visited[ny][nx] = true;
          queue.push([nx, ny]);
          reachableFloors++;
        }
      }
    }
  }

  // Count total floor tiles
  let totalFloors = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === TILE.FLOOR) totalFloors++;
    }
  }

  return reachableFloors === totalFloors;
}
