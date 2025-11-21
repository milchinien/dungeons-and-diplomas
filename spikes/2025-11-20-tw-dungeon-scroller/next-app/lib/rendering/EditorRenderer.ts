import { GameRenderer } from './GameRenderer';
import type { TileType, TileVariant, Room } from '../constants';
import { TILE, TILE_SOURCE_SIZE, TILESET_COORDS, DUNGEON_WIDTH, DUNGEON_HEIGHT } from '../constants';
import type { Player } from '../Enemy';
import { Enemy } from '../Enemy';

export interface EditorCamera {
  x: number;         // Camera world position X
  y: number;         // Camera world position Y
  zoom: number;      // Zoom level (0.5 = 50%, 1.0 = 100%, 2.0 = 200%)
}

export class EditorRenderer {
  private gameRenderer: GameRenderer;
  private tilesetImage: HTMLImageElement | null = null;

  constructor() {
    this.gameRenderer = new GameRenderer();
  }

  async loadTileset() {
    await this.gameRenderer.loadTileset();

    // Load tileset for editor-specific rendering
    const tilesetImage = new Image();
    await new Promise<void>((resolve) => {
      tilesetImage.onload = () => resolve();
      tilesetImage.src = '/Assets/Castle-Dungeon2_Tiles/Tileset.png';
    });
    this.tilesetImage = tilesetImage;
  }

  private getTileCoords(
    x: number,
    y: number,
    tile: TileType,
    tileVariants: TileVariant[][],
    roomMap: number[][],
    rooms: Room[],
    dungeon: TileType[][]
  ): { x: number; y: number } | null {
    if (tile === 0) {
      return null;
    }

    if (tile === 1) {
      const roomId = roomMap[y][x];
      if (roomId >= 0 && rooms[roomId]) {
        const roomType = rooms[roomId].type;

        if (roomType === 'treasure') {
          return { x: 18, y: 11 };
        } else if (roomType === 'combat') {
          return { x: 7, y: 12 };
        }
      }

      return tileVariants[y][x].floor;
    }

    if (tile === 3) {
      const hasWallLeft = x > 0 && dungeon[y][x - 1] === 2;
      const hasWallRight = x < DUNGEON_WIDTH - 1 && dungeon[y][x + 1] === 2;
      const hasWallAbove = y > 0 && dungeon[y - 1][x] === 2;
      const hasWallBelow = y < DUNGEON_HEIGHT - 1 && dungeon[y + 1][x] === 2;

      if (hasWallLeft || hasWallRight) {
        return TILESET_COORDS.DOOR_VERTICAL;
      } else if (hasWallAbove || hasWallBelow) {
        return TILESET_COORDS.DOOR_HORIZONTAL;
      } else {
        const hasFloorLeft = x > 0 && dungeon[y][x - 1] === 1;
        const hasFloorRight = x < DUNGEON_WIDTH - 1 && dungeon[y][x + 1] === 1;

        if (hasFloorLeft && hasFloorRight) {
          return TILESET_COORDS.DOOR_HORIZONTAL;
        } else {
          return TILESET_COORDS.DOOR_VERTICAL;
        }
      }
    }

    if (tile === 2 || tile === 4) {
      return tileVariants[y][x].wall;
    }

    return tileVariants[y][x].floor;
  }

  /**
   * Render dungeon from editor camera perspective
   *
   * Key differences from GameRenderer.render():
   * - Camera is NOT centered on player
   * - Camera position is freely controlled (pan)
   * - Zoom is applied to canvas transform
   * - All rooms are visible (no fog of war)
   * - Enemies are rendered statically (no animation)
   */
  render(
    canvas: HTMLCanvasElement,
    dungeon: TileType[][],
    tileVariants: TileVariant[][],
    roomMap: number[][],
    rooms: Room[],
    enemies: Enemy[],
    camera: EditorCamera,
    baseTileSize: number,
    treasures?: Set<string>,
    playerSpawnPos?: { x: number; y: number }
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx || !this.tilesetImage) return;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Apply camera transformation
    ctx.translate(-camera.x, -camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Calculate viewport in tile coordinates
    const startCol = Math.floor(camera.x / (baseTileSize * camera.zoom));
    const endCol = startCol + Math.ceil(canvas.width / (baseTileSize * camera.zoom)) + 1;
    const startRow = Math.floor(camera.y / (baseTileSize * camera.zoom));
    const endRow = startRow + Math.ceil(canvas.height / (baseTileSize * camera.zoom)) + 1;

    // Render tiles
    for (let y = Math.max(0, startRow); y < Math.min(DUNGEON_HEIGHT, endRow); y++) {
      for (let x = Math.max(0, startCol); x < Math.min(DUNGEON_WIDTH, endCol); x++) {
        const tile = dungeon[y][x];

        if (tile === TILE.EMPTY) continue;

        const coords = this.getTileCoords(x, y, tile, tileVariants, roomMap, rooms, dungeon);
        if (coords) {
          const srcX = coords.x * TILE_SOURCE_SIZE;
          const srcY = coords.y * TILE_SOURCE_SIZE;

          ctx.drawImage(
            this.tilesetImage!,
            srcX, srcY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
            x * baseTileSize, y * baseTileSize, baseTileSize, baseTileSize
          );
        }
      }
    }

    // Draw treasures
    if (treasures) {
      for (const treasureKey of treasures) {
        const [tx, ty] = treasureKey.split(',').map(Number);

        // Draw treasure chest sprite (10, 12)
        const treasureCoords = { x: 10, y: 12 };
        const srcX = treasureCoords.x * TILE_SOURCE_SIZE;
        const srcY = treasureCoords.y * TILE_SOURCE_SIZE;

        ctx.drawImage(
          this.tilesetImage!,
          srcX, srcY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
          tx * baseTileSize, ty * baseTileSize, baseTileSize, baseTileSize
        );
      }
    }

    // Render enemies (statically)
    this.renderEnemiesStatic(ctx, enemies, rooms, baseTileSize);

    // Optional: Render player spawn position
    if (playerSpawnPos) {
      this.renderPlayerSpawn(ctx, playerSpawnPos, baseTileSize);
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
      let color = '#00ff00'; // green
      if (enemy.level >= 8) {
        color = '#ff0000'; // red
      } else if (enemy.level >= 4) {
        color = '#ffff00'; // yellow
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
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw level text
      ctx.fillStyle = '#000000';
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
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(
      spawnPos.x * tileSize + tileSize / 2,
      spawnPos.y * tileSize + tileSize / 2,
      tileSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw "P" for Player
    ctx.fillStyle = '#00FFFF';
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
