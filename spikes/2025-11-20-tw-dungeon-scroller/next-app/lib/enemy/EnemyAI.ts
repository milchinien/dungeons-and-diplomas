/**
 * Enemy AI State Machine
 *
 * Handles all AI behavior: IDLE, WANDERING, FOLLOWING states
 * Orchestrates pathfinding, aggro detection, and combat triggering
 * using extracted modules for movement, waypoints, and aggro management.
 */
import {
  AI_STATE,
  ANIMATION,
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  ENEMY_IDLE_WAIT_TIME,
  ENEMY_WAYPOINT_THRESHOLD,
  COMBAT_TRIGGER_DISTANCE
} from '../constants';
import type { TileType, Room } from '../constants';
import { defaultPathfinder } from '../pathfinding/DefaultPathfinder';
import { getEntityTilePosition } from '../physics/TileCoordinates';
import { Enemy } from './Enemy';
import type { Player, EnemyUpdateContext, Pathfinder } from './types';
import { handleStateTransitions } from './AggroManager';
import { moveTowards, followPath, moveDirectlyTowardsPlayer } from './EnemyMovement';
import { pickRandomWaypoint } from './EnemyWaypoints';

export class EnemyAI {
  /**
   * Update enemy AI state and behavior
   */
  static update(enemy: Enemy, ctx: EnemyUpdateContext): void {
    const { dt, player, tileSize, rooms, dungeon, roomMap, onCombatStart, inCombat, doorStates } = ctx;

    if (!enemy.sprite) return;

    // Update sprite animation (even when dead for hurt animation)
    enemy.sprite.update(dt);

    // Skip AI if dead
    if (!enemy.alive) return;

    // Freeze enemy AI during combat
    if (inCombat) return;

    // Update room ID based on current position
    this.updateRoomId(enemy, tileSize, roomMap);

    // Calculate player's room ID
    const { tx: playerTileX, ty: playerTileY } = getEntityTilePosition(player, tileSize);
    const playerRoomId = (playerTileX >= 0 && playerTileX < DUNGEON_WIDTH &&
                          playerTileY >= 0 && playerTileY < DUNGEON_HEIGHT)
      ? roomMap[playerTileY][playerTileX]
      : -1;

    // AI Logic
    const distanceToPlayer = enemy.getDistanceToPlayer(player, tileSize);
    const aggroRadius = enemy.getAggroRadius();
    const deaggroRadius = enemy.getDeaggroRadius();
    const sameRoom = enemy.roomId === playerRoomId && enemy.roomId >= 0;

    // State transitions (using AggroManager module)
    handleStateTransitions(enemy, distanceToPlayer, aggroRadius, deaggroRadius, sameRoom, dungeon, playerTileX, playerTileY);

    // Count down aggro reaction timer while following
    if (enemy.aiState === AI_STATE.FOLLOWING && enemy.aggroReactionTimer > 0) {
      enemy.aggroReactionTimer -= dt;
    }

    // Execute behavior based on state
    this.executeBehavior(enemy, ctx);
  }

  /**
   * Update enemy's room ID based on current tile position
   */
  static updateRoomId(enemy: Enemy, tileSize: number, roomMap: number[][]): void {
    const { tx: tileX, ty: tileY } = getEntityTilePosition(enemy, tileSize);

    if (tileX >= 0 && tileX < DUNGEON_WIDTH && tileY >= 0 && tileY < DUNGEON_HEIGHT) {
      const currentRoomId = roomMap[tileY][tileX];
      if (currentRoomId >= 0) {
        enemy.roomId = currentRoomId;
      }
    }
  }

