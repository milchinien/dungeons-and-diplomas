/**
 * Shop layout calculation system.
 * Calculates positions of sign, counters, and floating items within a shop room.
 * Layout adapts to room size.
 */

import type { Room } from '../constants';
import { TILE_SOURCE_SIZE } from '../spriteConfig';
import { SHOP_ITEMS_COUNT, SHOP_PERKS_COUNT } from '../constants';

export interface Position {
  x: number;
  y: number;
}

export interface ShopLayout {
  /** Position of the shop sign (tile coordinates) */
  signPosition: Position;

  /** Tiles of the left counter (item counter) */
  leftCounterTiles: Position[];

  /** Tiles of the right counter (perk counter) */
  rightCounterTiles: Position[];

  /** Positions of the items (world coordinates, not tiles) */
  itemPositions: Position[];

  /** Positions of the perks (world coordinates, not tiles) */
  perkPositions: Position[];
}

// Cache for calculated layouts
const layoutCache = new Map<number, ShopLayout>();

/**
 * Calculates the layout of a shop room based on its size.
 * All positions are relative to the room origin.
 */
export function calculateShopLayout(room: Room): ShopLayout {
  const roomCenterX = room.x + Math.floor(room.width / 2);
  const roomCenterY = room.y + Math.floor(room.height / 2);

  // Sign: Upper third, centered
  const signPosition: Position = {
    x: roomCenterX,
    y: room.y + 1  // 1 tile from top edge
  };

  // Counter positions (2 tiles wide, 1 tile high)
  const counterY = roomCenterY + 1;  // Slightly below center
  const counterWidth = 2;
  const gap = 2;  // Gap between counters

  // Left counter (for items)
  const leftCounterStartX = roomCenterX - gap / 2 - counterWidth;
  const leftCounterTiles: Position[] = [];
  for (let i = 0; i < counterWidth; i++) {
    leftCounterTiles.push({
      x: leftCounterStartX + i,
      y: counterY
    });
  }

  // Right counter (for perks)
  const rightCounterStartX = roomCenterX + Math.ceil(gap / 2);
  const rightCounterTiles: Position[] = [];
  for (let i = 0; i < counterWidth; i++) {
    rightCounterTiles.push({
      x: rightCounterStartX + i,
      y: counterY
    });
  }

  // Item positions (above left counter, spaced evenly)
  const itemPositions: Position[] = [];
  const itemY = counterY - 1;  // Above the counter
  const itemSpacing = SHOP_ITEMS_COUNT <= 2 ? 0.8 : 0.7; // More spacing for 2 items
  for (let i = 0; i < SHOP_ITEMS_COUNT; i++) {
    itemPositions.push({
      x: (leftCounterStartX + 0.3 + i * itemSpacing) * TILE_SOURCE_SIZE + TILE_SOURCE_SIZE / 2,
      y: itemY * TILE_SOURCE_SIZE
    });
  }

  // Perk positions (above right counter, spaced evenly)
  const perkPositions: Position[] = [];
  const perkSpacing = SHOP_PERKS_COUNT <= 2 ? 0.8 : 0.7; // More spacing for 2 perks
  for (let i = 0; i < SHOP_PERKS_COUNT; i++) {
    perkPositions.push({
      x: (rightCounterStartX + 0.3 + i * perkSpacing) * TILE_SOURCE_SIZE + TILE_SOURCE_SIZE / 2,
      y: itemY * TILE_SOURCE_SIZE
    });
  }

  return {
    signPosition,
    leftCounterTiles,
    rightCounterTiles,
    itemPositions,
    perkPositions
  };
}

/**
 * Checks if a tile position is on a counter.
 */
export function isCounterTile(
  tileX: number,
  tileY: number,
  layout: ShopLayout
): boolean {
  const isLeftCounter = layout.leftCounterTiles.some(
    tile => tile.x === tileX && tile.y === tileY
  );
  const isRightCounter = layout.rightCounterTiles.some(
    tile => tile.x === tileX && tile.y === tileY
  );
  return isLeftCounter || isRightCounter;
}

/**
 * Returns all counter tiles.
 */
export function getAllCounterTiles(layout: ShopLayout): Position[] {
  return [...layout.leftCounterTiles, ...layout.rightCounterTiles];
}

/**
 * Calculates the floating height for an animation.
 * @param time - Current time in seconds
 * @param baseY - Base Y position
 * @param amplitude - Float amplitude in pixels
 * @param speed - Cycles per second
 */
export function calculateFloatingY(
  time: number,
  baseY: number,
  amplitude: number,
  speed: number
): number {
  return baseY + Math.sin(time * speed * Math.PI * 2) * amplitude;
}

/**
 * Returns the layout for a room (with caching).
 */
export function getShopLayout(room: Room): ShopLayout {
  if (layoutCache.has(room.id)) {
    return layoutCache.get(room.id)!;
  }

  const layout = calculateShopLayout(room);
  layoutCache.set(room.id, layout);
  return layout;
}

/**
 * Clears the layout cache (on new dungeon).
 */
export function clearLayoutCache(): void {
  layoutCache.clear();
}
