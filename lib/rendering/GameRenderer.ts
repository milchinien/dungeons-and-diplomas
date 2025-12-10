import type { TileType, Room, Direction } from '../constants';
import { PLAYER_ATTACK_CONE_ANGLE, PLAYER_ATTACK_RANGE } from '../constants';
import type { Player } from '../enemy';
import { SpriteSheetLoader } from '../SpriteSheetLoader';
import { Enemy, Trashmob } from '../enemy';
import type { RenderMap, TileTheme } from '../tiletheme/types';
import { VisibilityCalculator } from '../visibility';
import { getTileRenderer } from './TileRenderer';
import { getContext2D } from './canvasUtils';
import { RENDER_COLORS } from '../ui/colors';

/**
 * Main game renderer that orchestrates all rendering passes.
 * Uses TileRenderer for tile-specific rendering operations.
 */
export class GameRenderer {
  private tileRenderer = getTileRenderer();

  /**
   * Render all enemies visible in player's rooms
   */
  private renderEnemies(
    ctx: CanvasRenderingContext2D,
    enemies: Enemy[],
    rooms: Room[],
    tileSize: number,
    player: Player,
    playerRoomIds: Set<number>
  ): void {
    for (const enemy of enemies) {
      enemy.draw(ctx, rooms, tileSize, player, playerRoomIds);
    }
  }

  /**
   * Render all trashmobs visible in player's rooms
   */
  private renderTrashmobs(
    ctx: CanvasRenderingContext2D,
    trashmobs: Trashmob[],
    rooms: Room[],
    tileSize: number,
    playerRoomIds: Set<number>
  ): void {
    for (const trashmob of trashmobs) {
      if (!trashmob.alive) continue;

      // Only render if trashmob's room is visible
      const room = rooms[trashmob.roomId];
      if (!room || !room.visible) continue;

      trashmob.draw(ctx, tileSize);
    }
  }

  /**
   * Render the player sprite
   */
  private renderPlayer(
    ctx: CanvasRenderingContext2D,
    playerSprite: SpriteSheetLoader | null,
    player: Player,
    tileSize: number
  ): void {
    playerSprite?.draw(ctx, player.x, player.y, tileSize, tileSize);
  }

  /**
   * Direction angles in radians
   */
  private readonly directionAngles: Record<Direction, number> = {
    up: -Math.PI / 2,
    down: Math.PI / 2,
    left: Math.PI,
    right: 0
  };

  /**
   * Render attack cone visual indicator
   * @param aimAngle - Angle in radians toward cursor (0 = right, PI/2 = down)
   */
  private renderAttackCone(
    ctx: CanvasRenderingContext2D,
    player: Player,
    tileSize: number,
    isAttacking: boolean,
    aimAngle?: number
  ): void {
    const centerX = player.x + tileSize / 2;
    const centerY = player.y + tileSize / 2;
    const range = PLAYER_ATTACK_RANGE * tileSize;
    const halfAngle = (PLAYER_ATTACK_CONE_ANGLE / 2) * (Math.PI / 180);
    // Use aimAngle if provided (continuous), otherwise fall back to player direction
    const direction = aimAngle ?? this.directionAngles[player.direction];

    ctx.save();

    // Draw attack cone
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(
      centerX,
      centerY,
      range,
      direction - halfAngle,
      direction + halfAngle
    );
    ctx.closePath();

    if (isAttacking) {
      // Attacking - bright red flash
      ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
      ctx.lineWidth = 3;
    } else {
      // Not attacking - subtle indicator
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
    }

    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Main render method - orchestrates all rendering passes
   */
  render(
    canvas: HTMLCanvasElement,
    player: Player,
    dungeon: TileType[][],
    roomMap: number[][],
    rooms: Room[],
    enemies: Enemy[],
    playerSprite: SpriteSheetLoader | null,
    tileSize: number,
    renderMap: RenderMap,
    doorStates: Map<string, boolean>,
    darkTheme: TileTheme | null,
    trashmobs: Trashmob[] = [],
    isAttacking: boolean = false,
    aimAngle?: number
  ) {
    const ctx = getContext2D(canvas);
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const dungeonWidth = renderMap.width;
    const dungeonHeight = renderMap.height;

    const camX = player.x + tileSize / 2 - canvas.width / 2;
    const camY = player.y + tileSize / 2 - canvas.height / 2;

    ctx.save();
    ctx.translate(-Math.floor(camX), -Math.floor(camY));

    // Clear with black
    ctx.fillStyle = RENDER_COLORS.BACKGROUND;
    ctx.fillRect(Math.floor(camX), Math.floor(camY), canvas.width, canvas.height);

    // Calculate visible tile range
    const startCol = Math.floor(camX / tileSize);
    const endCol = startCol + Math.ceil(canvas.width / tileSize) + 1;
    const startRow = Math.floor(camY / tileSize);
    const endRow = startRow + Math.ceil(canvas.height / tileSize) + 1;

    // Get player's current room(s) for visibility calculations
    const playerRoomIds = VisibilityCalculator.getPlayerRoomIds(player, tileSize, roomMap, dungeonWidth, dungeonHeight);

    // Pass 1: Render tiles (delegated to TileRenderer)
    this.tileRenderer.renderTiles(
      ctx, dungeon, roomMap, rooms, enemies, tileSize, renderMap, doorStates, darkTheme,
      startCol, endCol, startRow, endRow, dungeonWidth, dungeonHeight
    );

    // Pass 2: Render fog of war dimming (delegated to TileRenderer)
    this.tileRenderer.renderFogOfWar(
      ctx, dungeon, roomMap, rooms, playerRoomIds, tileSize,
      startCol, endCol, startRow, endRow, dungeonWidth, dungeonHeight
    );

    // Pass 3: Render enemies
    this.renderEnemies(ctx, enemies, rooms, tileSize, player, playerRoomIds);

    // Pass 4: Render trashmobs
    this.renderTrashmobs(ctx, trashmobs, rooms, tileSize, playerRoomIds);

    // Pass 5: Render attack cone (before player so it's behind)
    this.renderAttackCone(ctx, player, tileSize, isAttacking, aimAngle);

    // Pass 6: Render player
    this.renderPlayer(ctx, playerSprite, player, tileSize);

    ctx.restore();
  }
}
