'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { ImportedTileset, DraggedTile } from '@/lib/tiletheme/types';
import { TILE_SOURCE_SIZE } from '@/lib/constants';
import { getContext2D } from '@/lib/rendering/canvasUtils';

interface TilesetViewerProps {
  tilesets: ImportedTileset[];
  selectedTilesetId: number | null;
  onSelectTileset: (id: number) => void;
  onStartDrag: (tile: DraggedTile) => void;
}

const DEFAULT_SCALE = 0.5; // 50% default
const MIN_SCALE = 0.25;
const MAX_SCALE = 2.0;

export function TilesetViewer({
  tilesets,
  selectedTilesetId,
  onSelectTileset,
  onStartDrag
}: TilesetViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tilesetImage, setTilesetImage] = useState<HTMLImageElement | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);

  // Computed display tile size based on scale
  const displayTileSize = Math.round(TILE_SOURCE_SIZE * scale);

  const selectedTileset = tilesets.find((t) => t.id === selectedTilesetId);

  // Load tileset image
  useEffect(() => {
    if (!selectedTileset) {
      setTilesetImage(null);
      return;
    }

    const img = new Image();
    img.onload = () => setTilesetImage(img);
    img.onerror = () => setTilesetImage(null);
    img.src = selectedTileset.path;
  }, [selectedTileset]);

  // Draw the tileset
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tilesetImage || !selectedTileset) return;

    const ctx = getContext2D(canvas);
    if (!ctx) return;

    // Set canvas size
    canvas.width = selectedTileset.widthTiles * displayTileSize;
    canvas.height = selectedTileset.heightTiles * displayTileSize;

    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    for (let y = 0; y < selectedTileset.heightTiles; y++) {
      for (let x = 0; x < selectedTileset.widthTiles; x++) {
        ctx.drawImage(
          tilesetImage,
          x * TILE_SOURCE_SIZE,
          y * TILE_SOURCE_SIZE,
          TILE_SOURCE_SIZE,
          TILE_SOURCE_SIZE,
          x * displayTileSize,
          y * displayTileSize,
          displayTileSize,
          displayTileSize
        );
      }
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= selectedTileset.widthTiles; x++) {
      ctx.beginPath();
      ctx.moveTo(x * displayTileSize, 0);
      ctx.lineTo(x * displayTileSize, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= selectedTileset.heightTiles; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * displayTileSize);
      ctx.lineTo(canvas.width, y * displayTileSize);
      ctx.stroke();
    }

    // Highlight hovered tile
    if (hoveredTile) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hoveredTile.x * displayTileSize,
        hoveredTile.y * displayTileSize,
        displayTileSize,
        displayTileSize
      );
    }
  }, [tilesetImage, selectedTileset, hoveredTile, displayTileSize]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTileset) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / displayTileSize);
    const y = Math.floor((e.clientY - rect.top) / displayTileSize);

    if (x >= 0 && x < selectedTileset.widthTiles && y >= 0 && y < selectedTileset.heightTiles) {
      setHoveredTile({ x, y });
    } else {
      setHoveredTile(null);
    }
  }, [selectedTileset, displayTileSize]);

  const handleMouseLeave = useCallback(() => {
    setHoveredTile(null);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    if (!hoveredTile || !selectedTileset) return;

    onStartDrag({
      tilesetId: selectedTileset.id,
      tilesetPath: selectedTileset.path,
      x: hoveredTile.x,
      y: hoveredTile.y
    });

    // Create drag image (use fixed size for drag preview)
    const dragSize = 48;
    const dragCanvas = document.createElement('canvas');
    dragCanvas.width = dragSize;
    dragCanvas.height = dragSize;
    const ctx = getContext2D(dragCanvas);
    if (ctx && tilesetImage) {
      ctx.drawImage(
        tilesetImage,
        hoveredTile.x * TILE_SOURCE_SIZE,
        hoveredTile.y * TILE_SOURCE_SIZE,
        TILE_SOURCE_SIZE,
        TILE_SOURCE_SIZE,
        0,
        0,
        dragSize,
        dragSize
      );
    }

    e.dataTransfer.setDragImage(dragCanvas, dragSize / 2, dragSize / 2);
    e.dataTransfer.effectAllowed = 'copy';
  }, [hoveredTile, selectedTileset, onStartDrag, tilesetImage]);

  return (
    <div className="flex flex-col h-full">
      {/* Tileset selector */}
      <div className="p-2 border-b border-gray-700">
        <label className="block text-gray-400 text-xs mb-1">Tileset:</label>
        <select
          value={selectedTilesetId || ''}
          onChange={(e) => onSelectTileset(parseInt(e.target.value))}
          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
        >
          <option value="">-- Tileset wählen --</option>
          {tilesets.map((tileset) => (
            <option key={tileset.id} value={tileset.id}>
              {tileset.name}
            </option>
          ))}
        </select>
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

      {/* Tileset canvas */}
      <div className="flex-1 overflow-auto p-2 bg-gray-900">
        {selectedTileset && tilesetImage ? (
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onDragStart={handleDragStart}
            draggable
            className="cursor-grab"
            style={{ imageRendering: 'pixelated' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {tilesets.length === 0 ? (
              <span>Keine Tilesets vorhanden</span>
            ) : (
              <span>Tileset wird geladen...</span>
            )}
          </div>
        )}
      </div>

      {/* Tile info */}
      {hoveredTile && (
        <div className="p-2 border-t border-gray-700 text-gray-400 text-xs">
          Tile: ({hoveredTile.x}, {hoveredTile.y})
        </div>
      )}
    </div>
  );
}
