// =============================================================================
// Effects Manager - Central controller for all visual effects
// =============================================================================

import type { ParticleQuality, EffectSettings } from './types';
import { DEFAULT_EFFECT_SETTINGS } from './types';
import { getParticleSystem } from './ParticleSystem';
import { getScreenShake } from './ScreenShake';
import { getRoomTransition } from './RoomTransition';
import { getFogOfWarRenderer } from './FogOfWarRenderer';
import type { Room } from '../constants';
import type { Player } from '../enemy';

/**
 * Storage key for effect settings
 */
const STORAGE_KEY = 'dungeons-diplomas-effects';

/**
 * Central effects manager that coordinates all effect systems
 */
export class EffectsManager {
  private settings: EffectSettings;
  private lastPlayerRoom: number = -1;

  constructor() {
    this.settings = this.loadSettings();
    this.applySettings();
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): EffectSettings {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_EFFECT_SETTINGS };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_EFFECT_SETTINGS,
          ...parsed
        };
      }
    } catch (e) {
      console.warn('Failed to load effect settings:', e);
    }

    return { ...DEFAULT_EFFECT_SETTINGS };
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save effect settings:', e);
    }
  }

  /**
   * Apply current settings to all subsystems
   */
  private applySettings(): void {
    getParticleSystem().setQuality(this.settings.particleQuality);
    getScreenShake().setEnabled(this.settings.screenShakeEnabled);
    getRoomTransition().setEnabled(this.settings.transitionsEnabled);
  }

  /**
   * Get current settings
   */
  getSettings(): EffectSettings {
    return { ...this.settings };
  }

  /**
   * Set particle quality
   */
  setParticleQuality(quality: ParticleQuality): void {
    this.settings.particleQuality = quality;
    getParticleSystem().setQuality(quality);
    this.saveSettings();
  }

  /**
   * Set screen shake enabled
   */
  setScreenShakeEnabled(enabled: boolean): void {
    this.settings.screenShakeEnabled = enabled;
    getScreenShake().setEnabled(enabled);
    this.saveSettings();
  }

  /**
   * Set transitions enabled
   */
  setTransitionsEnabled(enabled: boolean): void {
    this.settings.transitionsEnabled = enabled;
    getRoomTransition().setEnabled(enabled);
    this.saveSettings();
  }

  // =========================================================================
  // High-level effect triggers
  // =========================================================================

  /**
   * Trigger effect when player walks
   * @param x - Player center X in world coordinates
   * @param y - Player feet Y in world coordinates
   * @param isMoving - Whether player is moving
   */
  onPlayerWalk(x: number, y: number, isMoving: boolean): void {
    if (!isMoving) return;

    // Only spawn dust occasionally (every few frames)
    if (Math.random() < 0.15) {
      getParticleSystem().spawnDust(x, y);
    }
  }

  /**
   * Trigger effect when player takes damage
   * @param x - Player center X
   * @param y - Player center Y
   * @param damage - Amount of damage taken
   */
  onPlayerDamage(x: number, y: number, damage: number): void {
    // Spawn red damage particles
    getParticleSystem().spawnDamage(x, y, Math.min(damage, 20));

    // Trigger screen shake (subtle for normal damage)
    if (damage >= 10) {
      getScreenShake().triggerSubtle();
    }
  }

  /**
   * Trigger effect when enemy is hit
   * @param x - Hit position X
   * @param y - Hit position Y
   */
  onEnemyHit(x: number, y: number): void {
    // Spawn star-shaped sparks
    getParticleSystem().spawnSparks(x, y, 8);
  }

  /**
   * Trigger effect when trashmob is hit
   * @param x - Hit position X
   * @param y - Hit position Y
   */
  onTrashmobHit(x: number, y: number): void {
    // Smaller spark effect for trashmobs
    getParticleSystem().spawnSparks(x, y, 5);
  }

  /**
   * Spawn glitter effect for an item
   * @param x - Item center X
   * @param y - Item center Y
   */
  onItemGlitter(x: number, y: number): void {
    // Constant glitter - call this regularly for items
    if (Math.random() < 0.1) {
      getParticleSystem().spawnGlitter(x, y);
    }
  }

  /**
   * Check and trigger room transition if player changed rooms
   * Note: Black overlay no longer triggers on every room change,
   * only when discovering NEW rooms (handled in onRoomRevealed)
   * @param currentRoomId - Current room the player is in
   */
  checkRoomTransition(currentRoomId: number): void {
    // Just track room changes, no black overlay here anymore
    this.lastPlayerRoom = currentRoomId;
  }

  /**
   * Trigger room reveal effects (particles + black overlay, only in the new room)
   * Legacy method - use onRoomEntered for new exploration system
   * @param roomX - Room top-left X in tiles
   * @param roomY - Room top-left Y in tiles
   * @param roomWidth - Room width in tiles
   * @param roomHeight - Room height in tiles
   * @param tileSize - Size of a tile in pixels
   */
  onRoomRevealed(
    roomX: number,
    roomY: number,
    roomWidth: number,
    roomHeight: number,
    tileSize: number
  ): void {
    // Convert tile coordinates to pixels
    const pixelX = roomX * tileSize;
    const pixelY = roomY * tileSize;
    const pixelWidth = roomWidth * tileSize;
    const pixelHeight = roomHeight * tileSize;

    // Spawn particles only within the room
    getParticleSystem().spawnRoomReveal(pixelX, pixelY, pixelWidth, pixelHeight, 20);

    // Start black overlay transition only on this room
    getRoomTransition().startRoomReveal(pixelX, pixelY, pixelWidth, pixelHeight);
  }

  /**
   * Trigger circular room reveal when player enters an unexplored room
   * @param room - The room being entered
   * @param player - Player position (center of reveal)
   * @param tileSize - Tile size in pixels
   */
  onRoomEntered(room: Room, player: Player, tileSize: number): void {
    // Convert tile coordinates to pixels for particles
    const pixelX = room.x * tileSize;
    const pixelY = room.y * tileSize;
    const pixelWidth = room.width * tileSize;
    const pixelHeight = room.height * tileSize;

    // Spawn reveal particles within the room
    getParticleSystem().spawnRoomReveal(pixelX, pixelY, pixelWidth, pixelHeight, 15);

    // Start circular reveal from player position
    getRoomTransition().startCircularReveal(room, player, tileSize);
  }

  /**
   * Trigger effect when room is fully explored (all enemies defeated)
   * @param room - The room that was cleared
   * @param tileSize - Tile size in pixels
   */
  onRoomCleared(room: Room, tileSize: number): void {
    // Convert tile coordinates to pixels
    const pixelX = room.x * tileSize;
    const pixelY = room.y * tileSize;
    const pixelWidth = room.width * tileSize;
    const pixelHeight = room.height * tileSize;

    // Spawn celebration particles (gold glitter)
    const centerX = pixelX + pixelWidth / 2;
    const centerY = pixelY + pixelHeight / 2;

    // Spawn multiple glitter particles around room center
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = Math.min(pixelWidth, pixelHeight) / 4;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      getParticleSystem().spawnGlitter(x, y);
    }
  }

  /**
   * Reset room tracking (call on new game)
   */
  resetRoomTracking(): void {
    this.lastPlayerRoom = -1;
  }

  // =========================================================================
  // Update and render
  // =========================================================================

  /**
   * Update all effect systems
   * @param dt - Delta time in seconds
   */
  update(dt: number): void {
    getParticleSystem().update(dt);
    getScreenShake().update(dt);
    getRoomTransition().update(dt);
    getFogOfWarRenderer().update(dt);
  }

  /**
   * Get camera offset from screen shake
   */
  getCameraOffset(): { x: number; y: number } {
    return getScreenShake().getOffset();
  }

  /**
   * Render particles (call after game rendering, before UI)
   */
  renderParticles(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    getParticleSystem().render(ctx, cameraX, cameraY);
  }

  /**
   * Render room transition overlay (legacy - no longer used for room-specific transitions)
   */
  renderTransition(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    getRoomTransition().render(ctx, width, height);
  }

  /**
   * Render room transition overlay in world space (only on room area)
   * Call this inside the camera-translated context
   */
  renderTransitionInWorldSpace(ctx: CanvasRenderingContext2D): void {
    getRoomTransition().renderInWorldSpace(ctx);
  }

  /**
   * Check if transition is blocking gameplay
   */
  isTransitionActive(): boolean {
    return getRoomTransition().isActive();
  }
}

// Singleton instance
let effectsManagerInstance: EffectsManager | null = null;

/**
 * Get the global effects manager instance
 */
export function getEffectsManager(): EffectsManager {
  if (!effectsManagerInstance) {
    effectsManagerInstance = new EffectsManager();
  }
  return effectsManagerInstance;
}
