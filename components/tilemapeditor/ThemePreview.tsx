'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import type { TileTheme, ImportedTileset, RenderMap } from '@/lib/tiletheme/types';
import { generateAllWallTypesTestMap } from '@/lib/tiletheme/TestMapGenerator';
import { generateSingleThemeRenderMap } from '@/lib/tiletheme/RenderMapGenerator';
import { ThemeRenderer, getThemeRenderer } from '@/lib/tiletheme/ThemeRenderer';
import { TILE_SOURCE_SIZE } from '@/lib/constants';
import { getContext2D, clearCanvas } from '@/lib/rendering/canvasUtils';

interface ThemePreviewProps {
  theme: TileTheme | null;
  tilesets: ImportedTileset[];
}

const DEFAULT_SCALE = 0.5; // 50% default
const MIN_SCALE = 0.25;
const MAX_SCALE = 2.0;

export function ThemePreview({ theme, tilesets }: ThemePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedTilesets, setLoadedTilesets] = useState<Set<number>>(new Set());
  const [seed, setSeed] = useState(12345);
  const [scale, setScale] = useState(DEFAULT_SCALE);

  // Computed preview tile size based on scale
  const previewTileSize = Math.round(TILE_SOURCE_SIZE * scale);

  // Generate test map
  const testMap = useMemo(() => generateAllWallTypesTestMap(), []);

  // Generate render map when theme changes
  const renderMap: RenderMap | null = useMemo(() => {
    if (!theme) return null;
    return generateSingleThemeRenderMap(testMap.dungeon, theme, seed);
  }, [theme, testMap, seed]);

  // Load tilesets used by the theme
  useEffect(() => {
    if (!theme) return;

    const renderer = getThemeRenderer();
    const tilesetIds = new Set<number>();

    // Collect all tileset IDs from the theme
    for (const variants of Object.values(theme.floor)) {
      if (Array.isArray(variants)) {
        for (const variant of variants) {
          tilesetIds.add(variant.source.tilesetId);
        }
      }
    }
    for (const variants of Object.values(theme.wall)) {
      if (Array.isArray(variants)) {
        for (const variant of variants) {
          tilesetIds.add(variant.source.tilesetId);
        }
      }
    }
    for (const variants of Object.values(theme.door)) {
      if (Array.isArray(variants)) {
        for (const variant of variants) {
          tilesetIds.add(variant.source.tilesetId);
        }
      }
    }

    // Load each tileset
    const loadTilesets = async () => {
      for (const id of tilesetIds) {
        const tileset = tilesets.find((t) => t.id === id);
        if (tileset && !renderer.isTilesetLoaded(id)) {
          await renderer.loadTileset(id, tileset.path);
        }
      }
      setLoadedTilesets(new Set(tilesetIds));
    };

    loadTilesets();
  }, [theme, tilesets]);

  // Render preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !renderMap) return;

    const ctx = getContext2D(canvas);
    if (!ctx) return;

    const width = testMap.width * previewTileSize;
    const height = testMap.height * previewTileSize;

    canvas.width = width;
    canvas.height = height;

    // Clear with black
    clearCanvas(ctx);

    // Render using ThemeRenderer
    const renderer = getThemeRenderer();
    renderer.renderFullMap(ctx, renderMap, previewTileSize);
  }, [renderMap, testMap, loadedTilesets, previewTileSize]);

  const regenerate = () => {
    setSeed(Math.floor(Math.random() * 1000000));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Preview</h3>
        <button
          onClick={regenerate}
          className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded"
          title="Varianten neu würfeln"
        >
          Neu würfeln
        </button>
      </div>

      {/* Zoom slider */}
      <div className="p-2 border-b border-gray-700 flex items-center gap-2">
        <label className="text-gray-400 text-xs whitespace-nowrap">Zoom:</label>
        <input
          type="range"
          min={MIN_SCALE * 100}
          max={MAX_SCALE * 100}
          value={scale * 100}
          onChange={(e) => setScale(parseInt(e.target.value) / 100)}
          className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-gray-400 text-xs w-10 text-right">{Math.round(scale * 100)}%</span>
      </div>

      <div className="flex-1 overflow-auto p-2 bg-gray-900 flex items-center justify-center">
        {theme ? (
          <div className="border border-gray-700 rounded">
            <canvas
              ref={canvasRef}
              style={{ imageRendering: 'pixelated' }}
              className="block"
            />
          </div>
        ) : (
          <div className="text-gray-500 text-sm text-center">
            <p>Kein Theme geladen</p>
            <p className="text-xs mt-1">Preview erscheint nach dem Laden</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-2 border-t border-gray-700 text-gray-400 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-pink-500"></span>
          <span>= Fehlendes Tile</span>
        </div>
      </div>
    </div>
  );
}
