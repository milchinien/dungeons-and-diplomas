import type { TileType, Room, Shrine, Direction } from '../constants';
import { SHRINE_RENDER_SIZE } from '../constants';
import { renderSlash, isSlashActive } from '../effects/SlashAnimation';
import type { Player } from '../enemy';
import { SpriteSheetLoader } from '../SpriteSheetLoader';
import { Enemy, Trashmob } from '../enemy';
import type { RenderMap, TileTheme } from '../tiletheme/types';
import { VisibilityCalculator } from '../visibility';
import { getTileRenderer } from './TileRenderer';
import { getContext2D } from './canvasUtils';
import { RENDER_COLORS } from '../ui/colors';
import { getEffectsManager } from '../effects';
import { getEntityTilePosition } from '../physics/TileCoordinates';

import { renderShopRoom, type ShopAssets } from './ShopRenderer';
import { getPlayerShopRoom, getInteractionTarget, type InteractionTarget } from '../shop/ShopInteraction';
import { renderTooltip, createItemTooltip, createPerkTooltip } from './TooltipRenderer';

/**
 * Main game renderer that orchestrates all rendering passes.
 * Uses TileRenderer for tile-specific rendering operations.
 */
export class GameRenderer {
  private tileRenderer = getTileRenderer();
  private pulsePhase = 0;
  private shrineImage: HTMLImageElement | null = null;
  private shrineImageLoaded = false;
  private gameTime = 0;
  private shopAssets: ShopAssets = {};
  private currentInteractionTarget: InteractionTarget | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.shrineImage = new Image();
      this.shrineImage.onload = () => {
        this.shrineImageLoaded = true;
      };
      this.shrineImage.src = '/Assets/shrine.png';
    }
  }

  /**
   * Render all shrines visible in player's rooms
   */
  private renderShrines(
    ctx: CanvasRenderingContext2D,
    shrines: Shrine[],
    rooms: Room[],
    tileSize: number,
    playerRoomIds: Set<number>
  ): void {
    this.pulsePhase += 0.05;
    if (this.pulsePhase > Math.PI * 2) {
      this.pulsePhase = 0;
    }

    for (const shrine of shrines) {
      if (!rooms[shrine.roomId]?.visible) continue;

      // Calculate sprite size based on SHRINE_RENDER_SIZE
      const spriteSize = tileSize * SHRINE_RENDER_SIZE;
      // Center the sprite on the shrine position
      const offsetX = (tileSize - spriteSize) / 2;
      const offsetY = (tileSize - spriteSize) / 2;
      const screenX = shrine.x * tileSize + offsetX;
      const screenY = shrine.y * tileSize + offsetY;

      ctx.save();

      if (shrine.isActivated) {
        ctx.globalAlpha = 0.5;
        ctx.filter = 'grayscale(100%)';
      } else if (shrine.isActive) {
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 25;
      } else {
        const glowIntensity = 10 + Math.sin(this.pulsePhase) * 5;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = glowIntensity;
      }

      if (this.shrineImageLoaded && this.shrineImage) {
        ctx.drawImage(this.shrineImage, screenX, screenY, spriteSize, spriteSize);
      }

      ctx.restore();
    }
  }

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

  // Debug counter for trashmob rendering
  private trashmobRenderDebugCounter = 0;

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
    // Debug log every 120 frames
    this.trashmobRenderDebugCounter++;
    if (this.trashmobRenderDebugCounter >= 120) {
      this.trashmobRenderDebugCounter = 0;
      const visibleCount = trashmobs.filter(t => t.alive && rooms[t.roomId]?.visible).length;
      console.log(`[GameRenderer] Trashmobs total: ${trashmobs.length}, visible: ${visibleCount}`);
    }

    for (const trashmob of trashmobs) {
      if (!trashmob.alive) continue;

      // Only render if trashmob's room is visible
      const room = rooms[trashmob.roomId];
      if (!room || !room.visible) continue;

      trashmob.draw(ctx, tileSize);
    }
  }

  /**
   * Render all visible shop rooms
   */
  private renderShops(
    ctx: CanvasRenderingContext2D,
    rooms: Room[],
    camera: { x: number; y: number }
  ): void {
    for (const room of rooms) {
      if (room.type === 'shop' && room.visible && room.shopInventory) {
        renderShopRoom(ctx, room, this.gameTime, camera, this.shopAssets);
      }
    }
  }

  /**
   * Updates the current interaction target based on player position.
   */
  private updateInteractionTarget(
    player: Player,
    rooms: Room[],
    tileSize: number
  ): void {
    // Convert player position to world coordinates (center of player)
    const playerWorldX = player.x + tileSize / 2;
    const playerWorldY = player.y + tileSize / 2;

    // Find which shop room the player is in
    const shopRoom = getPlayerShopRoom(playerWorldX, playerWorldY, rooms);

    if (shopRoom) {
      this.currentInteractionTarget = getInteractionTarget(
        playerWorldX,
        playerWorldY,
        shopRoom
      );
    } else {
      this.currentInteractionTarget = null;
    }
  }

  /**
   * Renders the tooltip for the current interaction target.
   * Called after ctx.restore() since tooltips are in screen space.
   */
  private renderShopTooltip(
    ctx: CanvasRenderingContext2D,
    camera: { x: number; y: number }
  ): void {
    if (!this.currentInteractionTarget) return;

    const target = this.currentInteractionTarget;

    // Convert world position to screen position
    const screenX = target.worldX - camera.x;
    const screenY = target.worldY - camera.y;

    // Create tooltip based on type
    const tooltip = target.type === 'item' && target.item
      ? createItemTooltip(target.item)
      : target.type === 'perk' && target.perk
        ? createPerkTooltip(target.perk)
        : null;

    if (tooltip) {
      renderTooltip(ctx, tooltip, screenX, screenY);
    }
  }

  /**
   * Returns the current interaction target (for purchase handling).
   */
  getCurrentInteractionTarget(): InteractionTarget | null {
    return this.currentInteractionTarget;
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
   * Render attack visual indicator (now handled by particle system)
   * This method is kept for signature compatibility but does nothing
   */
  private renderAttackCone(
    _ctx: CanvasRenderingContext2D,
    _player: Player,
    _tileSize: number,
    _isAttacking: boolean,
    _aimAngle?: number
  ): void {
    // Attack visuals are now handled by the particle system (slash effect)
    // See GameEngine.performAttack() for particle spawning
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
    shrines: Shrine[] = [],
    trashmobs: Trashmob[] = [],
    isAttacking: boolean = false,
    aimAngle?: number
  ) {
    const ctx = getContext2D(canvas);
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    this.gameTime += 1 / 60;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const dungeonWidth = renderMap.width;
    const dungeonHeight = renderMap.height;

    // Get screen shake offset
    const effectsManager = getEffectsManager();
    const shakeOffset = effectsManager.getCameraOffset();

    const camX = player.x + tileSize / 2 - canvas.width / 2 + shakeOffset.x;
    const camY = player.y + tileSize / 2 - canvas.height / 2 + shakeOffset.y;

    ctx.save();
    ctx.translate(-Math.floor(camX), -Math.floor(camY));

    ctx.fillStyle = RENDER_COLORS.BACKGROUND;
    ctx.fillRect(Math.floor(camX), Math.floor(camY), canvas.width, canvas.height);

    const startCol = Math.floor(camX / tileSize);
    const endCol = startCol + Math.ceil(canvas.width / tileSize) + 1;
    const startRow = Math.floor(camY / tileSize);
    const endRow = startRow + Math.ceil(canvas.height / tileSize) + 1;

    const playerRoomIds = VisibilityCalculator.getPlayerRoomIds(player, tileSize, roomMap, dungeonWidth, dungeonHeight);
    const { tx: playerTileX, ty: playerTileY } = getEntityTilePosition(player, tileSize);

    this.tileRenderer.renderTiles(
      ctx, dungeon, roomMap, rooms, enemies, tileSize, renderMap, doorStates, darkTheme,
      startCol, endCol, startRow, endRow, dungeonWidth, dungeonHeight
    );

    this.tileRenderer.renderFogOfWar(
      ctx, dungeon, roomMap, rooms, playerRoomIds, tileSize,
      startCol, endCol, startRow, endRow, dungeonWidth, dungeonHeight,
      playerTileX, playerTileY
    );

    this.renderShrines(ctx, shrines, rooms, tileSize, playerRoomIds);
    this.renderShops(ctx, rooms, { x: camX, y: camY });

    // Update interaction target for shop tooltips
    this.updateInteractionTarget(player, rooms, tileSize);

    this.renderEnemies(ctx, enemies, rooms, tileSize, player, playerRoomIds);

    // Render trashmobs
    this.renderTrashmobs(ctx, trashmobs, rooms, tileSize, playerRoomIds);

    // Render player
    this.renderPlayer(ctx, playerSprite, player, tileSize);

    // Render slash animation (after player so it's in front)
    if (isSlashActive()) {
      const playerCenterX = player.x + tileSize / 2;
      const playerCenterY = player.y + tileSize / 2;
      renderSlash(ctx, playerCenterX, playerCenterY, tileSize);
    }

    // Render particles (after game objects, before UI)
    effectsManager.renderParticles(ctx, 0, 0); // Already translated by camera

    // Render room transition overlay in world space (only on room area)
    effectsManager.renderTransitionInWorldSpace(ctx);

    ctx.restore();

    // Render shop tooltips in screen space (after ctx.restore)
    this.renderShopTooltip(ctx, { x: camX, y: camY });
  }
}
