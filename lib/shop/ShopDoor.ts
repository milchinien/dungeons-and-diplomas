/**
 * Shop door mechanics.
 * Handles locked shop doors that open when adjacent rooms are cleared.
 */

import type { Room } from '../constants';
import type { Enemy } from '../enemy/Enemy';

export interface ShopDoorStatus {
  isLocked: boolean;
  reason?: string;
}

/**
 * Checks if a room is "cleared" (no living enemies).
 */
export function isRoomCleared(
  room: Room,
  enemies: Enemy[]
): boolean {
  const enemiesInRoom = enemies.filter(
    enemy => enemy.roomId === room.id && enemy.alive
  );
  return enemiesInRoom.length === 0;
}

/**
 * Checks if all neighbors of a shop are cleared.
 */
export function areNeighborsCleared(
  shopRoom: Room,
  allRooms: Room[],
  enemies: Enemy[]
): boolean {
  for (const neighborId of shopRoom.neighbors) {
    const neighbor = allRooms.find(r => r.id === neighborId);
    if (neighbor && !isRoomCleared(neighbor, enemies)) {
      return false;
    }
  }
  return true;
}

/**
 * Gets the status of a shop door.
 * @param shopRoom - The shop room
 * @param playerRoom - The room the player is currently in
 * @param allRooms - All rooms in the dungeon
 * @param enemies - All enemies
 */
export function getShopDoorStatus(
  shopRoom: Room,
  playerRoom: Room,
  allRooms: Room[],
  enemies: Enemy[]
): ShopDoorStatus {
  // Is the player already in the shop?
  if (playerRoom.id === shopRoom.id) {
    return { isLocked: false };
  }

  // Is the player room a neighbor of the shop?
  const isNeighbor = shopRoom.neighbors.includes(playerRoom.id);
  if (!isNeighbor) {
    return { isLocked: true, reason: 'Nicht erreichbar' };
  }

  // Is the player room cleared?
  if (!isRoomCleared(playerRoom, enemies)) {
    const remainingEnemies = enemies.filter(
      e => e.roomId === playerRoom.id && e.alive
    ).length;

    return {
      isLocked: true,
      reason: `Besiege alle Gegner! (${remainingEnemies} übrig)`
    };
  }

  // All okay, door is open
  return { isLocked: false };
}

/**
 * Checks if the player can enter a shop.
 * Called when checking collision with shop door.
 */
export function canEnterShop(
  shopRoom: Room,
  playerRoom: Room,
  enemies: Enemy[]
): boolean {
  // Player must be in a neighbor room
  if (!shopRoom.neighbors.includes(playerRoom.id)) {
    return false;
  }

  // Player room must be cleared
  return isRoomCleared(playerRoom, enemies);
}

/**
 * Gets the message to display when a shop door is locked.
 */
export function getLockedDoorMessage(
  playerRoom: Room,
  enemies: Enemy[]
): string {
  const remainingEnemies = enemies.filter(
    e => e.roomId === playerRoom.id && e.alive
  ).length;

  if (remainingEnemies > 0) {
    return `Besiege alle Gegner! (${remainingEnemies} übrig)`;
  }

  return 'Shop nicht erreichbar';
}

/**
 * Updates the shopDoorOpen status for all shop rooms.
 * Should be called after an enemy is defeated.
 */
export function updateShopDoorStates(
  rooms: Room[],
  enemies: Enemy[]
): void {
  for (const room of rooms) {
    if (room.type !== 'shop') continue;

    // Check if all neighbors are cleared
    const allCleared = areNeighborsCleared(room, rooms, enemies);
    room.shopDoorOpen = allCleared;
  }
}

/**
 * Initializes shop door states for all shops.
 * Should be called after dungeon generation.
 */
export function initializeShopDoorStates(
  rooms: Room[],
  enemies: Enemy[]
): void {
  updateShopDoorStates(rooms, enemies);
}
