/**
 * Trashmob class - Small enemies that can be killed with melee attacks (no quiz)
 *
 * Each trashmob type has unique movement and attack patterns:
 * - Slime: Hops around, attacks by jumping on player
 * - Bat: Erratic/confusing movement, swoops to attack
 * - Rat: Normal running, leaps at player to attack
 * - Mage: Slow floating, shoots fireballs at range
 * - Bomb: Slow rolling toward player, explodes on proximity timer
 */

import {
  TRASHMOB_TYPE,
  TRASHMOB_HP,
  TRASHMOB_SPEED_TILES,
  TRASHMOB_CONTACT_DAMAGE_MIN,
  TRASHMOB_CONTACT_DAMAGE_MAX,
  AI_STATE,
  DIRECTION,
  BOMB_ACTIVATION_RADIUS,
  BOMB_COUNTDOWN_DURATION,
  BOMB_EXPLOSION_RADIUS,
  BOMB_MAX_DAMAGE,
  BOMB_MIN_DAMAGE,
  BOMB_GLOW_RADIUS
} from '../constants';
import type { TrashmobType, Direction, AIStateType, TileType, Room } from '../constants';
import { CollisionDetector } from '../physics/CollisionDetector';
import { TrashmobSpriteRenderer, type TrashmobAnimationType } from '../rendering/TrashmobSprites';
import { getParticleSystem } from '../effects/ParticleSystem';
import { getScreenShake } from '../effects/ScreenShake';
import { hasLineOfSight } from '../physics/LineOfSight';
import type { Player } from './types';

// Attack cooldowns per type (in seconds)
const ATTACK_COOLDOWNS: Record<TrashmobType, number> = {
  [TRASHMOB_TYPE.RAT]: 1.5,    // Quick attacks
  [TRASHMOB_TYPE.SLIME]: 2.5,  // Slower hop attacks
  [TRASHMOB_TYPE.BAT]: 2.0,    // Medium swoop attacks
  [TRASHMOB_TYPE.MAGE]: 3.0,   // Slower, powerful fireball attacks
  [TRASHMOB_TYPE.BOMB]: 0,     // No cooldown (explodes once)
};

