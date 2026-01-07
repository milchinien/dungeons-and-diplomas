// =============================================================================
// Effect System Types
// =============================================================================

/**
 * Particle quality settings
 */
export type ParticleQuality = 'off' | 'low' | 'medium' | 'high';

/**
 * Particle quality limits
 */
export const PARTICLE_LIMITS: Record<ParticleQuality, number> = {
  off: 0,
  low: 20,
  medium: 50,
  high: 100
};

/**
 * Single particle instance
 */
export interface Particle {
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  life: number; // remaining life (0-1)
  maxLife: number; // initial life
  size: number;
  color: string;
  alpha: number;
  type: ParticleType;
  gravity?: number;
  friction?: number;
  rotation?: number; // rotation angle in radians (for slash particles)
  length?: number; // length of line (for slash particles)
}

/**
 * Particle types
 */
export type ParticleType =
  | 'dust'        // Walking dust
  | 'spark'       // Hit sparks (star-shaped)
  | 'damage'      // Player damage (red)
  | 'glitter'     // Item glitter
  | 'roomReveal'  // Room discovery effect
  | 'ash'         // Enemy death ash particles
  | 'slash'       // Melee attack slash effect
  | 'warning';    // Attack wind-up warning

/**
 * Screen shake configuration
 */
export interface ScreenShake {
  intensity: number;
  duration: number;
  elapsed: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Room transition configuration
 */
export interface RoomTransition {
  active: boolean;
  progress: number; // 0-1
  duration: number; // seconds
  direction: 'left' | 'right' | 'up' | 'down';
  fromRoomId: number;
  toRoomId: number;
  // Room bounds in pixels (for room-specific overlay)
  roomX: number;
  roomY: number;
  roomWidth: number;
  roomHeight: number;
}

/**
 * Effect system settings
 */
export interface EffectSettings {
  particleQuality: ParticleQuality;
  screenShakeEnabled: boolean;
  transitionsEnabled: boolean;
}

/**
 * Default effect settings
 */
export const DEFAULT_EFFECT_SETTINGS: EffectSettings = {
  particleQuality: 'medium',
  screenShakeEnabled: true,
  transitionsEnabled: true
};
