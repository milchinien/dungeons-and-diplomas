'use client';

import { useState, useEffect, useReducer, useCallback, useMemo } from 'react';
import { TILE } from '@/lib/constants';
import type { TileType } from '@/lib/constants';
import type { RoomLayoutInput, DoorPositions } from '@/lib/roomlayouts/types';
import { validateRoomLayout } from '@/lib/roomlayouts/validation';
import { useRouter } from 'next/navigation';
import LayoutCanvas from './LayoutCanvas';
import LayoutSettings from './LayoutSettings';
import LayoutPreview from './LayoutPreview';
import type { DrawTool } from './LayoutCanvas';

// --- Reducer Types ---

type GridAction =
  | { type: 'SET_TILE'; x: number; y: number; tile: TileType }
  | { type: 'FLOOD_FILL'; startX: number; startY: number; newTile: TileType; width: number; height: number }
  | { type: 'RESIZE'; newWidth: number; newHeight: number }
  | { type: 'RESET'; width: number; height: number }
  | { type: 'LOAD'; grid: TileType[][] }
  | { type: 'UNDO' }
  | { type: 'REDO' };

interface GridState {
  history: TileType[][][];
  pointer: number;
  maxHistory: number;
}

// --- Reducer ---

function gridReducer(state: GridState, action: GridAction): GridState {
  const { history, pointer, maxHistory } = state;
  const currentGrid = history[pointer];

  const pushGrid = (newGrid: TileType[][]): GridState => {
    // Truncate any redo history after current pointer
    const truncated = history.slice(0, pointer + 1);
    truncated.push(newGrid);
    // Cap at maxHistory
    if (truncated.length > maxHistory) {
      truncated.shift();
      return { history: truncated, pointer: truncated.length - 1, maxHistory };
    }
    return { history: truncated, pointer: truncated.length - 1, maxHistory };
  };

  switch (action.type) {
    case 'SET_TILE': {
      const newGrid = currentGrid.map(row => [...row]);
      newGrid[action.y][action.x] = action.tile;
      return pushGrid(newGrid);
    }

    case 'FLOOD_FILL': {
      const { startX, startY, newTile, width, height } = action;
      const targetTile = currentGrid[startY][startX];
      if (targetTile === newTile) return state;

      const newGrid = currentGrid.map(row => [...row]);
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

        queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }

      return pushGrid(newGrid);
    }

    case 'RESIZE': {
      const { newWidth, newHeight } = action;
      const newGrid = createEmptyGrid(newWidth, newHeight);
      for (let y = 0; y < Math.min(currentGrid.length, newHeight); y++) {
        for (let x = 0; x < Math.min(currentGrid[0]?.length || 0, newWidth); x++) {
          newGrid[y][x] = currentGrid[y][x];
        }
      }
      return pushGrid(newGrid);
    }

    case 'RESET':
      return pushGrid(createEmptyGrid(action.width, action.height));

    case 'LOAD':
      return { history: [action.grid], pointer: 0, maxHistory };

    case 'UNDO':
      if (pointer <= 0) return state;
      return { ...state, pointer: pointer - 1 };

    case 'REDO':
      if (pointer >= history.length - 1) return state;
      return { ...state, pointer: pointer + 1 };

    default:
      return state;
  }
}

// --- Main Component ---

interface RoomLayoutEditorProps {
  initialLayoutId?: number;
}

