import Phaser from "phaser";

/**
 * Asset configuration and loading utilities for the game
 */

export interface SpriteFrameConfig {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}

/**
 * Enemy sprite configurations
 * Each sprite sheet is organized in rows for different directions/animations
 */
export const ENEMY_SPRITES: Record<string, SpriteFrameConfig> = {
  skeleton: {
    key: "enemy-skeleton",
    path: "/sprites/skeleton-sheet.png",
    frameWidth: 350,
    frameHeight: 210,
    frameCount: 30, // 10 frames per row × 3 rows
  },
};

/**
 * Load all enemy sprite sheets into the game
 */
export function loadEnemySprites(scene: Phaser.Scene): void {
  // Load skeleton sprite sheet
  // Frame dimensions: 210x210px
  // Layout: 10 columns × 3 rows (30 total frames)
  // First row (idle animation): frames 0-2
  scene.load.spritesheet("enemy-skeleton", ENEMY_SPRITES.skeleton.path, {
    frameWidth: ENEMY_SPRITES.skeleton.frameWidth,
    frameHeight: ENEMY_SPRITES.skeleton.frameHeight,
  });
}

/**
 * Create animations for enemy sprites
 */
export function createEnemyAnimations(scene: Phaser.Scene): void {
  // Skeleton idle animation (first row, frames 0-2)
  if (!scene.anims.exists("skeleton-idle")) {
    scene.anims.create({
      key: "skeleton-idle",
      frames: scene.anims.generateFrameNumbers("enemy-skeleton", {
        start: 0,
        end: 2,
      }),
      frameRate: 6,
      repeat: -1,
    });
  }

  // Skeleton walking animation (second row, frames 10-12)
  if (!scene.anims.exists("skeleton-walk")) {
    scene.anims.create({
      key: "skeleton-walk",
      frames: scene.anims.generateFrameNumbers("enemy-skeleton", {
        start: 10,
        end: 12,
      }),
      frameRate: 8,
      repeat: -1,
    });
  }
}
