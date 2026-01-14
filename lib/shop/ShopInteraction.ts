/**
 * Shop interaction detection system.
 * Detects when the player is near items/perks and provides interaction targets.
 */

import type { Room } from '../constants';
import { TILE_SOURCE_SIZE } from '../spriteConfig';
import type { ShopInventory } from './ShopInventory';
import { getShopLayout, type ShopLayout } from './ShopLayout';
import type { Item } from './Item';
import type { Perk } from './Perk';

/** Maximum distance for interaction (in pixels) - increased for better gameplay */
const INTERACTION_DISTANCE = TILE_SOURCE_SIZE * 2.5; // ~160 pixels

export interface InteractionTarget {
  type: 'item' | 'perk';
  index: number;
  item?: Item;
  perk?: Perk;
  worldX: number;
  worldY: number;
}

/**
 * Calculates the distance between two points.
 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Finds the nearest item that the player can reach.
 */
export function getNearbyItem(
  playerX: number,
  playerY: number,
  inventory: ShopInventory,
  layout: ShopLayout
): { item: Item; index: number; x: number; y: number } | null {
  let closest: { item: Item; index: number; x: number; y: number; dist: number } | null = null;

  for (let i = 0; i < inventory.items.length; i++) {
    const item = inventory.items[i];
    if (item === null) continue;

    const pos = layout.itemPositions[i];
    const dist = distance(playerX, playerY, pos.x, pos.y);

    if (dist <= INTERACTION_DISTANCE) {
      if (!closest || dist < closest.dist) {
        closest = { item, index: i, x: pos.x, y: pos.y, dist };
      }
    }
  }

  return closest ? { item: closest.item, index: closest.index, x: closest.x, y: closest.y } : null;
}

/**
 * Finds the nearest perk that the player can reach.
 */
export function getNearbyPerk(
  playerX: number,
  playerY: number,
  inventory: ShopInventory,
  layout: ShopLayout
): { perk: Perk; index: number; x: number; y: number } | null {
  let closest: { perk: Perk; index: number; x: number; y: number; dist: number } | null = null;

  for (let i = 0; i < inventory.perks.length; i++) {
    const perk = inventory.perks[i];
    if (perk === null) continue;

    const pos = layout.perkPositions[i];
    const dist = distance(playerX, playerY, pos.x, pos.y);

    if (dist <= INTERACTION_DISTANCE) {
      if (!closest || dist < closest.dist) {
        closest = { perk, index: i, x: pos.x, y: pos.y, dist };
      }
    }
  }

  return closest ? { perk: closest.perk, index: closest.index, x: closest.x, y: closest.y } : null;
}

/**
 * Finds the nearest interactable object (item or perk).
 * Player position should be in world coordinates (pixels).
 */
export function getInteractionTarget(
  playerX: number,
  playerY: number,
  room: Room
): InteractionTarget | null {
  if (room.type !== 'shop' || !room.shopInventory) {
    return null;
  }

  const layout = getShopLayout(room);
  const inventory = room.shopInventory;

  // Check items first
  const nearbyItem = getNearbyItem(playerX, playerY, inventory, layout);
  if (nearbyItem) {
    return {
      type: 'item',
      index: nearbyItem.index,
      item: nearbyItem.item,
      worldX: nearbyItem.x,
      worldY: nearbyItem.y
    };
  }

  // Check perks
  const nearbyPerk = getNearbyPerk(playerX, playerY, inventory, layout);
  if (nearbyPerk) {
    return {
      type: 'perk',
      index: nearbyPerk.index,
      perk: nearbyPerk.perk,
      worldX: nearbyPerk.x,
      worldY: nearbyPerk.y
    };
  }

  return null;
}

/**
 * Gets all shops from rooms array.
 */
export function getShopRooms(rooms: Room[]): Room[] {
  return rooms.filter(room => room.type === 'shop' && room.shopInventory);
}

/**
 * Finds the shop room that contains the given player position.
 */
export function getPlayerShopRoom(
  playerX: number,
  playerY: number,
  rooms: Room[]
): Room | null {
  const tileX = Math.floor(playerX / TILE_SOURCE_SIZE);
  const tileY = Math.floor(playerY / TILE_SOURCE_SIZE);

  for (const room of rooms) {
    if (room.type !== 'shop') continue;

    // Check if player is inside this room
    if (
      tileX >= room.x &&
      tileX < room.x + room.width &&
      tileY >= room.y &&
      tileY < room.y + room.height
    ) {
      return room;
    }
  }

  return null;
}
