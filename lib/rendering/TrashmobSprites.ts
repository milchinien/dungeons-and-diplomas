/**
 * Procedural Pixel-Art Sprites for Trashmobs
 *
 * Each sprite is defined as a 2D array of color indices.
 * 0 = transparent, 1+ = color from palette
 *
 * Animations have multiple frames that cycle.
 */

import { TRASHMOB_TYPE } from '../constants';
import type { TrashmobType, Direction, AIStateType } from '../constants';

// Color palettes for each trashmob type
const PALETTES: Record<TrashmobType, string[]> = {
  [TRASHMOB_TYPE.RAT]: [
    'transparent', // 0
    '#4a3728',     // 1 - dark brown (outline)
    '#8b6914',     // 2 - brown (body)
    '#c4a35a',     // 3 - light brown (belly)
    '#ff6b6b',     // 4 - pink (ears, tail)
    '#2d2d2d',     // 5 - dark (eyes)
    '#ffffff',     // 6 - white (eye shine)
  ],
  [TRASHMOB_TYPE.SLIME]: [
    'transparent', // 0
    '#1a5f1a',     // 1 - dark green (outline)
    '#2ecc71',     // 2 - green (body)
    '#7dff7d',     // 3 - light green (highlight)
    '#145214',     // 4 - darker green (shadow)
    '#ffffff',     // 5 - white (eye)
    '#2d2d2d',     // 6 - black (pupil)
  ],
  [TRASHMOB_TYPE.BAT]: [
    'transparent', // 0
    '#1a1a2e',     // 1 - dark purple (outline)
    '#4a4a6a',     // 2 - purple (body)
    '#6a6a8a',     // 3 - light purple (wings)
    '#ff4757',     // 4 - red (eyes)
    '#2d2d2d',     // 5 - dark
    '#ffa502',     // 6 - orange (eye glow)
  ],
};

// Sprite frames - 12x12 pixels each
// Each trashmob has idle and move animations

const RAT_FRAMES = {
  idle: [
    // Frame 1 - sitting
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,4,4,0,0,4,4,0,0,0],
      [0,0,4,4,4,1,1,4,4,4,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,1,2,5,2,2,2,2,5,2,1,0],
      [0,1,2,6,2,3,3,2,6,2,1,0],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [0,0,1,2,3,3,3,3,2,1,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,1,1,0,0,0,0,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,4,4],
    ],
    // Frame 2 - ears twitch
    [
      [0,0,0,4,0,0,0,0,4,0,0,0],
      [0,0,4,4,4,0,0,4,4,4,0,0],
      [0,0,4,4,4,1,1,4,4,4,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,1,2,5,2,2,2,2,5,2,1,0],
      [0,1,2,6,2,3,3,2,6,2,1,0],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [0,0,1,2,3,3,3,3,2,1,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,1,1,0,0,0,0,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,4,4,0],
    ],
  ],
  move: [
    // Frame 1 - running left leg
    [
      [0,0,0,4,4,0,0,4,4,0,0,0],
      [0,0,4,4,4,1,1,4,4,4,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,1,2,5,2,2,2,2,5,2,1,0],
      [0,1,2,6,2,3,3,2,6,2,1,0],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [0,0,1,2,3,3,3,3,2,1,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,1,0,1,0,0,1,0,1,0,0],
      [0,1,0,0,0,0,0,0,0,0,1,0],
      [0,0,0,0,0,0,0,0,0,4,4,4],
    ],
    // Frame 2 - running right leg
    [
      [0,0,0,4,4,0,0,4,4,0,0,0],
      [0,0,4,4,4,1,1,4,4,4,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,1,2,5,2,2,2,2,5,2,1,0],
      [0,1,2,6,2,3,3,2,6,2,1,0],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [0,0,1,2,3,3,3,3,2,1,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,0,1,0,1,1,0,1,0,0,0],
      [0,0,1,0,0,0,0,0,0,1,0,0],
      [0,0,0,0,0,0,0,4,4,4,0,0],
    ],
  ],
};

