/**
 * Fireball Projectile
 *
 * Represents a fireball shot by MAGE trashmobs.
 * Travels in a straight line, damages player on contact.
 */

import type { TileType } from '../constants';
import { FIREBALL_SPEED, FIREBALL_DAMAGE, FIREBALL_SIZE, TILE } from '../constants';

export class Fireball {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public angle: number;
  public size: number;
  public damage: number;
  public alive: boolean = true;
  public lifetime: number = 0; // Track how long fireball has existed
  public maxLifetime: number = 5; // Fireballs disappear after 5 seconds

  /**
   * Create a new fireball
   * @param x Starting X position (world coordinates)
   * @param y Starting Y position (world coordinates)
   * @param angle Direction to travel (radians)
   * @param tileSize Size of a tile in pixels
   */
  constructor(x: number, y: number, angle: number, tileSize: number) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.size = tileSize * FIREBALL_SIZE; // Big fireballs (0.8 tiles)
    this.damage = FIREBALL_DAMAGE;

    // Calculate velocity components from angle
    const speed = FIREBALL_SPEED * tileSize; // tiles/second -> pixels/second
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  /**
   * Update fireball position and check lifetime
   * @param dt Delta time in seconds
   * @param dungeon Dungeon grid for wall collision
   * @param tileSize Size of a tile in pixels
   * @param doorStates Optional map of door states (true = open, false/undefined = closed)
   */
  update(dt: number, dungeon: TileType[][], tileSize: number, doorStates?: Map<string, boolean>): void {
    if (!this.alive) return;

    // Update lifetime
    this.lifetime += dt;
    if (this.lifetime >= this.maxLifetime) {
      this.alive = false;
      return;
    }

    // Move fireball
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Check wall collision
    const centerX = Math.floor((this.x + this.size / 2) / tileSize);
    const centerY = Math.floor((this.y + this.size / 2) / tileSize);

    // Check bounds
    if (centerY < 0 || centerY >= dungeon.length ||
        centerX < 0 || centerX >= dungeon[0]?.length) {
      this.alive = false;
      return;
    }

    // Check wall/door collision (fireballs can't pass through walls or closed doors)
    const tile = dungeon[centerY][centerX];
    if (tile === TILE.WALL || tile === TILE.EMPTY) {
      this.alive = false;
      return;
    }

    // For doors, check if they are open or closed
    if (tile === TILE.DOOR) {
      const isOpen = doorStates?.get(`${centerX},${centerY}`) ?? false;
      if (!isOpen) {
        // Closed door blocks fireball
        this.alive = false;
        return;
      }
      // Open door - fireball passes through
    }
  }

  /**
   * Check collision with player
   * @param playerX Player's X position
   * @param playerY Player's Y position
   * @param playerSize Player's size
   * @returns true if fireball hit player
   */
  checkPlayerCollision(playerX: number, playerY: number, playerSize: number): boolean {
    if (!this.alive) return false;

    // Simple circle-circle collision
    const fireballCenterX = this.x + this.size / 2;
    const fireballCenterY = this.y + this.size / 2;
    const playerCenterX = playerX + playerSize / 2;
    const playerCenterY = playerY + playerSize / 2;

    const dx = fireballCenterX - playerCenterX;
    const dy = fireballCenterY - playerCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const fireballRadius = this.size / 2;
    const playerRadius = playerSize / 2;

    if (distance < fireballRadius + playerRadius) {
      this.alive = false; // Fireball is consumed on hit
      return true;
    }

    return false;
  }

  /**
   * Draw the fireball
   * @param ctx Canvas rendering context
   */
  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    const centerX = this.x + this.size / 2;
    const centerY = this.y + this.size / 2;
    const radius = this.size / 2;

    ctx.save();

    // Outer glow (fades over lifetime)
    const glowAlpha = 1 - (this.lifetime / this.maxLifetime) * 0.3;
    const gradient1 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
    gradient1.addColorStop(0, `rgba(255, 165, 0, ${glowAlpha})`);
    gradient1.addColorStop(0.5, `rgba(255, 100, 0, ${glowAlpha * 0.5})`);
    gradient1.addColorStop(1, 'rgba(255, 50, 0, 0)');

    ctx.fillStyle = gradient1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Main fireball body
    const gradient2 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient2.addColorStop(0, '#FFF');      // Bright white center
    gradient2.addColorStop(0.3, '#FFD700'); // Gold
    gradient2.addColorStop(0.6, '#FF6B1A'); // Orange
    gradient2.addColorStop(1, '#FF0000');   // Red edge

    ctx.fillStyle = gradient2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Hot core
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
