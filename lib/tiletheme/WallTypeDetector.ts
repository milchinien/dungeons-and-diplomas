import { WALL_TYPE, DOOR_TYPE, type WallType, type DoorType } from './types';
import { TILE, type TileType } from '../constants';

/**
 * Check if a position is a wall or door
 * IMPORTANT: Doors are treated like walls for autotiling!
 */
function isWallOrDoor(dungeon: TileType[][], x: number, y: number): boolean {
  if (y < 0 || y >= dungeon.length || x < 0 || x >= dungeon[0].length) {
    return false; // Outside = not a wall
  }
  const tile = dungeon[y][x];
  return tile === TILE.WALL || tile === TILE.DOOR;
}

/**
 * Detect wall type based on 4 direct neighbors
 */
export function detectWallType(
  dungeon: TileType[][],
  x: number,
  y: number
): WallType {
  const hasTop = isWallOrDoor(dungeon, x, y - 1);
  const hasBottom = isWallOrDoor(dungeon, x, y + 1);
  const hasLeft = isWallOrDoor(dungeon, x - 1, y);
  const hasRight = isWallOrDoor(dungeon, x + 1, y);

  const count = [hasTop, hasBottom, hasLeft, hasRight].filter(Boolean).length;

  // 4 neighbors = cross
  if (count === 4) {
    return WALL_TYPE.CROSS;
  }

  // 3 neighbors = T-piece
  if (count === 3) {
    if (!hasTop) return WALL_TYPE.T_UP;
    if (!hasBottom) return WALL_TYPE.T_DOWN;
    if (!hasLeft) return WALL_TYPE.T_LEFT;
    if (!hasRight) return WALL_TYPE.T_RIGHT;
  }

  // 2 neighbors = corner or linear
  if (count === 2) {
    // Corners (right angle)
    if (hasRight && hasBottom) return WALL_TYPE.CORNER_TL;
    if (hasLeft && hasBottom) return WALL_TYPE.CORNER_TR;
    if (hasRight && hasTop) return WALL_TYPE.CORNER_BL;
    if (hasLeft && hasTop) return WALL_TYPE.CORNER_BR;

    // Linear (opposite sides)
    if (hasLeft && hasRight) return WALL_TYPE.HORIZONTAL;
    if (hasTop && hasBottom) return WALL_TYPE.VERTICAL;
  }

  // 1 neighbor = end piece
  if (count === 1) {
    if (hasRight) return WALL_TYPE.END_LEFT;
    if (hasLeft) return WALL_TYPE.END_RIGHT;
    if (hasBottom) return WALL_TYPE.END_TOP;
    if (hasTop) return WALL_TYPE.END_BOTTOM;
  }

  // 0 neighbors = isolated
  return WALL_TYPE.ISOLATED;
}

/**
 * Lookup map for fallbacks when optional types are not filled
 */
export const WALL_TYPE_FALLBACKS: { [key in WallType]?: WallType } = {
  [WALL_TYPE.ISOLATED]: WALL_TYPE.HORIZONTAL,
  [WALL_TYPE.END_LEFT]: WALL_TYPE.HORIZONTAL,
  [WALL_TYPE.END_RIGHT]: WALL_TYPE.HORIZONTAL,
  [WALL_TYPE.END_TOP]: WALL_TYPE.VERTICAL,
  [WALL_TYPE.END_BOTTOM]: WALL_TYPE.VERTICAL,
};

/**
 * Detect door type based on orientation
 * isOpen: In game, door becomes "open" when player passes through
 */
export function detectDoorType(
  dungeon: TileType[][],
  x: number,
  y: number,
  isOpen: boolean = false
): DoorType {
  // Check horizontal vs vertical orientation
  const hasWallLeft = x > 0 && dungeon[y][x - 1] === TILE.WALL;
  const hasWallRight = x < dungeon[0].length - 1 && dungeon[y][x + 1] === TILE.WALL;

  // Door is vertical if walls are on left/right
  const isVertical = hasWallLeft || hasWallRight;

  if (isVertical) {
    return isOpen ? DOOR_TYPE.VERTICAL_OPEN : DOOR_TYPE.VERTICAL_CLOSED;
  } else {
    return isOpen ? DOOR_TYPE.HORIZONTAL_OPEN : DOOR_TYPE.HORIZONTAL_CLOSED;
  }
}

/**
 * Get a wall type with fallback if the type is not available
 */
export function getWallTypeWithFallback(
  wallType: WallType,
  availableTypes: Set<WallType>
): WallType {
  if (availableTypes.has(wallType)) {
    return wallType;
  }

  const fallback = WALL_TYPE_FALLBACKS[wallType];
  if (fallback && availableTypes.has(fallback)) {
    return fallback;
  }

  // Ultimate fallback: horizontal
  return WALL_TYPE.HORIZONTAL;
}
