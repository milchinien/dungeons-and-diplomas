import { TILE, TILE_SOURCE_SIZE } from '../constants';
import type { TileType, Room } from '../constants';
import type { RenderMap, RenderTile, TileTheme } from '../tiletheme/types';
import { getThemeRenderer } from '../tiletheme/ThemeRenderer';
import { detectDoorType } from '../tiletheme/WallTypeDetector';
import { VisibilityCalculator } from '../visibility';
import { BrightnessCalculator } from './BrightnessCalculator';
import { RENDER_COLORS } from '../ui/colors';
import type { Enemy } from '../enemy';

/**
 * Responsible for rendering individual tiles to a canvas context.
 * Extracted from GameRenderer for better testability and separation of concerns.
 */
export class TileRenderer {
  private themeRenderer = getThemeRenderer();

  /**
   * Render a hidden (fog of war) tile
   */
  renderHiddenTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tileSize: number
  ): void {
    ctx.fillStyle = RENDER_COLORS.BACKGROUND;
    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
  }

  /**
   * Render a door tile
   */
  renderDoor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tileSize: number,
    dungeon: TileType[][],
    isOpen: boolean,
    darkTheme: TileTheme
  ): void {
    const doorType = detectDoorType(dungeon, x, y, isOpen);
    const doorVariants = darkTheme.door[doorType];

    if (doorVariants && doorVariants.length > 0) {
      const variant = doorVariants[0];
      const tileset = this.themeRenderer.getTilesetImage(variant.source.tilesetId);

      if (tileset) {
        ctx.drawImage(
          tileset,
          variant.source.x * TILE_SOURCE_SIZE,
          variant.source.y * TILE_SOURCE_SIZE,
          TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
          x * tileSize, y * tileSize, tileSize, tileSize
        );
      } else {
        this.renderMissingTile(ctx, x, y, tileSize);
      }
    }
  }

  /**
   * Render a floor or wall tile using the render map
   */
  renderTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tileSize: number,
    renderTile: RenderTile,
    useBright: boolean
  ): void {
    const useLight = useBright && renderTile.lightTilesetId !== null;
    const tilesetId = useLight ? renderTile.lightTilesetId! : renderTile.darkTilesetId;
    const srcX = useLight ? renderTile.lightSrcX! : renderTile.darkSrcX;
    const srcY = useLight ? renderTile.lightSrcY! : renderTile.darkSrcY;

    const tileset = this.themeRenderer.getTilesetImage(tilesetId);

    if (tileset) {
      ctx.drawImage(
        tileset,
        srcX, srcY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
        x * tileSize, y * tileSize, tileSize, tileSize
      );
    } else {
      this.renderMissingTile(ctx, x, y, tileSize);
    }
  }

  /**
   * Render a placeholder for missing tiles (magenta)
   */
  renderMissingTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tileSize: number
  ): void {
    ctx.fillStyle = RENDER_COLORS.MISSING_TILE;
    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
  }

  /**
   * Render fog of war dimming overlay for a tile
   */
  renderFogOverlay(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tileSize: number
  ): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
  }

  /**
   * Render all tiles in a visible area
   */
  renderTiles(
    ctx: CanvasRenderingContext2D,
    dungeon: TileType[][],
    roomMap: number[][],
    rooms: Room[],
    enemies: Enemy[],
    tileSize: number,
    renderMap: RenderMap,
    doorStates: Map<string, boolean>,
    darkTheme: TileTheme | null,
    startCol: number,
    endCol: number,
    startRow: number,
    endRow: number,
    dungeonWidth: number,
    dungeonHeight: number
  ): void {
    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        if (x < 0 || x >= dungeonWidth || y < 0 || y >= dungeonHeight) {
          continue;
        }

        const tile = dungeon[y][x];
        const roomId = roomMap[y][x];

        if (tile === TILE.EMPTY) continue;

        const isVisible = VisibilityCalculator.isTileVisible(x, y, roomId, roomMap, rooms, dungeonWidth, dungeonHeight);

        if (!isVisible) {
          this.renderHiddenTile(ctx, x, y, tileSize);
          continue;
        }

        // Special handling for doors
        if (tile === TILE.DOOR && darkTheme) {
          const doorKey = `${x},${y}`;
          const isOpen = doorStates.get(doorKey) ?? false;
          this.renderDoor(ctx, x, y, tileSize, dungeon, isOpen, darkTheme);
          continue;
        }

        // Get pre-computed render tile
        const renderTileData = renderMap.tiles[y]?.[x];
        if (!renderTileData) continue;

        const useBright = BrightnessCalculator.shouldUseBrightTileset(
          x, y, tile, roomMap, rooms, enemies, dungeonWidth, dungeonHeight
        );

        this.renderTile(ctx, x, y, tileSize, renderTileData, useBright);
      }
    }
  }

  /**
   * Render fog of war dimming effect for non-player rooms
   */
  renderFogOfWar(
    ctx: CanvasRenderingContext2D,
    dungeon: TileType[][],
    roomMap: number[][],
    rooms: Room[],
    playerRoomIds: Set<number>,
    tileSize: number,
    startCol: number,
    endCol: number,
    startRow: number,
    endRow: number,
    dungeonWidth: number,
    dungeonHeight: number
  ): void {
    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        if (x < 0 || x >= dungeonWidth || y < 0 || y >= dungeonHeight) continue;

        const tile = dungeon[y][x];
        if (tile === TILE.EMPTY) continue;

        const roomId = roomMap[y][x];

        const isVisible = VisibilityCalculator.isTileVisible(x, y, roomId, roomMap, rooms, dungeonWidth, dungeonHeight);
        if (!isVisible) continue;

        const shouldDim = VisibilityCalculator.shouldDimTile(
          x, y, roomId, roomMap, playerRoomIds, dungeonWidth, dungeonHeight
        );

        if (shouldDim) {
          this.renderFogOverlay(ctx, x, y, tileSize);
        }
      }
    }
  }
}

// Singleton instance for convenience
let tileRendererInstance: TileRenderer | null = null;

export function getTileRenderer(): TileRenderer {
  if (!tileRendererInstance) {
    tileRendererInstance = new TileRenderer();
  }
  return tileRendererInstance;
}
