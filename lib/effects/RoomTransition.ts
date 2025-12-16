// =============================================================================
// Room Transition System - Circular reveal effect from player position
// =============================================================================

import type { Room } from '../constants';
import type { Player } from '../enemy';
import { getFogOfWarRenderer } from './FogOfWarRenderer';

/**
 * Circular reveal transition state
 */
interface CircularReveal {
  active: boolean;
  progress: number;
  duration: number;
  // Room bounds in pixels
  roomX: number;
  roomY: number;
  roomWidth: number;
  roomHeight: number;
  // Player position (center of reveal) in pixels
  centerX: number;
  centerY: number;
  // Maximum radius to reach all corners
  maxRadius: number;
}

/**
 * Room transition manager - circular reveal effect from player position
 */
export class RoomTransitionSystem {
  private reveal: CircularReveal | null = null;
  private enabled: boolean = true;
  private duration: number = 0.35; // Fast reveal (0.35 seconds)

  /**
   * Enable or disable transitions
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.reveal = null;
    }
  }

  /**
   * Check if transitions are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set transition duration
   */
  setDuration(seconds: number): void {
    this.duration = Math.max(0.1, Math.min(3, seconds));
  }

  /**
   * Start a circular room reveal from player position
   * @param room - The room being revealed
   * @param player - Player position (center of reveal)
   * @param tileSize - Tile size in pixels
   */
  startCircularReveal(room: Room, player: Player, tileSize: number): void {
    if (!this.enabled) return;

    // Calculate room bounds in pixels
    const roomX = room.x * tileSize;
    const roomY = room.y * tileSize;
    const roomWidth = room.width * tileSize;
    const roomHeight = room.height * tileSize;

    // Player center position
    const centerX = player.x + tileSize / 2;
    const centerY = player.y + tileSize / 2;

    // Calculate max radius to reach all corners
    const maxRadius = this.calculateMaxRadius(
      centerX, centerY,
      roomX, roomY,
      roomWidth, roomHeight
    );

    this.reveal = {
      active: true,
      progress: 0,
      duration: this.duration,
      roomX,
      roomY,
      roomWidth,
      roomHeight,
      centerX,
      centerY,
      maxRadius
    };
  }

  /**
   * Legacy method for compatibility
   */
  startRoomReveal(
    roomX: number,
    roomY: number,
    roomWidth: number,
    roomHeight: number
  ): void {
    if (!this.enabled) return;

    // Use center of room as fallback
    const centerX = roomX + roomWidth / 2;
    const centerY = roomY + roomHeight / 2;

    const maxRadius = this.calculateMaxRadius(
      centerX, centerY,
      roomX, roomY,
      roomWidth, roomHeight
    );

    this.reveal = {
      active: true,
      progress: 0,
      duration: this.duration,
      roomX,
      roomY,
      roomWidth,
      roomHeight,
      centerX,
      centerY,
      maxRadius
    };
  }

  /**
   * Calculate the maximum radius needed to reveal entire room from a point
   */
  private calculateMaxRadius(
    centerX: number,
    centerY: number,
    roomX: number,
    roomY: number,
    roomWidth: number,
    roomHeight: number
  ): number {
    // Calculate distance to all four corners
    const corners = [
      { x: roomX, y: roomY },
      { x: roomX + roomWidth, y: roomY },
      { x: roomX, y: roomY + roomHeight },
      { x: roomX + roomWidth, y: roomY + roomHeight }
    ];

    let maxDist = 0;
    for (const corner of corners) {
      const dx = corner.x - centerX;
      const dy = corner.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      maxDist = Math.max(maxDist, dist);
    }

    return maxDist;
  }

  /**
   * Legacy start method (kept for compatibility)
   */
  start(_fromRoomId: number, _toRoomId: number): void {
    // No longer used
  }

  /**
   * Update the transition
   */
  update(dt: number): void {
    if (!this.reveal || !this.reveal.active) return;

    this.reveal.progress += dt / this.reveal.duration;

    if (this.reveal.progress >= 1) {
      this.reveal.active = false;
      this.reveal = null;
    }
  }

  /**
   * Check if transition is active
   */
  isActive(): boolean {
    return this.reveal?.active ?? false;
  }

  /**
   * Get current transition progress (0-1)
   */
  getProgress(): number {
    return this.reveal?.progress ?? 0;
  }

  /**
   * Get current reveal radius
   */
  getCurrentRadius(): number {
    if (!this.reveal) return 0;
    const eased = this.easeOutCubic(this.reveal.progress);
    return this.reveal.maxRadius * eased;
  }

  /**
   * Render the circular reveal transition
   * Uses clip path to show revealed area and fog for unrevealed
   * @param ctx - Canvas context (should be in world-space, already translated by camera)
   */
  renderInWorldSpace(ctx: CanvasRenderingContext2D): void {
    if (!this.reveal || !this.reveal.active) return;

    const { progress, roomX, roomY, roomWidth, roomHeight, centerX, centerY, maxRadius } = this.reveal;

    // Ease out for fast start, smooth end
    const eased = this.easeOutCubic(progress);
    const currentRadius = maxRadius * eased;

    ctx.save();

    // Clip to room bounds first
    ctx.beginPath();
    ctx.rect(roomX, roomY, roomWidth, roomHeight);
    ctx.clip();

    // Create path for the area OUTSIDE the reveal circle (but inside room)
    ctx.beginPath();
    ctx.rect(roomX, roomY, roomWidth, roomHeight);
    // Cut out the revealed circle (counter-clockwise for subtraction)
    ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2, true);
    ctx.closePath();

    // Fill the unrevealed area with animated fog
    const fogRenderer = getFogOfWarRenderer();
    const fogIntensity = 1 - eased * 0.3; // Fog fades slightly as reveal progresses

    // Draw base dark layer
    ctx.fillStyle = `rgba(8, 8, 15, ${fogIntensity * 0.9})`;
    ctx.fill();

    // Add some animated texture on top
    const wave = Math.sin(fogRenderer.getTime() * 2) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(20, 20, 35, ${fogIntensity * 0.3 * wave})`;
    ctx.fill();

    ctx.restore();
  }

  /**
   * Legacy render method
   */
  render(_ctx: CanvasRenderingContext2D, _width: number, _height: number): void {
    // Use renderInWorldSpace instead
  }

  /**
   * Get current direction (legacy compatibility)
   */
  getDirection(): 'left' | 'right' | 'up' | 'down' | null {
    return null; // No longer using directional reveals
  }

  /**
   * Ease out cubic function (faster than quadratic)
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Force stop the transition
   */
  stop(): void {
    this.reveal = null;
  }
}

// Singleton instance
let roomTransitionInstance: RoomTransitionSystem | null = null;

/**
 * Get the global room transition instance
 */
export function getRoomTransition(): RoomTransitionSystem {
  if (!roomTransitionInstance) {
    roomTransitionInstance = new RoomTransitionSystem();
  }
  return roomTransitionInstance;
}
