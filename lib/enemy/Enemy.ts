/**
 * Enemy class - Data entity with basic operations
 *
 * AI logic is in EnemyAI.ts
 * Rendering logic is in EnemyRenderer.ts
 */
import { SpriteSheetLoader } from '../SpriteSheetLoader';
import {
  DIRECTION,
  ANIMATION,
  AI_STATE,
  ENEMY_AGGRO_RADIUS
} from '../constants';
import type { Direction, AIStateType, TileType, Room } from '../constants';
import { CollisionDetector } from '../physics/CollisionDetector';
import type { Player, EnemyUpdateContext } from './types';

export class Enemy {
  // Position and room
  x: number;
  y: number;
  roomId: number;

  // Sprite
  sprite: SpriteSheetLoader | null = null;
  spriteName: string;
  direction: Direction = DIRECTION.DOWN;
  isMoving: boolean = false;
  alive: boolean = true;

  // HP system
  hp: number;
  maxHp: number;

  // Level and subject
  level: number;
  subject: string;

  // AI state
  aiState: AIStateType = AI_STATE.IDLE;
  waypoint: { x: number; y: number } | null = null;
  idleTimer: number = 0;

  // Pathfinding
  path: { x: number; y: number }[] = [];
  pathUpdateTimer: number = 0;
  static readonly PATH_UPDATE_INTERVAL = 0.5;

  // Aggro reaction time
  aggroReactionTimer: number = 0;
  static readonly AGGRO_REACTION_TIME = 0.1;
  static readonly AGGRO_REACTION_TIME_DOOR = 2.0;

  // Dynamic aggro radius based on player ELO
  playerElo: number = 5;

  constructor(x: number, y: number, spriteName: string, roomId: number, level: number, subject: string) {
    this.x = x;
    this.y = y;
    this.roomId = roomId;
    this.spriteName = spriteName;
    this.level = level;
    this.subject = subject;

    // Dynamic HP based on level: 10 + level * 5
    this.hp = 10 + level * 5;
    this.maxHp = this.hp;
  }

  /**
   * Load sprite asynchronously
   */
  async load(): Promise<void> {
    this.sprite = new SpriteSheetLoader(this.spriteName);
    await this.sprite.load();
    this.sprite.playAnimation(this.direction, ANIMATION.IDLE);
  }

  /**
   * Calculate dynamic aggro radius based on player ELO vs enemy level
   */
  getAggroRadius(): number {
    const baseAggroRadius = ENEMY_AGGRO_RADIUS;
    const multiplier = 1 + (this.level - this.playerElo) / 10;
    return baseAggroRadius * multiplier;
  }

  /**
   * Calculate dynamic deaggro radius (2x aggro radius)
   */
  getDeaggroRadius(): number {
    return this.getAggroRadius() * 2;
  }

  /**
   * Get distance to player in tiles
   */
  getDistanceToPlayer(player: Player, tileSize: number): number {
    const dx = (player.x + tileSize / 2) - (this.x + tileSize / 2);
    const dy = (player.y + tileSize / 2) - (this.y + tileSize / 2);
    return Math.sqrt(dx * dx + dy * dy) / tileSize;
  }

  /**
   * Get speed multiplier based on level
   */
  getSpeedMultiplier(): number {
    return 1.0 + (this.level - 5) * 0.05;
  }

  /**
   * Take damage and die if HP reaches 0
   */
  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  /**
   * Mark enemy as dead and play death animation
   */
  die(): void {
    this.alive = false;
    this.aiState = AI_STATE.IDLE;
    if (this.sprite) {
      this.sprite.playAnimation(this.direction, ANIMATION.HURT);
      this.sprite.stopOnLastFrame = true;
    }
  }

  /**
   * Check collision with dungeon (respects door states)
   */
  checkCollision(x: number, y: number, tileSize: number, dungeon: TileType[][], doorStates: Map<string, boolean>): boolean {
    return CollisionDetector.checkEnemyCollision(x, y, tileSize, dungeon, doorStates);
  }

  /**
   * Update enemy AI and animation
   * Delegates to EnemyAI module
   */
  update(
    dt: number,
    player: Player,
    tileSize: number,
    rooms: Room[],
    dungeon: TileType[][],
    roomMap: number[][],
    onCombatStart: (enemy: Enemy) => void,
    inCombat: boolean,
    doorStates: Map<string, boolean>
  ): void {
    // Import dynamically to avoid circular dependency at module load time
    const { EnemyAI } = require('./EnemyAI');
    EnemyAI.update(this, {
      dt,
      player,
      tileSize,
      rooms,
      dungeon,
      roomMap,
      onCombatStart,
      inCombat,
      doorStates
    });
  }

  /**
   * Draw enemy sprite and status bar
   * Delegates to EnemyRenderer module
   */
  draw(ctx: CanvasRenderingContext2D, rooms: Room[], tileSize: number, player?: Player, playerRoomIds?: Set<number>): void {
    // Import dynamically to avoid circular dependency at module load time
    const { EnemyRenderer } = require('./EnemyRenderer');
    EnemyRenderer.draw(this, ctx, rooms, tileSize, player, playerRoomIds);
  }
}
