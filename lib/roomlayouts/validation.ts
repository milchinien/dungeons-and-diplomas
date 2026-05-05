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
  if (north === null && south === null && east === null && west === null) {
    errors.push('Mindestens eine Tür muss definiert sein');
  }

  // Doors must be at edges
  const doorErrors = validateDoorPositions(layout);
  errors.push(...doorErrors);

  // Doors must have floor on both sides
  const doorFloorErrors = validateDoorsHaveFloor(layout);
  errors.push(...doorFloorErrors);

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

  // Special validation for spawn rooms
  if (layout.roomType === 'spawn') {
    const spawnErrors = validateSpawnRoom(layout);
    errors.push(...spawnErrors);
  }

  // Special validation for end rooms
  if (layout.roomType === 'end') {
    const endErrors = validateEndRoom(layout);
    errors.push(...endErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates spawn room requirements
 * Spawn rooms MUST have exactly 3 doors: North, East, West (NOT South)
 */
export function validateSpawnRoom(layout: RoomLayoutInput): string[] {
  const errors: string[] = [];
  const { doorPositions } = layout;

  // Count doors
  const doorCount = [
    doorPositions.north !== null,
    doorPositions.south !== null,
    doorPositions.east !== null,
    doorPositions.west !== null
  ].filter(Boolean).length;

  if (doorCount !== 3) {
    errors.push(`Spawn-Raum muss genau 3 Türen haben (aktuell: ${doorCount})`);
  }

  // Must have North, East, West (NOT South)
  if (doorPositions.north === null) {
    errors.push('Spawn-Raum muss eine Nord-Tür haben');
  }
  if (doorPositions.east === null) {
    errors.push('Spawn-Raum muss eine Ost-Tür haben');
  }
  if (doorPositions.west === null) {
    errors.push('Spawn-Raum muss eine West-Tür haben');
  }
  if (doorPositions.south !== null) {
    errors.push('Spawn-Raum darf KEINE Süd-Tür haben (nur Nord, Ost, West erlaubt)');
  }

  return errors;
}

/**
 * Validates end room requirements
 * End rooms MUST have at least 3 doors (for the 3 paths to converge)
 */
export function validateEndRoom(layout: RoomLayoutInput): string[] {
  const errors: string[] = [];
  const { doorPositions } = layout;

  // Count doors
  const doorCount = [
    doorPositions.north !== null,
    doorPositions.south !== null,
    doorPositions.east !== null,
    doorPositions.west !== null
  ].filter(Boolean).length;

  if (doorCount < 3) {
    errors.push(`End-Raum muss mindestens 3 Türen haben (aktuell: ${doorCount})`);
  }

  return errors;
}

/**
 * Helper: Count total doors in a layout
 */
export function countDoors(doorPositions: { north: number | null, south: number | null, east: number | null, west: number | null }): number {
  return [
    doorPositions.north !== null,
    doorPositions.south !== null,
    doorPositions.east !== null,
    doorPositions.west !== null
  ].filter(Boolean).length;
}

/**
 * Validates that doors are placed at correct positions
 * New version: validates exact door positions (only one door per side)
 */
function validateDoorPositions(layout: RoomLayoutInput): string[] {
  const errors: string[] = [];
  const { tileGrid, doorPositions, width, height } = layout;

  // North door validation
  if (doorPositions.north !== null) {
    const x = doorPositions.north;

    // Check bounds
    if (x < 0 || x >= width) {
      errors.push(`Nord-Tür Position ${x} außerhalb der Grenzen (0-${width - 1})`);
    } else {
      // Check if door tile exists at specified position
      if (tileGrid[0]?.[x] !== TILE.DOOR) {
        errors.push(`Nord-Tür bei Position ${x} definiert, aber kein Door-Tile vorhanden`);
      }

      // Check that no other doors exist on north edge
      for (let checkX = 0; checkX < width; checkX++) {
        if (checkX !== x && tileGrid[0]?.[checkX] === TILE.DOOR) {
          errors.push(`Zusätzliche Nord-Tür bei Position ${checkX} gefunden (nur eine Tür pro Seite erlaubt)`);
        }
      }
    }
  } else {
    // If no north door defined, ensure no door tiles on north edge
    for (let x = 0; x < width; x++) {
      if (tileGrid[0]?.[x] === TILE.DOOR) {
        errors.push(`Nord-Tür nicht definiert, aber Door-Tile bei Position ${x} gefunden`);
      }
    }
  }

  // South door validation
  if (doorPositions.south !== null) {
    const x = doorPositions.south;

    if (x < 0 || x >= width) {
      errors.push(`Süd-Tür Position ${x} außerhalb der Grenzen (0-${width - 1})`);
    } else {
      if (tileGrid[height - 1]?.[x] !== TILE.DOOR) {
        errors.push(`Süd-Tür bei Position ${x} definiert, aber kein Door-Tile vorhanden`);
      }

      for (let checkX = 0; checkX < width; checkX++) {
        if (checkX !== x && tileGrid[height - 1]?.[checkX] === TILE.DOOR) {
          errors.push(`Zusätzliche Süd-Tür bei Position ${checkX} gefunden (nur eine Tür pro Seite erlaubt)`);
        }
      }
    }
  } else {
    for (let x = 0; x < width; x++) {
      if (tileGrid[height - 1]?.[x] === TILE.DOOR) {
        errors.push(`Süd-Tür nicht definiert, aber Door-Tile bei Position ${x} gefunden`);
      }
    }
  }

  // West door validation
  if (doorPositions.west !== null) {
    const y = doorPositions.west;

    if (y < 0 || y >= height) {
      errors.push(`West-Tür Position ${y} außerhalb der Grenzen (0-${height - 1})`);
    } else {
      if (tileGrid[y]?.[0] !== TILE.DOOR) {
        errors.push(`West-Tür bei Position ${y} definiert, aber kein Door-Tile vorhanden`);
      }

      for (let checkY = 0; checkY < height; checkY++) {
        if (checkY !== y && tileGrid[checkY]?.[0] === TILE.DOOR) {
          errors.push(`Zusätzliche West-Tür bei Position ${checkY} gefunden (nur eine Tür pro Seite erlaubt)`);
        }
      }
    }
  } else {
    for (let y = 0; y < height; y++) {
      if (tileGrid[y]?.[0] === TILE.DOOR) {
        errors.push(`West-Tür nicht definiert, aber Door-Tile bei Position ${y} gefunden`);
      }
    }
  }

  // East door validation
  if (doorPositions.east !== null) {
    const y = doorPositions.east;

    if (y < 0 || y >= height) {
      errors.push(`Ost-Tür Position ${y} außerhalb der Grenzen (0-${height - 1})`);
    } else {
      if (tileGrid[y]?.[width - 1] !== TILE.DOOR) {
        errors.push(`Ost-Tür bei Position ${y} definiert, aber kein Door-Tile vorhanden`);
      }

      for (let checkY = 0; checkY < height; checkY++) {
        if (checkY !== y && tileGrid[checkY]?.[width - 1] === TILE.DOOR) {
          errors.push(`Zusätzliche Ost-Tür bei Position ${checkY} gefunden (nur eine Tür pro Seite erlaubt)`);
        }
      }
    }
  } else {
    for (let y = 0; y < height; y++) {
      if (tileGrid[y]?.[width - 1] === TILE.DOOR) {
        errors.push(`Ost-Tür nicht definiert, aber Door-Tile bei Position ${y} gefunden`);
      }
    }
  }

  return errors;
}

/**
 * Validates that all doors have floor tiles on the inside
 * Doors must not lead into walls or empty space
 */
function validateDoorsHaveFloor(layout: RoomLayoutInput): string[] {
  const errors: string[] = [];
  const { tileGrid, doorPositions, width, height } = layout;

  // North door - check if inside (y=1) has floor
  if (doorPositions.north !== null) {
    const x = doorPositions.north;
    if (x >= 0 && x < width && tileGrid[0]?.[x] === TILE.DOOR) {
      if (tileGrid[1]?.[x] !== TILE.FLOOR) {
        errors.push(`Nord-Tür bei x=${x} hat keinen Boden auf der Innenseite`);
      }
    }
  }

  // South door - check if inside (y=height-2) has floor
  if (doorPositions.south !== null) {
    const x = doorPositions.south;
    if (x >= 0 && x < width && tileGrid[height - 1]?.[x] === TILE.DOOR) {
      if (tileGrid[height - 2]?.[x] !== TILE.FLOOR) {
        errors.push(`Süd-Tür bei x=${x} hat keinen Boden auf der Innenseite`);
      }
    }
  }

  // West door - check if inside (x=1) has floor
  if (doorPositions.west !== null) {
    const y = doorPositions.west;
    if (y >= 0 && y < height && tileGrid[y]?.[0] === TILE.DOOR) {
      if (tileGrid[y]?.[1] !== TILE.FLOOR) {
        errors.push(`West-Tür bei y=${y} hat keinen Boden auf der Innenseite`);
      }
    }
  }

  // East door - check if inside (x=width-2) has floor
  if (doorPositions.east !== null) {
    const y = doorPositions.east;
    if (y >= 0 && y < height && tileGrid[y]?.[width - 1] === TILE.DOOR) {
      if (tileGrid[y]?.[width - 2] !== TILE.FLOOR) {
        errors.push(`Ost-Tür bei y=${y} hat keinen Boden auf der Innenseite`);
      }
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
