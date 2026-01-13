/**
 * Shop inventory system for the shop feature.
 * Manages 3 items and 3 perks per shop room.
 * Tracks which items have been purchased (set to null).
 */

import { Item, generateRandomItem } from './Item';
import { Perk, generateRandomPerk } from './Perk';

export interface ShopInventory {
  shopRoomId: number;
  items: (Item | null)[];   // 3 items, null if purchased
  perks: (Perk | null)[];   // 3 perks, null if purchased
}

export const SHOP_ITEMS_COUNT = 3;
export const SHOP_PERKS_COUNT = 3;

/**
 * Generates a complete shop inventory with 3 items and 3 perks.
 * @param roomId - The ID of the shop room
 * @param randomFn - Optional random function for deterministic tests
 */
export function generateShopInventory(
  roomId: number,
  randomFn: () => number = Math.random
): ShopInventory {
  const items: Item[] = [];
  const perks: Perk[] = [];

  // Generate 3 random items
  for (let i = 0; i < SHOP_ITEMS_COUNT; i++) {
    items.push(generateRandomItem(randomFn));
  }

  // Generate 3 random perks
  for (let i = 0; i < SHOP_PERKS_COUNT; i++) {
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
