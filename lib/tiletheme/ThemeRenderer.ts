import { RenderMap, RenderTile } from './types';
import { TILE_SOURCE_SIZE } from '../constants';
import { RENDER_COLORS } from '../ui/colors';

// Pink placeholder for missing tiles (like Unity)
const MISSING_TILE_COLOR = RENDER_COLORS.MISSING_TILE;

export class ThemeRenderer {
  private tilesetImages: Map<number, HTMLImageElement> = new Map();
  private loadingPromises: Map<number, Promise<void>> = new Map();

  /**
   * Load a tileset image and cache it
   */
  async loadTileset(tilesetId: number, path: string): Promise<void> {
    if (this.tilesetImages.has(tilesetId)) return;

    // Check if already loading
    if (this.loadingPromises.has(tilesetId)) {
      return this.loadingPromises.get(tilesetId);
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.tilesetImages.set(tilesetId, img);
        this.loadingPromises.delete(tilesetId);
        resolve();
      };
      img.onerror = () => {
        this.loadingPromises.delete(tilesetId);
        reject(new Error(`Failed to load tileset: ${path}`));
      };
      img.src = path;
    });

    this.loadingPromises.set(tilesetId, loadPromise);
    return loadPromise;
  }

  /**
   * Check if a tileset is loaded
   */
  isTilesetLoaded(tilesetId: number): boolean {
    return this.tilesetImages.has(tilesetId);
  }

  /**
   * Get a loaded tileset image
   */
  getTilesetImage(tilesetId: number): HTMLImageElement | undefined {
    return this.tilesetImages.get(tilesetId);
  }

  /**
   * Clear all loaded tilesets
   */
  clearTilesets(): void {
    this.tilesetImages.clear();
    this.loadingPromises.clear();
  }

  /**
   * Render the entire map with pre-computed RenderMap
   * NO LOGIC here - just drawImage() calls!
   *
   * @param ctx - Canvas 2D context
   * @param renderMap - Pre-computed tile references
   * @param tileSize - Size of each tile in pixels (destination)
   * @param viewportX - Camera X position
   * @param viewportY - Camera Y position
   * @param viewportWidth - Viewport width
   * @param viewportHeight - Viewport height
   * @param brightTilesetFn - Optional function to determine if bright (light) tiles should be used for a position
   */
  render(
    ctx: CanvasRenderingContext2D,
    renderMap: RenderMap,
    tileSize: number,
    viewportX: number,
    viewportY: number,
    viewportWidth: number,
    viewportHeight: number,
    brightTilesetFn?: (x: number, y: number) => boolean
  ): void {
    // Calculate visible area in tile coordinates
    const startCol = Math.floor(viewportX / tileSize);
    const endCol = Math.ceil((viewportX + viewportWidth) / tileSize);
    const startRow = Math.floor(viewportY / tileSize);
    const endRow = Math.ceil((viewportY + viewportHeight) / tileSize);

    // Only render visible tiles
    for (let y = Math.max(0, startRow); y < Math.min(renderMap.height, endRow); y++) {
      for (let x = Math.max(0, startCol); x < Math.min(renderMap.width, endCol); x++) {
        const renderTile = renderMap.tiles[y]?.[x];

        const destX = x * tileSize - viewportX;
        const destY = y * tileSize - viewportY;

        if (renderTile === null || renderTile === undefined) {
          // EMPTY - don't render (or optionally: black tile)
          continue;
        }

        // Determine if we should use light tiles
        const useBright = brightTilesetFn ? brightTilesetFn(x, y) : false;
        const useLight = useBright && renderTile.lightTilesetId !== null;

        const tilesetId = useLight ? renderTile.lightTilesetId! : renderTile.darkTilesetId;
        const srcX = useLight ? renderTile.lightSrcX! : renderTile.darkSrcX;
        const srcY = useLight ? renderTile.lightSrcY! : renderTile.darkSrcY;

        const tileset = this.tilesetImages.get(tilesetId);

        if (!tileset) {
          // Tileset not loaded - pink placeholder
          ctx.fillStyle = MISSING_TILE_COLOR;
          ctx.fillRect(destX, destY, tileSize, tileSize);
          continue;
        }

        // Simple drawImage - all coordinates are pre-calculated!
        ctx.drawImage(
          tileset,
          srcX, srcY,
          TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
          destX, destY,
          tileSize, tileSize
        );
      }
    }
  }

  /**
   * Render a single tile (useful for editor preview)
   */
  renderTile(
    ctx: CanvasRenderingContext2D,
    tilesetId: number,
    srcX: number,
    srcY: number,
    destX: number,
    destY: number,
    tileSize: number
  ): void {
    const tileset = this.tilesetImages.get(tilesetId);

    if (!tileset) {
      ctx.fillStyle = MISSING_TILE_COLOR;
      ctx.fillRect(destX, destY, tileSize, tileSize);
      return;
    }

    ctx.drawImage(
      tileset,
      srcX * TILE_SOURCE_SIZE, srcY * TILE_SOURCE_SIZE,
      TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
      destX, destY,
      tileSize, tileSize
    );
  }

  /**
   * Render the entire map without viewport (for small previews)
   */
  renderFullMap(
    ctx: CanvasRenderingContext2D,
    renderMap: RenderMap,
    tileSize: number,
    offsetX: number = 0,
    offsetY: number = 0
  ): void {
    for (let y = 0; y < renderMap.height; y++) {
      for (let x = 0; x < renderMap.width; x++) {
        const renderTile = renderMap.tiles[y]?.[x];

        const destX = offsetX + x * tileSize;
        const destY = offsetY + y * tileSize;

        if (renderTile === null || renderTile === undefined) {
          // Draw black for empty tiles
          ctx.fillStyle = '#000000';
          ctx.fillRect(destX, destY, tileSize, tileSize);
          continue;
        }

        // Always use dark tiles for preview
        const tilesetId = renderTile.darkTilesetId;
        const srcX = renderTile.darkSrcX;
        const srcY = renderTile.darkSrcY;

        const tileset = this.tilesetImages.get(tilesetId);

        if (!tileset) {
          ctx.fillStyle = MISSING_TILE_COLOR;
          ctx.fillRect(destX, destY, tileSize, tileSize);
          continue;
        }

        ctx.drawImage(
          tileset,
          srcX, srcY,
          TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
          destX, destY,
          tileSize, tileSize
        );
      }
    }
  }
}

// Singleton instance for convenience
let rendererInstance: ThemeRenderer | null = null;

export function getThemeRenderer(): ThemeRenderer {
  if (!rendererInstance) {
    rendererInstance = new ThemeRenderer();
  }
  return rendererInstance;
}
