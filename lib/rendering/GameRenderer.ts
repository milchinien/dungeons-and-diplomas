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

/**
 * Main game renderer that orchestrates all rendering passes.
 * Uses TileRenderer for tile-specific rendering operations.
 */
export class GameRenderer {
  private tileRenderer = getTileRenderer();
  private pulsePhase = 0;
  private shrineImage: HTMLImageElement | null = null;
  private shrineImageLoaded = false;

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
   * Render all enemies visible in player's rooms or through open doors
   */
  private renderEnemies(
    ctx: CanvasRenderingContext2D,
    enemies: Enemy[],
    rooms: Room[],
    tileSize: number,
    player: Player,
    playerRoomIds: Set<number>,
    roomMap: number[][],
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
  ): void {
    for (const enemy of enemies) {
      // Calculate current tile position
      const enemyTileX = Math.floor((enemy.x + tileSize / 2) / tileSize);
      const enemyTileY = Math.floor((enemy.y + tileSize / 2) / tileSize);

      // Check bounds
      if (enemyTileY < 0 || enemyTileY >= roomMap.length ||
          enemyTileX < 0 || enemyTileX >= roomMap[0]?.length) {
        continue;
      }

      const currentTileRoomId = roomMap[enemyTileY][enemyTileX];

      // Special case: enemy is standing on an open door tile
      if (currentTileRoomId === -2) {
        const doorKey = `${enemyTileX},${enemyTileY}`;
        const isDoorOpen = doorStates.get(doorKey) ?? false;

        if (isDoorOpen) {
          const isVisible = VisibilityCalculator.isEntityOnDoorVisible(
            enemy.x,
            enemy.y,
            enemyTileX,
            enemyTileY,
            player.x,
            player.y,
            playerRoomIds,
            tileSize,
            roomMap,
            rooms,
            dungeon,
            doorStates
          );

          if (isVisible) {
            enemy.draw(ctx, rooms, tileSize, player, playerRoomIds, true);
          }
        }
        continue;
      }

      // Check if enemy is visible through an open door
      const isVisibleThroughDoor = !playerRoomIds.has(enemy.roomId) &&
        VisibilityCalculator.isEnemyVisibleThroughDoor(
          enemy.x,
          enemy.y,
          enemy.roomId,
          player.x,
          player.y,
          playerRoomIds,
          tileSize,
          roomMap,
          rooms,
          dungeon,
          doorStates
        );

      enemy.draw(ctx, rooms, tileSize, player, playerRoomIds, isVisibleThroughDoor);
    }
  }

  // Debug counter for trashmob rendering
  private trashmobRenderDebugCounter = 0;

  /**
   * Render all trashmobs visible in player's rooms or through open doors
   */
  private renderTrashmobs(
    ctx: CanvasRenderingContext2D,
    trashmobs: Trashmob[],
    rooms: Room[],
    tileSize: number,
    playerRoomIds: Set<number>,
    roomMap: number[][],
    player: Player,
    dungeon: TileType[][],
    doorStates: Map<string, boolean>
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

      // Calculate current room based on trashmob's actual position (not spawn roomId)
      const trashmobTileX = Math.floor((trashmob.x + tileSize / 2) / tileSize);
      const trashmobTileY = Math.floor((trashmob.y + tileSize / 2) / tileSize);

      // Check bounds and get current room
      if (trashmobTileY < 0 || trashmobTileY >= roomMap.length ||
          trashmobTileX < 0 || trashmobTileX >= roomMap[0]?.length) {
        continue;
      }

      const currentRoomId = roomMap[trashmobTileY][trashmobTileX];

      // Special case: trashmob is standing on an open door tile
      if (currentRoomId === -2) {
        const doorKey = `${trashmobTileX},${trashmobTileY}`;
        const isDoorOpen = doorStates.get(doorKey) ?? false;

        if (isDoorOpen) {
          // Check if player is near this door
          const isVisible = VisibilityCalculator.isEntityOnDoorVisible(
            trashmob.x,
            trashmob.y,
            trashmobTileX,
            trashmobTileY,
            player.x,
            player.y,
            playerRoomIds,
            tileSize,
            roomMap,
            rooms,
            dungeon,
            doorStates
          );

          if (isVisible) {
            trashmob.draw(ctx, tileSize);
          }
        }
        continue;
      }

      const room = currentRoomId >= 0 ? rooms[currentRoomId] : null;
      if (!room) continue;

      // Check visibility conditions:
      // 1. Player is in the same room (directly visible)
      // 2. OR trashmob is visible through an open door (with LOS and distance check)
      const isInPlayerRoom = playerRoomIds.has(currentRoomId);
      const isVisibleThroughDoor = !isInPlayerRoom && VisibilityCalculator.isEnemyVisibleThroughDoor(
        trashmob.x,
        trashmob.y,
        currentRoomId,
        player.x,
        player.y,
        playerRoomIds,
        tileSize,
        roomMap,
        rooms,
        dungeon,
        doorStates
      );

      if (!isInPlayerRoom && !isVisibleThroughDoor) continue;

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
    this.renderPlayerHealthBar(ctx, player, tileSize);
  }

