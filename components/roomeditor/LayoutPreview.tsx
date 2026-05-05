'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { TILE } from '@/lib/constants';
import type { TileType } from '@/lib/constants';
import { generateSingleThemeRenderMap } from '@/lib/tiletheme/RenderMapGenerator';
import { getThemeRenderer } from '@/lib/tiletheme/ThemeRenderer';
import type { TileTheme, ImportedTileset } from '@/lib/tiletheme/types';

interface LayoutPreviewProps {
  tileGrid: TileType[][];
  width: number;
  height: number;
}

const DISPLAY_TILE_SIZE = 48;

export default function LayoutPreview({ tileGrid, width, height }: LayoutPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<TileTheme | null>(null);
  const [tilesets, setTilesets] = useState<ImportedTileset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const CANVAS_WIDTH = width * DISPLAY_TILE_SIZE;
  const CANVAS_HEIGHT = height * DISPLAY_TILE_SIZE;

  // Load theme + tilesets from Tilemap Editor API
  const loadTheme = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch available themes
      const themesRes = await fetch('/api/tilemapeditor/themes');
      if (!themesRes.ok) throw new Error('Themes API failed');
      const themes: TileTheme[] = await themesRes.json();

      if (themes.length === 0) throw new Error('No themes available');

      // Use the first theme (matches what the game uses as default)
      const activeTheme = themes[0];
      setTheme(activeTheme);

      // Fetch tilesets
      const tilesetsRes = await fetch('/api/tilemapeditor/tilesets');
      if (!tilesetsRes.ok) throw new Error('Tilesets API failed');
      const loadedTilesets: ImportedTileset[] = await tilesetsRes.json();
      setTilesets(loadedTilesets);

      // Pre-load tileset images into ThemeRenderer
      const renderer = getThemeRenderer();
      for (const ts of loadedTilesets) {
        if (!renderer.isTilesetLoaded(ts.id)) {
          await renderer.loadTileset(ts.id, ts.path);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load theme');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  // Render preview using theme system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !theme || loading) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Generate RenderMap from tileGrid using the theme
    const renderMap = generateSingleThemeRenderMap(tileGrid, theme, 42);

    // Render using ThemeRenderer (same renderer the game uses)
    const renderer = getThemeRenderer();
    renderer.renderFullMap(ctx, renderMap, DISPLAY_TILE_SIZE);

    // Draw grid lines over empty tiles for clarity
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tileGrid[y][x] === TILE.EMPTY) {
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(x * DISPLAY_TILE_SIZE, y * DISPLAY_TILE_SIZE, DISPLAY_TILE_SIZE, DISPLAY_TILE_SIZE);
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * DISPLAY_TILE_SIZE, y * DISPLAY_TILE_SIZE, DISPLAY_TILE_SIZE, DISPLAY_TILE_SIZE);
        }
      }
    }
  }, [tileGrid, width, height, theme, loading, CANVAS_WIDTH, CANVAS_HEIGHT]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#1a1a1a',
      flex: 1,
      overflow: 'auto'
    }}>
      <div style={{
        fontSize: '14px',
        color: '#aaa',
        marginBottom: '12px',
        fontFamily: 'Rajdhani, monospace'
      }}>
        Preview Mode — Drawing disabled
      </div>

      {loading && (
        <div style={{ color: '#666', fontSize: '14px', fontFamily: 'Rajdhani, monospace' }}>
          Loading theme...
        </div>
      )}

      {error && (
        <div style={{ color: '#d44', fontSize: '13px', fontFamily: 'Rajdhani, monospace', marginBottom: '8px' }}>
          {error}
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '2px solid #555',
          imageRendering: 'pixelated'
        }}
      />
    </div>
  );
}
