# Dungeon Map Editor - Implementationsplan

## Status der aktuellen Architektur

### ✅ Bereits gut getrennt!

Die bestehende Code-Basis ist bereits **hervorragend strukturiert** und trennt Rendering perfekt von Game-Logik:

**Rendering (100% stateless)**:
- ✅ `GameRenderer.ts` - Nimmt alle Daten als Parameter, keine internen States
- ✅ `MinimapRenderer.ts` - Komplett unabhängig von Game-Loop
- ✅ Beide Renderer können sofort wiederverwendet werden!

**Game-Logik (separate Klassen)**:
- ✅ `GameEngine.ts` - Update-Logik (Player, Enemies)
- ✅ `DungeonManager.ts` - Dungeon-State und Generation
- ✅ Seeding bereits implementiert!

**Game-Loop**:
- ✅ `useGameState.ts` - React Hook mit `requestAnimationFrame`
- ✅ Trennt klar `update()` und `render()`

### ⚠️ Was angepasst werden muss:

1. **Kamera-Logik**: Player-zentriert → Zoom/Pan/Scroll
2. **Game-Loop**: RAF → Statisches Rendering bei Änderungen
3. **Enemy-Sprites**: Animiert → Statisch (eine Frame)
4. **Fog of War**: Respektiert → Ignoriert (alles sichtbar)

## Ziel: Level-Editor

### Phase 1: Statisches Dungeon-Rendering (Aktuell)

**Features**:
- Neue Route `/editor`
- Drei Seed-Inputs (Structure, Decoration, Spawn)
- Button: "Generate Dungeon"
- Statisches Rendering der kompletten Map
- Zoom In/Out (Mouse Wheel)
- Pan/Scroll (Mouse Drag oder WASD)
- Alle Räume sichtbar (kein Fog of War)
- Enemies statisch dargestellt (nicht animiert)
- Speichern: Level-Name + 3 Seeds in DB

**Nicht in Phase 1**:
- ❌ Tileset-Import
- ❌ Asset-Map Editor
- ❌ Manuelle Asset-Platzierung
- ❌ JSON/DB Export von Asset-Konfigurationen

### Phase 2: Erweiterte Features (Später)

Siehe "Zukünftige Erweiterungen" am Ende.

## Architektur-Übersicht

```
Editor Route (/editor)
├── EditorCanvas (Component)
│   ├── SeedInputPanel (UI für Seeds)
│   ├── EditorToolbar (Zoom, Pan, Save, Load)
│   ├── <canvas> (Main Map View)
│   └── <canvas> (Optional: Minimap)
├── useEditorState (Hook - verwaltet Editor-State)
├── EditorRenderer (Wrapper um GameRenderer)
│   └── GameRenderer (wiederverwendet!)
└── API Routes
    ├── /api/editor/levels (GET/POST)
    └── /api/editor/levels/[id] (GET/DELETE)
```

## Detaillierte Implementierung

---

## 1. Datenbank-Schema

### Neue Tabelle: `editor_levels`

```sql
CREATE TABLE editor_levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                     -- Level Name (z.B. "Test Layout 1")
  structure_seed INTEGER NOT NULL,        -- Structure Seed
  decoration_seed INTEGER NOT NULL,       -- Decoration Seed
  spawn_seed INTEGER NOT NULL,            -- Spawn Seed
  created_by INTEGER,                     -- User ID (optional)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,                             -- Optional: Notizen zum Level
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Index für schnellere Suche
CREATE INDEX idx_editor_levels_created_by ON editor_levels(created_by);
CREATE INDEX idx_editor_levels_name ON editor_levels(name);
```

### Datenbank-Operationen in `lib/db.ts`

Neue Funktionen hinzufügen:

