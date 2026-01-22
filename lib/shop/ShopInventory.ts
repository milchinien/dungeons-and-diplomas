/**
 * Shop inventory system for the shop feature.
 * Manages items and perks per shop room.
 * Tracks which items have been purchased (set to null).
 */

import { Item, generateRandomItem } from './Item';
import { Perk, generateRandomPerk } from './Perk';
import { SHOP_ITEMS_COUNT, SHOP_PERKS_COUNT } from '../constants';

export interface ShopInventory {
  shopRoomId: number;
  items: (Item | null)[];   // Items array, null if purchased
  perks: (Perk | null)[];   // Perks array, null if purchased
}

/**
 * Generates a complete shop inventory with random items and perks.
 * @param roomId - The ID of the shop room
 * @param randomFn - Optional random function for deterministic tests
 * @param roomWidth - Optional room width to determine item count (small rooms get 1 item/perk each)
 */
export function generateShopInventory(
  roomId: number,
  randomFn: () => number = Math.random,
  roomWidth?: number
): ShopInventory {
  const items: Item[] = [];
  const perks: Perk[] = [];

  // Determine count based on room size
  // Small rooms (width < 7): 1 counter with 1 item + 1 perk
  // Large rooms (width >= 7): 2 counters with 2 items + 2 perks
  const isSmallRoom = roomWidth !== undefined && roomWidth < 7;
  const itemCount = isSmallRoom ? 1 : SHOP_ITEMS_COUNT;
  const perkCount = isSmallRoom ? 1 : SHOP_PERKS_COUNT;

  // Generate random items
  for (let i = 0; i < itemCount; i++) {
    items.push(generateRandomItem(randomFn));
  }

  // Generate random perks
  for (let i = 0; i < perkCount; i++) {
    perks.push(generateRandomPerk(randomFn));
  }

  return {
    shopRoomId: roomId,
    items,
    perks
  };
}

/**
 * Marks an item as purchased (sets to null).
 * @returns The purchased item or null if already purchased/invalid index
 */
export function purchaseItem(
  inventory: ShopInventory,
  itemIndex: number
): Item | null {
  if (itemIndex < 0 || itemIndex >= inventory.items.length) {
    return null;
  }

  const item = inventory.items[itemIndex];
  if (item === null) {
    return null; // Already purchased
  }

  inventory.items[itemIndex] = null;
  return item;
}

/**
 * Marks a perk as purchased (sets to null).
 * @returns The purchased perk or null if already purchased/invalid index
 */
export function purchasePerk(
  inventory: ShopInventory,
  perkIndex: number
): Perk | null {
  if (perkIndex < 0 || perkIndex >= inventory.perks.length) {
    return null;
  }

  const perk = inventory.perks[perkIndex];
  if (perk === null) {
    return null; // Already purchased
  }

  inventory.perks[perkIndex] = null;
  return perk;
}

/**
 * Checks if there are items available in the shop.
 */
export function hasAvailableItems(inventory: ShopInventory): boolean {
  return inventory.items.some(item => item !== null);
}

/**
 * Checks if there are perks available in the shop.
 */
export function hasAvailablePerks(inventory: ShopInventory): boolean {
  return inventory.perks.some(perk => perk !== null);
}

/**
 * Checks if the shop is empty (no items or perks available).
 */
export function isShopEmpty(inventory: ShopInventory): boolean {
  return !hasAvailableItems(inventory) && !hasAvailablePerks(inventory);
}

/**
 * Returns the number of available items.
 */
export function countAvailableItems(inventory: ShopInventory): number {
  return inventory.items.filter(item => item !== null).length;
}

/**
 * Returns the number of available perks.
 */
export function countAvailablePerks(inventory: ShopInventory): number {
  return inventory.perks.filter(perk => perk !== null).length;
}
