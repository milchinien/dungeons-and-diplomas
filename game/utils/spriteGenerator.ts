import Phaser from "phaser";

/**
 * Generates an animated character sprite dynamically
 * Creates individual sprite frames that Phaser can animate
 */
export function generatePlayerSprite(
  scene: Phaser.Scene,
  textureKey: string = "player-sprite"
): void {
  const frameWidth = 64;
  const frameHeight = 64;
  const numFrames = 6;
  const spriteSize = 50;

  // Create each frame as an individual canvas texture
  for (let frame = 0; frame < numFrames; frame++) {
    const canvas = document.createElement("canvas");
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    const ctx = canvas.getContext("2d")!;

    // Clear canvas with transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, frameWidth, frameHeight);

    // Calculate position for character within frame
    const characterX = frameWidth / 2;
    const characterY = frameHeight / 2;

    // Draw bobbing idle animation - character moves up/down slightly
    const bobOffset = Math.sin((frame / numFrames) * Math.PI * 2) * 5;

    // Draw character body
    drawCharacter(ctx, characterX, characterY + bobOffset, spriteSize);

    // Add frame to texture
    const frameKey = `${textureKey}_${frame}`;
    scene.textures.addCanvas(frameKey, canvas);
  }
}

/**
 * Draws a simple character sprite
 */
function drawCharacter(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number
): void {
  const radius = size / 2;

  // Head (light blue circle)
  ctx.fillStyle = "#4da6ff";
  ctx.beginPath();
  ctx.arc(centerX, centerY - radius * 0.4, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#000000";
  const eyeRadius = radius * 0.08;
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.15, centerY - radius * 0.5, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX + radius * 0.15, centerY - radius * 0.5, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Body (darker blue rectangle)
  ctx.fillStyle = "#0066cc";
  ctx.fillRect(
    centerX - radius * 0.25,
    centerY - radius * 0.1,
    radius * 0.5,
    radius * 0.6
  );

  // Left arm
  ctx.fillStyle = "#4da6ff";
  ctx.fillRect(centerX - radius * 0.35, centerY, radius * 0.15, radius * 0.5);

  // Right arm
  ctx.fillStyle = "#4da6ff";
  ctx.fillRect(centerX + radius * 0.2, centerY, radius * 0.15, radius * 0.5);

  // Legs
  ctx.fillStyle = "#003d99";
  ctx.fillRect(
    centerX - radius * 0.15,
    centerY + radius * 0.4,
    radius * 0.12,
    radius * 0.5
  );
  ctx.fillRect(
    centerX + radius * 0.03,
    centerY + radius * 0.4,
    radius * 0.12,
    radius * 0.5
  );
}

/**
 * Creates animation configuration for the sprite
 */
export function createPlayerAnimationConfig(): Phaser.Types.Animations.PlayAnimationConfig {
  return {
    key: "player-idle",
    duration: 3000,
    repeat: -1,
    repeatDelay: 0,
  };
}