```typescript
interface EditorLevel {
  id?: number;
  name: string;
  structure_seed: number;
  decoration_seed: number;
  spawn_seed: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  notes?: string;
}

/**
 * Save a new editor level
 */
export function saveEditorLevel(level: EditorLevel): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO editor_levels (name, structure_seed, decoration_seed, spawn_seed, created_by, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    level.name,
    level.structure_seed,
    level.decoration_seed,
    level.spawn_seed,
    level.created_by || null,
    level.notes || null
  );

  return result.lastInsertRowid as number;
}

/**
 * Get all editor levels (optionally filtered by user)
 */
export function getEditorLevels(userId?: number): EditorLevel[] {
  const db = getDatabase();

  let query = 'SELECT * FROM editor_levels';
  const params: any[] = [];

  if (userId) {
    query += ' WHERE created_by = ?';
    params.push(userId);
  }

  query += ' ORDER BY updated_at DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params) as EditorLevel[];
}

/**
 * Get a single editor level by ID
 */
export function getEditorLevel(id: number): EditorLevel | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM editor_levels WHERE id = ?');
  return stmt.get(id) as EditorLevel | null;
}

/**
 * Update an existing editor level
 */
export function updateEditorLevel(id: number, updates: Partial<EditorLevel>): void {
  const db = getDatabase();

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.structure_seed !== undefined) {
    fields.push('structure_seed = ?');
    values.push(updates.structure_seed);
  }
  if (updates.decoration_seed !== undefined) {
    fields.push('decoration_seed = ?');
    values.push(updates.decoration_seed);
  }
  if (updates.spawn_seed !== undefined) {
    fields.push('spawn_seed = ?');
    values.push(updates.spawn_seed);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`
    UPDATE editor_levels
    SET ${fields.join(', ')}
    WHERE id = ?
  `);

  stmt.run(...values);
}

/**
 * Delete an editor level
 */
export function deleteEditorLevel(id: number): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM editor_levels WHERE id = ?');
  stmt.run(id);
}
```

**Hinweis für Migration**: Die Tabelle muss in `initializeDatabase()` erstellt werden.

---

## 2. API Routes

### GET `/api/editor/levels` - Liste aller Levels

```typescript
// app/api/editor/levels/route.ts
import { NextResponse } from 'next/server';
import { getEditorLevels } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userIdParam = url.searchParams.get('userId');
    const userId = userIdParam ? parseInt(userIdParam, 10) : undefined;

    const levels = getEditorLevels(userId);

    return NextResponse.json(levels);
  } catch (error) {
    console.error('Error fetching editor levels:', error);
    return NextResponse.json({ error: 'Failed to fetch levels' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || body.structure_seed === undefined ||
        body.decoration_seed === undefined || body.spawn_seed === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const levelId = saveEditorLevel({
      name: body.name,
      structure_seed: body.structure_seed,
      decoration_seed: body.decoration_seed,
      spawn_seed: body.spawn_seed,
      created_by: body.created_by,
      notes: body.notes
    });

    return NextResponse.json({ id: levelId, success: true });
  } catch (error) {
    console.error('Error saving editor level:', error);
    return NextResponse.json({ error: 'Failed to save level' }, { status: 500 });
  }
}
```

### GET/DELETE `/api/editor/levels/[id]` - Einzelnes Level

```typescript
// app/api/editor/levels/[id]/route.ts
import { NextResponse } from 'next/server';
import { getEditorLevel, deleteEditorLevel, updateEditorLevel } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const level = getEditorLevel(id);

    if (!level) {
      return NextResponse.json({ error: 'Level not found' }, { status: 404 });
    }

    return NextResponse.json(level);
  } catch (error) {
    console.error('Error fetching editor level:', error);
    return NextResponse.json({ error: 'Failed to fetch level' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();

    updateEditorLevel(id, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating editor level:', error);
    return NextResponse.json({ error: 'Failed to update level' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    deleteEditorLevel(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting editor level:', error);
    return NextResponse.json({ error: 'Failed to delete level' }, { status: 500 });
  }
}
```

---

## 3. Editor Renderer

Wrapper um `GameRenderer`, der die Kamera-Logik ersetzt.

