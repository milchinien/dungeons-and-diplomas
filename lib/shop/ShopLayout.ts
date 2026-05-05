/**
 * Shop layout calculation system.
 * Calculates positions of sign, counters, and floating items within a shop room.
 * Layout adapts to room size.
 */

import type { Room } from '../constants';
import { TILE_SOURCE_SIZE } from '../spriteConfig';

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
 * Calculates the layout of a shop room based on its size and inventory.
 * All positions are relative to the room origin.
 * New layout: Everything at the very top wall - sign and counters, items floating ABOVE counters.
 * Ensures all elements stay within room boundaries.
 *
 * For small rooms (width < 7), uses a single counter with all items/perks.
 * For larger rooms, uses two counters (left for items, right for perks).
 */
export function calculateShopLayout(room: Room): ShopLayout {
  // Get actual item/perk counts from inventory
  const shopItemsCount = room.shopInventory?.items.length ?? 0;
  const shopPerksCount = room.shopInventory?.perks.length ?? 0;
  const roomCenterX = room.x + Math.floor(room.width / 2);

  // Sign: Very top of room, right against the wall
  const signPosition: Position = {
    x: roomCenterX,
    y: room.y + 1  // 1 tile from top edge (right at the wall)
  };

  // Counter positions at the very top wall, just below sign
  const counterY = room.y + 2;  // Directly below the sign
  const counterWidth = 2;

  // Check if room is wide enough for two counters
  // Minimum required: 2 walls + 2 counters (4 tiles) + gap (1 tile) = 7 tiles
  const minWidthForTwoCounters = 7;
  const useSingleCounter = room.width < minWidthForTwoCounters;

  const leftCounterTiles: Position[] = [];
  const rightCounterTiles: Position[] = [];
  const itemPositions: Position[] = [];
  const perkPositions: Position[] = [];
  const itemY = counterY - 0.5;  // ABOVE the counter (floating)

  if (useSingleCounter) {
    // SMALL ROOM: Single counter in the center with all items/perks
    const singleCounterStartX = roomCenterX - Math.floor(counterWidth / 2);

    // Single counter tiles
    for (let i = 0; i < counterWidth; i++) {
      leftCounterTiles.push({
        x: singleCounterStartX + i,
        y: counterY
      });
    }

    // All items/perks on one counter, evenly distributed
    const totalItems = shopItemsCount + shopPerksCount;
    const spacing = totalItems > 0 ? counterWidth / (totalItems + 1) : 0.5; // Evenly distribute across counter width

    // Items first
    for (let i = 0; i < shopItemsCount; i++) {
      itemPositions.push({
        x: (singleCounterStartX + spacing * (i + 1)) * TILE_SOURCE_SIZE,
        y: itemY * TILE_SOURCE_SIZE
      });
    }

    // Perks next
    for (let i = 0; i < shopPerksCount; i++) {
      perkPositions.push({
        x: (singleCounterStartX + spacing * (shopItemsCount + i + 1)) * TILE_SOURCE_SIZE,
        y: itemY * TILE_SOURCE_SIZE
      });
    }
  } else {
    // LARGE ROOM: Two counters (left for items, right for perks)
    const maxGap = Math.max(1, Math.min(3, room.width - 2 * counterWidth - 2));
    const gap = maxGap;

    // Left counter (for items) - to the left of the sign
    let leftCounterStartX = roomCenterX - Math.ceil(gap / 2) - counterWidth;
    leftCounterStartX = Math.max(room.x + 1, leftCounterStartX); // At least 1 tile from left wall

    for (let i = 0; i < counterWidth; i++) {
      leftCounterTiles.push({
        x: leftCounterStartX + i,
        y: counterY
      });
    }

    // Right counter (for perks) - to the right of the sign
    let rightCounterStartX = roomCenterX + Math.ceil(gap / 2);
    rightCounterStartX = Math.min(room.x + room.width - counterWidth - 1, rightCounterStartX); // At least 1 tile from right wall

    for (let i = 0; i < counterWidth; i++) {
      rightCounterTiles.push({
        x: rightCounterStartX + i,
        y: counterY
      });
    }

    // Item positions ABOVE the left counter (floating over it)
    // Center items on the counter: for 2 items on 2-tile counter, place at 0.5 and 1.5
    const itemSpacing = shopItemsCount > 0 ? counterWidth / (shopItemsCount + 1) : 0.5;
    for (let i = 0; i < shopItemsCount; i++) {
      itemPositions.push({
        x: (leftCounterStartX + itemSpacing * (i + 1)) * TILE_SOURCE_SIZE,
        y: itemY * TILE_SOURCE_SIZE
      });
    }

    // Perk positions ABOVE the right counter (floating over it)
    const perkSpacing = shopPerksCount > 0 ? counterWidth / (shopPerksCount + 1) : 0.5;
    for (let i = 0; i < shopPerksCount; i++) {
      perkPositions.push({
        x: (rightCounterStartX + perkSpacing * (i + 1)) * TILE_SOURCE_SIZE,
        y: itemY * TILE_SOURCE_SIZE
      });
    }
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
