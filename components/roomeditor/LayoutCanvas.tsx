'use client';

import { useRef, useEffect, useState } from 'react';
import { TILE } from '@/lib/constants';
import type { TileType } from '@/lib/constants';

export type DrawTool = 'pen' | 'eraser' | 'fill' | 'door';

interface LayoutCanvasProps {
  width: number;
  height: number;
  tileGrid: TileType[][];
  onTileChange: (x: number, y: number, tile: TileType) => void;
  onFloodFill: (startX: number, startY: number, newTile: TileType) => void;
  activeTool: DrawTool;
  selectedTile: TileType;
}

export default function LayoutCanvas({
  width,
  height,
  tileGrid,
  onTileChange,
  onFloodFill,
  activeTool,
  selectedTile
}: LayoutCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  const TILE_SIZE = 32; // pixels per tile
  const CANVAS_WIDTH = width * TILE_SIZE;
  const CANVAS_HEIGHT = height * TILE_SIZE;

  // Render the grid
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw tiles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tileGrid[y][x];
        let color = '#000';

        if (tile === TILE.FLOOR) color = '#666';
        else if (tile === TILE.WALL) color = '#333';
        else if (tile === TILE.DOOR) color = '#4a9eff';
        else if (tile === TILE.EMPTY) color = '#111';

        ctx.fillStyle = color;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Draw grid lines
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    // Highlight hovered tile
    if (hoveredTile) {
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hoveredTile.x * TILE_SIZE,
        hoveredTile.y * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE
      );

      // Show preview of what will be drawn
      if (activeTool === 'pen') {
        let previewColor = '#000';
        if (selectedTile === TILE.FLOOR) previewColor = 'rgba(102, 102, 102, 0.5)';
        else if (selectedTile === TILE.WALL) previewColor = 'rgba(51, 51, 51, 0.5)';
        else if (selectedTile === TILE.DOOR) previewColor = 'rgba(74, 158, 255, 0.5)';

        ctx.fillStyle = previewColor;
        ctx.fillRect(
          hoveredTile.x * TILE_SIZE + 2,
          hoveredTile.y * TILE_SIZE + 2,
          TILE_SIZE - 4,
          TILE_SIZE - 4
        );
      } else if (activeTool === 'eraser') {
        ctx.fillStyle = 'rgba(17, 17, 17, 0.5)';
        ctx.fillRect(
          hoveredTile.x * TILE_SIZE + 2,
          hoveredTile.y * TILE_SIZE + 2,
          TILE_SIZE - 4,
          TILE_SIZE - 4
        );
      }
    }
  }, [width, height, tileGrid, hoveredTile, activeTool, selectedTile, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    handleDraw(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      setHoveredTile({ x, y });
    } else {
      setHoveredTile(null);
    }

    if (isDrawing && activeTool !== 'fill') {
      handleDraw(e);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
    setHoveredTile(null);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

    if (x < 0 || x >= width || y < 0 || y >= height) return;

    if (activeTool === 'pen') {
      onTileChange(x, y, selectedTile);
    } else if (activeTool === 'eraser') {
      onTileChange(x, y, TILE.EMPTY);
    } else if (activeTool === 'fill') {
      onFloodFill(x, y, selectedTile);
    } else if (activeTool === 'door') {
      // Only allow doors on edges
      const isEdge = x === 0 || x === width - 1 || y === 0 || y === height - 1;
      if (isEdge) {
        onTileChange(x, y, TILE.DOOR);
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#1a1a1a',
      flex: 1,
      overflow: 'auto'
    }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          border: '2px solid #555',
          cursor: activeTool === 'pen' ? 'crosshair' : activeTool === 'eraser' ? 'not-allowed' : activeTool === 'fill' ? 'pointer' : 'cell',
          imageRendering: 'pixelated'
        }}
      />
    </div>
  );
}