const SLIME_FRAMES = {
  idle: [
    // Frame 1 - squished
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,1,2,5,2,5,2,2,1,0,0],
      [0,0,1,2,6,2,6,2,2,1,0,0],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [0,1,3,3,2,2,2,2,3,3,1,0],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,4,4,2,2,2,2,2,2,4,4,1],
      [0,1,1,1,1,1,1,1,1,1,1,0],
    ],
    // Frame 2 - stretched
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,1,2,3,3,3,3,2,1,0,0],
      [0,0,1,2,5,2,5,2,2,1,0,0],
      [0,0,1,2,6,2,6,2,2,1,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,0,1,4,4,4,4,1,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
    ],
  ],
  move: [
    // Frame 1 - hop start (squished)
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,1,2,5,2,5,2,2,1,0,0],
      [0,0,1,2,6,2,6,2,2,1,0,0],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [1,2,3,3,2,2,2,2,3,3,2,1],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,4,4,4,2,2,2,2,4,4,4,1],
      [0,1,1,1,1,1,1,1,1,1,1,0],
    ],
    // Frame 2 - hop mid (tall)
    [
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,2,3,3,2,1,0,0,0],
      [0,0,0,1,2,3,3,2,1,0,0,0],
      [0,0,0,1,5,2,5,2,1,0,0,0],
      [0,0,0,1,6,2,6,2,1,0,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,0,0,1,2,2,1,0,0,0,0],
      [0,0,0,0,1,4,4,1,0,0,0,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
    ],
    // Frame 3 - hop land
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,2,3,3,2,1,0,0,0],
      [0,0,1,2,5,2,5,2,2,1,0,0],
      [0,0,1,2,6,2,6,2,2,1,0,0],
      [0,0,1,2,2,2,2,2,2,1,0,0],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [0,1,2,2,2,2,2,2,2,2,1,0],
      [1,2,2,2,2,2,2,2,2,2,2,1],
      [1,4,4,2,2,2,2,2,2,4,4,1],
      [0,1,1,1,1,1,1,1,1,1,1,0],
    ],
  ],
};

