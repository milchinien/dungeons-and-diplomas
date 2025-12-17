// =============================================================================
// Re-exports from extracted modules (for backwards compatibility)
// =============================================================================
export {
  TILE,
  DIRECTION,
  DIRECTION_OFFSETS,
  ANIMATION,
  AI_STATE,
  DUNGEON_ALGORITHM,
  type Direction,
  type AnimationType,
  type TileType,
  type AIStateType,
  type DungeonAlgorithm
} from './enums';

export {
  ANIM_SPEEDS,
  SPRITESHEET_CONFIGS,
  TILE_SOURCE_SIZE,
  TILESET_COORDS,
  WALL_VARIANTS,
  FLOOR_VARIANTS
} from './spriteConfig';

// =============================================================================
// Game constants (defaults)
// =============================================================================
export const DUNGEON_WIDTH = 100;
export const DUNGEON_HEIGHT = 100;
export const MIN_ROOM_SIZE = 4;
export const MAX_ROOM_SIZE = 8;

// Configuration for dungeon generation
export interface DungeonConfig {
  width: number;
  height: number;
  algorithm: import('./enums').DungeonAlgorithm;
  minRoomSize?: number;
  maxRoomSize?: number;
}

// Default dungeon configuration
import { DUNGEON_ALGORITHM as ALGO } from './enums';
export const DEFAULT_DUNGEON_CONFIG: DungeonConfig = {
  width: DUNGEON_WIDTH,
  height: DUNGEON_HEIGHT,
  algorithm: ALGO.BSP,
  minRoomSize: MIN_ROOM_SIZE,
  maxRoomSize: MAX_ROOM_SIZE,
};

// Keyboard state interface
export interface KeyboardState {
  ArrowUp: boolean;
  ArrowDown: boolean;
  ArrowLeft: boolean;
  ArrowRight: boolean;
  w: boolean;
  s: boolean;
  a: boolean;
  d: boolean;
  ' ': boolean; // Space key for door interaction
}

// =============================================================================
// Player constants
// =============================================================================
export const PLAYER_SPEED_TILES = 6; // tiles per second
export const PLAYER_SIZE = 0.5; // relative to tile size (smaller for better tolerance)

// =============================================================================
// Enemy constants
// =============================================================================
export const ENEMY_SPEED_TILES = 3; // tiles per second (slower than player)
export const ENEMY_AGGRO_RADIUS = 3; // tiles
export const ENEMY_DEAGGRO_RADIUS = 6; // tiles (2x aggro radius)
export const ENEMY_IDLE_WAIT_TIME = 2; // seconds to wait at waypoint
export const ENEMY_WAYPOINT_THRESHOLD = 5; // pixels - distance to consider waypoint reached

// =============================================================================
// Combat constants
// =============================================================================
export const PLAYER_MAX_HP = 100;
export const GOBLIN_MAX_HP = 30;
export const COMBAT_TIME_LIMIT = 10; // seconds per question
export const DAMAGE_CORRECT = 10; // damage to enemy on correct answer
export const DAMAGE_WRONG = 15; // damage to player on wrong answer
export const COMBAT_TRIGGER_DISTANCE = 0.5; // tiles - distance to trigger combat
export const COMBAT_FEEDBACK_DELAY = 1500; // milliseconds - delay before next question or ending combat

// =============================================================================
// Shrine constants
// =============================================================================
export const SHRINE_SPAWN_CHANCE = 0.10; // 10% chance per eligible room
export const SHRINE_INTERACTION_RADIUS = 1.5; // tiles - distance to interact
export const SHRINE_MIN_ROOM_SIZE = 5; // minimum room size for shrine
export const SHRINE_ENEMY_SPAWN_RADIUS = 2.0; // tiles from shrine center
export const SHRINE_MIN_ENEMIES = 1;
export const SHRINE_MAX_ENEMIES = 2;
export const SHRINE_HITBOX_SIZE = 0.7; // tiles - smaller hitbox for collision
export const SHRINE_RENDER_SIZE = 1.0; // tiles - visual size of shrine
export const SHRINE_MIN_PLAYER_DISTANCE = 1.5; // minimum distance from player for enemy spawn

// =============================================================================
// Melee Attack constants (for Trashmobs)
// =============================================================================
export const PLAYER_ATTACK_CONE_ANGLE = 75; // degrees
export const PLAYER_ATTACK_RANGE = 1.5; // tiles
export const PLAYER_ATTACK_COOLDOWN = 0.4; // seconds
export const PLAYER_ATTACK_SLOWDOWN = 0.5; // 50% speed during attack
export const PLAYER_ATTACK_DURATION = 0.3; // seconds (attack animation)
export const PLAYER_ATTACK_DAMAGE = 1; // damage per hit

