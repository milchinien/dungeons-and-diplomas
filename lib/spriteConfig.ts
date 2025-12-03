/**
 * Sprite and animation configuration.
 * Extracted from constants.ts for better organization.
 */

// Animation speeds (seconds per frame)
export const ANIM_SPEEDS = {
  run: 0.08,      // Fast for running
  walk: 0.12,     // Normal walking
  idle: 0.3,      // Slow for idle
  combat: 0.1,    // Medium for combat animations
  default: 0.12   // Default fallback
};

// Animation definition for spritesheets
export interface AnimationDefinition {
  name: string;
  firstrow: number;
  rowcount: number;
  animcount: number;
}

// Spritesheet configuration
export interface SpritesheetConfig {
  frameWidth: number;
  frameHeight: number;
  animations: AnimationDefinition[];
}

// Standard animation set (shared by player and goblin)
const STANDARD_ANIMATIONS: AnimationDefinition[] = [
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
];

// Skeleton animations - uses spellcast row for idle (has full body)
const SKELETON_ANIMATIONS: AnimationDefinition[] = [
  { name: 'spellcast', firstrow: 0, rowcount: 4, animcount: 7 },
  { name: 'thrust', firstrow: 4, rowcount: 4, animcount: 8 },
  { name: 'walk', firstrow: 8, rowcount: 4, animcount: 9 },
  { name: 'slash', firstrow: 12, rowcount: 4, animcount: 6 },
  { name: 'shoot', firstrow: 16, rowcount: 4, animcount: 13 },
  { name: 'hurt', firstrow: 20, rowcount: 1, animcount: 6 },
  { name: 'climb', firstrow: 21, rowcount: 1, animcount: 6 },
  { name: 'idle', firstrow: 0, rowcount: 4, animcount: 1 }, // Use spellcast first frame as idle
  { name: 'jump', firstrow: 26, rowcount: 4, animcount: 6 },
  { name: 'sit', firstrow: 30, rowcount: 4, animcount: 15 },
  { name: 'emote', firstrow: 34, rowcount: 4, animcount: 15 },
  { name: 'run', firstrow: 8, rowcount: 4, animcount: 9 }, // Use walk as run (has full body)
  { name: 'watering', firstrow: 42, rowcount: 4, animcount: 7 },
  { name: 'combat', firstrow: 46, rowcount: 4, animcount: 3 }
];

// Spritesheet configurations (embedded to avoid CORS issues with file://)
export const SPRITESHEET_CONFIGS: Record<string, SpritesheetConfig> = {
  player: {
    frameWidth: 64,
    frameHeight: 64,
    animations: STANDARD_ANIMATIONS
  },
  goblin: {
    frameWidth: 64,
    frameHeight: 64,
    animations: STANDARD_ANIMATIONS
  },
  skeleton: {
    frameWidth: 64,
    frameHeight: 64,
    animations: SKELETON_ANIMATIONS
  }
};

// Tileset configuration
export const TILE_SOURCE_SIZE = 64;

// Tile coordinates in the tileset (column, row)
export const TILESET_COORDS = {
  FLOOR: { x: 0, y: 1 },
  WALL_TOP: { x: 0, y: 0 },
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
  { x: 0, y: 0, weight: 20 },
  { x: 1, y: 0, weight: 15 },
  { x: 2, y: 0, weight: 15 },
  { x: 3, y: 0, weight: 15 },
  { x: 3, y: 11, weight: 1 }
];

export const FLOOR_VARIANTS = [
  { x: 0, y: 1, weight: 200 },
  { x: 1, y: 1, weight: 50 },
  { x: 2, y: 1, weight: 30 },
  { x: 2, y: 11, weight: 2 },
  { x: 19, y: 8, weight: 1 }
];

// Available enemy types for spawning
export const ENEMY_TYPES = ['goblin', 'skeleton'] as const;
export type EnemyType = typeof ENEMY_TYPES[number];