```typescript
// lib/rendering/EditorRenderer.ts
import { GameRenderer } from './GameRenderer';
import type { TileType, TileVariant, Room } from '../constants';
import type { Player } from '../Enemy';
import { Enemy } from '../Enemy';
import { SpriteSheetLoader } from '../SpriteSheetLoader';

export interface EditorCamera {
  x: number;         // Camera world position X
  y: number;         // Camera world position Y
  zoom: number;      // Zoom level (0.5 = 50%, 1.0 = 100%, 2.0 = 200%)
}

export class EditorRenderer {
  private gameRenderer: GameRenderer;

  constructor() {
    this.gameRenderer = new GameRenderer();
  }

  async loadTileset() {
    await this.gameRenderer.loadTileset();
  }

  /**
   * Render dungeon from editor camera perspective
   *
   * Key differences from GameRenderer.render():
   * - Camera is NOT centered on player
   * - Camera position is freely controlled (pan)
   * - Zoom is applied to tile size
   * - All rooms are visible (no fog of war)
   * - Enemies are rendered statically (no animation updates needed)
   */
  render(
    canvas: HTMLCanvasElement,
    dungeon: TileType[][],
    tileVariants: TileVariant[][],
    roomMap: number[][],
    rooms: Room[],
    enemies: Enemy[],
    camera: EditorCamera,
    baseTileSize: number,
    treasures?: Set<string>,
    playerSpawnPos?: { x: number; y: number } // Optional: Show player spawn
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply zoom to tile size
    const effectiveTileSize = baseTileSize * camera.zoom;

    // Camera position in world coordinates
    const camX = camera.x;
    const camY = camera.y;

    // Create a fake player for GameRenderer (it expects one)
    // We don't render the actual player, but some functions need it
    const fakePlayer: Player = {
      x: playerSpawnPos ? playerSpawnPos.x * effectiveTileSize : 0,
      y: playerSpawnPos ? playerSpawnPos.y * effectiveTileSize : 0,
      width: effectiveTileSize,
      height: effectiveTileSize,
      direction: 'down' as any,
      isMoving: false,
      hp: 100,
      maxHp: 100
    };

    // Make all rooms visible (no fog of war in editor)
    const visibleRooms = rooms.map(room => ({ ...room, visible: true }));

    // HACK: Override GameRenderer's camera logic
    // We need to modify the render function to accept camera parameters
    // For now, we'll use a workaround by adjusting the fake player position
    // and canvas transform

    ctx.save();

    // Clear canvas
    canvas.width = canvas.width; // Quick clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply camera transformation
    ctx.translate(-camX, -camY);
    ctx.scale(camera.zoom, camera.zoom);

    // Call GameRenderer with modified parameters
    // Note: This is a workaround. See "Refactoring Notes" below.
    this.renderDungeonTiles(
      ctx,
      dungeon,
      tileVariants,
      roomMap,
      visibleRooms,
      enemies,
      effectiveTileSize,
      camX / camera.zoom,
      camY / camera.zoom,
      canvas.width / camera.zoom,
      canvas.height / camera.zoom
    );

    // Render treasures
    if (treasures) {
      this.renderTreasures(ctx, treasures, roomMap, visibleRooms, effectiveTileSize);
    }

    // Render enemies (statically)
    this.renderEnemiesStatic(ctx, enemies, visibleRooms, effectiveTileSize);

    // Optional: Render player spawn position
    if (playerSpawnPos) {
      this.renderPlayerSpawn(ctx, playerSpawnPos, effectiveTileSize);
    }

    ctx.restore();
  }

  /**
   * Render dungeon tiles
   * (Simplified version of GameRenderer logic)
   */
  private renderDungeonTiles(
    ctx: CanvasRenderingContext2D,
    dungeon: TileType[][],
    tileVariants: TileVariant[][],
    roomMap: number[][],
    rooms: Room[],
    enemies: Enemy[],
    tileSize: number,
    viewX: number,
    viewY: number,
    viewWidth: number,
    viewHeight: number
  ) {
    // TODO: Copy relevant rendering logic from GameRenderer
    // For MVP, we can reuse GameRenderer.render() with adjusted parameters
    // See "Refactoring Notes" below for better approach
  }

  private renderTreasures(
    ctx: CanvasRenderingContext2D,
    treasures: Set<string>,
    roomMap: number[][],
    rooms: Room[],
    tileSize: number
  ) {
    // Render treasure chests
    // Similar to GameRenderer logic
  }

  private renderEnemiesStatic(
    ctx: CanvasRenderingContext2D,
    enemies: Enemy[],
    rooms: Room[],
    tileSize: number
  ) {
    for (const enemy of enemies) {
      // Render enemy sprite at frame 0 (no animation)
      // enemy.draw() but freeze animation

      // Draw status bar with level/subject/HP
      // (Copy logic from Enemy.draw())
    }
  }

  private renderPlayerSpawn(
    ctx: CanvasRenderingContext2D,
    spawnPos: { x: number; y: number },
    tileSize: number
  ) {
    // Draw a marker at player spawn position
    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(
      spawnPos.x * tileSize + tileSize / 2,
      spawnPos.y * tileSize + tileSize / 2,
      tileSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}
```

### Refactoring Notes für EditorRenderer:

**Problem**: `GameRenderer.render()` ist auf Player-zentrierte Kamera ausgelegt.

**Lösungen**:

**Option A: Minimal-Invasiv (Quick & Dirty)**
- EditorRenderer ruft GameRenderer.render() auf
- Erzeugt "Fake Player" an Kamera-Position
- Setzt canvas.width/height entsprechend Zoom
- **Vorteil**: Keine Änderungen an GameRenderer
- **Nachteil**: Hacky, schwer wartbar

