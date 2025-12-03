/**
 * Canvas utility functions for consistent canvas operations.
 *
 * Usage: import { getContext2D, clearCanvas } from '@/lib/rendering/canvasUtils';
 */

/**
 * Safely get a 2D rendering context from a canvas element.
 * Returns null if the canvas is null or context cannot be obtained.
 */
export function getContext2D(canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
  return canvas?.getContext('2d') ?? null;
}

/**
 * Clear the entire canvas with a solid color.
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, color: string = '#000000'): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Calculate the visible tile bounds for efficient rendering.
 * Returns the start/end tile indices that are visible within the viewport.
 */
export interface VisibleTileBounds {
  startTileX: number;
  startTileY: number;
  endTileX: number;
  endTileY: number;
}

export function getVisibleTileBounds(
  cameraX: number,
  cameraY: number,
  canvasWidth: number,
  canvasHeight: number,
  tileSize: number,
  dungeonWidth: number,
  dungeonHeight: number
): VisibleTileBounds {
  const startTileX = Math.max(0, Math.floor(cameraX / tileSize));
  const startTileY = Math.max(0, Math.floor(cameraY / tileSize));
  const endTileX = Math.min(dungeonWidth, Math.ceil((cameraX + canvasWidth) / tileSize));
  const endTileY = Math.min(dungeonHeight, Math.ceil((cameraY + canvasHeight) / tileSize));

  return { startTileX, startTileY, endTileX, endTileY };
}
