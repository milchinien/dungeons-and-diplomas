'use client';

import { useEffect, useRef, useState } from 'react';
import { TILE, TILE_SOURCE_SIZE } from '@/lib/constants';
import type { TileType, Room } from '@/lib/constants';
import type { Player } from '@/lib/enemy';
import type { RenderMap, TileTheme, TileVariant, WallType } from '@/lib/tiletheme/types';
import { WALL_TYPE } from '@/lib/tiletheme/types';
import { getThemeRenderer } from '@/lib/tiletheme/ThemeRenderer';
import { detectDoorType } from '@/lib/tiletheme/WallTypeDetector';

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
  isPlayerAttacking,
  isEnemyHurt,
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
  const [fallbackThemeLoaded, setFallbackThemeLoaded] = useState(false);
  const fallbackThemeRef = useRef<TileTheme | null>(null);

  // Check if we have real dungeon data
  const hasRealDungeonData = !!(player && dungeon && renderMap && darkTheme);

  // Load fallback theme only if no real dungeon data
  useEffect(() => {
    if (hasRealDungeonData) return;

    const loadTheme = async () => {
      try {
        const response = await fetch('/api/theme/1');
        if (!response.ok) {
          console.warn('Failed to load theme for combat view');
          return;
        }

        const data = await response.json();
        fallbackThemeRef.current = data.theme;
        const tilesets = data.tilesets;

        const renderer = getThemeRenderer();
        for (const tileset of tilesets) {
          if (!renderer.isTilesetLoaded(tileset.id)) {
            await renderer.loadTileset(tileset.id, tileset.path);
          }
        }

        setFallbackThemeLoaded(true);
      } catch (error) {
        console.error('Error loading theme for combat view:', error);
      }
    };

    loadTheme();
  }, [hasRealDungeonData]);

  // Render with real dungeon data (zoomed in on player)
  useEffect(() => {
    if (!hasRealDungeonData) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
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

        // Check visibility
        let isVisible = false;
        if (roomId >= 0 && rooms![roomId]) {
          isVisible = rooms![roomId].visible;
        } else if (roomId === -1 || roomId === -2) {
          // Walls/doors visible if any adjacent room is visible
          outer: for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < dungeonHeight && nx >= 0 && nx < dungeonWidth) {
                const neighborRoomId = roomMap![ny][nx];
                if (neighborRoomId >= 0 && rooms![neighborRoomId]?.visible) {
                  isVisible = true;
                  break outer;
                }
              }
            }
          }
        }

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
          ctx.fillStyle = '#FF00FF';
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
    if (hasRealDungeonData || !fallbackThemeLoaded || !fallbackThemeRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const theme = fallbackThemeRef.current;
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
      return theme.wall[wallType];
    };

    // Draw floor tiles
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        drawTileVariant(theme.floor.default, x, y);
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

  }, [hasRealDungeonData, fallbackThemeLoaded]);

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

// Torch component with inline styles
function Torch({ left, top }: { left: number; top: number }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: '40px',
      height: '80px',
      zIndex: 5
    }}>
      {/* Torch Flame */}
      <div style={{
        width: '40px',
        height: '45px',
        background: 'radial-gradient(ellipse at center, #ffff00 0%, #ffcc00 30%, #ff9933 60%, #ff6600 100%)',
        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
        animation: 'torchFlicker 0.5s ease-in-out infinite',
        position: 'relative',
        top: '-10px',
        boxShadow: '0 0 25px rgba(255, 153, 51, 0.7), 0 0 50px rgba(255, 102, 0, 0.5)',
        filter: 'blur(1px)'
      }}>
        <div style={{
          position: 'absolute',
          top: '7px',
          left: '7px',
          right: '7px',
          bottom: '7px',
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
      </div>

      {/* Torch Stick */}
      <div style={{
        width: '12px',
        height: '55px',
        backgroundColor: '#8b4513',
        margin: '0 auto',
        borderRadius: '3px'
      }} />

      <style jsx>{`
        @keyframes torchFlicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