**Option B: GameRenderer erweitern (Empfohlen)**
- Füge optionale `camera` Parameter zu `GameRenderer.render()` hinzu
- Wenn `camera` gesetzt: Nutze camera.x/y statt Player-Position
- Wenn `camera` nicht gesetzt: Bisheriges Verhalten (Player-zentriert)
- **Vorteil**: Sauber, wiederverwendbar
- **Nachteil**: Kleine Änderung an GameRenderer nötig

**Empfehlung**: Starte mit Option A für MVP, migriere zu Option B später.

---

## 4. Editor State Hook

React Hook zur Verwaltung des Editor-States.

```typescript
// hooks/useEditorState.ts
import { useState, useRef, useEffect } from 'react';
import { DungeonManager } from '@/lib/game/DungeonManager';
import { EditorRenderer, EditorCamera } from '@/lib/rendering/EditorRenderer';
import type { Player } from '@/lib/Enemy';
import { DIRECTION, PLAYER_MAX_HP } from '@/lib/constants';

interface UseEditorStateProps {
  availableSubjects: string[];
}

export function useEditorState({ availableSubjects }: UseEditorStateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Seeds
  const [structureSeed, setStructureSeed] = useState<number>(1);
  const [decorationSeed, setDecorationSeed] = useState<number>(1);
  const [spawnSeed, setSpawnSeed] = useState<number>(1);

  // Camera
  const [camera, setCamera] = useState<EditorCamera>({
    x: 0,
    y: 0,
    zoom: 1.0
  });

  // Dungeon state
  const dungeonManagerRef = useRef<DungeonManager | null>(null);
  const editorRendererRef = useRef<EditorRenderer>(new EditorRenderer());
  const [dungeonGenerated, setDungeonGenerated] = useState(false);

  // Fake player for DungeonManager
  const fakePlayerRef = useRef<Player>({
    x: 0,
    y: 0,
    width: 64,
    height: 64,
    direction: DIRECTION.DOWN,
    isMoving: false,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP
  });

  // Initialize
  useEffect(() => {
    const init = async () => {
      await editorRendererRef.current.loadTileset();

      const dungeonManager = new DungeonManager(fakePlayerRef.current);
      await dungeonManager.initialize(availableSubjects);
      dungeonManagerRef.current = dungeonManager;
    };

    init();
  }, [availableSubjects]);

  // Generate dungeon with seeds
  const generateDungeon = async () => {
    if (!dungeonManagerRef.current) return;

    await dungeonManagerRef.current.generateNewDungeon(
      availableSubjects,
      null, // No user ID needed for editor
      structureSeed,
      decorationSeed,
      spawnSeed
    );

    setDungeonGenerated(true);

    // Center camera on dungeon
    const dungeonWidth = dungeonManagerRef.current.dungeon[0].length;
    const dungeonHeight = dungeonManagerRef.current.dungeon.length;
    const tileSize = dungeonManagerRef.current.tileSize;

    setCamera({
      x: (dungeonWidth * tileSize * camera.zoom) / 2 - (canvasRef.current?.width || 0) / 2,
      y: (dungeonHeight * tileSize * camera.zoom) / 2 - (canvasRef.current?.height || 0) / 2,
      zoom: 0.5 // Start zoomed out to see more
    });

    render();
  };

  // Render (call this whenever something changes)
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas || !dungeonManagerRef.current || !dungeonGenerated) return;

    const manager = dungeonManagerRef.current;

    editorRendererRef.current.render(
      canvas,
      manager.dungeon,
      manager.tileVariants,
      manager.roomMap,
      manager.rooms,
      manager.enemies,
      camera,
      manager.tileSize,
      manager.treasures,
      {
        x: Math.floor(fakePlayerRef.current.x / manager.tileSize),
        y: Math.floor(fakePlayerRef.current.y / manager.tileSize)
      }
    );
  };

  // Camera controls
  const zoomIn = () => {
    setCamera(prev => {
      const newZoom = Math.min(prev.zoom * 1.2, 4.0);
      render();
      return { ...prev, zoom: newZoom };
    });
  };

  const zoomOut = () => {
    setCamera(prev => {
      const newZoom = Math.max(prev.zoom / 1.2, 0.1);
      render();
      return { ...prev, zoom: newZoom };
    });
  };

  const pan = (dx: number, dy: number) => {
    setCamera(prev => {
      const newCamera = {
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      };
      render();
      return newCamera;
    });
  };

  // Trigger render on camera change
  useEffect(() => {
    render();
  }, [camera, dungeonGenerated]);

  return {
    canvasRef,
    structureSeed,
    decorationSeed,
    spawnSeed,
    setStructureSeed,
    setDecorationSeed,
    setSpawnSeed,
    generateDungeon,
    dungeonGenerated,
    camera,
    zoomIn,
    zoomOut,
    pan,
    render
  };
}
```

