/**
 * Trashmob class - Small enemies that can be killed with melee attacks (no quiz)
 *
 * Trashmobs are weaker enemies that deal contact damage to the player.
 * They are rendered as colored circles until proper sprites are added.
 */

import {
  TRASHMOB_TYPE,
  TRASHMOB_HP,
  TRASHMOB_COLORS,
  TRASHMOB_SPEED_TILES,
  TRASHMOB_CONTACT_DAMAGE_MIN,
  TRASHMOB_CONTACT_DAMAGE_MAX,
  TRASHMOB_INVULNERABILITY_TIME,
  AI_STATE,
  DIRECTION
} from '../constants';
import type { TrashmobType, Direction, AIStateType, TileType, Room } from '../constants';
import { CollisionDetector } from '../physics/CollisionDetector';
import { TrashmobSpriteRenderer } from '../rendering/TrashmobSprites';
import type { Player } from './types';

export class Trashmob {
  // Position
  x: number;
  y: number;
  roomId: number;

  // Type and stats
  type: TrashmobType;
  hp: number;
  maxHp: number;
  alive: boolean = true;

  // Movement
  direction: Direction = DIRECTION.DOWN;
  isMoving: boolean = false;

  // AI state
  aiState: AIStateType = AI_STATE.IDLE;
  waypoint: { x: number; y: number } | null = null;
  idleTimer: number = 0;
  static readonly IDLE_WAIT_TIME = 1.5; // seconds

  // Aggro settings
  static readonly AGGRO_RADIUS = 4; // tiles - start chasing player
  static readonly DEAGGRO_RADIUS = 8; // tiles - stop chasing
  static readonly ATTACK_RADIUS = 0.6; // tiles - close enough to attack

  // Sprite renderer for pixel-art animation
  private spriteRenderer: TrashmobSpriteRenderer;

  constructor(x: number, y: number, type: TrashmobType, roomId: number) {
    // Initialize sprite renderer with random offset for varied animation
    this.spriteRenderer = new TrashmobSpriteRenderer();
    this.spriteRenderer.setAnimationTime(Math.random() * 10);
    this.x = x;
    this.y = y;
    this.type = type;
    this.roomId = roomId;

    // Set HP based on type
    this.hp = TRASHMOB_HP[type];
    this.maxHp = this.hp;
  }

  /**
   * Get movement speed in tiles per second
   */
  getSpeed(): number {
    // Bats are faster, slimes are slower
    switch (this.type) {
      case TRASHMOB_TYPE.BAT:
        return TRASHMOB_SPEED_TILES * 1.5;
      case TRASHMOB_TYPE.SLIME:
        return TRASHMOB_SPEED_TILES * 0.6;
      case TRASHMOB_TYPE.RAT:
      default:
        return TRASHMOB_SPEED_TILES;
    }
  }

  /**
   * Get contact damage (random between min and max)
   */
  getContactDamage(): number {
    return Math.floor(
      Math.random() * (TRASHMOB_CONTACT_DAMAGE_MAX - TRASHMOB_CONTACT_DAMAGE_MIN + 1)
    ) + TRASHMOB_CONTACT_DAMAGE_MIN;
  }

  /**
   * Take damage from player attack
   */
  takeDamage(amount: number): void {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
  }

  /**
   * Mark as dead
   */
  die(): void {
    this.alive = false;
    this.aiState = AI_STATE.IDLE;
    this.isMoving = false;
  }

  /**
   * Check collision with dungeon
   */
  checkCollision(
    x: number,
    y: number,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): boolean {
    return CollisionDetector.checkEnemyCollision(x, y, tileSize, dungeon, doorStates);
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
   * Update trashmob AI and movement
   */
  update(
    dt: number,
    player: Player,
    tileSize: number,
    rooms: Room[],
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    if (!this.alive) return;

    const room = rooms[this.roomId];
    if (!room) {
      console.warn(`Trashmob has invalid roomId: ${this.roomId}, rooms.length: ${rooms.length}`);
      return;
    }

    // Check distance to player for aggro
    const distanceToPlayer = this.getDistanceToPlayer(player, tileSize);

    // State transitions based on distance
    if (this.aiState !== AI_STATE.FOLLOWING) {
      // Start following if player is close
      if (distanceToPlayer <= Trashmob.AGGRO_RADIUS) {
        this.aiState = AI_STATE.FOLLOWING;
      }
    } else {
      // Stop following if player is too far
      if (distanceToPlayer > Trashmob.DEAGGRO_RADIUS) {
        this.aiState = AI_STATE.IDLE;
        this.idleTimer = 0;
      }
    }

    switch (this.aiState) {
      case AI_STATE.IDLE:
        this.updateIdle(dt, room, tileSize);
        break;
      case AI_STATE.WANDERING:
        this.updateWandering(dt, tileSize, dungeon, doorStates);
        // Also check for aggro while wandering
        if (distanceToPlayer <= Trashmob.AGGRO_RADIUS) {
          this.aiState = AI_STATE.FOLLOWING;
        }
        break;
      case AI_STATE.FOLLOWING:
        this.updateFollowing(dt, player, tileSize, dungeon, doorStates);
        break;
    }
  }

  /**
   * Update idle state - wait then pick new waypoint
   */
  private updateIdle(dt: number, room: Room, tileSize: number): void {
    this.isMoving = false;
    this.idleTimer += dt;

    if (this.idleTimer >= Trashmob.IDLE_WAIT_TIME) {
      this.idleTimer = 0;
      this.pickNewWaypoint(room, tileSize);
      this.aiState = AI_STATE.WANDERING;
    }
  }

  /**
   * Update wandering state - move toward waypoint
   */
  private updateWandering(
    dt: number,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    if (!this.waypoint) {
      this.aiState = AI_STATE.IDLE;
      return;
    }

    const speed = this.getSpeed() * tileSize;
    const dx = this.waypoint.x - this.x;
    const dy = this.waypoint.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Reached waypoint?
    if (distance < 5) {
      this.waypoint = null;
      this.aiState = AI_STATE.IDLE;
      this.isMoving = false;
      return;
    }

    // Move toward waypoint
    const moveX = (dx / distance) * speed * dt;
    const moveY = (dy / distance) * speed * dt;

    // Update direction based on movement
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }

    // Try to move
    const newX = this.x + moveX;
    const newY = this.y + moveY;

    if (!this.checkCollision(newX, newY, tileSize, dungeon, doorStates)) {
      this.x = newX;
      this.y = newY;
      this.isMoving = true;
    } else {
      // Blocked - pick new waypoint
      this.waypoint = null;
      this.aiState = AI_STATE.IDLE;
      this.isMoving = false;
    }
  }

