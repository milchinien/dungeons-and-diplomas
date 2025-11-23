import type { TileType, Room } from '../constants';
import { TILE, TILE_SOURCE_SIZE } from '../constants';
import { Enemy } from '../enemy';
import type { RenderMap } from '../tiletheme/types';
import { getThemeRenderer } from '../tiletheme/ThemeRenderer';
import { getContext2D, clearCanvas } from './canvasUtils';
import { RENDER_COLORS } from '../ui/colors';

export interface EditorCamera {
  x: number;         // Camera world position X
  y: number;         // Camera world position Y
  zoom: number;      // Zoom level (0.5 = 50%, 1.0 = 100%, 2.0 = 200%)
}

export class EditorRenderer {
  /**
   * Render dungeon from editor camera perspective
   *
   * Key differences from GameRenderer.render():
   * - Camera is NOT centered on player
   * - Camera position is freely controlled (pan)
   * - Zoom is applied to canvas transform
   * - All rooms are visible (no fog of war)
   * - Enemies are rendered statically (no animation)
   * - No bright/dark tileset switching (always uses dark theme)
   */
  render(
    canvas: HTMLCanvasElement,
    dungeon: TileType[][],
    roomMap: number[][],
    rooms: Room[],
    enemies: Enemy[],
    camera: EditorCamera,
    baseTileSize: number,
    renderMap: RenderMap,
    playerSpawnPos?: { x: number; y: number },
    showGrid?: boolean
  ) {
    const ctx = getContext2D(canvas);
    if (!ctx) return;

    const themeRenderer = getThemeRenderer();

    // Clear canvas
    clearCanvas(ctx);

    ctx.save();

    // Apply camera transformation
    ctx.translate(-camera.x, -camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Get dungeon dimensions from renderMap
    const dungeonWidth = renderMap.width;
    const dungeonHeight = renderMap.height;

    // Calculate viewport in tile coordinates
    const startCol = Math.floor(camera.x / (baseTileSize * camera.zoom));
    const endCol = startCol + Math.ceil(canvas.width / (baseTileSize * camera.zoom)) + 1;
    const startRow = Math.floor(camera.y / (baseTileSize * camera.zoom));
    const endRow = startRow + Math.ceil(canvas.height / (baseTileSize * camera.zoom)) + 1;

    // Render tiles using RenderMap (same as GameRenderer)
    for (let y = Math.max(0, startRow); y < Math.min(dungeonHeight, endRow); y++) {
      for (let x = Math.max(0, startCol); x < Math.min(dungeonWidth, endCol); x++) {
        const tile = dungeon[y][x];

        if (tile === TILE.EMPTY) continue;

        // Get pre-computed render tile
        const renderTile = renderMap.tiles[y]?.[x];
        if (!renderTile) continue;

        // Editor always uses dark tileset (no bright/dark switching)
        const tilesetId = renderTile.darkTilesetId;
        const srcX = renderTile.darkSrcX;
        const srcY = renderTile.darkSrcY;

        const tileset = themeRenderer.getTilesetImage(tilesetId);

        if (tileset) {
          ctx.drawImage(
            tileset,
            srcX, srcY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
            x * baseTileSize, y * baseTileSize, baseTileSize, baseTileSize
          );
        } else {
          // Missing tileset - pink placeholder
          ctx.fillStyle = RENDER_COLORS.MISSING_TILE;
          ctx.fillRect(x * baseTileSize, y * baseTileSize, baseTileSize, baseTileSize);
        }
      }
    }

    // Render enemies (statically)
    this.renderEnemiesStatic(ctx, enemies, rooms, baseTileSize);

    // Optional: Render player spawn position
    if (playerSpawnPos) {
      this.renderPlayerSpawn(ctx, playerSpawnPos, baseTileSize);
    }

    // Render grid overlay
    if (showGrid) {
      this.renderGrid(ctx, baseTileSize, startCol, endCol, startRow, endRow, dungeonWidth, dungeonHeight);
    }

    ctx.restore();
  }

  private renderGrid(
    ctx: CanvasRenderingContext2D,
    tileSize: number,
    startCol: number,
    endCol: number,
    startRow: number,
    endRow: number,
    dungeonWidth: number,
    dungeonHeight: number
  ) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = Math.max(0, startCol); x <= Math.min(dungeonWidth, endCol); x++) {
      ctx.beginPath();
      ctx.moveTo(x * tileSize, Math.max(0, startRow) * tileSize);
      ctx.lineTo(x * tileSize, Math.min(dungeonHeight, endRow) * tileSize);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = Math.max(0, startRow); y <= Math.min(dungeonHeight, endRow); y++) {
      ctx.beginPath();
      ctx.moveTo(Math.max(0, startCol) * tileSize, y * tileSize);
      ctx.lineTo(Math.min(dungeonWidth, endCol) * tileSize, y * tileSize);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderEnemiesStatic(
    ctx: CanvasRenderingContext2D,
    enemies: Enemy[],
    rooms: Room[],
    tileSize: number
  ) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      // Draw enemy sprite at current position
      // We'll use a simplified version without animation
      const enemyX = enemy.x;
      const enemyY = enemy.y;

      // Draw a simple colored circle representing the enemy
      ctx.save();

      // Color based on level (green=easy, yellow=medium, red=hard)
      let color: string = RENDER_COLORS.editor.enemyLevelEasy;
      if (enemy.level >= 8) {
        color = RENDER_COLORS.editor.enemyLevelHard;
      } else if (enemy.level >= 4) {
        color = RENDER_COLORS.editor.enemyLevelMedium;
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(
        enemyX + tileSize / 2,
        enemyY + tileSize / 2,
        tileSize / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw border
      ctx.strokeStyle = RENDER_COLORS.editor.border;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw level text
      ctx.fillStyle = RENDER_COLORS.editor.text;
      ctx.font = `bold ${tileSize / 3}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `L${enemy.level}`,
        enemyX + tileSize / 2,
        enemyY + tileSize / 2
      );

      ctx.restore();
    }
  }

  private renderPlayerSpawn(
    ctx: CanvasRenderingContext2D,
    spawnPos: { x: number; y: number },
    tileSize: number
  ) {
    // Draw a marker at player spawn position
    ctx.save();
    ctx.fillStyle = RENDER_COLORS.editor.playerSpawn;
    ctx.beginPath();
    ctx.arc(
      spawnPos.x * tileSize + tileSize / 2,
      spawnPos.y * tileSize + tileSize / 2,
      tileSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = RENDER_COLORS.editor.playerSpawnBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw "P" for Player
    ctx.fillStyle = RENDER_COLORS.editor.playerSpawnBorder;
    ctx.font = `bold ${tileSize / 2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'P',
      spawnPos.x * tileSize + tileSize / 2,
      spawnPos.y * tileSize + tileSize / 2
    );

    ctx.restore();
  }
}
