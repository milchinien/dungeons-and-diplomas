// Core game type definitions

export enum RoomType {
  ENTRANCE = 'ENTRANCE',
  COMBAT = 'COMBAT',
  BOSS = 'BOSS',
  TREASURE = 'TREASURE',
  SHOP = 'SHOP',
  EXIT = 'EXIT',
}

export enum GameScene {
  MAP = 'MAP',
  COMBAT = 'COMBAT',
  TREASURE = 'TREASURE',
  SHOP = 'SHOP',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
}

export enum CombatState {
  QUESTION_ACTIVE = 'QUESTION_ACTIVE',
  PLAYER_ATTACK = 'PLAYER_ATTACK',
  ENEMY_ATTACK = 'ENEMY_ATTACK',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export interface Room {
  id: string;
  type: RoomType;
  position: { x: number; y: number };
  connections: string[]; // IDs of connected rooms
  cleared: boolean;
}

export interface Enemy {
  id: string;
  name: string;
  maxHp: number;
  currentHp: number;
  damage: number;
  isBoss: boolean;
}

export interface Player {
  maxHp: number;
  currentHp: number;
  gold: number;
  inventory: Item[];
}

export interface MathQuestion {
  question: string;
  correctAnswer: number;
  options?: number[]; // Optional for multiple choice
}

export interface Floor {
  level: number;
  rooms: Room[];
  currentRoomId: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  effect: ItemEffect;
}

export enum ItemEffect {
  HEAL = 'HEAL',
  MAX_HP = 'MAX_HP',
  DAMAGE_BOOST = 'DAMAGE_BOOST',
  SHIELD = 'SHIELD',
}

export interface GameState {
  scene: GameScene;
  player: Player;
  currentFloor: Floor | null;
  currentEnemy: Enemy | null;
  currentQuestion: MathQuestion | null;
  combatState: CombatState;
}
