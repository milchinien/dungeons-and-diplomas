/**
 * Enum-like constants for type-safe game values.
 * Extracted from constants.ts for better organization.
 */

// Tile types
export const TILE = {
  EMPTY: 0,
  FLOOR: 1,
  WALL: 2,
  DOOR: 3,
  CORNER: 4
} as const;

// Direction constants
export const DIRECTION = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right'
} as const;

// Direction offsets for adjacent tile checks (4 cardinal directions)
export const DIRECTION_OFFSETS = [
  { dx: 0, dy: -1 }, // up
  { dx: 0, dy: 1 },  // down
  { dx: -1, dy: 0 }, // left
  { dx: 1, dy: 0 }   // right
] as const;

// Animation constants
export const ANIMATION = {
  SPELLCAST: 'spellcast',
  THRUST: 'thrust',
  WALK: 'walk',
  SLASH: 'slash',
  SHOOT: 'shoot',
  HURT: 'hurt',
  CLIMB: 'climb',
  IDLE: 'idle',
  JUMP: 'jump',
  SIT: 'sit',
  EMOTE: 'emote',
  RUN: 'run',
  WATERING: 'watering',
  COMBAT: 'combat'
} as const;

// AI States
export const AI_STATE = {
  IDLE: 'idle',
  WANDERING: 'wandering',
  FOLLOWING: 'following'
} as const;

// Dungeon generation algorithms
export const DUNGEON_ALGORITHM = {
  BSP: 1,           // Binary Space Partitioning (current implementation)
  // Future algorithms:
  // CELLULAR: 2,   // Cellular Automata
  // DRUNKARD: 3,   // Drunkard's Walk
  // ROOM_PLACEMENT: 4, // Random room placement with corridors
} as const;

// Derived types
export type Direction = typeof DIRECTION[keyof typeof DIRECTION];
export type AnimationType = typeof ANIMATION[keyof typeof ANIMATION];
export type TileType = typeof TILE[keyof typeof TILE];
export type AIStateType = typeof AI_STATE[keyof typeof AI_STATE];
export type DungeonAlgorithm = typeof DUNGEON_ALGORITHM[keyof typeof DUNGEON_ALGORITHM];