const BAT_FRAMES = {
  idle: [
    // Frame 1 - wings folded
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,1,2,4,2,2,4,2,1,0,0],
      [0,0,1,2,6,2,2,6,2,1,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,0,1,2,5,5,2,1,0,0,0],
      [0,0,1,3,2,2,2,2,3,1,0,0],
      [0,1,3,3,1,2,2,1,3,3,1,0],
      [0,1,3,1,0,1,1,0,1,3,1,0],
      [0,0,1,0,0,0,0,0,0,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    // Frame 2 - wings slightly open
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,1,2,4,2,2,4,2,1,0,0],
      [0,0,1,2,6,2,2,6,2,1,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,0,1,2,5,5,2,1,0,0,0],
      [0,1,3,3,2,2,2,2,3,3,1,0],
      [1,3,3,3,1,2,2,1,3,3,3,1],
      [1,3,3,1,0,1,1,0,1,3,3,1],
      [0,1,1,0,0,0,0,0,0,1,1,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
  ],
  move: [
    // Frame 1 - wings up
    [
      [0,1,1,0,0,0,0,0,0,1,1,0],
      [1,3,3,1,0,0,0,0,1,3,3,1],
      [1,3,3,3,1,1,1,1,3,3,3,1],
      [0,1,3,3,2,2,2,2,3,3,1,0],
      [0,0,1,2,4,2,2,4,2,1,0,0],
      [0,0,1,2,6,2,2,6,2,1,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,0,1,2,5,5,2,1,0,0,0],
      [0,0,0,0,1,2,2,1,0,0,0,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    // Frame 2 - wings mid
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,1,1,1,2,2,2,2,1,1,1,0],
      [1,3,3,3,2,2,2,2,3,3,3,1],
      [1,3,3,2,4,2,2,4,2,3,3,1],
      [0,1,1,2,6,2,2,6,2,1,1,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,0,1,2,5,5,2,1,0,0,0],
      [0,0,0,0,1,2,2,1,0,0,0,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
    // Frame 3 - wings down
    [
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,1,2,4,2,2,4,2,1,0,0],
      [0,0,1,2,6,2,2,6,2,1,0,0],
      [0,0,0,1,2,2,2,2,1,0,0,0],
      [0,0,0,1,2,5,5,2,1,0,0,0],
      [0,1,3,3,2,2,2,2,3,3,1,0],
      [1,3,3,3,1,1,1,1,3,3,3,1],
      [1,3,3,1,0,0,0,0,1,3,3,1],
      [0,1,1,0,0,0,0,0,0,1,1,0],
      [0,0,0,0,0,0,0,0,0,0,0,0],
    ],
  ],
};

// All frames organized by type
const SPRITE_FRAMES: Record<TrashmobType, { idle: number[][][]; move: number[][][] }> = {
  [TRASHMOB_TYPE.RAT]: RAT_FRAMES,
  [TRASHMOB_TYPE.SLIME]: SLIME_FRAMES,
  [TRASHMOB_TYPE.BAT]: BAT_FRAMES,
};

// Animation speeds (frames per second)
const ANIMATION_SPEEDS: Record<TrashmobType, { idle: number; move: number }> = {
  [TRASHMOB_TYPE.RAT]: { idle: 2, move: 8 },
  [TRASHMOB_TYPE.SLIME]: { idle: 1.5, move: 4 },
  [TRASHMOB_TYPE.BAT]: { idle: 3, move: 10 },
};

/**
 * Trashmob sprite renderer
 */
export class TrashmobSpriteRenderer {
  private animationTime: number = 0;

  /**
   * Update animation timer
   */
  update(dt: number): void {
    this.animationTime += dt;
  }

  /**
   * Draw a trashmob sprite
   */
  draw(
    ctx: CanvasRenderingContext2D,
    type: TrashmobType,
    x: number,
    y: number,
    size: number,
    isMoving: boolean,
    direction: Direction
  ): void {
    const frames = SPRITE_FRAMES[type];
    const palette = PALETTES[type];
    const speeds = ANIMATION_SPEEDS[type];

    // Select animation
    const animation = isMoving ? frames.move : frames.idle;
    const speed = isMoving ? speeds.move : speeds.idle;

    // Calculate current frame
    const frameIndex = Math.floor(this.animationTime * speed) % animation.length;
    const frame = animation[frameIndex];

    // Calculate pixel size (sprite is 12x12)
    const pixelSize = size / 12;

    // Flip horizontally if facing left
    const flipX = direction === 'left';

    ctx.save();

    if (flipX) {
      ctx.translate(x + size, y);
      ctx.scale(-1, 1);
      x = 0;
      y = 0;
    }

    // Draw each pixel
    for (let py = 0; py < 12; py++) {
      for (let px = 0; px < 12; px++) {
        const colorIndex = frame[py][px];
        if (colorIndex === 0) continue; // Transparent

        const color = palette[colorIndex];
        if (color === 'transparent') continue;

        ctx.fillStyle = color;
        ctx.fillRect(
          Math.floor(x + px * pixelSize),
          Math.floor(y + py * pixelSize),
          Math.ceil(pixelSize),
          Math.ceil(pixelSize)
        );
      }
    }

    ctx.restore();
  }

  /**
   * Get current animation time (for syncing multiple sprites)
   */
  getAnimationTime(): number {
    return this.animationTime;
  }

  /**
   * Set animation time (for individual sprite timing)
   */
  setAnimationTime(time: number): void {
    this.animationTime = time;
  }
}

// Singleton instance for shared animation timing
export const trashmobSpriteRenderer = new TrashmobSpriteRenderer();