  /**
   * Render HP and Shield bar above the player
   */
  private renderPlayerHealthBar(
    ctx: CanvasRenderingContext2D,
    player: Player,
    tileSize: number
  ): void {
    const barWidth = tileSize * 1.0;
    const barHeight = 8;
    const barX = player.x + (tileSize - barWidth) / 2;
    let barY = player.y - 12; // Above the player sprite

    const hpPercent = Math.max(0, Math.min(1, player.hp / player.maxHp));
    const hasShield = player.buffs?.hasShield && player.buffs.maxShield > 0;
    const currentShield = hasShield ? Math.floor(player.buffs!.currentShield) : 0;
    const maxShield = hasShield ? player.buffs!.maxShield : 0;
    const shieldPercent = hasShield
      ? Math.max(0, Math.min(1, currentShield / maxShield))
      : 0;

    ctx.save();

    // Move bars up if we have shield
    if (hasShield) {
      barY -= barHeight + 4;
    }

    // Shield bar (if player has shield) - drawn first (above HP)
    if (hasShield) {
      const shieldBarY = barY;
      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(barX - 1, shieldBarY - 1, barWidth + 2, barHeight + 2);
      // Bar background
      ctx.fillStyle = '#222';
      ctx.fillRect(barX, shieldBarY, barWidth, barHeight);
      // Shield fill
      ctx.fillStyle = '#4a9eff';
      ctx.fillRect(barX, shieldBarY, barWidth * shieldPercent, barHeight);
      // Border
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, shieldBarY, barWidth, barHeight);
      // Shield text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 2;
      ctx.fillText(`${currentShield}/${maxShield}`, barX + barWidth / 2, shieldBarY + barHeight / 2);
      ctx.shadowBlur = 0;
    }

    // HP bar
    const hpBarY = hasShield ? barY + barHeight + 2 : barY;
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(barX - 1, hpBarY - 1, barWidth + 2, barHeight + 2);
    // Bar background
    ctx.fillStyle = '#222';
    ctx.fillRect(barX, hpBarY, barWidth, barHeight);
    // HP fill
    const hpColor = hpPercent > 0.5 ? '#00dd00' : hpPercent > 0.25 ? '#ddaa00' : '#dd0000';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, hpBarY, barWidth * hpPercent, barHeight);
    // Border
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, hpBarY, barWidth, barHeight);
    // HP text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 2;
    ctx.fillText(`${Math.floor(player.hp)}/${player.maxHp}`, barX + barWidth / 2, hpBarY + barHeight / 2);
    ctx.shadowBlur = 0;

    ctx.restore();
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
    aimAngle?: number,
    fireballs: import('../projectiles').Fireball[] = []
  ) {
    const ctx = getContext2D(canvas);
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

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

    const playerRoomIds = VisibilityCalculator.getPlayerRoomIds(
      player,
      tileSize,
      roomMap,
      dungeonWidth,
      dungeonHeight,
      false  // Only show enemies in player's current room
    );
    const { tx: playerTileX, ty: playerTileY } = getEntityTilePosition(player, tileSize);

    this.tileRenderer.renderTiles(
      ctx, dungeon, roomMap, rooms, enemies, tileSize, renderMap, doorStates, darkTheme,
      startCol, endCol, startRow, endRow, dungeonWidth, dungeonHeight
    );

    this.tileRenderer.renderFogOfWar(
      ctx, dungeon, roomMap, rooms, playerRoomIds, tileSize,
      startCol, endCol, startRow, endRow, dungeonWidth, dungeonHeight,
      playerTileX, playerTileY, doorStates
    );

    this.renderShrines(ctx, shrines, rooms, tileSize, playerRoomIds);

    this.renderEnemies(ctx, enemies, rooms, tileSize, player, playerRoomIds, roomMap, dungeon, doorStates);

    // Render trashmobs
    this.renderTrashmobs(ctx, trashmobs, rooms, tileSize, playerRoomIds, roomMap, player, dungeon, doorStates);

    // Render fireballs
    for (const fireball of fireballs) {
      if (fireball.alive) {
        fireball.draw(ctx);
      }
    }

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
  }
}
