import { DIRECTION, ANIM_SPEEDS, SPRITESHEET_CONFIGS } from './constants';
import type { Direction, AnimationType } from './constants';

export class SpriteSheetLoader {
  spritesheetName: string;
  image: HTMLImageElement | null = null;
  config: any = null;
  loaded: boolean = false;
  currentAnimation: AnimationType | null = null;
  currentDirection: Direction = DIRECTION.DOWN;
  currentFrame: number = 0;
  animTimer: number = 0;
  animSpeed: number = ANIM_SPEEDS.default;
  stopOnLastFrame: boolean = false; // For death animations
  maxFrame: number | null = null; // Limit animation to specific frame count (null = all frames)

  constructor(spritesheetName: string) {
    this.spritesheetName = spritesheetName;
  }

  async load(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Get config from embedded configurations
      this.config = (SPRITESHEET_CONFIGS as any)[this.spritesheetName];
      if (!this.config) {
        reject(new Error(`No configuration found for ${this.spritesheetName}`));
        return;
      }

      // Load image
      this.image = new Image();
      this.image.onload = () => {
        this.loaded = true;
        resolve();
      };
      this.image.onerror = () => reject(new Error(`Failed to load ${this.spritesheetName}.png`));
      this.image.src = `/Assets/${this.spritesheetName}.png`;
    });
  }

  playAnimation(direction: Direction, animationName: AnimationType) {
    this.currentDirection = direction;

    // Reset frame if animation changed
    if (this.currentAnimation !== animationName) {
      this.currentAnimation = animationName;
      this.currentFrame = 0;
      this.animTimer = 0;

      // Set animation speed based on animation type
      this.animSpeed = (ANIM_SPEEDS as any)[animationName] || ANIM_SPEEDS.default;
    }
  }

  update(dt: number) {
    if (!this.loaded || !this.currentAnimation) return;

    this.animTimer += dt;

    const anim = this.config.animations.find((a: any) => a.name === this.currentAnimation);
    if (!anim) return;

    // Determine effective frame count (limited by maxFrame if set)
    const effectiveFrameCount = this.maxFrame !== null
      ? Math.min(this.maxFrame, anim.animcount)
      : anim.animcount;

    if (this.animTimer >= this.animSpeed) {
      this.animTimer = 0;

      if (this.stopOnLastFrame && this.currentFrame >= effectiveFrameCount - 1) {
        // Stay on last frame
        this.currentFrame = effectiveFrameCount - 1;
      } else {
        this.currentFrame = (this.currentFrame + 1) % effectiveFrameCount;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
    if (!this.loaded || !this.currentAnimation || !this.image) return;

    const anim = this.config.animations.find((a: any) => a.name === this.currentAnimation);
    if (!anim) return;

    // Determine row based on animation and direction
    let row = anim.firstrow;

    if (anim.rowcount === 4) {
      // Multi-directional animation
      switch (this.currentDirection) {
        case DIRECTION.UP:
          row = anim.firstrow + 0;
          break;
        case DIRECTION.LEFT:
          row = anim.firstrow + 1;
          break;
        case DIRECTION.DOWN:
          row = anim.firstrow + 2;
          break;
        case DIRECTION.RIGHT:
          row = anim.firstrow + 3;
          break;
      }
    } else {
      // Single row animation (same for all directions)
      row = anim.firstrow;
    }

    const frameWidth = this.config.frameWidth;
    const frameHeight = this.config.frameHeight;

    const srcX = this.currentFrame * frameWidth;
    const srcY = row * frameHeight;

    ctx.drawImage(
      this.image,
      srcX, srcY,
      frameWidth, frameHeight,
      x, y,
      width, height
    );
  }
}
