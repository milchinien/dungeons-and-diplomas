/**
 * Line of Sight Checker
 *
 * Determines if there's a clear line of sight between two points
 * (no walls blocking the view)
 */

import { TILE } from '../constants';
import type { TileType } from '../constants';

/**
 * Check if there's a clear line of sight between two positions
 * Uses DDA (Digital Differential Analyzer) raycasting
 *
 * @param x1 Starting X position (pixels)
 * @param y1 Starting Y position (pixels)
 * @param x2 Target X position (pixels)
 * @param y2 Target Y position (pixels)
 * @param dungeon Dungeon tile grid
 * @param tileSize Size of a tile in pixels
 * @param doorStates Optional map of door states (true = open, false/undefined = closed)
 * @returns true if line of sight is clear (no walls), false if blocked
 */
export function hasLineOfSight(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dungeon: TileType[][],
  tileSize: number,
  doorStates?: Map<string, boolean>
): boolean {
  // Convert pixel positions to tile positions
  const startTileX = Math.floor(x1 / tileSize);
  const startTileY = Math.floor(y1 / tileSize);
  const endTileX = Math.floor(x2 / tileSize);
  const endTileY = Math.floor(y2 / tileSize);

  // Check if start/end positions are in bounds
  if (startTileY < 0 || startTileY >= dungeon.length ||
      startTileX < 0 || startTileX >= dungeon[0]?.length ||
      endTileY < 0 || endTileY >= dungeon.length ||
      endTileX < 0 || endTileX >= dungeon[0]?.length) {
    return false;
  }

  // Calculate direction
  const dx = endTileX - startTileX;
  const dy = endTileY - startTileY;

  // Number of steps (use larger dimension)
  const steps = Math.max(Math.abs(dx), Math.abs(dy));

  if (steps === 0) {
    // Same tile - check if it's walkable
    return !isBlocking(dungeon[startTileY][startTileX], startTileX, startTileY, doorStates);
  }

  // Step increments
  const xInc = dx / steps;
  const yInc = dy / steps;

  // Walk along the line
  let x = startTileX + 0.5; // Start from center of tile
  let y = startTileY + 0.5;

  for (let i = 0; i <= steps; i++) {
    const tileX = Math.floor(x);
    const tileY = Math.floor(y);

    // Check bounds
    if (tileY < 0 || tileY >= dungeon.length ||
        tileX < 0 || tileX >= dungeon[0]?.length) {
      return false;
    }

    // Check if this tile blocks line of sight
    const tile = dungeon[tileY][tileX];
    if (isBlocking(tile, tileX, tileY, doorStates)) {
      return false;
    }

    // Move to next step
    x += xInc;
    y += yInc;
  }

  return true;
}

/**
 * Check if a tile type blocks line of sight
 * Walls, empty tiles, and closed doors block vision
 * Open doors do NOT block vision
 */
function isBlocking(
  tile: TileType,
  tileX: number,
  tileY: number,
  doorStates?: Map<string, boolean>
): boolean {
  if (tile === TILE.WALL || tile === TILE.EMPTY) {
    return true;
  }

  // For doors, check if they are open or closed
  if (tile === TILE.DOOR) {
    // If no doorStates provided, assume closed (blocking)
    if (!doorStates) {
      return true;
    }
    // Check door state: true = open (not blocking), false/undefined = closed (blocking)
    const isOpen = doorStates.get(`${tileX},${tileY}`) ?? false;
    return !isOpen;
  }

  return false;
}