// =============================================================================
// Trashmob constants
// =============================================================================
export const TRASHMOB_CONTACT_DAMAGE_MIN = 3;
export const TRASHMOB_CONTACT_DAMAGE_MAX = 4;
export const TRASHMOB_INVULNERABILITY_TIME = 1.0; // seconds after taking damage
export const TRASHMOB_SPEED_TILES = 2; // slower than regular enemies

export const TRASHMOB_TYPE = {
  RAT: 'rat',
  SLIME: 'slime',
  BAT: 'bat'
} as const;

export type TrashmobType = typeof TRASHMOB_TYPE[keyof typeof TRASHMOB_TYPE];

export const TRASHMOB_HP: Record<TrashmobType, number> = {
  rat: 2,
  slime: 3,
  bat: 1
};

export const TRASHMOB_COLORS: Record<TrashmobType, string> = {
  rat: '#8B4513',    // Brown
  slime: '#32CD32',  // Green
  bat: '#4B0082'     // Purple
};

// =============================================================================
// Type definitions
// =============================================================================

// Room types including shrine
export type RoomType = 'empty' | 'treasure' | 'combat' | 'shrine';

// Room exploration states
export type RoomState = 'unexplored' | 'exploring' | 'explored';

export interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  neighbors: number[];
  type: RoomType;
  state: RoomState;
}

export interface TileCoord {
  x: number;
  y: number;
}

export interface TileVariant {
  floor: TileCoord;
  wall: TileCoord;
}

// =============================================================================
// Shrine types
// =============================================================================
export interface Shrine {
  id: number;
  x: number; // tile position X (center)
  y: number; // tile position Y (center)
  roomId: number;
  isActivated: boolean; // already used (cannot be used again)
  isActive: boolean; // currently in use (combat in progress)
  spawnedEnemies: number[]; // IDs of spawned enemies
  defeatedEnemies: number[]; // IDs of defeated enemies
}

// =============================================================================
// Buff types
// =============================================================================
export type BuffType =
  | 'hp_boost'
  | 'shield'
  | 'time_bonus'
  | 'damage_boost'
  | 'damage_reduction'
  | 'regen';

export interface Buff {
  type: BuffType;
  name: string;
  description: string;
  icon: string;
  value?: number;
  maxShield?: number;
  regenRate?: number;
  hpPerTick?: number;
  tickInterval?: number;
}

export interface PlayerBuffs {
  // HP system
  maxHpBonus: number;

  // Shield system
  hasShield: boolean;
  maxShield: number;
  currentShield: number;
  shieldRegenRate: number;

  // Combat modifiers
  timeBonus: number; // extra seconds for quiz
  damageBoost: number; // extra damage on correct answer
  damageReduction: number; // reduced damage on wrong answer

  // Regeneration
  regenRate: number; // HP per tick
  regenInterval: number; // seconds between ticks

  // Tracking
  activeBuffs: BuffType[];
}

// Initial player buffs state
export const INITIAL_PLAYER_BUFFS: PlayerBuffs = {
  maxHpBonus: 0,
  hasShield: false,
  maxShield: 0,
  currentShield: 0,
  shieldRegenRate: 0,
  timeBonus: 0,
  damageBoost: 0,
  damageReduction: 0,
  regenRate: 0,
  regenInterval: 3,
  activeBuffs: [],
};

// Buff pool - all available buffs
export const BUFF_POOL: Buff[] = [
  {
    type: 'hp_boost',
    name: 'Vitalität',
    description: '+25 Maximale HP',
    icon: '❤️',
    value: 25,
  },
  {
    type: 'shield',
    name: 'Schutzschild',
    description: '20 Schild-HP, regeneriert 2/s',
    icon: '🛡️',
    maxShield: 20,
    regenRate: 2,
  },
  {
    type: 'time_bonus',
    name: 'Zeitdehnung',
    description: '+5 Sekunden Antwortzeit',
    icon: '⏱️',
    value: 5,
  },
  {
    type: 'damage_boost',
    name: 'Macht',
    description: '+5 Schaden bei richtiger Antwort',
    icon: '⚔️',
    value: 5,
  },
  {
    type: 'damage_reduction',
    name: 'Widerstand',
    description: '-3 Schaden bei falscher Antwort',
    icon: '🛡️',
    value: 3,
  },
  {
    type: 'regen',
    name: 'Heilung',
    description: 'Regeneriere 1 HP alle 3 Sekunden',
    icon: '💚',
    hpPerTick: 1,
    tickInterval: 3,
  },
];