  /**
   * Update following state - chase the player
   */
  private updateFollowing(
    dt: number,
    player: Player,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    // Move faster when chasing (1.5x speed)
    const speed = this.getSpeed() * tileSize * 1.5;

    // Calculate direction to player
    const playerCenterX = player.x + tileSize / 2;
    const playerCenterY = player.y + tileSize / 2;
    const myCenterX = this.x + tileSize / 2;
    const myCenterY = this.y + tileSize / 2;

    const dx = playerCenterX - myCenterX;
    const dy = playerCenterY - myCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Already at attack range? Stop moving
    if (distance < Trashmob.ATTACK_RADIUS * tileSize) {
      this.isMoving = false;
      return;
    }

    // Move toward player
    const moveX = (dx / distance) * speed * dt;
    const moveY = (dy / distance) * speed * dt;

    // Update direction based on movement
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }

    // Try to move (try X and Y separately for sliding along walls)
    const newX = this.x + moveX;
    const newY = this.y + moveY;

    let moved = false;
    if (!this.checkCollision(newX, this.y, tileSize, dungeon, doorStates)) {
      this.x = newX;
      moved = true;
    }
    if (!this.checkCollision(this.x, newY, tileSize, dungeon, doorStates)) {
      this.y = newY;
      moved = true;
    }

    this.isMoving = moved;
  }

  /**
   * Pick a random waypoint within the room
   */
  private pickNewWaypoint(room: Room, tileSize: number): void {
    const padding = 1; // Stay 1 tile away from walls
    const minX = (room.x + padding) * tileSize;
    const maxX = (room.x + room.width - padding - 1) * tileSize;
    const minY = (room.y + padding) * tileSize;
    const maxY = (room.y + room.height - padding - 1) * tileSize;

    this.waypoint = {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY)
    };
  }

  /**
   * Draw trashmob with pixel-art sprite animation
   * Note: ctx is already translated by camera, so use world coordinates directly
   */
  draw(ctx: CanvasRenderingContext2D, tileSize: number, dt: number = 0.016): void {
    if (!this.alive) return;

    // Update sprite animation
    this.spriteRenderer.update(dt);

    const spriteSize = tileSize * 0.8; // Sprite size relative to tile
    const offsetX = (tileSize - spriteSize) / 2;
    const offsetY = (tileSize - spriteSize) / 2;

    // Draw pixel-art sprite
    this.spriteRenderer.draw(
      ctx,
      this.type,
      this.x + offsetX,
      this.y + offsetY,
      spriteSize,
      this.isMoving,
      this.direction
    );

    // Draw aggro indicator when following
    if (this.aiState === AI_STATE.FOLLOWING) {
      const centerX = this.x + tileSize / 2;
      const centerY = this.y + tileSize / 2;
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, spriteSize / 2 + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw HP bar above sprite
    const centerX = this.x + tileSize / 2;
    this.drawHpBar(ctx, centerX, this.y - 6, spriteSize);
  }

  /**
   * Draw small HP bar above trashmob
   */
  private drawHpBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    const barHeight = 4;
    const hpPercent = this.hp / this.maxHp;

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(x - width / 2, y, width, barHeight);

    // HP fill
    ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
    ctx.fillRect(x - width / 2, y, width * hpPercent, barHeight);

    // Border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - width / 2, y, width, barHeight);
  }
}

/**
 * Create a random trashmob at position
 */
export function createRandomTrashmob(x: number, y: number, roomId: number): Trashmob {
  const types: TrashmobType[] = [TRASHMOB_TYPE.RAT, TRASHMOB_TYPE.SLIME, TRASHMOB_TYPE.BAT];
  const randomType = types[Math.floor(Math.random() * types.length)];
  return new Trashmob(x, y, randomType, roomId);
}
