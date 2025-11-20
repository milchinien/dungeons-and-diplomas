// Game constants
export const DUNGEON_WIDTH = 100;
export const DUNGEON_HEIGHT = 100;
export const MIN_ROOM_SIZE = 4;
export const MAX_ROOM_SIZE = 8;

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

// Player constants
export const PLAYER_SPEED_TILES = 6; // tiles per second
export const PLAYER_SIZE = 0.5; // relative to tile size (smaller for better tolerance)

// Enemy constants
export const ENEMY_SPEED_TILES = 3; // tiles per second (slower than player)
export const ENEMY_AGGRO_RADIUS = 3; // tiles
export const ENEMY_DEAGGRO_RADIUS = 6; // tiles (2x aggro radius)
export const ENEMY_IDLE_WAIT_TIME = 2; // seconds to wait at waypoint

// Combat constants
export const PLAYER_MAX_HP = 100;
export const GOBLIN_MAX_HP = 30;
export const COMBAT_TIME_LIMIT = 10; // seconds per question
export const DAMAGE_CORRECT = 10; // damage to enemy on correct answer
export const DAMAGE_WRONG = 15; // damage to player on wrong answer

// AI States
export const AI_STATE = {
  IDLE: 'idle',
  WANDERING: 'wandering',
  FOLLOWING: 'following'
} as const;

// Animation speeds (seconds per frame)
export const ANIM_SPEEDS = {
  run: 0.08,      // Fast for running
  walk: 0.12,     // Normal walking
  idle: 0.3,      // Slow for idle
  combat: 0.1,    // Medium for combat animations
  default: 0.12   // Default fallback
};

// Spritesheet configurations (embedded to avoid CORS issues with file://)
export const SPRITESHEET_CONFIGS = {
  player: {
    frameWidth: 64,
    frameHeight: 64,
    animations: [
      { name: 'spellcast', firstrow: 0, rowcount: 4, animcount: 7 },
      { name: 'thrust', firstrow: 4, rowcount: 4, animcount: 8 },
      { name: 'walk', firstrow: 8, rowcount: 4, animcount: 9 },
      { name: 'slash', firstrow: 12, rowcount: 4, animcount: 6 },
      { name: 'shoot', firstrow: 16, rowcount: 4, animcount: 13 },
      { name: 'hurt', firstrow: 20, rowcount: 1, animcount: 6 },
      { name: 'climb', firstrow: 21, rowcount: 1, animcount: 6 },
      { name: 'idle', firstrow: 22, rowcount: 4, animcount: 2 },
      { name: 'jump', firstrow: 26, rowcount: 4, animcount: 6 },
      { name: 'sit', firstrow: 30, rowcount: 4, animcount: 15 },
      { name: 'emote', firstrow: 34, rowcount: 4, animcount: 15 },
      { name: 'run', firstrow: 38, rowcount: 4, animcount: 8 },
      { name: 'watering', firstrow: 42, rowcount: 4, animcount: 7 },
      { name: 'combat', firstrow: 46, rowcount: 4, animcount: 3 }
    ]
  },
  goblin: {
    frameWidth: 64,
    frameHeight: 64,
    animations: [
      { name: 'spellcast', firstrow: 0, rowcount: 4, animcount: 7 },
      { name: 'thrust', firstrow: 4, rowcount: 4, animcount: 8 },
      { name: 'walk', firstrow: 8, rowcount: 4, animcount: 9 },
      { name: 'slash', firstrow: 12, rowcount: 4, animcount: 6 },
      { name: 'shoot', firstrow: 16, rowcount: 4, animcount: 13 },
      { name: 'hurt', firstrow: 20, rowcount: 1, animcount: 6 },
      { name: 'climb', firstrow: 21, rowcount: 1, animcount: 6 },
      { name: 'idle', firstrow: 22, rowcount: 4, animcount: 2 },
      { name: 'jump', firstrow: 26, rowcount: 4, animcount: 6 },
      { name: 'sit', firstrow: 30, rowcount: 4, animcount: 15 },
      { name: 'emote', firstrow: 34, rowcount: 4, animcount: 15 },
      { name: 'run', firstrow: 38, rowcount: 4, animcount: 8 },
      { name: 'watering', firstrow: 42, rowcount: 4, animcount: 7 },
      { name: 'combat', firstrow: 46, rowcount: 4, animcount: 3 }
    ]
  }
};

// Tileset configuration (64x64 tiles)
export const TILE_SOURCE_SIZE = 64;

// Tile coordinates in the tileset (column, row) - based on matrix
export const TILESET_COORDS = {
  FLOOR: { x: 0, y: 1 },  // Default floor tile
  WALL_TOP: { x: 0, y: 0 },  // Default wall
  WALL_BOTTOM: { x: 0, y: 0 },
  WALL_LEFT: { x: 0, y: 0 },
  WALL_RIGHT: { x: 0, y: 0 },
  WALL_HORIZONTAL: { x: 0, y: 0 },
  WALL_VERTICAL: { x: 0, y: 0 },
  CORNER_TL: { x: 0, y: 0 },
  CORNER_TR: { x: 0, y: 0 },
  CORNER_BL: { x: 0, y: 0 },
  CORNER_BR: { x: 0, y: 0 },
  DOOR_VERTICAL: { x: 8, y: 0 },
  DOOR_HORIZONTAL: { x: 13, y: 0 }
};

// Tile variants for random variation with probability weights
export const WALL_VARIANTS = [
  { x: 0, y: 0, weight: 20 },    // Common
  { x: 1, y: 0, weight: 15 },    // Common
  { x: 2, y: 0, weight: 15 },    // Common
  { x: 3, y: 0, weight: 15 },    // Less common
  { x: 3, y: 11, weight: 1 }    // Rare
];

export const FLOOR_VARIANTS = [
  { x: 0, y: 1, weight: 200 },   // Very common (main floor tile)
  { x: 1, y: 1, weight: 50 },    // Common
  { x: 2, y: 1, weight: 30 },    // Less common
  { x: 2, y: 11, weight: 2 },   // Rare
  { x: 19, y: 8, weight: 1 }    // Rare (special tile)
];

// Types
export type Direction = typeof DIRECTION[keyof typeof DIRECTION];
export type AnimationType = typeof ANIMATION[keyof typeof ANIMATION];
export type TileType = typeof TILE[keyof typeof TILE];
export type AIStateType = typeof AI_STATE[keyof typeof AI_STATE];

export interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  neighbors: number[];
  type: 'empty' | 'treasure' | 'combat';
}

export interface TileCoord {
  x: number;
  y: number;
}

export interface TileVariant {
  floor: TileCoord;
  wall: TileCoord;
}
