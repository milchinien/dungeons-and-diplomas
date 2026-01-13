/**
 * Aggro Manager Module
 *
 * Handles AI state transitions based on player distance and room awareness.
 * Manages transitions between IDLE, WANDERING, and FOLLOWING states.
 */
import { AI_STATE, TILE, ENEMY_IDLE_WAIT_TIME } from '../constants';
import type { TileType } from '../constants';
import { Enemy } from './Enemy';

/**
 * Handle AI state transitions (IDLE <-> WANDERING <-> FOLLOWING)
 *
 * @param enemy The enemy to update
 * @param distanceToPlayer Distance to player in tiles
 * @param aggroRadius Aggro radius in tiles
 * @param deaggroRadius Deaggro radius in tiles
 * @param sameRoom Whether player and enemy are in the same room
 * @param dungeon The dungeon grid
 * @param playerTileX Player's tile X position
 * @param playerTileY Player's tile Y position
 * @param playerRoomType The type of room the player is in (optional)
 */
export function handleStateTransitions(
  enemy: Enemy,
  distanceToPlayer: number,
  aggroRadius: number,
  deaggroRadius: number,
  sameRoom: boolean,
  dungeon: TileType[][],
  playerTileX: number,
  playerTileY: number,
  playerRoomType?: string
): void {
  // Shop rooms are safe zones - enemies immediately lose aggro
  const playerInShop = playerRoomType === 'shop';

  if (enemy.aiState === AI_STATE.FOLLOWING) {
    // Deaggro if player is too far away OR player entered a shop
    if (distanceToPlayer > deaggroRadius || playerInShop) {
      enemy.aiState = AI_STATE.IDLE;
      enemy.idleTimer = ENEMY_IDLE_WAIT_TIME;
      enemy.path = [];
    }
  } else {
    // Never aggro if player is in a shop
    if (playerInShop) {
      return;
    }

    // Aggro only if player is in the SAME room AND close enough
    if (sameRoom && distanceToPlayer <= aggroRadius) {
      enemy.aiState = AI_STATE.FOLLOWING;
      enemy.waypoint = null;
      // Longer reaction time if player is standing in a door
      const playerTile = dungeon[playerTileY]?.[playerTileX];
      const isPlayerInDoor = playerTile === TILE.DOOR;
      enemy.aggroReactionTimer = isPlayerInDoor
        ? Enemy.AGGRO_REACTION_TIME_DOOR
        : Enemy.AGGRO_REACTION_TIME;
    }
  }
}
