/**
 * Visual effects for shop purchases.
 * Provides animated feedback when items/perks are purchased.
 */

export interface PurchaseAnimation {
  startX: number;
  startY: number;
  startTime: number;
  duration: number;
  color: string;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  startTime: number;
  duration: number;
}

const activeAnimations: PurchaseAnimation[] = [];
const floatingTexts: FloatingText[] = [];

/**
 * Starts a purchase animation at the given position.
 * Creates a colored particle effect that rises and fades.
 */
export function startPurchaseAnimation(
  x: number,
  y: number,
  rarityColor: string,
  duration: number = 500
): void {
  activeAnimations.push({
    startX: x,
    startY: y,
    startTime: performance.now(),
    duration,
    color: rarityColor
  });
}

/**
 * Shows floating text at the given position.
 * Text rises and fades over time.
 */
export function showFloatingText(
  text: string,
  x: number,
  y: number,
  color: string = '#FFFFFF',
  duration: number = 1500
): void {
  floatingTexts.push({
    text,
    x,
    y,
    color,
    startTime: performance.now(),
    duration
  });
}

/**
 * Renders all active purchase animations.
 * Should be called in the main render loop.
 */
export function renderPurchaseAnimations(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  camera: { x: number; y: number }
): void {
  for (let i = activeAnimations.length - 1; i >= 0; i--) {
    const anim = activeAnimations[i];
    const elapsed = currentTime - anim.startTime;
    const progress = Math.min(elapsed / anim.duration, 1);

    // Remove completed animations
    if (progress >= 1) {
      activeAnimations.splice(i, 1);
      continue;
    }

    // Calculate animation properties
    const screenX = anim.startX - camera.x;
    const screenY = anim.startY - camera.y - (progress * 50);  // Rise up
    const alpha = 1 - progress;  // Fade out
    const scale = 1 + progress * 0.5;  // Grow slightly

    // Render particle
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = anim.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 10 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Add inner glow
    ctx.globalAlpha = alpha * 0.5;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(screenX, screenY, 5 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Renders all floating texts.
 * Should be called in the main render loop.
 */
export function renderFloatingTexts(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  camera: { x: number; y: number }
): void {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    const elapsed = currentTime - ft.startTime;
    const progress = Math.min(elapsed / ft.duration, 1);

    // Remove completed texts
    if (progress >= 1) {
      floatingTexts.splice(i, 1);
      continue;
    }

    // Calculate text properties
    const screenX = ft.x - camera.x;
    const screenY = ft.y - camera.y - (progress * 30);  // Rise up slower
    const alpha = 1 - progress;  // Fade out

    // Render text with shadow for better visibility
    ctx.save();
    ctx.globalAlpha = alpha;

    // Shadow
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ft.text, screenX + 2, screenY + 2);

    // Main text
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, screenX, screenY);

    ctx.restore();
  }
}

/**
 * Clears all active effects.
 * Useful when resetting the game state.
 */
export function clearAllEffects(): void {
  activeAnimations.length = 0;
  floatingTexts.length = 0;
}

/**
 * Returns the number of active animations.
 * Useful for debugging.
 */
export function getActiveAnimationCount(): number {
  return activeAnimations.length + floatingTexts.length;
}
