/**
 * Types for the enemy module
 */
import type { Direction, TileType } from '../constants';

/**
 * Player interface - represents the player entity
 * Used by enemy AI for distance calculations and targeting
 */
export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: Direction;
  isMoving: boolean;
  hp: number;
  maxHp: number;
}

/**
 * Path coordinate returned by pathfinder
 */
export interface PathCoord {
  x: number;
  y: number;
}

/**
 * Pathfinder interface for dependency injection
 * Allows mocking in tests and swapping implementations
 */
export interface Pathfinder {
  findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): PathCoord[];
}

/**
 * Context for enemy AI update
 */
export interface EnemyUpdateContext {
  dt: number;
  player: Player;
  tileSize: number;
  rooms: import('../constants').Room[];
  dungeon: import('../constants').TileType[][];
  roomMap: number[][];
  onCombatStart: (enemy: import('./Enemy').Enemy) => void;
  inCombat: boolean;
  doorStates: Map<string, boolean>;
  /** Optional pathfinder - defaults to AStarPathfinder if not provided */
  pathfinder?: Pathfinder;
}