export default function RoomLayoutEditor({ initialLayoutId }: RoomLayoutEditorProps) {
  const router = useRouter();
  const [currentLayoutId, setCurrentLayoutId] = useState<number | null>(initialLayoutId ?? null);
  const [layoutName, setLayoutName] = useState('New Layout');
  const [width, setWidth] = useState(8);
  const [height, setHeight] = useState(8);
  const [roomType, setRoomType] = useState<string>('any');
  const [difficulty, setDifficulty] = useState(5);
  const [tags, setTags] = useState<string[]>([]);

  // Drawing state
  const [activeTool, setActiveTool] = useState<DrawTool>('pen');
  const [selectedTile, setSelectedTile] = useState<TileType>(TILE.FLOOR);

  // Preview mode
  const [showPreview, setShowPreview] = useState(false);

  // Grid state with undo/redo
  const [gridState, dispatch] = useReducer(gridReducer, {
    history: [createEmptyGrid(8, 8)],
    pointer: 0,
    maxHistory: 30
  });

  const tileGrid = gridState.history[gridState.pointer];
  const canUndo = gridState.pointer > 0;
  const canRedo = gridState.pointer < gridState.history.length - 1;

  // Load initial layout if ID provided
  useEffect(() => {
    if (!initialLayoutId) return;
    const loadLayout = async () => {
      try {
        const response = await fetch(`/api/room-layouts/${initialLayoutId}`);
        if (response.ok) {
          const layout = await response.json();
          setCurrentLayoutId(layout.id);
          setLayoutName(layout.name);
          setWidth(layout.width);
          setHeight(layout.height);
          setRoomType(layout.roomType);
          setDifficulty(layout.difficulty);
          setTags(layout.tags);
          dispatch({ type: 'LOAD', grid: layout.tileGrid });
        }
      } catch (error) {
        console.error('Failed to load layout:', error);
      }
    };
    loadLayout();
  }, [initialLayoutId]);

  // Live validation
  const validationResult = useMemo(() => {
    const doorPositions = detectDoorPositions(tileGrid, width, height);
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
    return validateRoomLayout(layoutInput);
  }, [tileGrid, width, height, layoutName, roomType, difficulty, tags]);

  // --- Handlers ---

  const handleSettingsChange = (settings: Partial<RoomLayoutInput>) => {
    if (settings.name !== undefined) setLayoutName(settings.name);
    if (settings.roomType !== undefined) setRoomType(settings.roomType);
    if (settings.difficulty !== undefined) setDifficulty(settings.difficulty);
    if (settings.tags !== undefined) setTags(settings.tags);

    if (settings.width !== undefined && settings.width !== width) {
      setWidth(settings.width);
      dispatch({ type: 'RESIZE', newWidth: settings.width, newHeight: height });
    }
    if (settings.height !== undefined && settings.height !== height) {
      setHeight(settings.height);
      dispatch({ type: 'RESIZE', newWidth: width, newHeight: settings.height });
    }
  };

  const handleTileChange = useCallback((x: number, y: number, tile: TileType) => {
    dispatch({ type: 'SET_TILE', x, y, tile });
  }, []);

  const handleFloodFill = useCallback((startX: number, startY: number, newTile: TileType) => {
    dispatch({ type: 'FLOOD_FILL', startX, startY, newTile, width, height });
  }, [width, height]);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const handleSave = async () => {
    const doorPositions = detectDoorPositions(tileGrid, width, height);
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

    // Validate (redundant with live validation, but ensures correctness)
    const validation = validateRoomLayout(layoutInput);
    if (!validation.isValid) {
      alert(`Validation failed:\n${validation.errors.join('\n')}`);
      return;
    }

    try {
      let response;
      if (currentLayoutId) {
        response = await fetch(`/api/room-layouts/${currentLayoutId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(layoutInput)
        });
      } else {
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

  const handleReset = () => {
    if (confirm('Reset canvas? This will clear all tiles.')) {
      dispatch({ type: 'RESET', width, height });
    }
  };

  const canSave = layoutName.trim().length > 0 && validationResult.isValid;

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      fontFamily: 'Rajdhani, monospace',
      flexDirection: 'column'
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        backgroundColor: '#222',
        borderBottom: '1px solid #333',
        gap: '12px',
        flexShrink: 0
      }}>
        <button
          onClick={() => router.push('/room-editor')}
          style={{
            padding: '6px 14px',
            backgroundColor: '#333',
            color: '#ccc',
            border: '1px solid #555',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'Rajdhani, monospace',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3a3a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#333'; }}
        >
          ← Zurück
        </button>
        <span style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#ddd'
        }}>
          {currentLayoutId ? 'Layout bearbeiten' : 'Neues Layout'}
        </span>
      </div>

      {/* Editor Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Center: Canvas or Preview */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showPreview ? (
          <LayoutPreview tileGrid={tileGrid} width={width} height={height} />
        ) : (
          <LayoutCanvas
            width={width}
            height={height}
            tileGrid={tileGrid}
            onTileChange={handleTileChange}
            onFloodFill={handleFloodFill}
            activeTool={activeTool}
            selectedTile={selectedTile}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        )}

        {/* Live Validation Errors */}
        {!validationResult.isValid && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#3a1a1a',
            borderTop: '1px solid #d44',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {validationResult.errors.map((error, i) => (
              <span key={i} style={{
                fontSize: '12px',
                color: '#ff6b6b',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ color: '#d44' }}>⚠</span> {error}
              </span>
            ))}
          </div>
        )}
      </div>

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
        showPreview={showPreview}
        onPreviewToggle={() => setShowPreview(!showPreview)}
      />
      </div>
    </div>
  );
}

// --- Utility Functions ---

function createEmptyGrid(width: number, height: number): TileType[][] {
  return Array(height).fill(null).map(() =>
    Array(width).fill(TILE.EMPTY)
  );
}

function detectDoorPositions(tileGrid: TileType[][], width: number, height: number): DoorPositions {
  const doorPositions: DoorPositions = { north: false, south: false, east: false, west: false };

  for (let x = 0; x < width; x++) {
    if (tileGrid[0]?.[x] === TILE.DOOR) doorPositions.north = true;
    if (tileGrid[height - 1]?.[x] === TILE.DOOR) doorPositions.south = true;
  }
  for (let y = 0; y < height; y++) {
    if (tileGrid[y]?.[0] === TILE.DOOR) doorPositions.west = true;
    if (tileGrid[y]?.[width - 1] === TILE.DOOR) doorPositions.east = true;
  }

  return doorPositions;
}