// Attack ranges per type (in tiles)
const ATTACK_RANGES: Record<TrashmobType, number> = {
  [TRASHMOB_TYPE.RAT]: 2.0,    // Leap attack range
  [TRASHMOB_TYPE.SLIME]: 1.5,  // Hop attack range
  [TRASHMOB_TYPE.BAT]: 2.5,    // Swoop attack range
  [TRASHMOB_TYPE.MAGE]: 6.0,   // Long range - shoots fireballs
  [TRASHMOB_TYPE.BOMB]: 3.5,   // Explosion radius
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

  // Death animation state
  isDying: boolean = false;
  deathTimer: number = 0;
  deathAlpha: number = 1;
  deathScale: number = 1; // Shrink effect
  private static readonly DEATH_DURATION = 1.2; // seconds for fade-out (slower)
  private ashSpawned: boolean = false;

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
  // Attack animation tracking
  private warningSpawned: boolean = false;
  private slashSpawned: boolean = false;

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

  // Mage shooting state
  private isShooting: boolean = false;
  private shootCooldown: number = 0;
  private castingTimer: number = 0; // Time spent in casting animation
  private currentCastTime: number = 0.6; // Current cast time (varies by distance)
  private fireballsSpawned: boolean = false; // Track if fireballs spawned this cast

  // Bomb state
  private bombState: 'idle' | 'armed' | 'exploding' = 'idle';
  private bombTimer: number = 0;
  private bombActivatedOnce: boolean = false; // Prevents re-arming after player leaves
  private bombGlowPhase: number = 0; // For pulsing animation
  private storedDamage: number = 0; // Explosion damage storage

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
        return TRASHMOB_SPEED_TILES * 1.2; // Fast runner
      case TRASHMOB_TYPE.MAGE:
        return TRASHMOB_SPEED_TILES * 0.7; // Slow, floats around
      case TRASHMOB_TYPE.BOMB:
        return TRASHMOB_SPEED_TILES * 0.7; // Slow rolling toward player
      default:
        return TRASHMOB_SPEED_TILES * 1.2;
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
   * Get explosion damage amount (for BOMB type)
   */
  public getExplosionDamage(): number {
    return this.storedDamage;
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
   * Start death animation - trashmob will fade out and turn to ash
   */
  die(): void {
    if (this.isDying) return; // Already dying

    this.isDying = true;
    this.deathTimer = 0;
    this.deathAlpha = 1;
    this.aiState = AI_STATE.IDLE;
    this.isMoving = false;
    this.isAttacking = false;
    this.canDealDamage = false;
  }

  /**
   * Update death animation
   * @returns true if death animation is complete
   */
  updateDeathAnimation(dt: number, tileSize: number, roomVisible: boolean): boolean {
    if (!this.isDying) return false;

    this.deathTimer += dt;
    const progress = this.deathTimer / Trashmob.DEATH_DURATION;

    // Spawn initial ash burst (only if room visible)
    if (!this.ashSpawned) {
      this.ashSpawned = true;
      if (roomVisible) {
        const particleSystem = getParticleSystem();
        const centerX = this.x + tileSize / 2;
        const centerY = this.y + tileSize / 2;
        const spriteSize = tileSize * 0.8;
        particleSystem.spawnAsh(centerX, centerY, spriteSize, spriteSize, 20);
      }
    }

    // Smooth fade out using easing (starts slow, accelerates)
    // Use cubic easing for smoother transition
    const easedProgress = progress * progress * progress;
    this.deathAlpha = Math.max(0, 1 - easedProgress);

    // Shrink effect - starts after 30% of animation
    if (progress > 0.3) {
      const shrinkProgress = (progress - 0.3) / 0.7; // 0 to 1 over remaining 70%
      this.deathScale = Math.max(0.1, 1 - shrinkProgress * 0.8); // Shrink to 20%
    }

    // Continuously spawn ash particles during the animation (only if room visible)
    // More particles at the beginning, fewer towards the end
    const spawnChance = 0.5 * (1 - progress);
    if (roomVisible && progress < 0.9 && Math.random() < spawnChance) {
      const particleSystem = getParticleSystem();
      const centerX = this.x + tileSize / 2;
      const centerY = this.y + tileSize / 2;
      const currentSize = tileSize * 0.8 * this.deathScale;
      particleSystem.spawnAsh(centerX, centerY, currentSize, currentSize, 2 + Math.floor(Math.random() * 3));
    }

    // Check if animation is complete
    if (this.deathTimer >= Trashmob.DEATH_DURATION) {
      this.alive = false;
      return true;
    }

    return false;
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
    const room = rooms[this.roomId];
    const roomVisible = room?.visible ?? false;

    // Handle death animation
    if (this.isDying) {
      this.updateDeathAnimation(dt, tileSize, roomVisible);
      return;
    }

    if (!this.alive) return;

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
      case TRASHMOB_TYPE.MAGE:
        this.updateMage(dt, player, tileSize, room, dungeon, doorStates);
        break;
      case TRASHMOB_TYPE.BOMB:
        this.updateBomb(dt, player, tileSize, room, dungeon, doorStates);
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
      this.updateSlimeAttack(dt, player, tileSize, dungeon, doorStates, room.visible);
      return;
    }

    // Check if should attack
    if (this.aiState === AI_STATE.FOLLOWING &&
        this.canAttack() &&
        distanceToPlayer <= this.getAttackRange()) {
      // Check line of sight before attacking
      const trashmobCenterX = this.x + tileSize / 2;
      const trashmobCenterY = this.y + tileSize / 2;
      const playerCenterX = player.x + tileSize / 2;
      const playerCenterY = player.y + tileSize / 2;

      if (hasLineOfSight(trashmobCenterX, trashmobCenterY, playerCenterX, playerCenterY, dungeon, tileSize)) {
        this.startSlimeAttack(player, tileSize, room.visible);
        return;
      }
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

  private startSlimeAttack(player: Player, tileSize: number, roomVisible: boolean): void {
    this.isAttacking = true;
    this.attackTimer = 0;
    this.canDealDamage = false; // Wind-up - can't deal damage yet
    this.warningSpawned = false;
    this.slashSpawned = false;
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

    // Spawn warning particles only if room is visible
    if (roomVisible) {
      const particleSystem = getParticleSystem();
      const centerX = this.x + tileSize / 2;
      const centerY = this.y + tileSize / 2;
      particleSystem.spawnWarning(centerX, centerY, tileSize * 0.4, 10);
    }
    this.warningSpawned = true;
  }

  private updateSlimeAttack(
    dt: number,
    player: Player,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>,
    roomVisible: boolean
  ): void {
    this.attackTimer += dt;

    // Enable damage after wind-up time and spawn slash effect
    if (!this.canDealDamage && this.attackTimer >= Trashmob.ATTACK_WINDUP_TIME) {
      this.canDealDamage = true;

      // Spawn slash particles when attack becomes active (only if room visible)
      if (!this.slashSpawned) {
        this.slashSpawned = true;
        if (roomVisible) {
          const particleSystem = getParticleSystem();
          const centerX = this.x + tileSize / 2;
          const centerY = this.y + tileSize / 2;
          particleSystem.spawnSlash(centerX, centerY, player.x + tileSize / 2, player.y + tileSize / 2, 15);
        }
      }
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
      this.updateBatAttack(dt, player, tileSize, dungeon, doorStates, room.visible);
      return;
    }

    // Check if should attack
    if (this.aiState === AI_STATE.FOLLOWING &&
        this.canAttack() &&
        distanceToPlayer <= this.getAttackRange()) {
      // Check line of sight before attacking
      const trashmobCenterX = this.x + tileSize / 2;
      const trashmobCenterY = this.y + tileSize / 2;
      const playerCenterX = player.x + tileSize / 2;
      const playerCenterY = player.y + tileSize / 2;

      if (hasLineOfSight(trashmobCenterX, trashmobCenterY, playerCenterX, playerCenterY, dungeon, tileSize)) {
        this.startBatAttack(player, tileSize, room.visible);
        return;
      }
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

  private startBatAttack(player: Player, tileSize: number, roomVisible: boolean): void {
    this.isAttacking = true;
    this.attackTimer = 0;
    this.canDealDamage = false; // Wind-up - can't deal damage yet
    this.warningSpawned = false;
    this.slashSpawned = false;
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

    // Spawn warning particles only if room is visible
    if (roomVisible) {
      const particleSystem = getParticleSystem();
      const centerX = this.x + tileSize / 2;
      const centerY = this.y + tileSize / 2;
      particleSystem.spawnWarning(centerX, centerY, tileSize * 0.4, 10);
    }
    this.warningSpawned = true;
  }

  private updateBatAttack(
    dt: number,
    player: Player,
    tileSize: number,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>,
    roomVisible: boolean
  ): void {
    this.attackTimer += dt;

    // Enable damage after wind-up time and spawn slash effect
    if (!this.canDealDamage && this.attackTimer >= Trashmob.ATTACK_WINDUP_TIME) {
      this.canDealDamage = true;

      // Spawn slash particles when attack becomes active (only if room visible)
      if (!this.slashSpawned) {
        this.slashSpawned = true;
        if (roomVisible) {
          const particleSystem = getParticleSystem();
          const centerX = this.x + tileSize / 2;
          const centerY = this.y + tileSize / 2;
          particleSystem.spawnSlash(centerX, centerY, player.x + tileSize / 2, player.y + tileSize / 2, 15);
        }
      }
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
        this.startRatLeap(player, tileSize, room.visible);
      }
      return;
    }

    // Check if should attack
    if (this.aiState === AI_STATE.FOLLOWING &&
        this.canAttack() &&
        distanceToPlayer <= this.getAttackRange()) {
      // Check line of sight before attacking
      const trashmobCenterX = this.x + tileSize / 2;
      const trashmobCenterY = this.y + tileSize / 2;
      const playerCenterX = player.x + tileSize / 2;
      const playerCenterY = player.y + tileSize / 2;

      if (hasLineOfSight(trashmobCenterX, trashmobCenterY, playerCenterX, playerCenterY, dungeon, tileSize)) {
        this.startRatAttack(player, tileSize, room.visible);
        return;
      }
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

  private startRatAttack(player: Player, tileSize: number, roomVisible: boolean): void {
    this.isAttacking = true;
    this.attackTimer = 0;
    this.canDealDamage = false; // Wind-up - can't deal damage yet
    this.warningSpawned = false;
    this.slashSpawned = false;
    this.isMoving = false;

    // Face player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }

    // Spawn warning particles only if room is visible
    if (roomVisible) {
      const particleSystem = getParticleSystem();
      const centerX = this.x + tileSize / 2;
      const centerY = this.y + tileSize / 2;
      particleSystem.spawnWarning(centerX, centerY, tileSize * 0.4, 10);
    }
    this.warningSpawned = true;
  }

  private startRatLeap(player: Player, tileSize: number, roomVisible: boolean): void {
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

    // Spawn slash particles when leap starts (only if room visible)
    if (!this.slashSpawned) {
      this.slashSpawned = true;
      if (roomVisible) {
        const particleSystem = getParticleSystem();
        const centerX = this.x + tileSize / 2;
        const centerY = this.y + tileSize / 2;
        particleSystem.spawnSlash(centerX, centerY, player.x + tileSize / 2, player.y + tileSize / 2, 15);
      }
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

  // ==================== MAGE BEHAVIOR ====================
  // Floats slowly, shoots 5 fireballs in an arc at range

  private updateMage(
    dt: number,
    player: Player,
    tileSize: number,
    room: Room,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    const distanceToPlayer = this.getDistanceToPlayer(player, tileSize);

    // Update shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    // Update casting animation
    if (this.isShooting) {
      this.castingTimer += dt;
      this.isMoving = false;

      // When casting animation completes, actual fireballs are spawned by GameEngine
      if (this.castingTimer >= this.currentCastTime) {
        this.isShooting = false;
        this.castingTimer = 0;
        this.shootCooldown = ATTACK_COOLDOWNS[this.type];
      }
      return;
    }

    // Check if should shoot
    const attackRange = this.getAttackRange();
    if (this.aiState === AI_STATE.FOLLOWING &&
        this.shootCooldown <= 0 &&
        distanceToPlayer <= attackRange) {
      // Check line of sight before shooting
      const mageCenterX = this.x + tileSize / 2;
      const mageCenterY = this.y + tileSize / 2;
      const playerCenterX = player.x + tileSize / 2;
      const playerCenterY = player.y + tileSize / 2;

      if (hasLineOfSight(mageCenterX, mageCenterY, playerCenterX, playerCenterY, dungeon, tileSize)) {
        this.startMageShooting(player, tileSize, distanceToPlayer);
        return;
      }
    }

    // Move toward player if too far, away if too close
    const idealDistance = 5; // tiles
    const speed = this.getSpeed() * tileSize;

    if (this.aiState === AI_STATE.FOLLOWING) {
      // Calculate direction to player
      const playerCenterX = player.x + tileSize / 2;
      const playerCenterY = player.y + tileSize / 2;
      const mageCenterX = this.x + tileSize / 2;
      const mageCenterY = this.y + tileSize / 2;

      const dx = playerCenterX - mageCenterX;
      const dy = playerCenterY - mageCenterY;
      const distancePixels = Math.sqrt(dx * dx + dy * dy);

      if (distancePixels > 0) {
        const dirX = dx / distancePixels;
        const dirY = dy / distancePixels;

        // Move toward or away from player based on distance
        let moveDir = 1; // toward
        if (distanceToPlayer < idealDistance) {
          moveDir = -1; // away
        }

        const newX = this.x + dirX * speed * dt * moveDir;
        const newY = this.y + dirY * speed * dt * moveDir;

        // Check collision
        if (!this.checkCollision(newX, newY, tileSize, dungeon, doorStates)) {
          this.x = newX;
          this.y = newY;
          this.isMoving = true;

          // Update direction (face player)
          if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
          } else {
            this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
          }
        } else {
          this.isMoving = false;
        }
      }
    } else {
      // Idle - wander slowly
      this.idleTimer += dt;
      if (this.idleTimer >= Trashmob.IDLE_WAIT_TIME) {
        this.idleTimer = 0;
        this.pickNewWaypoint(room, tileSize);
      }

      // Move toward waypoint
      if (this.waypoint) {
        const dx = this.waypoint.x - this.x;
        const dy = this.waypoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
          // Reached waypoint
          this.waypoint = null;
          this.isMoving = false;
        } else {
          const dirX = dx / distance;
          const dirY = dy / distance;

          const newX = this.x + dirX * speed * dt * 0.5; // Slow wander
          const newY = this.y + dirY * speed * dt * 0.5;

          if (!this.checkCollision(newX, newY, tileSize, dungeon, doorStates)) {
            this.x = newX;
            this.y = newY;
            this.isMoving = true;

            // Update direction
            if (Math.abs(dx) > Math.abs(dy)) {
              this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
            } else {
              this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
            }
          } else {
            this.waypoint = null;
            this.isMoving = false;
          }
        }
      }
    }
  }

  private startMageShooting(player: Player, tileSize: number, distanceToPlayer: number): void {
    this.isShooting = true;
    this.castingTimer = 0;
    this.isMoving = false;
    this.fireballsSpawned = false; // Reset for new cast

    // Calculate cast time based on distance - closer = longer cast time
    // At max range (6 tiles): 0.6 seconds
    // At close range (0 tiles): 1.8 seconds (3x longer)
    const maxRange = 6;
    const minCastTime = 0.6;
    const maxCastTime = 1.8;
    const distanceFactor = Math.min(distanceToPlayer, maxRange) / maxRange; // 0.0 to 1.0
    this.currentCastTime = maxCastTime - (distanceFactor * (maxCastTime - minCastTime));

    // Face player
    const playerCenterX = player.x + tileSize / 2;
    const playerCenterY = player.y + tileSize / 2;
    const mageCenterX = this.x + tileSize / 2;
    const mageCenterY = this.y + tileSize / 2;

    const dx = playerCenterX - mageCenterX;
    const dy = playerCenterY - mageCenterY;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
    } else {
      this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
    }
  }

  /**
   * Returns true if this trashmob is ready to shoot fireballs
   * (MAGE only, called by GameEngine to spawn fireballs at the right time)
   */
  public shouldSpawnFireballs(): boolean {
    // Spawn fireballs halfway through casting animation, but only once per cast
    if (this.fireballsSpawned) return false;

    if (this.isShooting && this.castingTimer >= this.currentCastTime * 0.5) {
      this.fireballsSpawned = true; // Mark as spawned
      return true;
    }

    return false;
  }

  /**
   * Get the shooting angle toward the player
   * (MAGE only, called by GameEngine when spawning fireballs)
   */
  public getShootingAngle(player: Player, tileSize: number): number {
    const playerCenterX = player.x + tileSize / 2;
    const playerCenterY = player.y + tileSize / 2;
    const mageCenterX = this.x + tileSize / 2;
    const mageCenterY = this.y + tileSize / 2;

    return Math.atan2(playerCenterY - mageCenterY, playerCenterX - mageCenterX);
  }

  // ==================== BOMB BEHAVIOR ====================
  // Slow-moving enemy that rolls toward player and explodes after proximity-based countdown

  private updateBomb(
    dt: number,
    player: Player,
    tileSize: number,
    room: Room,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    const distanceToPlayer = this.getDistanceToPlayer(player, tileSize);

    // Aggro/de-aggro state management
    if (distanceToPlayer <= Trashmob.AGGRO_RADIUS) {
      this.aiState = AI_STATE.FOLLOWING;
    } else if (distanceToPlayer > Trashmob.DEAGGRO_RADIUS) {
      this.aiState = AI_STATE.IDLE;
    }

    // Movement toward player when following
    if (this.aiState === AI_STATE.FOLLOWING && this.bombState !== 'exploding') {
      this.isMoving = true;
      const speed = this.getSpeed() * tileSize;

      // Calculate direction to player
      const playerCenterX = player.x + tileSize / 2;
      const playerCenterY = player.y + tileSize / 2;
      const bombCenterX = this.x + tileSize / 2;
      const bombCenterY = this.y + tileSize / 2;

      const dx = playerCenterX - bombCenterX;
      const dy = playerCenterY - bombCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const moveX = (dx / distance) * speed * dt;
        const moveY = (dy / distance) * speed * dt;

        // Update direction based on movement
        if (Math.abs(dx) > Math.abs(dy)) {
          this.direction = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
        } else {
          this.direction = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
        }

        // Try to move with collision detection
        const collisionDetector = new CollisionDetector();
        const newX = this.x + moveX;
        const newY = this.y + moveY;

        if (!collisionDetector.checkCollision(newX, this.y, this.x, this.y, tileSize, dungeon, doorStates)) {
          this.x = newX;
        }
        if (!collisionDetector.checkCollision(this.x, newY, this.x, this.y, tileSize, dungeon, doorStates)) {
          this.y = newY;
        }
      }
    } else {
      this.isMoving = false;

      // Idle timer
      if (this.aiState === AI_STATE.IDLE) {
        this.idleTimer += dt;
        if (this.idleTimer >= Trashmob.IDLE_WAIT_TIME) {
          this.idleTimer = 0;
        }
      }
    }

    // Bomb-specific countdown logic (runs parallel to movement)
    switch (this.bombState) {
      case 'idle':
        // Check if player is within activation radius
        if (distanceToPlayer <= BOMB_ACTIVATION_RADIUS && !this.bombActivatedOnce) {
          this.armBomb(room.visible, tileSize);
        }
        break;

      case 'armed':
        // Update countdown timer
        this.bombTimer -= dt;

        // Update glow pulsing animation
        this.bombGlowPhase += dt * 5; // Fast pulsing

        // Check if timer expired
        if (this.bombTimer <= 0) {
          this.explode(player, tileSize, room.visible);
        }
        break;

      case 'exploding':
        // Explosion handled, death animation will play
        this.isMoving = false;
        break;
    }
  }

  /**
   * Arm the bomb (start countdown)
   */
  private armBomb(roomVisible: boolean, tileSize: number): void {
    this.bombState = 'armed';
    this.bombTimer = BOMB_COUNTDOWN_DURATION;
    this.bombActivatedOnce = true;
    this.bombGlowPhase = 0;

    // Spawn warning particles if room is visible
    if (roomVisible) {
      const particleSystem = getParticleSystem();
      const centerX = this.x + tileSize / 2;
      const centerY = this.y + tileSize / 2;
      particleSystem.spawnWarning(centerX, centerY, BOMB_GLOW_RADIUS, 12);
    }
  }

  /**
   * Trigger explosion
   */
  private explode(player: Player, tileSize: number, roomVisible: boolean): void {
    this.bombState = 'exploding';

    // Calculate center position
    const bombCenterX = this.x + tileSize / 2;
    const bombCenterY = this.y + tileSize / 2;

    // Spawn explosion effects (only if room visible)
    if (roomVisible) {
      const particleSystem = getParticleSystem();
      const screenShake = getScreenShake();

      // Large ash burst (explosion cloud)
      particleSystem.spawnAsh(
        bombCenterX,
        bombCenterY,
        tileSize * 3, // Large spread
        tileSize * 3,
        60 // Many particles
      );

      // Sparks radiating outward
      particleSystem.spawnSparks(bombCenterX, bombCenterY, 24);

      // Strong screen shake
      screenShake.triggerStrong();
    }

    // Calculate damage to player based on distance
    const playerCenterX = player.x + tileSize / 2;
    const playerCenterY = player.y + tileSize / 2;
    const dx = playerCenterX - bombCenterX;
    const dy = playerCenterY - bombCenterY;
    const distancePixels = Math.sqrt(dx * dx + dy * dy);
    const distanceTiles = distancePixels / tileSize;

    // Only damage if within explosion radius
    if (distanceTiles <= BOMB_EXPLOSION_RADIUS) {
      // Calculate damage: max at center, scales linearly to min at edge
      const damageRatio = 1 - distanceTiles / BOMB_EXPLOSION_RADIUS;
      const damage = Math.round(
        BOMB_MIN_DAMAGE + (BOMB_MAX_DAMAGE - BOMB_MIN_DAMAGE) * damageRatio
      );

      // Mark that bomb dealt damage (GameEngine will read canDealDamage)
      this.canDealDamage = true;
      // Store damage amount temporarily (GameEngine needs to read this)
      this.storedDamage = damage;
    }

    // Start death animation
    this.die();
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
    // Don't draw if completely dead (after death animation)
    if (!this.alive && !this.isDying) return;

    // Save context for transformations during death
    ctx.save();

    // Apply fade-out during death animation
    if (this.isDying) {
      ctx.globalAlpha = this.deathAlpha;
    }

    // Update sprite animation
    this.spriteRenderer.update(dt);

    // Calculate sprite size (with shrink effect during death)
    const baseSize = tileSize * 0.8;
    const spriteSize = this.isDying ? baseSize * this.deathScale : baseSize;

    // Center the sprite (adjust for shrinking)
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

    // Determine current animation based on state
    let animation: TrashmobAnimationType = 'idle';
    if (this.isDying) {
      animation = 'death';
    } else if (this.isAttacking || this.isShooting) {
      animation = 'attack';
    } else if (this.isLeaping) {
      animation = 'dash';
    } else if (this.hopPhase !== 'grounded' && this.type === TRASHMOB_TYPE.SLIME) {
      animation = 'jump';
    } else if (this.isMoving) {
      animation = 'move';
    }

    // Draw pixel-art sprite
    this.spriteRenderer.draw(
      ctx,
      this.type,
      this.x + offsetX,
      this.y + offsetY,
      spriteSize,
      animation,
      this.direction
    );

    // Don't draw UI elements during death animation
    if (!this.isDying) {
      // BOMB: Draw countdown and glow ring
      if (this.type === TRASHMOB_TYPE.BOMB && this.bombState === 'armed') {
        this.drawBombCountdown(ctx, tileSize);
      }

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

    // Restore context
    ctx.restore();
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

  /**
   * Draw bomb countdown timer and pulsing glow ring
   */
  private drawBombCountdown(ctx: CanvasRenderingContext2D, tileSize: number): void {
    const centerX = this.x + tileSize / 2;
    const centerY = this.y + tileSize / 2;
    const spriteSize = tileSize * 0.8;

    // Calculate pulsing glow
    const pulseIntensity = Math.sin(this.bombGlowPhase) * 0.3 + 0.7; // 0.4 to 1.0

    // Color shifts from orange (3s) → red (0s)
    const timeRatio = this.bombTimer / BOMB_COUNTDOWN_DURATION; // 1.0 to 0.0
    const red = 255;
    const green = Math.floor(100 * timeRatio); // Orange at start, pure red at end
    const glowColor = `rgba(${red}, ${green}, 0, ${pulseIntensity * 0.6})`;

    // Draw outer glow ring (larger, more transparent)
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, BOMB_GLOW_RADIUS * pulseIntensity, 0, Math.PI * 2);
    ctx.stroke();

    // Draw inner glow ring (smaller, brighter)
    ctx.strokeStyle = `rgba(${red}, ${green}, 0, ${pulseIntensity})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, (BOMB_GLOW_RADIUS - 10) * pulseIntensity, 0, Math.PI * 2);
    ctx.stroke();

    // Draw countdown number above sprite
    const countdownNumber = Math.ceil(this.bombTimer);
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Number glow (shadow)
    ctx.shadowColor = `rgba(${red}, ${green}, 0, 0.8)`;
    ctx.shadowBlur = 8;

    // Number outline (black)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(countdownNumber.toString(), centerX, centerY - spriteSize * 0.7);

    // Number fill (bright color)
    ctx.fillStyle = `rgb(${red}, ${green + 50}, 0)`;
    ctx.fillText(countdownNumber.toString(), centerX, centerY - spriteSize * 0.7);

    // Reset shadow
    ctx.shadowBlur = 0;
  }
}

/**
 * Create a random trashmob at position
 */
export function createRandomTrashmob(x: number, y: number, roomId: number): Trashmob {
  const types: TrashmobType[] = [TRASHMOB_TYPE.RAT, TRASHMOB_TYPE.SLIME, TRASHMOB_TYPE.BAT, TRASHMOB_TYPE.MAGE];
  const randomType = types[Math.floor(Math.random() * types.length)];
  return new Trashmob(x, y, randomType, roomId);
}
