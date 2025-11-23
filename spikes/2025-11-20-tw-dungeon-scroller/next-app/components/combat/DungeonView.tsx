'use client';

import { useEffect, useRef } from 'react';
import { TILE, TILE_SOURCE_SIZE } from '@/lib/constants';
import type { TileType, Room } from '@/lib/constants';
import type { Player } from '@/lib/enemy';
import type { RenderMap, TileTheme, TileVariant, WallType } from '@/lib/tiletheme/types';
import { WALL_TYPE } from '@/lib/tiletheme/types';
import { getThemeRenderer } from '@/lib/tiletheme/ThemeRenderer';
import { detectDoorType } from '@/lib/tiletheme/WallTypeDetector';
import { VisibilityCalculator } from '@/lib/visibility';
import { useFallbackTheme } from '@/hooks/useFallbackTheme';
import { getContext2D } from '@/lib/rendering/canvasUtils';
import { RENDER_COLORS } from '@/lib/ui/colors';
import Torch from './Torch';

interface DungeonViewProps {
  isPlayerAttacking?: boolean;
  isEnemyHurt?: boolean;
  // Dungeon data for real map rendering
  player?: Player;
  dungeon?: TileType[][];
  roomMap?: number[][];
  rooms?: Room[];
  renderMap?: RenderMap | null;
  doorStates?: Map<string, boolean>;
  darkTheme?: TileTheme | null;
  tileSize?: number;
}

// Combat view zoom factor
const ZOOM_FACTOR = 3;

