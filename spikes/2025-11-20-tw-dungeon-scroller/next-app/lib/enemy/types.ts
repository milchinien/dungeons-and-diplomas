/**
 * Types for the enemy module
 */
import type { Direction } from '../constants';

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
}