---

## 5. Editor Components

### Main Editor Component

```typescript
// components/EditorCanvas.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditorState } from '@/hooks/useEditorState';
import SeedInputPanel from './editor/SeedInputPanel';
import EditorToolbar from './editor/EditorToolbar';
import SaveLevelModal from './editor/SaveLevelModal';

interface EditorCanvasProps {
  availableSubjects: string[];
}

export default function EditorCanvas({ availableSubjects }: EditorCanvasProps) {
  const editorState = useEditorState({ availableSubjects });
  const [showSaveModal, setShowSaveModal] = useState(false);

  const canvasRef = editorState.canvasRef;

  // Mouse drag for panning
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = dragStart.x - e.clientX;
    const dy = dragStart.y - e.clientY;

    editorState.pan(dx, dy);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel for zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    if (e.deltaY < 0) {
      editorState.zoomIn();
    } else {
      editorState.zoomOut();
    }
  };

  // Keyboard controls (WASD for panning)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const panSpeed = 50;

      switch (e.key) {
        case 'w':
        case 'ArrowUp':
          editorState.pan(0, -panSpeed);
          break;
        case 's':
        case 'ArrowDown':
          editorState.pan(0, panSpeed);
          break;
        case 'a':
        case 'ArrowLeft':
          editorState.pan(-panSpeed, 0);
          break;
        case 'd':
        case 'ArrowRight':
          editorState.pan(panSpeed, 0);
          break;
        case '+':
        case '=':
          editorState.zoomIn();
          break;
        case '-':
        case '_':
          editorState.zoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorState]);

  // Canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        editorState.render();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef, editorState]);

  return (
    <>
      <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#1a1a1a' }}>
        {/* Seed Input Panel */}
        <SeedInputPanel
          structureSeed={editorState.structureSeed}
          decorationSeed={editorState.decorationSeed}
          spawnSeed={editorState.spawnSeed}
          onStructureSeedChange={editorState.setStructureSeed}
          onDecorationSeedChange={editorState.setDecorationSeed}
          onSpawnSeedChange={editorState.setSpawnSeed}
          onGenerate={editorState.generateDungeon}
        />

        {/* Toolbar */}
        <EditorToolbar
          zoom={editorState.camera.zoom}
          onZoomIn={editorState.zoomIn}
          onZoomOut={editorState.zoomOut}
          onSave={() => setShowSaveModal(true)}
          dungeonGenerated={editorState.dungeonGenerated}
        />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            cursor: isDragging ? 'grabbing' : 'grab',
            imageRendering: 'pixelated'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Save Modal */}
        {showSaveModal && (
          <SaveLevelModal
            structureSeed={editorState.structureSeed}
            decorationSeed={editorState.decorationSeed}
            spawnSeed={editorState.spawnSeed}
            onClose={() => setShowSaveModal(false)}
            onSave={() => {
              setShowSaveModal(false);
              // Reload levels list if needed
            }}
          />
        )}
      </div>
    </>
  );
}
```

### Seed Input Panel

```typescript
// components/editor/SeedInputPanel.tsx
interface SeedInputPanelProps {
  structureSeed: number;
  decorationSeed: number;
  spawnSeed: number;
  onStructureSeedChange: (seed: number) => void;
  onDecorationSeedChange: (seed: number) => void;
  onSpawnSeedChange: (seed: number) => void;
  onGenerate: () => void;
}

export default function SeedInputPanel({
  structureSeed,
  decorationSeed,
  spawnSeed,
  onStructureSeedChange,
  onDecorationSeedChange,
  onSpawnSeedChange,
  onGenerate
}: SeedInputPanelProps) {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      padding: '20px',
      color: 'white',
      fontFamily: 'Rajdhani, monospace',
      zIndex: 1000,
      minWidth: '300px'
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Dungeon Seeds</h3>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
          Structure Seed
        </label>
        <input
          type="number"
          value={structureSeed}
          onChange={(e) => onStructureSeedChange(parseInt(e.target.value, 10))}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #4CAF50',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
          Decoration Seed
        </label>
        <input
          type="number"
          value={decorationSeed}
          onChange={(e) => onDecorationSeedChange(parseInt(e.target.value, 10))}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #4CAF50',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
          Spawn Seed
        </label>
        <input
          type="number"
          value={spawnSeed}
          onChange={(e) => onSpawnSeedChange(parseInt(e.target.value, 10))}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #4CAF50',
            borderRadius: '4px',
            color: 'white',
            fontSize: '14px'
          }}
        />
      </div>

      <button
        onClick={onGenerate}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#4CAF50',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
      >
        Generate Dungeon
      </button>
    </div>
  );
}
```

