/**
 * Trashmob class - Small enemies that can be killed with melee attacks (no quiz)
 *
 * Each trashmob type has unique movement and attack patterns:
 * - Slime: Hops around, attacks by jumping on player
 * - Bat: Erratic/confusing movement, swoops to attack
 * - Rat: Normal running, leaps at player to attack
 */

import {
  TRASHMOB_TYPE,
  TRASHMOB_HP,
  TRASHMOB_SPEED_TILES,
  TRASHMOB_CONTACT_DAMAGE_MIN,
  TRASHMOB_CONTACT_DAMAGE_MAX,
  AI_STATE,
  DIRECTION
} from '../constants';
import type { TrashmobType, Direction, AIStateType, TileType, Room } from '../constants';
import { CollisionDetector } from '../physics/CollisionDetector';
import { TrashmobSpriteRenderer } from '../rendering/TrashmobSprites';
import type { Player } from './types';

// Attack cooldowns per type (in seconds)
const ATTACK_COOLDOWNS: Record<TrashmobType, number> = {
  [TRASHMOB_TYPE.RAT]: 1.5,    // Quick attacks
  [TRASHMOB_TYPE.SLIME]: 2.5,  // Slower hop attacks
  [TRASHMOB_TYPE.BAT]: 2.0,    // Medium swoop attacks
};

