/**
 * Enemy Movement Module
 *
 * Handles all movement-related logic for enemies:
 * - Direct movement towards targets with collision detection
 * - A* path following
 * - Direct player targeting (fallback when no path found)
 */
import { ENEMY_SPEED_TILES, ENEMY_WAYPOINT_THRESHOLD } from '../constants';
import type { TileType } from '../constants';
import { DirectionCalculator } from '../movement/DirectionCalculator';
import type { Enemy } from './Enemy';
import type { Player } from './types';

/**
 * Move enemy towards target with collision detection
 */
export function moveTowards(
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
 * Follow calculated A* path
 */
export function followPath(
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
    moveTowards(enemy, dx, dy, distance, dt, tileSize, dungeon, doorStates);
  }
}

/**
 * Move directly towards player (fallback when no path found)
 */
export function moveDirectlyTowardsPlayer(
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
    moveTowards(enemy, dx, dy, distance, dt, tileSize, dungeon, doorStates);
  }
}