### Editor Toolbar

```typescript
// components/editor/EditorToolbar.tsx
interface EditorToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSave: () => void;
  dungeonGenerated: boolean;
}

export default function EditorToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onSave,
  dungeonGenerated
}: EditorToolbarProps) {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      padding: '15px',
      color: 'white',
      fontFamily: 'Rajdhani, monospace',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{ fontSize: '14px', marginBottom: '5px' }}>
        Zoom: {Math.round(zoom * 100)}%
      </div>

      <button
        onClick={onZoomIn}
        style={{
          padding: '8px',
          backgroundColor: '#4CAF50',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Zoom In (+)
      </button>

      <button
        onClick={onZoomOut}
        style={{
          padding: '8px',
          backgroundColor: '#4CAF50',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Zoom Out (-)
      </button>

      <button
        onClick={onSave}
        disabled={!dungeonGenerated}
        style={{
          padding: '8px',
          backgroundColor: dungeonGenerated ? '#2196F3' : '#666',
          border: 'none',
          borderRadius: '4px',
          color: 'white',
          cursor: dungeonGenerated ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          marginTop: '10px'
        }}
      >
        Save Level
      </button>

      <div style={{
        fontSize: '12px',
        color: '#888',
        marginTop: '10px',
        borderTop: '1px solid #444',
        paddingTop: '10px'
      }}>
        Controls:<br/>
        WASD / Arrows: Pan<br/>
        Mouse Drag: Pan<br/>
        Mouse Wheel: Zoom
      </div>
    </div>
  );
}
```

### Save Level Modal

```typescript
// components/editor/SaveLevelModal.tsx
import { useState } from 'react';

interface SaveLevelModalProps {
  structureSeed: number;
  decorationSeed: number;
  spawnSeed: number;
  onClose: () => void;
  onSave: () => void;
}

export default function SaveLevelModal({
  structureSeed,
  decorationSeed,
  spawnSeed,
  onClose,
  onSave
}: SaveLevelModalProps) {
  const [levelName, setLevelName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!levelName.trim()) {
      alert('Please enter a level name');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/editor/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: levelName,
          structure_seed: structureSeed,
          decoration_seed: decorationSeed,
          spawn_seed: spawnSeed,
          notes: notes
        })
      });

      if (response.ok) {
        alert('Level saved successfully!');
        onSave();
      } else {
        alert('Failed to save level');
      }
    } catch (error) {
      console.error('Error saving level:', error);
      alert('Error saving level');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '2px solid #4CAF50',
        borderRadius: '8px',
        padding: '30px',
        minWidth: '400px',
        color: 'white',
        fontFamily: 'Rajdhani, monospace'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>Save Level</h2>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Level Name *
          </label>
          <input
            type="text"
            value={levelName}
            onChange={(e) => setLevelName(e.target.value)}
            placeholder="My Awesome Dungeon"
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #4CAF50',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Description, design notes, etc."
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #4CAF50',
              borderRadius: '4px',
              color: 'white',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#2a2a2a',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#aaa'
        }}>
          <div>Structure Seed: {structureSeed}</div>
          <div>Decoration Seed: {decorationSeed}</div>
          <div>Spawn Seed: {spawnSeed}</div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: saving ? '#666' : '#4CAF50',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#666',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '16px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Editor Route/Page

```typescript
// app/editor/page.tsx
'use client';

import { useEffect, useState } from 'react';
import EditorCanvas from '@/components/EditorCanvas';

