/**
 * Shop collision detection for counters.
 * Counters block movement like walls.
 */

import { PLAYER_SIZE } from '../constants';
import type { Room } from '../constants';
import { getShopLayout, isCounterTile } from './ShopLayout';

/**
 * Check if a position collides with a shop counter.
 * Counters block movement like walls.
 *
 * @param x X position in pixels
 * @param y Y position in pixels
 * @param tileSize Size of each tile in pixels
 * @param room The shop room to check
 * @param entitySizeMultiplier Size multiplier for hitbox (default: PLAYER_SIZE)
 * @returns true if collision with counter detected, false otherwise
 */
export function checkShopCounterCollision(
  x: number,
  y: number,
  tileSize: number,
  room: Room,
  entitySizeMultiplier: number = PLAYER_SIZE
): boolean {
  // Only check for shop rooms
  if (room.type !== 'shop') {
    return false;
  }

  // Calculate reduced hitbox size
  const entitySize = tileSize * entitySizeMultiplier;
  const margin = (tileSize - entitySize) / 2;

  // Check all 4 corners of the hitbox
  const points = [
    { x: x + margin, y: y + margin },
    { x: x + tileSize - margin, y: y + margin },
    { x: x + margin, y: y + tileSize - margin },
    { x: x + tileSize - margin, y: y + tileSize - margin }
  ];

  const layout = getShopLayout(room);

  for (const p of points) {
    const tileX = Math.floor(p.x / tileSize);
    const tileY = Math.floor(p.y / tileSize);

    if (isCounterTile(tileX, tileY, layout)) {
      return true;
    }
  }

  return false;
}

/**
 * Find the shop room at a given position.
 * Returns the shop room if position is inside a shop, null otherwise.
 *
 * @param x X position in pixels
 * @param y Y position in pixels
 * @param tileSize Size of each tile in pixels
 * @param roomMap 2D array mapping tile positions to room IDs
 * @param rooms Array of all rooms
 * @returns The shop room or null
 */
export function getShopRoomAtPosition(
  x: number,
  y: number,
  tileSize: number,
  roomMap: number[][],
  rooms: Room[]
): Room | null {
  const tileX = Math.floor(x / tileSize);
  const tileY = Math.floor(y / tileSize);

  if (tileY < 0 || tileY >= roomMap.length || tileX < 0 || tileX >= roomMap[0].length) {
    return null;
  }

  const roomId = roomMap[tileY][tileX];
  if (roomId < 0 || !rooms[roomId]) {
    return null;
  }

  const room = rooms[roomId];
  return room.type === 'shop' ? room : null;
}