export default function DungeonView({
  player,
  dungeon,
  roomMap,
  rooms,
  renderMap,
  doorStates,
  darkTheme,
  tileSize = 64
}: DungeonViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if we have real dungeon data
  const hasRealDungeonData = !!(player && dungeon && renderMap && darkTheme);

  // Load fallback theme only if no real dungeon data
  const { theme: fallbackTheme, isLoaded: fallbackThemeLoaded } = useFallbackTheme(hasRealDungeonData);

  // Render with real dungeon data (zoomed in on player)
  useEffect(() => {
    if (!hasRealDungeonData) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = getContext2D(canvas);
    if (!ctx) return;

    const renderer = getThemeRenderer();

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw dark atmospheric background (for unexplored areas)
    const bgGradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(0.5, '#16213e');
    bgGradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle stone texture effect for dungeon atmosphere
    ctx.globalAlpha = 0.15;
    const stoneSize = (tileSize * ZOOM_FACTOR) / 2;
    for (let sy = 0; sy < canvas.height; sy += stoneSize) {
      for (let sx = 0; sx < canvas.width; sx += stoneSize) {
        const shade = Math.random() * 0.1;
        ctx.fillStyle = `rgba(${30 + shade * 50}, ${30 + shade * 50}, ${50 + shade * 50}, 1)`;
        ctx.fillRect(sx, sy, stoneSize - 1, stoneSize - 1);
      }
    }
    ctx.globalAlpha = 1.0;

    const dungeonWidth = renderMap!.width;
    const dungeonHeight = renderMap!.height;

    // Zoomed tile size
    const zoomedTileSize = tileSize * ZOOM_FACTOR;

    // Camera centered on player with zoom
    const camX = player!.x * ZOOM_FACTOR + zoomedTileSize / 2 - canvas.width / 2;
    const camY = player!.y * ZOOM_FACTOR + zoomedTileSize / 2 - canvas.height / 2;

    // Calculate visible tile range
    const startCol = Math.floor(camX / zoomedTileSize);
    const endCol = startCol + Math.ceil(canvas.width / zoomedTileSize) + 1;
    const startRow = Math.floor(camY / zoomedTileSize);
    const endRow = startRow + Math.ceil(canvas.height / zoomedTileSize) + 1;

    // Render tiles
    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        if (x < 0 || x >= dungeonWidth || y < 0 || y >= dungeonHeight) {
          continue;
        }

        const tile = dungeon![y][x];
        const roomId = roomMap![y][x];

        if (tile === TILE.EMPTY) continue;

        // Check visibility using VisibilityCalculator
        const isVisible = VisibilityCalculator.isTileVisible(
          x, y, roomId, roomMap!, rooms!, dungeonWidth, dungeonHeight
        );

        if (!isVisible) {
          // Skip - let the atmospheric background show through
          continue;
        }

        // Special handling for doors
        if (tile === TILE.DOOR && darkTheme) {
          const doorKey = `${x},${y}`;
          const isOpen = doorStates?.get(doorKey) ?? false;
          const doorType = detectDoorType(dungeon!, x, y, isOpen);
          const doorVariants = darkTheme.door[doorType];

          if (doorVariants && doorVariants.length > 0) {
            const variant = doorVariants[0];
            const tileset = renderer.getTilesetImage(variant.source.tilesetId);

            if (tileset) {
              ctx.drawImage(
                tileset,
                variant.source.x * TILE_SOURCE_SIZE,
                variant.source.y * TILE_SOURCE_SIZE,
                TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
                x * zoomedTileSize - camX,
                y * zoomedTileSize - camY,
                zoomedTileSize, zoomedTileSize
              );
            }
          }
          continue;
        }

        // Get pre-computed render tile
        const renderTile = renderMap!.tiles[y]?.[x];
        if (!renderTile) continue;

        // Always use dark tiles in combat view
        const tilesetId = renderTile.darkTilesetId;
        const srcX = renderTile.darkSrcX;
        const srcY = renderTile.darkSrcY;

        const tileset = renderer.getTilesetImage(tilesetId);

        if (tileset) {
          ctx.drawImage(
            tileset,
            srcX, srcY, TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
            x * zoomedTileSize - camX,
            y * zoomedTileSize - camY,
            zoomedTileSize, zoomedTileSize
          );
        } else {
          ctx.fillStyle = RENDER_COLORS.MISSING_TILE;
          ctx.fillRect(
            x * zoomedTileSize - camX,
            y * zoomedTileSize - camY,
            zoomedTileSize,
            zoomedTileSize
          );
        }
      }
    }

    // Add atmospheric overlay
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  }, [hasRealDungeonData, player, dungeon, roomMap, rooms, renderMap, doorStates, darkTheme, tileSize]);

  // Fallback rendering (static arena) when no real data
  useEffect(() => {
    if (hasRealDungeonData || !fallbackThemeLoaded || !fallbackTheme) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = getContext2D(canvas);
    if (!ctx) return;

    const renderer = getThemeRenderer();

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const fallbackTileSize = 64;
    const tilesX = Math.ceil(canvas.width / fallbackTileSize) + 1;
    const tilesY = Math.ceil(canvas.height / fallbackTileSize) + 1;

    const drawTileVariant = (variants: TileVariant[] | undefined, x: number, y: number) => {
      if (!variants || variants.length === 0) return;

      const variant = variants[0];
      const tileset = renderer.getTilesetImage(variant.source.tilesetId);

      if (tileset) {
        ctx.drawImage(
          tileset,
          variant.source.x * TILE_SOURCE_SIZE,
          variant.source.y * TILE_SOURCE_SIZE,
          TILE_SOURCE_SIZE,
          TILE_SOURCE_SIZE,
          x * fallbackTileSize,
          y * fallbackTileSize,
          fallbackTileSize,
          fallbackTileSize
        );
      }
    };

    const getWallVariants = (wallType: WallType): TileVariant[] | undefined => {
      return fallbackTheme.wall[wallType];
    };

    // Draw floor tiles
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        drawTileVariant(fallbackTheme.floor.default, x, y);
      }
    }

    // Draw back wall
    for (let x = 0; x < tilesX; x++) {
      drawTileVariant(getWallVariants(WALL_TYPE.HORIZONTAL), x, 0);
    }

    // Draw side walls
    const wallHeight = 5;
    for (let y = 1; y < wallHeight; y++) {
      drawTileVariant(getWallVariants(WALL_TYPE.VERTICAL), 0, y);
      drawTileVariant(getWallVariants(WALL_TYPE.VERTICAL), 1, y);

      const rightX = tilesX - 1;
      const rightX2 = tilesX - 2;
      drawTileVariant(getWallVariants(WALL_TYPE.VERTICAL), rightX, y);
      drawTileVariant(getWallVariants(WALL_TYPE.VERTICAL), rightX2, y);
    }

    // Draw corners
    drawTileVariant(getWallVariants(WALL_TYPE.CORNER_TL), 0, 0);
    drawTileVariant(getWallVariants(WALL_TYPE.CORNER_TL), 1, 0);
    drawTileVariant(getWallVariants(WALL_TYPE.CORNER_TR), tilesX - 1, 0);
    drawTileVariant(getWallVariants(WALL_TYPE.CORNER_TR), tilesX - 2, 0);

    // Add atmospheric gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

  }, [hasRealDungeonData, fallbackThemeLoaded, fallbackTheme]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      overflow: 'hidden',
      background: '#1a1a1a'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />

      {/* Torches */}
      <Torch left={100} top={50} />
      <Torch left={typeof window !== 'undefined' ? window.innerWidth - 130 : 800} top={50} />
    </div>
  );
}
