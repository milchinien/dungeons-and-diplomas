/**
 * Enemy AI State Machine
 *
 * Handles all AI behavior: IDLE, WANDERING, FOLLOWING states
 * Includes pathfinding, aggro detection, and combat triggering
 */
import {
  AI_STATE,
  ANIMATION,
  TILE,
  DUNGEON_WIDTH,
  DUNGEON_HEIGHT,
  ENEMY_SPEED_TILES,
  ENEMY_IDLE_WAIT_TIME,
  ENEMY_WAYPOINT_THRESHOLD,
  COMBAT_TRIGGER_DISTANCE
} from '../constants';
import type { TileType, Room } from '../constants';
import { DirectionCalculator } from '../movement/DirectionCalculator';
import { AStarPathfinder } from '../pathfinding/AStarPathfinder';
import { Enemy } from './Enemy';
import type { Player, EnemyUpdateContext } from './types';

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
    const playerTileX = Math.floor((player.x + tileSize / 2) / tileSize);
    const playerTileY = Math.floor((player.y + tileSize / 2) / tileSize);
    const playerRoomId = (playerTileX >= 0 && playerTileX < DUNGEON_WIDTH &&
                          playerTileY >= 0 && playerTileY < DUNGEON_HEIGHT)
      ? roomMap[playerTileY][playerTileX]
      : -1;

    // AI Logic
    const distanceToPlayer = enemy.getDistanceToPlayer(player, tileSize);
    const aggroRadius = enemy.getAggroRadius();
    const deaggroRadius = enemy.getDeaggroRadius();
    const sameRoom = enemy.roomId === playerRoomId && enemy.roomId >= 0;

    // State transitions
    this.handleStateTransitions(enemy, distanceToPlayer, aggroRadius, deaggroRadius, sameRoom, dungeon, playerTileX, playerTileY);

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
    const tileX = Math.floor((enemy.x + tileSize / 2) / tileSize);
    const tileY = Math.floor((enemy.y + tileSize / 2) / tileSize);

    if (tileX >= 0 && tileX < DUNGEON_WIDTH && tileY >= 0 && tileY < DUNGEON_HEIGHT) {
      const currentRoomId = roomMap[tileY][tileX];
      if (currentRoomId >= 0) {
        enemy.roomId = currentRoomId;
      }
    }
  }

  /**
   * Handle AI state transitions (IDLE <-> WANDERING <-> FOLLOWING)
   */
  private static handleStateTransitions(
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

  /**
   * Execute behavior based on current AI state
   */
  private static executeBehavior(enemy: Enemy, ctx: EnemyUpdateContext): void {
    const { dt, player, tileSize, rooms, dungeon, roomMap, onCombatStart, inCombat, doorStates } = ctx;

    if (enemy.aiState === AI_STATE.IDLE) {
      this.executeIdleBehavior(enemy, dt, rooms, dungeon, roomMap, tileSize);
    } else if (enemy.aiState === AI_STATE.WANDERING) {
      this.executeWanderingBehavior(enemy, dt, tileSize, dungeon, doorStates);
    } else if (enemy.aiState === AI_STATE.FOLLOWING) {
      this.executeFollowingBehavior(enemy, dt, player, tileSize, dungeon, doorStates, onCombatStart, inCombat);
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
      this.pickRandomWaypoint(enemy, rooms, dungeon, roomMap, tileSize);
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
      // Move towards waypoint
      this.moveTowards(enemy, dx, dy, distance, dt, tileSize, dungeon, doorStates);
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
    inCombat: boolean
  ): void {
    const distanceToPlayer = enemy.getDistanceToPlayer(player, tileSize);

    if (distanceToPlayer > COMBAT_TRIGGER_DISTANCE) {
      // Update path periodically
      enemy.pathUpdateTimer -= dt;
      if (enemy.pathUpdateTimer <= 0 || enemy.path.length === 0) {
        enemy.pathUpdateTimer = Enemy.PATH_UPDATE_INTERVAL;

        const enemyTileX = Math.floor((enemy.x + tileSize / 2) / tileSize);
        const enemyTileY = Math.floor((enemy.y + tileSize / 2) / tileSize);
        const playerTileX = Math.floor((player.x + tileSize / 2) / tileSize);
        const playerTileY = Math.floor((player.y + tileSize / 2) / tileSize);

        enemy.path = AStarPathfinder.findPath(
          enemyTileX, enemyTileY,
          playerTileX, playerTileY,
          dungeon, doorStates
        );
      }

      // Follow the path
      if (enemy.path.length > 0) {
        this.followPath(enemy, dt, tileSize, dungeon, doorStates);
      } else {
        // No path found - fallback to direct movement
        this.moveDirectlyTowardsPlayer(enemy, dt, player, tileSize, dungeon, doorStates);
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

  /**
   * Follow calculated A* path
   */
  private static followPath(
    enemy: Enemy,
    dt: number,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    const nextTile = enemy.path[0];
    const targetX = nextTile.x * tileSize;
    const targetY = nextTile.y * tileSize;

    const dx = targetX - enemy.x;
    const dy = targetY - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ENEMY_WAYPOINT_THRESHOLD) {
      enemy.path.shift();
    } else {
      this.moveTowards(enemy, dx, dy, distance, dt, tileSize, dungeon, doorStates);
    }
  }

  /**
   * Move directly towards player (fallback when no path found)
   */
  private static moveDirectlyTowardsPlayer(
    enemy: Enemy,
    dt: number,
    player: Player,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    const dx = (player.x + tileSize / 2) - (enemy.x + tileSize / 2);
    const dy = (player.y + tileSize / 2) - (enemy.y + tileSize / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      this.moveTowards(enemy, dx, dy, distance, dt, tileSize, dungeon, doorStates);
    }
  }

  /**
   * Move enemy towards target with collision detection
   */
  private static moveTowards(
    enemy: Enemy,
    dx: number,
    dy: number,
    distance: number,
    dt: number,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    const speedMultiplier = enemy.getSpeedMultiplier();
    const speed = ENEMY_SPEED_TILES * tileSize * dt * speedMultiplier;
    const moveX = (dx / distance) * speed;
    const moveY = (dy / distance) * speed;

    const newX = enemy.x + moveX;
    const newY = enemy.y + moveY;

    if (!enemy.checkCollision(newX, enemy.y, tileSize, dungeon, doorStates)) {
      enemy.x = newX;
    }
    if (!enemy.checkCollision(enemy.x, newY, tileSize, dungeon, doorStates)) {
      enemy.y = newY;
    }

    enemy.direction = DirectionCalculator.calculateDirection(dx, dy);
  }

  /**
   * Pick a random floor tile in the enemy's room as waypoint
   */
  static pickRandomWaypoint(
    enemy: Enemy,
    rooms: Room[],
    dungeon: TileType[][],
    roomMap: number[][],
    tileSize: number
  ): void {
    const room = rooms[enemy.roomId];
    if (!room) return;

    const roomFloorTiles: { x: number; y: number }[] = [];
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < DUNGEON_HEIGHT && x >= 0 && x < DUNGEON_WIDTH) {
          if (dungeon[y][x] === TILE.FLOOR && roomMap[y][x] === enemy.roomId) {
            roomFloorTiles.push({ x: x * tileSize, y: y * tileSize });
          }
        }
      }
    }

    if (roomFloorTiles.length > 0) {
      enemy.waypoint = roomFloorTiles[Math.floor(Math.random() * roomFloorTiles.length)];
    }
  }
}
