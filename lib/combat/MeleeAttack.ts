/**
 * Melee Attack System for Trashmobs
 *
 * Provides functions for calculating attack cone hits with a 75-degree angle.
 */

import type { Direction } from '../enums';
import {
  PLAYER_ATTACK_CONE_ANGLE,
  PLAYER_ATTACK_RANGE,
  PLAYER_ATTACK_DAMAGE
} from '../constants';

/**
 * Direction angles in radians for each cardinal direction
 */
const DIRECTION_ANGLES: Record<Direction, number> = {
  up: -Math.PI / 2,    // -90 degrees
  down: Math.PI / 2,   // 90 degrees
  left: Math.PI,       // 180 degrees
  right: 0             // 0 degrees
};

/**
 * Check if a target position is within the player's attack cone
 *
 * @param playerX - Player center X position
 * @param playerY - Player center Y position
 * @param playerDirection - Player facing direction OR attack angle in radians
 * @param targetX - Target center X position
 * @param targetY - Target center Y position
 * @param coneAngleDegrees - Attack cone angle in degrees (default: 75)
 * @returns true if target is within the attack cone
 */
export function isInAttackCone(
  playerX: number,
  playerY: number,
  playerDirection: Direction | number,
  targetX: number,
  targetY: number,
  coneAngleDegrees: number = PLAYER_ATTACK_CONE_ANGLE
): boolean {
  // Get player look direction as angle
  // If number is passed, use it directly as radians; otherwise look up from direction
  const lookAngle = typeof playerDirection === 'number'
    ? playerDirection
    : DIRECTION_ANGLES[playerDirection];

  // Calculate angle to target
  const dx = targetX - playerX;
  const dy = targetY - playerY;
  const angleToTarget = Math.atan2(dy, dx);

  // Calculate difference (normalized to -PI to PI)
  let diff = angleToTarget - lookAngle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;

  // Half cone angle in radians
  const halfCone = (coneAngleDegrees / 2) * (Math.PI / 180);

  return Math.abs(diff) <= halfCone;
}

/**
 * Calculate distance between two points in pixels
 */
export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Interface for entities that can be targeted by melee attacks
 */
export interface MeleeTarget {
  x: number;
  y: number;
  alive: boolean;
}

/**
 * Get all targets within attack range and cone
 *
 * @param playerX - Player X position (top-left)
 * @param playerY - Player Y position (top-left)
 * @param attackDirection - Player facing direction OR attack angle in radians
 * @param targets - Array of potential targets
 * @param tileSize - Tile size in pixels
 * @param attackRangeTiles - Attack range in tiles (default: 1.5)
 * @param coneAngle - Attack cone angle in degrees (default: 75)
 * @returns Array of targets within attack range and cone
 */
export function getTargetsInAttackCone<T extends MeleeTarget>(
  playerX: number,
  playerY: number,
  attackDirection: Direction | number,
  targets: T[],
  tileSize: number,
  attackRangeTiles: number = PLAYER_ATTACK_RANGE,
  coneAngle: number = PLAYER_ATTACK_CONE_ANGLE
): T[] {
  const playerCenterX = playerX + tileSize / 2;
  const playerCenterY = playerY + tileSize / 2;
  const attackRangePx = attackRangeTiles * tileSize;

  return targets.filter(target => {
    if (!target.alive) return false;

    const targetCenterX = target.x + tileSize / 2;
    const targetCenterY = target.y + tileSize / 2;

    // Distance check
    const distance = getDistance(playerCenterX, playerCenterY, targetCenterX, targetCenterY);
    if (distance > attackRangePx) return false;

    // Angle check
    return isInAttackCone(
      playerCenterX, playerCenterY,
      attackDirection,
      targetCenterX, targetCenterY,
      coneAngle
    );
  });
}

/**
 * Player attack state for tracking cooldown and animation
 */
export interface PlayerAttackState {
  isAttacking: boolean;
  cooldownRemaining: number;
  attackTimeRemaining: number;
}

/**
 * Create initial attack state
 */
export function createAttackState(): PlayerAttackState {
  return {
    isAttacking: false,
    cooldownRemaining: 0,
    attackTimeRemaining: 0
  };
}

/**
 * Check if player can attack (not on cooldown)
 */
export function canAttack(state: PlayerAttackState): boolean {
  return state.cooldownRemaining <= 0;
}

/**
 * Get attack damage value
 */
export function getAttackDamage(): number {
  return PLAYER_ATTACK_DAMAGE;
}

/**
 * Convert an angle in radians to the closest cardinal Direction
 *
 * @param angle - Angle in radians (0 = right, PI/2 = down, PI = left, -PI/2 = up)
 * @returns The closest cardinal Direction
 */
export function angleToDirection(angle: number): Direction {
  // Normalize angle to 0 to 2*PI
  let normalized = angle;
  while (normalized < 0) normalized += 2 * Math.PI;
  while (normalized >= 2 * Math.PI) normalized -= 2 * Math.PI;

  // Divide into 4 quadrants (each 90 degrees / PI/2 radians)
  // Right: -PI/4 to PI/4 (or 7PI/4 to 2PI and 0 to PI/4)
  // Down: PI/4 to 3PI/4
  // Left: 3PI/4 to 5PI/4
  // Up: 5PI/4 to 7PI/4

  if (normalized < Math.PI / 4 || normalized >= 7 * Math.PI / 4) {
    return 'right';
  } else if (normalized < 3 * Math.PI / 4) {
    return 'down';
  } else if (normalized < 5 * Math.PI / 4) {
    return 'left';
  } else {
    return 'up';
  }
}
