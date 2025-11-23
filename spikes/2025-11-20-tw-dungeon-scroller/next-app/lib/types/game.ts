/**
 * Game engine types used across game logic modules
 *
 * This file consolidates type definitions for game engine operations
 * to improve readability and testability (Parameter Object Pattern).
 */

import type { TileType, Room, KeyboardState } from '../constants';
import type { Player } from '../enemy';
import type { SpriteSheetLoader } from '../SpriteSheetLoader';
import type { Enemy } from '../enemy';

// ============================================================================
// Player Update Context
// ============================================================================

/**
 * Context object for updatePlayer method
 * Uses Parameter Object Pattern to reduce argument count and improve readability
 */
export interface UpdatePlayerContext {
  /** Delta time in seconds */
  dt: number;
  /** Player entity */
  player: Player;
  /** Current keyboard state */
  keys: KeyboardState;
  /** Size of a tile in pixels */
  tileSize: number;
  /** 2D dungeon grid */
  dungeon: TileType[][];
  /** Map of tile coordinates to room indices */
  roomMap: number[][];
  /** Array of all rooms */
  rooms: Room[];
  /** Player sprite loader (can be null during initialization) */
  playerSprite: SpriteSheetLoader | null;
  /** Whether combat is currently active */
  inCombat: boolean;
  /** Map of door positions to their open/closed state */
  doorStates: Map<string, boolean>;
  /** Array of all enemies */
  enemies: Enemy[];
  /** Optional set of treasure positions */
  treasures?: Set<string>;
  /** Optional callback when treasure is collected */
  onTreasureCollected?: (x: number, y: number) => void;
}

// ============================================================================
// Enemy Update Context
// ============================================================================

/**
 * Context object for updateEnemies method
 * Uses Parameter Object Pattern for consistency with UpdatePlayerContext
 */
export interface UpdateEnemiesContext {
  /** Delta time in seconds */
  dt: number;
  /** Array of all enemies */
  enemies: Enemy[];
  /** Player entity */
  player: Player;
  /** Size of a tile in pixels */
  tileSize: number;
  /** Array of all rooms */
  rooms: Room[];
  /** 2D dungeon grid */
  dungeon: TileType[][];
  /** Map of tile coordinates to room indices */
  roomMap: number[][];
  /** Callback to start combat with an enemy */
  startCombat: (enemy: Enemy) => void;
  /** Whether combat is currently active */
  inCombat: boolean;
  /** Map of door positions to their open/closed state */
  doorStates: Map<string, boolean>;
}
