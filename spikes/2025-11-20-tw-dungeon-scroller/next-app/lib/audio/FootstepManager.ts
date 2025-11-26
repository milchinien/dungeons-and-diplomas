/**
 * FootstepManager - Handles footstep sounds for player and enemies
 *
 * Features:
 * - Player footstep sounds when moving
 * - Enemy footstep sounds with distance-based volume
 * - Deeper/darker sounds for boss enemies (high level)
 * - Web Audio API for pitch shifting and volume control
 */

import type { Player } from '../enemy/types';
import type { Enemy } from '../enemy/Enemy';

interface FootstepSource {
  id: string;
  x: number;
  y: number;
  isMoving: boolean;
  isBoss?: boolean;
  level?: number;
}

export class FootstepManager {
  private audioContext: AudioContext | null = null;
  private footstepBuffer: AudioBuffer | null = null;
  private isLoaded: boolean = false;

  // Timing for footsteps
  private readonly PLAYER_STEP_INTERVAL = 0.25; // seconds between steps
  private readonly ENEMY_STEP_INTERVAL = 0.35; // slightly slower for enemies
  private readonly BOSS_THRESHOLD = 8; // level 8+ is considered a boss

  // Distance-based volume
  private readonly MAX_AUDIBLE_DISTANCE = 10; // tiles
  private readonly MIN_VOLUME = 0.02;
  private readonly MAX_VOLUME = 0.4;

  // Track last step times
  private lastStepTimes: Map<string, number> = new Map();

  // Currently playing audio nodes (for cleanup)
  private activeNodes: Set<AudioBufferSourceNode> = new Set();

  /**
   * Initialize the audio context and load the footstep sound
   */
  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const response = await fetch('/Assets/Sound/Footstep.wav');
      const arrayBuffer = await response.arrayBuffer();
      this.footstepBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.isLoaded = true;
    } catch (error) {
      console.warn('Failed to load footstep sound:', error);
    }
  }

  /**
   * Resume audio context (needed after user interaction)
   */
  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Play a footstep sound with optional pitch shift
   * @param volume Volume (0-1)
   * @param pitchShift Playback rate (1 = normal, <1 = deeper, >1 = higher)
   * @param pan Stereo pan (-1 = left, 0 = center, 1 = right)
   */
  private playFootstep(volume: number, pitchShift: number = 1.0, pan: number = 0): void {
    if (!this.audioContext || !this.footstepBuffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = this.footstepBuffer;
    source.playbackRate.value = pitchShift;

    // Create gain node for volume
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;

    // Create stereo panner for spatial audio
    const pannerNode = this.audioContext.createStereoPanner();
    pannerNode.pan.value = pan;

    // Connect: source -> gain -> panner -> destination
    source.connect(gainNode);
    gainNode.connect(pannerNode);
    pannerNode.connect(this.audioContext.destination);

    // Track active nodes for cleanup
    this.activeNodes.add(source);
    source.onended = () => {
      this.activeNodes.delete(source);
    };

    source.start(0);
  }

  /**
   * Calculate volume based on distance to player
   */
  private calculateDistanceVolume(
    sourceX: number,
    sourceY: number,
    playerX: number,
    playerY: number,
    tileSize: number
  ): number {
    const dx = (sourceX - playerX) / tileSize;
    const dy = (sourceY - playerY) / tileSize;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.MAX_AUDIBLE_DISTANCE) return 0;

    // Linear falloff
    const normalizedDistance = distance / this.MAX_AUDIBLE_DISTANCE;
    return this.MIN_VOLUME + (this.MAX_VOLUME - this.MIN_VOLUME) * (1 - normalizedDistance);
  }

  /**
   * Calculate stereo pan based on relative position
   */
  private calculatePan(
    sourceX: number,
    playerX: number,
    tileSize: number
  ): number {
    const dx = (sourceX - playerX) / tileSize;
    // Clamp to -1 to 1, with some distance scaling
    return Math.max(-1, Math.min(1, dx / 5));
  }

  /**
   * Check if enough time has passed for a new step
   */
  private canPlayStep(id: string, interval: number, currentTime: number): boolean {
    const lastStep = this.lastStepTimes.get(id) || 0;
    if (currentTime - lastStep >= interval) {
      this.lastStepTimes.set(id, currentTime);
      return true;
    }
    return false;
  }

  /**
   * Update player footsteps
   */
  updatePlayer(player: Player, currentTime: number): void {
    if (!this.isLoaded || !player.isMoving) return;

    if (this.canPlayStep('player', this.PLAYER_STEP_INTERVAL, currentTime)) {
      // Player footsteps: normal pitch, full volume, centered
      this.playFootstep(this.MAX_VOLUME, 1.0, 0);
    }
  }

  /**
   * Update enemy footsteps with distance-based volume
   */
  updateEnemies(
    enemies: Enemy[],
    player: Player,
    tileSize: number,
    currentTime: number
  ): void {
    if (!this.isLoaded) return;

    for (const enemy of enemies) {
      if (!enemy.alive || !enemy.isMoving) continue;

      const id = `enemy_${enemy.x}_${enemy.y}_${enemy.level}`;
      const isBoss = enemy.level >= this.BOSS_THRESHOLD;
      const interval = isBoss ? this.ENEMY_STEP_INTERVAL * 1.2 : this.ENEMY_STEP_INTERVAL;

      if (this.canPlayStep(id, interval, currentTime)) {
        const volume = this.calculateDistanceVolume(
          enemy.x,
          enemy.y,
          player.x,
          player.y,
          tileSize
        );

        if (volume > 0) {
          // Boss enemies: deeper pitch (0.6-0.7), regular enemies: slightly varied (0.9-1.1)
          let pitchShift: number;
          if (isBoss) {
            pitchShift = 0.6 + Math.random() * 0.1; // 0.6-0.7 for deeper sound
          } else {
            pitchShift = 0.9 + Math.random() * 0.2; // 0.9-1.1 for variation
          }

          const pan = this.calculatePan(enemy.x, player.x, tileSize);

          // Bosses are slightly louder
          const adjustedVolume = isBoss ? volume * 1.3 : volume;

          this.playFootstep(Math.min(adjustedVolume, this.MAX_VOLUME), pitchShift, pan);
        }
      }
    }
  }

  /**
   * Update all footsteps (call from game loop)
   */
  update(
    player: Player,
    enemies: Enemy[],
    tileSize: number,
    currentTime: number
  ): void {
    this.updatePlayer(player, currentTime);
    this.updateEnemies(enemies, player, tileSize, currentTime);
  }

  /**
   * Clean up and stop all sounds
   */
  dispose(): void {
    this.activeNodes.forEach(node => {
      try {
        node.stop();
      } catch {
        // Ignore if already stopped
      }
    });
    this.activeNodes.clear();
    this.lastStepTimes.clear();

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isLoaded = false;
  }
}

// Singleton instance for global access
let footstepManagerInstance: FootstepManager | null = null;

export function getFootstepManager(): FootstepManager {
  if (!footstepManagerInstance) {
    footstepManagerInstance = new FootstepManager();
  }
  return footstepManagerInstance;
}

export function disposeFootstepManager(): void {
  if (footstepManagerInstance) {
    footstepManagerInstance.dispose();
    footstepManagerInstance = null;
  }
}