export default function EditorPage() {
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await fetch('/api/subjects');
        if (response.ok) {
          const subjects = await response.json();
          setAvailableSubjects(subjects);
        }
      } catch (error) {
        console.error('Failed to load subjects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        color: 'white',
        fontFamily: 'Rajdhani, monospace',
        fontSize: '24px'
      }}>
        Loading Editor...
      </div>
    );
  }

  return <EditorCanvas availableSubjects={availableSubjects} />;
}
```

---

## 7. Implementierungs-Reihenfolge

### Step 1: Datenbank (30 Min)
- [ ] `editor_levels` Tabelle in `lib/db.ts` hinzufügen
- [ ] CRUD-Funktionen implementieren
- [ ] Migration in `initializeDatabase()` einbauen
- [ ] Testen mit SQLite Browser

### Step 2: API Routes (30 Min)
- [ ] `/api/editor/levels` Route (GET/POST)
- [ ] `/api/editor/levels/[id]` Route (GET/PUT/DELETE)
- [ ] Testen mit Postman/curl

### Step 3: EditorRenderer (2-3 Stunden)
- [ ] Basis-Klasse erstellen
- [ ] GameRenderer-Wrapping implementieren
- [ ] Kamera-Transformation (Zoom/Pan)
- [ ] Alle Räume sichtbar machen
- [ ] Statisches Enemy-Rendering
- [ ] Player-Spawn Marker
- [ ] Testen mit einfachem HTML

### Step 4: useEditorState Hook (1-2 Stunden)
- [ ] Hook-Struktur aufbauen
- [ ] DungeonManager Integration
- [ ] Seed State Management
- [ ] Camera State Management
- [ ] Generate/Render Funktionen
- [ ] Pan/Zoom Controls

### Step 5: UI Components (2-3 Stunden)
- [ ] SeedInputPanel
- [ ] EditorToolbar
- [ ] SaveLevelModal
- [ ] EditorCanvas (Main Component)
- [ ] Styling & Layout

### Step 6: Route & Integration (1 Stunde)
- [ ] `/editor` Route erstellen
- [ ] Components zusammenführen
- [ ] Mouse/Keyboard Events
- [ ] Canvas Resizing

### Step 7: Testing & Polishing (1-2 Stunden)
- [ ] End-to-End Test: Seed → Generate → Render
- [ ] Zoom/Pan Usability
- [ ] Save/Load Workflow
- [ ] Bug Fixes
- [ ] Performance Check

**Geschätzte Gesamtzeit**: 8-13 Stunden

---

## 8. Kritische Hinweise für Implementierung

### 🔴 Rendering-Performance

**Problem**: Rendering des gesamten Dungeons (100×100 Tiles) bei jedem Frame kann langsam sein.

**Lösungen**:
1. **Viewport-Culling**: Nur sichtbare Tiles rendern (bereits in GameRenderer)
2. **Render-On-Demand**: Nur rendern wenn sich etwas ändert (Camera, Seeds)
3. **Canvas-Caching**: Pre-render Dungeon auf Off-Screen-Canvas
4. **requestAnimationFrame vermeiden**: Kein Loop, nur bei Bedarf rendern

**Empfehlung**: Starte mit Render-On-Demand (nur bei Camera-Change), optimiere später.

### 🔴 Enemy-Sprites Statisch

**Problem**: `Enemy.draw()` ruft Sprite-Animation auf.

**Lösung**:
- Erstelle `Enemy.drawStatic()` Methode
- Rendert Sprite bei Frame 0
- Kopiert Status-Bar-Logik

### 🔴 Kamera vs. Player

**Problem**: GameRenderer erwartet Player-Position für Kamera.

**Lösungen**:
- **Quick**: Fake Player an Kamera-Position
- **Proper**: GameRenderer.render() mit optional camera parameter erweitern

### 🔴 Fog of War

**Problem**: GameRenderer respektiert `room.visible`.

**Lösung**: Alle Räume auf `visible: true` setzen vor dem Rendern.

### 🔴 Zoom & Canvas Transform

**Problem**: Canvas-Transformation kann Performance beeinträchtigen.

**Lösung**:
- Nutze `ctx.scale()` für einfaches Zooming
- Alternativ: Tile-Size direkt anpassen (besser für Performance)

### 🔴 Type-Safety

**Hinweis**: EditorCamera, EditorLevel Types sollten in `constants.ts` oder eigene Datei.

---

## 9. Zukünftige Erweiterungen (Phase 2+)

### Level-Laden-Funktionalität
- [ ] Level-Browser UI
- [ ] Load-Button lädt Seeds aus DB
- [ ] Auto-Generate beim Laden

### Erweiterte Seed-Verwaltung
- [ ] Random Seed Generator (Button)
- [ ] Copy Seeds to Clipboard
- [ ] Seed URL-Parameter (`/editor?seeds=1,1,1`)

### Grid & Debugging-Overlays
- [ ] Grid-Overlay (Tile-Grenzen anzeigen)
- [ ] Room-ID Overlay
- [ ] Tile-Type Overlay
- [ ] Spawn-Points Overlay

### Export-Funktionalität
- [ ] Screenshot Export (PNG)
- [ ] JSON Export (Dungeon-Daten)
- [ ] Seed-Liste Export (CSV)

### Tileset-Import (Phase 2)
- [ ] Upload Custom Tileset
- [ ] Tileset-Vorschau
- [ ] Tile-Picker UI

### Asset-Map Editor (Phase 2)
- [ ] Asset-Platzierungs-Modus
- [ ] Drag & Drop Assets
- [ ] Asset-Bibliothek UI
- [ ] Layers (Floor, Objects, Walls)

### Manuelle Asset-Platzierung (Phase 2)
- [ ] Click-to-Place Modus
- [ ] Asset-Override System
- [ ] Undo/Redo
- [ ] Asset-Eigenschaften Editor

### Prefab-System (Phase 3)
- [ ] Prefab-Designer
- [ ] Prefab-Bibliothek
- [ ] Template-basierte Rooms
- [ ] Arrangement-Editor

### Multi-User & Sharing
- [ ] Level-Sharing (Public/Private)
- [ ] Community-Level-Browser
- [ ] Level-Rating System
- [ ] Challenge-Level Creation

---

## 10. Technische Referenzen

### Wiederverwendbare Komponenten
- ✅ `GameRenderer.ts` - Fast vollständig wiederverwendbar
- ✅ `MinimapRenderer.ts` - Direkt nutzbar (optional für Editor)
- ✅ `DungeonManager.ts` - Seeds bereits unterstützt
- ✅ `Enemy.ts` - Nur `draw()` muss statisch gemacht werden
- ✅ `SpriteSheetLoader.ts` - Direkt nutzbar

### Neue Dateien (zu erstellen)
- `lib/rendering/EditorRenderer.ts`
- `hooks/useEditorState.ts`
- `components/EditorCanvas.tsx`
- `components/editor/SeedInputPanel.tsx`
- `components/editor/EditorToolbar.tsx`
- `components/editor/SaveLevelModal.tsx`
- `app/editor/page.tsx`
- `app/api/editor/levels/route.ts`
- `app/api/editor/levels/[id]/route.ts`

### Zu modifizierende Dateien
- `lib/db.ts` - Neue Tabelle + CRUD
- Optional: `lib/Enemy.ts` - `drawStatic()` Methode
- Optional: `lib/rendering/GameRenderer.ts` - Camera parameter

---

## 11. Testing-Strategie

### Unit-Tests (Optional)
- EditorRenderer rendering
- Seed-State Management
- API Route handlers

### Integration-Tests
1. **Dungeon Generation**
   - Seeds → DungeonManager → Dungeon-Daten
   - Verschiedene Seed-Kombinationen testen

2. **Rendering**
   - EditorRenderer → Canvas
   - Zoom/Pan funktional
   - Viewport-Culling korrekt

3. **Save/Load**
   - POST `/api/editor/levels` → DB
   - GET `/api/editor/levels` → Liste
   - GET `/api/editor/levels/[id]` → Einzelnes Level

### Manual Testing-Checklist
- [ ] Seeds eingeben → Generate → Map erscheint
- [ ] Mouse Wheel → Zoom funktioniert
- [ ] Mouse Drag → Pan funktioniert
- [ ] WASD → Pan funktioniert
- [ ] Alle Räume sichtbar (kein Fog of War)
- [ ] Enemies statisch dargestellt
- [ ] Player-Spawn markiert
- [ ] Save Modal → Level speichern
- [ ] Gespeichertes Level in DB sichtbar

---

## 12. Performance-Benchmarks

### Ziel-Performance
- Initial Render: < 100ms
- Zoom/Pan: 60 FPS
- Generate Dungeon: < 500ms

### Monitoring
- `console.time('render')` für Rendering-Zeit
- Chrome DevTools Performance Tab
- Canvas FPS Counter

### Optimierungen (falls nötig)
1. Off-Screen Canvas Caching
2. Tile-Batching
3. Web Worker für Dungeon Generation
4. Virtual Scrolling (nur sichtbare Tiles)

---

## 13. Zusammenfassung & Next Steps

### ✅ Was gut ist:
- Rendering bereits perfekt abstrahiert
- Seeds bereits implementiert
- Klare Trennung Game/Rendering

### ⚠️ Was angepasst werden muss:
- Kamera-Logik (Player → Zoom/Pan)
- Game-Loop entfernen
- Statisches Enemy-Rendering

### 🎯 MVP-Features (Phase 1):
1. Route `/editor`
2. Seed-Inputs + Generate
3. Statisches Rendering (Zoom/Pan)
4. Save Level (Name + Seeds)

### 🚀 Implementierungs-Start:
**Beginne mit Step 1: Datenbank** (siehe Implementierungs-Reihenfolge oben)

---

**Erstellt**: 2025-11-21
**Autor**: Dungeons & Diplomas Team
**Status**: Implementation Plan
**Geschätzte Implementierungszeit**: 8-13 Stunden
