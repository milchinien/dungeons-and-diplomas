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
 */
export function handleStateTransitions(
  enemy: Enemy,
  distanceToPlayer: number,
  aggroRadius: number,
  deaggroRadius: number,
  sameRoom: boolean,
  dungeon: TileType[][],
  playerTileX: number,
  playerTileY: number
): void {
  if (enemy.aiState === AI_STATE.FOLLOWING) {
    // Deaggro if player is too far away
    if (distanceToPlayer > deaggroRadius) {
      enemy.aiState = AI_STATE.IDLE;
      enemy.idleTimer = ENEMY_IDLE_WAIT_TIME;
      enemy.path = [];
    }
  } else {
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