  /**
   * Execute behavior based on current AI state
   */
  private static executeBehavior(enemy: Enemy, ctx: EnemyUpdateContext): void {
    const { dt, player, tileSize, rooms, dungeon, roomMap, onCombatStart, inCombat, doorStates, pathfinder } = ctx;

    if (enemy.aiState === AI_STATE.IDLE) {
      this.executeIdleBehavior(enemy, dt, rooms, dungeon, roomMap, tileSize);
    } else if (enemy.aiState === AI_STATE.WANDERING) {
      this.executeWanderingBehavior(enemy, dt, tileSize, dungeon, doorStates);
    } else if (enemy.aiState === AI_STATE.FOLLOWING) {
      this.executeFollowingBehavior(enemy, dt, player, tileSize, dungeon, doorStates, onCombatStart, inCombat, pathfinder);
    }
  }

  /**
   * IDLE state: Wait, then transition to WANDERING
   */
  private static executeIdleBehavior(
    enemy: Enemy,
    dt: number,
    rooms: Room[],
    dungeon: TileType[][],
    roomMap: number[][],
    tileSize: number
  ): void {
    enemy.idleTimer -= dt;
    if (enemy.idleTimer <= 0) {
      enemy.aiState = AI_STATE.WANDERING;
      pickRandomWaypoint(enemy, rooms, dungeon, roomMap, tileSize);
    }
    enemy.sprite?.playAnimation(enemy.direction, ANIMATION.IDLE);
  }

  /**
   * WANDERING state: Move towards random waypoint within room
   */
  private static executeWanderingBehavior(
    enemy: Enemy,
    dt: number,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    if (!enemy.waypoint) {
      enemy.aiState = AI_STATE.IDLE;
      enemy.idleTimer = ENEMY_IDLE_WAIT_TIME;
      return;
    }

    const dx = enemy.waypoint.x - enemy.x;
    const dy = enemy.waypoint.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ENEMY_WAYPOINT_THRESHOLD) {
      // Reached waypoint
      enemy.aiState = AI_STATE.IDLE;
      enemy.idleTimer = ENEMY_IDLE_WAIT_TIME;
      enemy.waypoint = null;
      enemy.sprite?.playAnimation(enemy.direction, ANIMATION.IDLE);
    } else {
      // Move towards waypoint (using EnemyMovement module)
      moveTowards(enemy, dx, dy, distance, dt, tileSize, dungeon, doorStates);
      enemy.sprite?.playAnimation(enemy.direction, ANIMATION.WALK);
    }
  }

  /**
   * FOLLOWING state: Chase player using A* pathfinding
   */
  private static executeFollowingBehavior(
    enemy: Enemy,
    dt: number,
    player: Player,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>,
    onCombatStart: (enemy: Enemy) => void,
    inCombat: boolean,
    pathfinder: Pathfinder = defaultPathfinder
  ): void {
    const distanceToPlayer = enemy.getDistanceToPlayer(player, tileSize);

    if (distanceToPlayer > COMBAT_TRIGGER_DISTANCE) {
      // Update path periodically
      enemy.pathUpdateTimer -= dt;
      if (enemy.pathUpdateTimer <= 0 || enemy.path.length === 0) {
        enemy.pathUpdateTimer = Enemy.PATH_UPDATE_INTERVAL;

        const { tx: enemyTileX, ty: enemyTileY } = getEntityTilePosition(enemy, tileSize);
        const { tx: playerTileX, ty: playerTileY } = getEntityTilePosition(player, tileSize);

        enemy.path = pathfinder.findPath(
          enemyTileX, enemyTileY,
          playerTileX, playerTileY,
          dungeon, doorStates
        );
      }

      // Follow the path (using EnemyMovement module)
      if (enemy.path.length > 0) {
        followPath(enemy, dt, tileSize, dungeon, doorStates);
      } else {
        // No path found - fallback to direct movement
        moveDirectlyTowardsPlayer(enemy, dt, player, tileSize, dungeon, doorStates);
      }

      enemy.sprite?.playAnimation(enemy.direction, ANIMATION.RUN);
    } else {
      // Close enough - start combat (but only after reaction time has passed)
      if (!inCombat && enemy.alive && enemy.aggroReactionTimer <= 0) {
        onCombatStart(enemy);
      }
      enemy.sprite?.playAnimation(enemy.direction, ANIMATION.IDLE);
    }
  }

}
