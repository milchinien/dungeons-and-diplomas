'use client';

import { useState, useCallback } from 'react';
import { TILE } from '@/lib/constants';
import type { TileType } from '@/lib/constants';
import type { RoomLayout, RoomLayoutInput, DoorPositions } from '@/lib/roomlayouts/types';
import { validateRoomLayout } from '@/lib/roomlayouts/validation';
import LayoutManager from './LayoutManager';
import LayoutCanvas from './LayoutCanvas';
import LayoutSettings from './LayoutSettings';
import type { DrawTool } from './LayoutCanvas';

export default function RoomLayoutEditor() {
  // Current layout being edited
  const [currentLayoutId, setCurrentLayoutId] = useState<number | null>(null);
  const [layoutName, setLayoutName] = useState('New Layout');
  const [width, setWidth] = useState(8);
  const [height, setHeight] = useState(8);
  const [roomType, setRoomType] = useState<string>('any');
  const [difficulty, setDifficulty] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [tileGrid, setTileGrid] = useState<TileType[][]>(createEmptyGrid(8, 8));

  // Drawing state
  const [activeTool, setActiveTool] = useState<DrawTool>('pen');
  const [selectedTile, setSelectedTile] = useState<TileType>(TILE.FLOOR);

  // Create new layout
  const handleCreateNew = () => {
    if (confirm('Create a new layout? Unsaved changes will be lost.')) {
      setCurrentLayoutId(null);
      setLayoutName('New Layout');
      setWidth(8);
      setHeight(8);
      setRoomType('any');
      setDifficulty(5);
      setTags([]);
      setTileGrid(createEmptyGrid(8, 8));
    }
  };

  // Load existing layout
  const handleSelectLayout = async (layout: RoomLayout | null) => {
    if (!layout) return;

    if (confirm('Load this layout? Unsaved changes will be lost.')) {
      setCurrentLayoutId(layout.id);
      setLayoutName(layout.name);
      setWidth(layout.width);
      setHeight(layout.height);
      setRoomType(layout.roomType);
      setDifficulty(layout.difficulty);
      setTags(layout.tags);
      setTileGrid(layout.tileGrid);
    }
  };

  // Delete layout
  const handleDeleteLayout = (layoutId: number) => {
    if (currentLayoutId === layoutId) {
      handleCreateNew();
    }
  };

  // Update settings
  const handleSettingsChange = (settings: Partial<RoomLayoutInput>) => {
    if (settings.name !== undefined) setLayoutName(settings.name);
    if (settings.roomType !== undefined) setRoomType(settings.roomType);
    if (settings.difficulty !== undefined) setDifficulty(settings.difficulty);
    if (settings.tags !== undefined) setTags(settings.tags);

    // Handle grid size changes
    if (settings.width !== undefined && settings.width !== width) {
      setWidth(settings.width);
      setTileGrid(resizeGrid(tileGrid, settings.width, height));
    }
    if (settings.height !== undefined && settings.height !== height) {
      setHeight(settings.height);
      setTileGrid(resizeGrid(tileGrid, width, settings.height));
    }
  };

  // Tile change handler
  const handleTileChange = useCallback((x: number, y: number, tile: TileType) => {
    setTileGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[y][x] = tile;
      return newGrid;
    });
  }, []);

  // Flood fill handler
  const handleFloodFill = useCallback((startX: number, startY: number, newTile: TileType) => {
    setTileGrid(prev => {
      const targetTile = prev[startY][startX];
      if (targetTile === newTile) return prev; // Already the same tile

      const newGrid = prev.map(row => [...row]);
      const queue: [number, number][] = [[startX, startY]];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const [x, y] = queue.shift()!;
        const key = `${x},${y}`;

        if (visited.has(key)) continue;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        if (newGrid[y][x] !== targetTile) continue;

        visited.add(key);
        newGrid[y][x] = newTile;

        // Add neighbors
        queue.push([x + 1, y]);
        queue.push([x - 1, y]);
        queue.push([x, y + 1]);
        queue.push([x, y - 1]);
      }

      return newGrid;
    });
  }, [width, height]);

  // Save layout
  const handleSave = async () => {
    // Detect door positions
    const doorPositions: DoorPositions = {
      north: false,
      south: false,
      east: false,
      west: false
    };

    // Check top edge
    for (let x = 0; x < width; x++) {
      if (tileGrid[0][x] === TILE.DOOR) doorPositions.north = true;
    }

    // Check bottom edge
    for (let x = 0; x < width; x++) {
      if (tileGrid[height - 1][x] === TILE.DOOR) doorPositions.south = true;
    }

    // Check left edge
    for (let y = 0; y < height; y++) {
      if (tileGrid[y][0] === TILE.DOOR) doorPositions.west = true;
    }

    // Check right edge
    for (let y = 0; y < height; y++) {
      if (tileGrid[y][width - 1] === TILE.DOOR) doorPositions.east = true;
    }

    const layoutInput: RoomLayoutInput = {
      name: layoutName,
      width,
      height,
      tileGrid,
      doorPositions,
      roomType: roomType as any,
      difficulty,
      tags
    };

    // Validate
    const validation = validateRoomLayout(layoutInput);
    if (!validation.isValid) {
      alert(`Validation failed:\n${validation.errors.join('\n')}`);
      return;
    }

    try {
      let response;
      if (currentLayoutId) {
        // Update existing
        response = await fetch(`/api/room-layouts/${currentLayoutId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(layoutInput)
        });
      } else {
        // Create new
        response = await fetch('/api/room-layouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(layoutInput)
        });
      }

      if (response.ok) {
        const saved = await response.json();
        setCurrentLayoutId(saved.id);
        alert('Layout saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save layout');
    }
  };

  // Reset canvas
  const handleReset = () => {
    if (confirm('Reset canvas? This will clear all tiles.')) {
      setTileGrid(createEmptyGrid(width, height));
    }
  };

  // Check if can save (must have at least one floor tile)
  const canSave = layoutName.trim().length > 0 &&
                  tileGrid.some(row => row.some(tile => tile === TILE.FLOOR));

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      fontFamily: 'Rajdhani, monospace'
    }}>
      {/* Left Panel: Layout Manager */}
      <LayoutManager
        selectedLayoutId={currentLayoutId}
        onSelectLayout={handleSelectLayout}
        onCreateNew={handleCreateNew}
        onDeleteLayout={handleDeleteLayout}
      />

      {/* Center: Canvas */}
      <LayoutCanvas
        width={width}
        height={height}
        tileGrid={tileGrid}
        onTileChange={handleTileChange}
        onFloodFill={handleFloodFill}
        activeTool={activeTool}
        selectedTile={selectedTile}
      />

      {/* Right Panel: Settings */}
      <LayoutSettings
        layoutName={layoutName}
        roomType={roomType}
        difficulty={difficulty}
        tags={tags}
        width={width}
        height={height}
        onSettingsChange={handleSettingsChange}
        onSave={handleSave}
        onReset={handleReset}
        canSave={canSave}
        activeTool={activeTool}
        onToolChange={setActiveTool}
        selectedTile={selectedTile}
        onTileSelect={setSelectedTile}
      />
    </div>
  );
}

/**
 * Creates an empty grid filled with EMPTY tiles
 */
function createEmptyGrid(width: number, height: number): TileType[][] {
  return Array(height).fill(null).map(() =>
    Array(width).fill(TILE.EMPTY)
  );
}

/**
 * Resizes a grid, preserving existing tiles and filling new space with EMPTY
 */
function resizeGrid(oldGrid: TileType[][], newWidth: number, newHeight: number): TileType[][] {
  const newGrid = createEmptyGrid(newWidth, newHeight);

  for (let y = 0; y < Math.min(oldGrid.length, newHeight); y++) {
    for (let x = 0; x < Math.min(oldGrid[0]?.length || 0, newWidth); x++) {
      newGrid[y][x] = oldGrid[y][x];
    }
  }

  return newGrid;
}
