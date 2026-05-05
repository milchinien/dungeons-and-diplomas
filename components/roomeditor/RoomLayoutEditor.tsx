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
import ToolBar from './ToolBar';
import StatusBar from './StatusBar';
import HelpOverlay from './HelpOverlay';
import ConfirmModal from './ConfirmModal';
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

  // Grid visibility
  const [showGrid, setShowGrid] = useState(true);

  // Help overlay
  const [showHelp, setShowHelp] = useState(false);

  // Confirmation modals
  const [confirmModal, setConfirmModal] = useState<{
    type: 'reset' | 'delete';
    data?: any;
  } | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Cursor position for status bar
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);

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
    // If placing a door on an edge, remove other doors on same edge
    if (tile === TILE.DOOR) {
      const isEdge = x === 0 || x === width - 1 || y === 0 || y === height - 1;
      if (isEdge) {
        const currentGrid = gridState.history[gridState.pointer];

        // North edge (y = 0)
        if (y === 0) {
          for (let checkX = 0; checkX < width; checkX++) {
            if (checkX !== x && currentGrid[0]?.[checkX] === TILE.DOOR) {
              dispatch({ type: 'SET_TILE', x: checkX, y: 0, tile: TILE.EMPTY });
            }
          }
        }

        // South edge (y = height - 1)
        if (y === height - 1) {
          for (let checkX = 0; checkX < width; checkX++) {
            if (checkX !== x && currentGrid[height - 1]?.[checkX] === TILE.DOOR) {
              dispatch({ type: 'SET_TILE', x: checkX, y: height - 1, tile: TILE.EMPTY });
            }
          }
        }

        // West edge (x = 0)
        if (x === 0) {
          for (let checkY = 0; checkY < height; checkY++) {
            if (checkY !== y && currentGrid[checkY]?.[0] === TILE.DOOR) {
              dispatch({ type: 'SET_TILE', x: 0, y: checkY, tile: TILE.EMPTY });
            }
          }
        }

        // East edge (x = width - 1)
        if (x === width - 1) {
          for (let checkY = 0; checkY < height; checkY++) {
            if (checkY !== y && currentGrid[checkY]?.[width - 1] === TILE.DOOR) {
              dispatch({ type: 'SET_TILE', x: width - 1, y: checkY, tile: TILE.EMPTY });
            }
          }
        }
      }
    }

    // Place the tile
    dispatch({ type: 'SET_TILE', x, y, tile });
  }, [width, height, gridState.history, gridState.pointer]);

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
      setToast({ message: `❌ Validation failed: ${validation.errors[0]}`, type: 'error' });
      setTimeout(() => setToast(null), 3000);
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
        setToast({ message: '✓ Layout saved!', type: 'success' });
        setTimeout(() => setToast(null), 2000);
      } else {
        const error = await response.json();
        setToast({ message: `❌ Failed to save: ${error.error || 'Unknown error'}`, type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error('Save error:', error);
      setToast({ message: '❌ Failed to save layout', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleReset = () => {
    setConfirmModal({ type: 'reset' });
  };

  const confirmReset = () => {
    dispatch({ type: 'RESET', width, height });
    setConfirmModal(null);
  };

  const canSave = layoutName.trim().length > 0 && validationResult.isValid;

  // Keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Help overlay
      if ((e.key === '?' || e.key.toLowerCase() === 'h') && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // ESC to close modals
      if (e.key === 'Escape') {
        if (showHelp) {
          setShowHelp(false);
        } else if (confirmModal) {
          setConfirmModal(null);
        }
        return;
      }

      // Don't handle tool shortcuts if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Tool shortcuts
      if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setActiveTool('pen');
      } else if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setActiveTool('eraser');
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setActiveTool('fill');
      } else if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setActiveTool('door');
      } else if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setShowGrid(!showGrid);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp, confirmModal, showGrid]);

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

      {/* Toolbar */}
      <ToolBar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onGridToggle={() => setShowGrid(!showGrid)}
        onHelpToggle={() => setShowHelp(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        onReset={handleReset}
        canUndo={canUndo}
        canRedo={canRedo}
        canSave={canSave}
        gridVisible={showGrid}
      />

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
            showGrid={showGrid}
            onCursorMove={setCursorPosition}
          />
        )}

        {/* Status Bar */}
        <StatusBar
          cursorX={cursorPosition?.x ?? null}
          cursorY={cursorPosition?.y ?? null}
          activeTool={activeTool}
          canvasWidth={width}
          canvasHeight={height}
          validationState={validationResult}
          gridVisible={showGrid}
        />
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

      {/* Help Overlay */}
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}

      {/* Confirmation Modals */}
      {confirmModal?.type === 'reset' && (
        <ConfirmModal
          title="Reset Canvas?"
          message="This will clear all tiles. This action cannot be undone."
          confirmText="Reset"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmReset}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 20px',
          backgroundColor: toast.type === 'success' ? '#4ade80' : '#ef4444',
          color: 'white',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          fontFamily: 'Rajdhani, monospace',
          zIndex: 1001,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// --- Utility Functions ---

function createEmptyGrid(width: number, height: number): TileType[][] {
  return Array(height).fill(null).map(() =>
    Array(width).fill(TILE.EMPTY)
  );
}

/**
 * Detects exact door positions from tile grid
 * Returns first door found on each side (editor should only allow one)
 */
function detectDoorPositions(tileGrid: TileType[][], width: number, height: number): DoorPositions {
  const doorPositions: DoorPositions = {
    north: null,
    south: null,
    east: null,
    west: null
  };

  // North (top row, y=0)
  for (let x = 0; x < width; x++) {
    if (tileGrid[0]?.[x] === TILE.DOOR) {
      doorPositions.north = x;
      break; // Only first door
    }
  }

  // South (bottom row, y=height-1)
  for (let x = 0; x < width; x++) {
    if (tileGrid[height - 1]?.[x] === TILE.DOOR) {
      doorPositions.south = x;
      break;
    }
  }

  // West (left column, x=0)
  for (let y = 0; y < height; y++) {
    if (tileGrid[y]?.[0] === TILE.DOOR) {
      doorPositions.west = y;
      break;
    }
  }

  // East (right column, x=width-1)
  for (let y = 0; y < height; y++) {
    if (tileGrid[y]?.[width - 1] === TILE.DOOR) {
      doorPositions.east = y;
      break;
    }
  }

  return doorPositions;
}