// Attack ranges per type (in tiles)
const ATTACK_RANGES: Record<TrashmobType, number> = {
  [TRASHMOB_TYPE.RAT]: 2.0,    // Leap attack range
  [TRASHMOB_TYPE.SLIME]: 1.5,  // Hop attack range
  [TRASHMOB_TYPE.BAT]: 2.5,    // Swoop attack range
};

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
  static readonly AGGRO_RADIUS = 5; // tiles - start chasing player
  static readonly DEAGGRO_RADIUS = 10; // tiles - stop chasing

  // Attack state
  attackCooldown: number = 0;
  isAttacking: boolean = false;
  attackTimer: number = 0;
  attackTarget: { x: number; y: number } | null = null;
  // Wind-up time before attack can deal damage (gives player time to react)
  private static readonly ATTACK_WINDUP_TIME = 0.3; // seconds
  // IMPORTANT: Only true during active attack phase after wind-up, must be reset when attack ends
  canDealDamage: boolean = false;

  // Type-specific movement state
  // Slime hop state
  private hopHeight: number = 0;
  private hopPhase: 'grounded' | 'rising' | 'falling' = 'grounded';
  private hopTimer: number = 0;

  // Bat erratic movement
  private batSwerveAngle: number = 0;
  private batSwerveTimer: number = 0;

  // Rat leap state
  private leapVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private isLeaping: boolean = false;
  private isRetreating: boolean = false;
  private retreatTimer: number = 0;

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

    // Random initial bat swerve
    this.batSwerveAngle = Math.random() * Math.PI * 2;
  }

  /**
   * Get base movement speed in tiles per second
   */
  getSpeed(): number {
    switch (this.type) {
      case TRASHMOB_TYPE.BAT:
        return TRASHMOB_SPEED_TILES * 1.1; // Medium speed, erratic movement
      case TRASHMOB_TYPE.SLIME:
        return TRASHMOB_SPEED_TILES * 1.0; // Normal hop speed
      case TRASHMOB_TYPE.RAT:
      default:
        return TRASHMOB_SPEED_TILES * 1.2; // Fast runner
    }
  }

  /**
   * Get contact damage
   */
  getContactDamage(): number {
    // More damage during attack
    const baseDamage = Math.floor(
      Math.random() * (TRASHMOB_CONTACT_DAMAGE_MAX - TRASHMOB_CONTACT_DAMAGE_MIN + 1)
    ) + TRASHMOB_CONTACT_DAMAGE_MIN;

    return this.isAttacking ? Math.floor(baseDamage * 1.5) : baseDamage;
  }

  /**
   * Check if can attack (cooldown ready)
   */
  canAttack(): boolean {
    return this.attackCooldown <= 0 && !this.isAttacking;
  }

  /**
   * Get attack range for this type
   */
  getAttackRange(): number {
    return ATTACK_RANGES[this.type];
  }

  /**
   * Take damage from player attack
   */
  takeDamage(amount: number): void {
    this.hp -= amount;
    // Cancel attack if hit
    this.isAttacking = false;
    this.isLeaping = false;
    this.canDealDamage = false; // Reset damage flag
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
    this.isAttacking = false;
    this.canDealDamage = false; // Reset damage flag
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
   * Check if this trashmob is touching the player
   */
  isTouchingPlayer(player: Player, tileSize: number): boolean {
    const distance = this.getDistanceToPlayer(player, tileSize);
    return distance < 0.6; // Contact threshold
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
      return;
    }

    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // Check distance to player for aggro
    const distanceToPlayer = this.getDistanceToPlayer(player, tileSize);

    // State transitions based on distance (unless attacking)
    if (!this.isAttacking) {
      if (this.aiState !== AI_STATE.FOLLOWING) {
        if (distanceToPlayer <= Trashmob.AGGRO_RADIUS) {
          this.aiState = AI_STATE.FOLLOWING;
        }
      } else {
        if (distanceToPlayer > Trashmob.DEAGGRO_RADIUS) {
          this.aiState = AI_STATE.IDLE;
          this.idleTimer = 0;
        }
      }
    }

    // Type-specific behavior
    switch (this.type) {
      case TRASHMOB_TYPE.SLIME:
        this.updateSlime(dt, player, tileSize, room, dungeon, doorStates);
        break;
      case TRASHMOB_TYPE.BAT:
        this.updateBat(dt, player, tileSize, room, dungeon, doorStates);
        break;
      case TRASHMOB_TYPE.RAT:
        this.updateRat(dt, player, tileSize, room, dungeon, doorStates);
        break;
    }
  }

  // ==================== SLIME BEHAVIOR ====================
  // Hops around, attacks by jumping on player

  private updateSlime(
    dt: number,
    player: Player,
    tileSize: number,
    room: Room,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    const distanceToPlayer = this.getDistanceToPlayer(player, tileSize);

    if (this.isAttacking) {
      // Attack hop toward player
      this.updateSlimeAttack(dt, player, tileSize, dungeon, doorStates);
      return;
    }

    // Check if should attack
    if (this.aiState === AI_STATE.FOLLOWING &&
        this.canAttack() &&
        distanceToPlayer <= this.getAttackRange()) {
      this.startSlimeAttack(player, tileSize);
      return;
    }

    // Update hop physics and movement
    this.updateSlimeHop(dt, tileSize, dungeon, doorStates);

    // Start new hop when grounded
    if (this.hopPhase === 'grounded') {
      this.hopTimer += dt;

      // Wait between hops
      const hopDelay = this.aiState === AI_STATE.FOLLOWING ? 0.4 : 1.0;
      if (this.hopTimer >= hopDelay) {
        this.hopTimer = 0;
        this.startSlimeHop(player, tileSize, room, dungeon, doorStates);
      }
    }
  }

  private updateSlimeHop(
    dt: number,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    if (this.hopPhase === 'rising') {
      this.hopHeight += dt * tileSize * 4;
      if (this.hopHeight >= tileSize * 0.4) {
        this.hopPhase = 'falling';
      }
      // Move toward waypoint during hop
      this.moveTowardWaypoint(dt, tileSize, dungeon, doorStates, 2.0);
    } else if (this.hopPhase === 'falling') {
      this.hopHeight -= dt * tileSize * 5;
      // Move toward waypoint during hop
      this.moveTowardWaypoint(dt, tileSize, dungeon, doorStates, 2.0);
      if (this.hopHeight <= 0) {
        this.hopHeight = 0;
        this.hopPhase = 'grounded';
        this.isMoving = false;
        this.waypoint = null;
      }
    }
  }

  private moveTowardWaypoint(
    dt: number,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>,
    speedMultiplier: number
  ): void {
    if (!this.waypoint) return;

    const dx = this.waypoint.x - this.x;
    const dy = this.waypoint.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      this.waypoint = null;
      return;
    }

    const speed = this.getSpeed() * tileSize * speedMultiplier;
    const moveX = (dx / dist) * speed * dt;
    const moveY = (dy / dist) * speed * dt;

    const newX = this.x + moveX;
    const newY = this.y + moveY;

    if (!this.checkCollision(newX, this.y, tileSize, dungeon, doorStates)) {
      this.x = newX;
    }
    if (!this.checkCollision(this.x, newY, tileSize, dungeon, doorStates)) {
      this.y = newY;
    }
  }

  private startSlimeHop(
    player: Player,
    tileSize: number,
    room: Room,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    this.hopPhase = 'rising';
    this.isMoving = true;

    let targetX: number, targetY: number;

    if (this.aiState === AI_STATE.FOLLOWING) {
      // Hop toward player
      targetX = player.x;
      targetY = player.y;
    } else {
      // Random hop within room
      const padding = 1;
      const minX = (room.x + padding) * tileSize;
      const maxX = (room.x + room.width - padding - 1) * tileSize;
      const minY = (room.y + padding) * tileSize;
      const maxY = (room.y + room.height - padding - 1) * tileSize;
      targetX = minX + Math.random() * (maxX - minX);
      targetY = minY + Math.random() * (maxY - minY);
    }

    // Set waypoint for hop destination
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const hopDist = Math.min(dist, tileSize * 2.5); // Max hop distance

    if (dist > 0) {
      const newX = this.x + (dx / dist) * hopDist;
      const newY = this.y + (dy / dist) * hopDist;

      this.waypoint = { x: newX, y: newY };

      // Update direction
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
      } else {
        this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
      }
    }
  }

  private startSlimeAttack(player: Player, tileSize: number): void {
    this.isAttacking = true;
    this.attackTimer = 0;
    this.canDealDamage = false; // Wind-up - can't deal damage yet
    this.attackTarget = { x: player.x, y: player.y };
    this.hopPhase = 'rising';
    this.hopHeight = 0;
    this.isMoving = true;

    // Direction toward player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }
  }

  private updateSlimeAttack(
    dt: number,
    player: Player,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    this.attackTimer += dt;

    // Enable damage after wind-up time
    if (!this.canDealDamage && this.attackTimer >= Trashmob.ATTACK_WINDUP_TIME) {
      this.canDealDamage = true;
    }

    // Faster hop during attack
    if (this.hopPhase === 'rising') {
      this.hopHeight += dt * tileSize * 5;
      if (this.hopHeight >= tileSize * 0.8) {
        this.hopPhase = 'falling';
      }
    } else if (this.hopPhase === 'falling') {
      this.hopHeight -= dt * tileSize * 6;
      if (this.hopHeight <= 0) {
        this.hopHeight = 0;
        this.hopPhase = 'grounded';
        this.isAttacking = false;
        this.canDealDamage = false;
        this.attackCooldown = ATTACK_COOLDOWNS[this.type];
        this.isMoving = false;
        return;
      }
    }

    // Move toward attack target during hop
    if (this.attackTarget && this.hopPhase !== 'grounded') {
      const dx = this.attackTarget.x - this.x;
      const dy = this.attackTarget.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        const speed = this.getSpeed() * tileSize * 2.5;
        const moveX = (dx / dist) * speed * dt;
        const moveY = (dy / dist) * speed * dt;

        const newX = this.x + moveX;
        const newY = this.y + moveY;

        if (!this.checkCollision(newX, this.y, tileSize, dungeon, doorStates)) {
          this.x = newX;
        }
        if (!this.checkCollision(this.x, newY, tileSize, dungeon, doorStates)) {
          this.y = newY;
        }
      }
    }
  }

  // ==================== BAT BEHAVIOR ====================
  // Erratic/confusing movement, swoops to attack

  private updateBat(
    dt: number,
    player: Player,
    tileSize: number,
    room: Room,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    const distanceToPlayer = this.getDistanceToPlayer(player, tileSize);

    if (this.isAttacking) {
      this.updateBatAttack(dt, player, tileSize, dungeon, doorStates);
      return;
    }

    // Check if should attack
    if (this.aiState === AI_STATE.FOLLOWING &&
        this.canAttack() &&
        distanceToPlayer <= this.getAttackRange()) {
      this.startBatAttack(player, tileSize);
      return;
    }

    // Update swerve pattern - faster direction changes
    this.batSwerveTimer += dt;
    if (this.batSwerveTimer >= 0.15) { // Faster direction changes
      this.batSwerveTimer = 0;
      // More extreme random direction change
      this.batSwerveAngle += (Math.random() - 0.5) * Math.PI * 1.5;
    }

    // Erratic movement
    const speed = this.getSpeed() * tileSize;
    let moveX: number, moveY: number;

    if (this.aiState === AI_STATE.FOLLOWING) {
      // Move toward player but with very erratic swerving
      const playerCenterX = player.x + tileSize / 2;
      const playerCenterY = player.y + tileSize / 2;
      const myCenterX = this.x + tileSize / 2;
      const myCenterY = this.y + tileSize / 2;

      const dx = playerCenterX - myCenterX;
      const dy = playerCenterY - myCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        // Base direction toward player
        const baseAngle = Math.atan2(dy, dx);
        // Add strong swerve - more erratic with multiple sine waves
        const swerve1 = Math.sin(this.batSwerveTimer * 15 + this.batSwerveAngle) * 1.2;
        const swerve2 = Math.sin(this.batSwerveTimer * 8 + this.batSwerveAngle * 2) * 0.6;
        const finalAngle = baseAngle + swerve1 + swerve2;

        moveX = Math.cos(finalAngle) * speed * dt;
        moveY = Math.sin(finalAngle) * speed * dt;

        // Update direction
        if (Math.abs(moveX) > Math.abs(moveY)) {
          this.direction = moveX > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
        } else {
          this.direction = moveY > 0 ? DIRECTION.DOWN : DIRECTION.UP;
        }
      } else {
        moveX = 0;
        moveY = 0;
      }
    } else {
      // Random erratic movement when idle/wandering - more active
      const idleSwerve = Math.sin(this.batSwerveTimer * 12) * 0.5;
      moveX = Math.cos(this.batSwerveAngle + idleSwerve) * speed * dt * 0.7;
      moveY = Math.sin(this.batSwerveAngle + idleSwerve) * speed * dt * 0.7;

      // Update direction
      if (Math.abs(moveX) > Math.abs(moveY)) {
        this.direction = moveX > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
      } else {
        this.direction = moveY > 0 ? DIRECTION.DOWN : DIRECTION.UP;
      }
    }

    // Try to move
    const newX = this.x + moveX;
    const newY = this.y + moveY;

    let moved = false;
    if (!this.checkCollision(newX, this.y, tileSize, dungeon, doorStates)) {
      this.x = newX;
      moved = true;
    } else {
      this.batSwerveAngle += Math.PI / 2; // Turn when hitting wall
    }
    if (!this.checkCollision(this.x, newY, tileSize, dungeon, doorStates)) {
      this.y = newY;
      moved = true;
    } else {
      this.batSwerveAngle -= Math.PI / 2;
    }

    this.isMoving = moved;
  }

  private startBatAttack(player: Player, tileSize: number): void {
    this.isAttacking = true;
    this.attackTimer = 0;
    this.canDealDamage = false; // Wind-up - can't deal damage yet
    this.attackTarget = { x: player.x, y: player.y };
    this.isMoving = true;

    // Direction toward player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }
  }

  private updateBatAttack(
    dt: number,
    player: Player,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    this.attackTimer += dt;

    // Enable damage after wind-up time
    if (!this.canDealDamage && this.attackTimer >= Trashmob.ATTACK_WINDUP_TIME) {
      this.canDealDamage = true;
    }

    // Swoop attack lasts 0.5 seconds
    if (this.attackTimer >= 0.5) {
      this.isAttacking = false;
      this.canDealDamage = false;
      this.attackCooldown = ATTACK_COOLDOWNS[this.type];
      this.isMoving = false;
      return;
    }

    // Fast swoop toward player
    const playerCenterX = player.x + tileSize / 2;
    const playerCenterY = player.y + tileSize / 2;
    const myCenterX = this.x + tileSize / 2;
    const myCenterY = this.y + tileSize / 2;

    const dx = playerCenterX - myCenterX;
    const dy = playerCenterY - myCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const speed = this.getSpeed() * tileSize * 2; // Swoop speed
      const moveX = (dx / dist) * speed * dt;
      const moveY = (dy / dist) * speed * dt;

      const newX = this.x + moveX;
      const newY = this.y + moveY;

      if (!this.checkCollision(newX, this.y, tileSize, dungeon, doorStates)) {
        this.x = newX;
      }
      if (!this.checkCollision(this.x, newY, tileSize, dungeon, doorStates)) {
        this.y = newY;
      }
    }
  }

  // ==================== RAT BEHAVIOR ====================
  // Normal running, leaps at player to attack, retreats after

  private updateRat(
    dt: number,
    player: Player,
    tileSize: number,
    room: Room,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    const distanceToPlayer = this.getDistanceToPlayer(player, tileSize);

    // Handle retreat after leap
    if (this.isRetreating) {
      this.updateRatRetreat(dt, player, tileSize, dungeon, doorStates);
      return;
    }

    if (this.isLeaping) {
      this.updateRatLeap(dt, player, tileSize, dungeon, doorStates);
      return;
    }

    if (this.isAttacking) {
      // Wind-up before leap
      this.attackTimer += dt;
      if (this.attackTimer >= 0.3) {
        this.startRatLeap(player, tileSize);
      }
      return;
    }

    // Check if should attack
    if (this.aiState === AI_STATE.FOLLOWING &&
        this.canAttack() &&
        distanceToPlayer <= this.getAttackRange()) {
      this.startRatAttack(player, tileSize);
      return;
    }

    // Normal movement
    switch (this.aiState) {
      case AI_STATE.IDLE:
        this.updateRatIdle(dt, room, tileSize);
        break;
      case AI_STATE.WANDERING:
        this.updateRatWandering(dt, tileSize, dungeon, doorStates);
        break;
      case AI_STATE.FOLLOWING:
        this.updateRatFollowing(dt, player, tileSize, dungeon, doorStates);
        break;
    }
  }

  private updateRatIdle(dt: number, room: Room, tileSize: number): void {
    this.isMoving = false;
    this.idleTimer += dt;

    if (this.idleTimer >= Trashmob.IDLE_WAIT_TIME) {
      this.idleTimer = 0;
      this.pickNewWaypoint(room, tileSize);
      this.aiState = AI_STATE.WANDERING;
    }
  }

  private updateRatWandering(
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

    if (distance < 5) {
      this.waypoint = null;
      this.aiState = AI_STATE.IDLE;
      this.isMoving = false;
      return;
    }

    const moveX = (dx / distance) * speed * dt;
    const moveY = (dy / distance) * speed * dt;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }

    const newX = this.x + moveX;
    const newY = this.y + moveY;

    if (!this.checkCollision(newX, newY, tileSize, dungeon, doorStates)) {
      this.x = newX;
      this.y = newY;
      this.isMoving = true;
    } else {
      this.waypoint = null;
      this.aiState = AI_STATE.IDLE;
      this.isMoving = false;
    }
  }

  private updateRatFollowing(
    dt: number,
    player: Player,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    const speed = this.getSpeed() * tileSize * 1.3; // Faster when chasing

    const playerCenterX = player.x + tileSize / 2;
    const playerCenterY = player.y + tileSize / 2;
    const myCenterX = this.x + tileSize / 2;
    const myCenterY = this.y + tileSize / 2;

    const dx = playerCenterX - myCenterX;
    const dy = playerCenterY - myCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < tileSize * 0.5) {
      this.isMoving = false;
      return;
    }

    const moveX = (dx / distance) * speed * dt;
    const moveY = (dy / distance) * speed * dt;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }

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

  private startRatAttack(player: Player, tileSize: number): void {
    this.isAttacking = true;
    this.attackTimer = 0;
    this.canDealDamage = false; // Wind-up - can't deal damage yet
    this.isMoving = false;

    // Face player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }
  }

  private startRatLeap(player: Player, tileSize: number): void {
    this.isLeaping = true;
    this.isMoving = true;
    this.canDealDamage = true; // Leap is the damaging part
    this.attackTimer = 0; // Reset timer for leap duration

    // Calculate leap velocity toward player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const leapSpeed = this.getSpeed() * tileSize * 4; // Slower, more dodgeable leap
      this.leapVelocity = {
        x: (dx / dist) * leapSpeed,
        y: (dy / dist) * leapSpeed
      };
    }
  }

  private updateRatLeap(
    dt: number,
    player: Player,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    this.attackTimer += dt;

    // Leap duration - longer for more distance
    if (this.attackTimer >= 0.8) {
      this.isLeaping = false;
      this.isAttacking = false;
      this.canDealDamage = false;
      this.leapVelocity = { x: 0, y: 0 };
      // Start retreat after leap - flee until cooldown ready
      this.startRatRetreat();
      return;
    }

    // Apply leap velocity with deceleration
    const decel = Math.max(0, 1 - (this.attackTimer / 0.8));
    const moveX = this.leapVelocity.x * dt * decel;
    const moveY = this.leapVelocity.y * dt * decel;

    const newX = this.x + moveX;
    const newY = this.y + moveY;

    // Stop leap on collision
    if (!this.checkCollision(newX, this.y, tileSize, dungeon, doorStates)) {
      this.x = newX;
    } else {
      this.leapVelocity.x = 0;
    }
    if (!this.checkCollision(this.x, newY, tileSize, dungeon, doorStates)) {
      this.y = newY;
    } else {
      this.leapVelocity.y = 0;
    }
  }

  private startRatRetreat(): void {
    this.isRetreating = true;
    this.isMoving = true;
    this.canDealDamage = false; // Reset damage flag when retreating
    // Set cooldown - rat will flee until this expires
    this.attackCooldown = ATTACK_COOLDOWNS[this.type];
  }

  private updateRatRetreat(
    dt: number,
    player: Player,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    // Stop retreating when attack is ready again
    if (this.attackCooldown <= 0) {
      this.isRetreating = false;
      this.isMoving = false;
      return;
    }

    const speed = this.getSpeed() * tileSize * 1.5; // Fast flee

    // Check all 8 directions (cardinal + diagonal) for escape routes
    const directions = [
      { dx: 1, dy: 0, dir: DIRECTION.RIGHT },
      { dx: -1, dy: 0, dir: DIRECTION.LEFT },
      { dx: 0, dy: 1, dir: DIRECTION.DOWN },
      { dx: 0, dy: -1, dir: DIRECTION.UP },
      { dx: 1, dy: 1, dir: DIRECTION.DOWN },   // down-right
      { dx: -1, dy: 1, dir: DIRECTION.DOWN },  // down-left
      { dx: 1, dy: -1, dir: DIRECTION.UP },    // up-right
      { dx: -1, dy: -1, dir: DIRECTION.UP },   // up-left
    ];

    const playerCenterX = player.x + tileSize / 2;
    const playerCenterY = player.y + tileSize / 2;

    // Find the best escape direction
    let bestDirection: { dx: number; dy: number; dir: Direction } | null = null;
    let bestScore = -Infinity;

    for (const dir of directions) {
      // Normalize diagonal movement
      const length = Math.sqrt(dir.dx * dir.dx + dir.dy * dir.dy);
      const normDx = dir.dx / length;
      const normDy = dir.dy / length;

      const testX = this.x + normDx * speed * dt;
      const testY = this.y + normDy * speed * dt;

      // Check if this direction is passable
      if (this.checkCollision(testX, testY, tileSize, dungeon, doorStates)) {
        continue; // Can't go this way
      }

      // Calculate how far this takes us from the player
      const newCenterX = testX + tileSize / 2;
      const newCenterY = testY + tileSize / 2;
      const distToPlayer = Math.sqrt(
        (newCenterX - playerCenterX) ** 2 + (newCenterY - playerCenterY) ** 2
      );

      if (distToPlayer > bestScore) {
        bestScore = distToPlayer;
        bestDirection = { dx: normDx, dy: normDy, dir: dir.dir };
      }
    }

    // If we found a valid direction, move that way
    if (bestDirection) {
      const moveX = bestDirection.dx * speed * dt;
      const moveY = bestDirection.dy * speed * dt;

      this.x += moveX;
      this.y += moveY;
      this.direction = bestDirection.dir;
      this.isMoving = true;
    } else {
      // Completely stuck in corner - stop retreating early and go back to following
      this.isRetreating = false;
      this.isMoving = false;
    }
  }

  /**
   * Pick a random waypoint within the room
   */
  private pickNewWaypoint(room: Room, tileSize: number): void {
    const padding = 1;
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
   */
  draw(ctx: CanvasRenderingContext2D, tileSize: number, dt: number = 0.016): void {
    if (!this.alive) return;

    // Update sprite animation
    this.spriteRenderer.update(dt);

    const spriteSize = tileSize * 0.8;
    const offsetX = (tileSize - spriteSize) / 2;
    let offsetY = (tileSize - spriteSize) / 2;

    // Apply hop height for slime
    if (this.type === TRASHMOB_TYPE.SLIME) {
      offsetY -= this.hopHeight;
    }

    // Draw shadow when airborne (slime hopping or leaping rat)
    if (this.hopHeight > 0 || this.isLeaping) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(
        this.x + tileSize / 2,
        this.y + tileSize * 0.8,
        spriteSize / 3,
        spriteSize / 6,
        0, 0, Math.PI * 2
      );
      ctx.fill();
    }

    // Draw pixel-art sprite
    this.spriteRenderer.draw(
      ctx,
      this.type,
      this.x + offsetX,
      this.y + offsetY,
      spriteSize,
      this.isMoving || this.isAttacking,
      this.direction
    );

    // Draw attack indicator
    if (this.isAttacking) {
      const centerX = this.x + tileSize / 2;
      const centerY = this.y + tileSize / 2 - this.hopHeight;
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, spriteSize / 2 + 6, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.aiState === AI_STATE.FOLLOWING) {
      // Aggro indicator
      const centerX = this.x + tileSize / 2;
      const centerY = this.y + tileSize / 2 - this.hopHeight;
      ctx.strokeStyle = 'rgba(255, 150, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, spriteSize / 2 + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw HP bar above sprite
    const centerX = this.x + tileSize / 2;
    this.drawHpBar(ctx, centerX, this.y - 6 - this.hopHeight, spriteSize);

    // Draw cooldown indicator if on cooldown
    if (this.attackCooldown > 0) {
      const cooldownPercent = this.attackCooldown / ATTACK_COOLDOWNS[this.type];
      ctx.fillStyle = 'rgba(100, 100, 255, 0.5)';
      ctx.fillRect(
        centerX - spriteSize / 2,
        this.y - 2 - this.hopHeight,
        spriteSize * (1 - cooldownPercent),
        2
      );
    }
  }

  /**
   * Draw small HP bar above trashmob
   */
  private drawHpBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
    const barHeight = 4;
    const hpPercent = this.hp / this.maxHp;

    ctx.fillStyle = '#333';
    ctx.fillRect(x - width / 2, y, width, barHeight);

    ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
    ctx.fillRect(x - width / 2, y, width * hpPercent, barHeight);

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
