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
 * @returns true if line of sight is clear (no walls), false if blocked
 */
export function hasLineOfSight(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dungeon: TileType[][],
  tileSize: number
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
    return !isBlocking(dungeon[startTileY][startTileX]);
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
    if (isBlocking(tile)) {
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
 */
function isBlocking(tile: TileType): boolean {
  return tile === TILE.WALL || tile === TILE.EMPTY;
}
