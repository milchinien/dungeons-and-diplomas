# Implementierungsplan: Room Layout System

**Erstellt:** 2026-01-27
**Autor:** Claude + Michi
**Status:** Plan
**Basiert auf:** Room-Layout-System.md

---

## Übersicht

Dieser Plan beschreibt die vollständige Implementierung des Room Layout Systems, das das aktuelle BSP-basierte Dungeon-Generierungssystem durch ein vorgeneriertes Raum-Layout-System ersetzt. Das Feature wird in 5 Phasen unterteilt, wobei jede Phase auf der vorherigen aufbaut.

---

## Phase 1: Datenbank & Datenstrukturen (Foundation)

Diese Phase legt das Fundament: Datenbank-Schema, TypeScript-Typen und grundlegende Datenstrukturen.

### 1.1 Datenbank-Schema erstellen

**Ziel:** Tabelle für Room Layouts in der Datenbank anlegen.

**Aufgaben:**
- Neue Migration erstellen: `supabase/migrations/YYYYMMDD_create_room_layouts.sql`
- Tabelle `room_layouts` mit allen Feldern definieren
- Indizes für Performance hinzufügen (auf `room_type`, `width`, `height`)
- Migration für SQLite Version erstellen (für lokale Entwicklung)

**Schema:**
```sql
CREATE TABLE room_layouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  width INTEGER NOT NULL CHECK (width >= 5 AND width <= 15),
  height INTEGER NOT NULL CHECK (height >= 5 AND height <= 15),
  tile_grid TEXT NOT NULL,           -- JSON: number[][] (TileType values)
  door_positions TEXT NOT NULL,      -- JSON: DoorPositions
  room_type TEXT DEFAULT 'any',      -- 'empty' | 'treasure' | 'combat' | 'shop' | 'any'
  difficulty INTEGER DEFAULT 5 CHECK (difficulty >= 1 AND difficulty <= 10),
  tags TEXT DEFAULT '[]',            -- JSON: string[]
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_room_layouts_type ON room_layouts(room_type);
CREATE INDEX idx_room_layouts_size ON room_layouts(width, height);
CREATE INDEX idx_room_layouts_difficulty ON room_layouts(difficulty);
```

### 1.2 TypeScript-Typen definieren

**Ziel:** Alle TypeScript-Interfaces für Room Layouts erstellen.

**Aufgaben:**
- Neue Datei `lib/roomlayouts/types.ts` erstellen
- Interfaces definieren für RoomLayout, DoorPositions, LayoutMetadata
- Validierungs-Funktionen für Layout-Daten

**TypeScript Definitions:**
```typescript
// lib/roomlayouts/types.ts

import type { TileType } from '../constants';

/**
 * Door positions for a room layout
 */
export interface DoorPositions {
  north: boolean;
  south: boolean;
  east: boolean;
  west: boolean;
}

/**
 * Room layout metadata
 */
export interface LayoutMetadata {
  name: string;
  roomType: 'empty' | 'treasure' | 'combat' | 'shop' | 'any';
  difficulty: number;  // 1-10
  tags: string[];
}

/**
 * Complete room layout definition
 */
export interface RoomLayout {
  id: number;
  name: string;
  width: number;      // 5-15
  height: number;     // 5-15
  tileGrid: TileType[][];
  doorPositions: DoorPositions;
  roomType: 'empty' | 'treasure' | 'combat' | 'shop' | 'any';
  difficulty: number;
  tags: string[];
  createdBy: number | null;
  createdAt: Date;
}

/**
 * Room layout for database insertion (without id/timestamps)
 */
export interface RoomLayoutInput {
  name: string;
  width: number;
  height: number;
  tileGrid: TileType[][];
  doorPositions: DoorPositions;
  roomType?: 'empty' | 'treasure' | 'combat' | 'shop' | 'any';
  difficulty?: number;
  tags?: string[];
  createdBy?: number;
}

/**
 * Filter options for querying layouts
 */
export interface LayoutFilterOptions {
  roomType?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  difficulty?: number;
  tags?: string[];
  doorSide?: 'north' | 'south' | 'east' | 'west';  // Has door on this side
}
```

### 1.3 Validierungs-Funktionen

**Ziel:** Sicherstellen dass nur valide Layouts gespeichert werden.

**Aufgaben:**
- Datei `lib/roomlayouts/validation.ts` erstellen
- Validierungsfunktionen implementieren
- Error-Messages auf Deutsch

**Validierungs-Logik:**
```typescript
// lib/roomlayouts/validation.ts

import type { RoomLayoutInput, DoorPositions } from './types';
import { TILE } from '../constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a room layout
 */
export function validateRoomLayout(layout: RoomLayoutInput): ValidationResult {
  const errors: string[] = [];

  // Size validation
  if (layout.width < 5 || layout.width > 15) {
    errors.push('Breite muss zwischen 5 und 15 liegen');
  }
  if (layout.height < 5 || layout.height > 15) {
    errors.push('Höhe muss zwischen 5 und 15 liegen');
  }

  // Grid size match
  if (layout.tileGrid.length !== layout.height) {
    errors.push('Tile-Grid Höhe stimmt nicht mit Layout-Höhe überein');
  }
  if (layout.tileGrid[0] && layout.tileGrid[0].length !== layout.width) {
    errors.push('Tile-Grid Breite stimmt nicht mit Layout-Breite überein');
  }

  // At least one door
  const { north, south, east, west } = layout.doorPositions;
  if (!north && !south && !east && !west) {
    errors.push('Mindestens eine Tür muss definiert sein');
  }

  // Doors must be at edges
  const doorErrors = validateDoorPositions(layout);
  errors.push(...doorErrors);

  // Must have walkable floor
  const hasFloor = layout.tileGrid.some(row =>
    row.some(tile => tile === TILE.FLOOR)
  );
  if (!hasFloor) {
    errors.push('Raum muss begehbaren Boden haben');
  }

  // All floor tiles must be reachable
  if (hasFloor && !areAllFloorsReachable(layout.tileGrid)) {
    errors.push('Nicht alle Boden-Tiles sind erreichbar (isolierte Bereiche)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates that doors are placed at room edges
 */
function validateDoorPositions(layout: RoomLayoutInput): string[] {
  const errors: string[] = [];
  const { tileGrid, doorPositions, width, height } = layout;

  // North door check
  if (doorPositions.north) {
    const hasDoorInNorth = tileGrid[0].some(tile => tile === TILE.DOOR);
    if (!hasDoorInNorth) {
      errors.push('Nord-Tür aktiviert aber kein Door-Tile in oberster Reihe');
    }
  }

  // South door check
  if (doorPositions.south) {
    const hasDoorInSouth = tileGrid[height - 1].some(tile => tile === TILE.DOOR);
    if (!hasDoorInSouth) {
      errors.push('Süd-Tür aktiviert aber kein Door-Tile in unterster Reihe');
    }
  }

  // East door check
  if (doorPositions.east) {
    const hasDoorInEast = tileGrid.some(row => row[width - 1] === TILE.DOOR);
    if (!hasDoorInEast) {
      errors.push('Ost-Tür aktiviert aber kein Door-Tile in rechter Spalte');
    }
  }

  // West door check
  if (doorPositions.west) {
    const hasDoorInWest = tileGrid.some(row => row[0] === TILE.DOOR);
    if (!hasDoorInWest) {
      errors.push('West-Tür aktiviert aber kein Door-Tile in linker Spalte');
    }
  }

  return errors;
}

/**
 * Flood-fill algorithm to check if all floor tiles are reachable
 */
function areAllFloorsReachable(grid: number[][]): boolean {
  const height = grid.length;
  const width = grid[0].length;
  const visited: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));

  // Find first floor tile
  let startX = -1, startY = -1;
  outer: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === TILE.FLOOR) {
        startX = x;
        startY = y;
        break outer;
      }
    }
  }

  if (startX === -1) return false; // No floor tiles

  // Flood fill from first floor tile
  const queue: [number, number][] = [[startX, startY]];
  visited[startY][startX] = true;
  let reachableFloors = 1;

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;

    // Check 4 neighbors
    const neighbors = [
      [x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (!visited[ny][nx] && grid[ny][nx] === TILE.FLOOR) {
          visited[ny][nx] = true;
          queue.push([nx, ny]);
          reachableFloors++;
        }
      }
    }
  }

  // Count total floor tiles
  let totalFloors = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === TILE.FLOOR) totalFloors++;
    }
  }

  return reachableFloors === totalFloors;
}
```

### 1.4 Datenbank-Operationen

**Ziel:** CRUD-Funktionen für Room Layouts implementieren.

**Aufgaben:**
- Neue Datei `lib/db/roomLayouts.ts` erstellen
- Funktionen für Create, Read, Update, Delete
- Query-Funktionen mit Filtern

**DB-Funktionen:**
```typescript
// lib/db/roomLayouts.ts

import Database from 'better-sqlite3';
import { getDatabase } from './index';
import type { RoomLayout, RoomLayoutInput, LayoutFilterOptions } from '../roomlayouts/types';
import { validateRoomLayout } from '../roomlayouts/validation';

/**
 * Creates a new room layout
 */
export function createRoomLayout(layout: RoomLayoutInput): RoomLayout {
  // Validate first
  const validation = validateRoomLayout(layout);
  if (!validation.isValid) {
    throw new Error(`Layout validation failed: ${validation.errors.join(', ')}`);
  }

  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO room_layouts (
      name, width, height, tile_grid, door_positions,
      room_type, difficulty, tags, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    layout.name,
    layout.width,
    layout.height,
    JSON.stringify(layout.tileGrid),
    JSON.stringify(layout.doorPositions),
    layout.roomType || 'any',
    layout.difficulty || 5,
    JSON.stringify(layout.tags || []),
    layout.createdBy || null
  );

  return getRoomLayoutById(result.lastInsertRowid as number)!;
}

/**
 * Gets a room layout by ID
 */
export function getRoomLayoutById(id: number): RoomLayout | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM room_layouts WHERE id = ?');
  const row = stmt.get(id) as any;

  if (!row) return null;

  return parseRoomLayoutRow(row);
}

/**
 * Gets all room layouts with optional filters
 */
export function getRoomLayouts(filters?: LayoutFilterOptions): RoomLayout[] {
  const db = getDatabase();
  let query = 'SELECT * FROM room_layouts WHERE 1=1';
  const params: any[] = [];

  if (filters) {
    if (filters.roomType) {
      query += ' AND (room_type = ? OR room_type = "any")';
      params.push(filters.roomType);
    }
    if (filters.minWidth !== undefined) {
      query += ' AND width >= ?';
      params.push(filters.minWidth);
    }
    if (filters.maxWidth !== undefined) {
      query += ' AND width <= ?';
      params.push(filters.maxWidth);
    }
    if (filters.minHeight !== undefined) {
      query += ' AND height >= ?';
      params.push(filters.minHeight);
    }
    if (filters.maxHeight !== undefined) {
      query += ' AND height <= ?';
      params.push(filters.maxHeight);
    }
    if (filters.difficulty !== undefined) {
      query += ' AND difficulty = ?';
      params.push(filters.difficulty);
    }
    if (filters.doorSide) {
      // Filter by specific door position
      query += ` AND json_extract(door_positions, '$.${filters.doorSide}') = 1`;
    }
  }

  query += ' ORDER BY created_at DESC';

  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as any[];

  return rows.map(parseRoomLayoutRow);
}

/**
 * Gets a random room layout matching filters
 */
export function getRandomRoomLayout(filters?: LayoutFilterOptions): RoomLayout | null {
  const layouts = getRoomLayouts(filters);
  if (layouts.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * layouts.length);
  return layouts[randomIndex];
}

/**
 * Updates a room layout
 */
export function updateRoomLayout(id: number, layout: Partial<RoomLayoutInput>): RoomLayout {
  const existing = getRoomLayoutById(id);
  if (!existing) {
    throw new Error(`Layout with id ${id} not found`);
  }

  const updated: RoomLayoutInput = {
    name: layout.name ?? existing.name,
    width: layout.width ?? existing.width,
    height: layout.height ?? existing.height,
    tileGrid: layout.tileGrid ?? existing.tileGrid,
    doorPositions: layout.doorPositions ?? existing.doorPositions,
    roomType: layout.roomType ?? existing.roomType,
    difficulty: layout.difficulty ?? existing.difficulty,
    tags: layout.tags ?? existing.tags,
  };

  // Validate
  const validation = validateRoomLayout(updated);
  if (!validation.isValid) {
    throw new Error(`Layout validation failed: ${validation.errors.join(', ')}`);
  }

  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE room_layouts
    SET name = ?, width = ?, height = ?, tile_grid = ?, door_positions = ?,
        room_type = ?, difficulty = ?, tags = ?
    WHERE id = ?
  `);

  stmt.run(
    updated.name,
    updated.width,
    updated.height,
    JSON.stringify(updated.tileGrid),
    JSON.stringify(updated.doorPositions),
    updated.roomType,
    updated.difficulty,
    JSON.stringify(updated.tags),
    id
  );

  return getRoomLayoutById(id)!;
}

/**
 * Deletes a room layout
 */
export function deleteRoomLayout(id: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM room_layouts WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Parses a database row into a RoomLayout object
 */
function parseRoomLayoutRow(row: any): RoomLayout {
  return {
    id: row.id,
    name: row.name,
    width: row.width,
    height: row.height,
    tileGrid: JSON.parse(row.tile_grid),
    doorPositions: JSON.parse(row.door_positions),
    roomType: row.room_type,
    difficulty: row.difficulty,
    tags: JSON.parse(row.tags),
    createdBy: row.created_by,
    createdAt: new Date(row.created_at)
  };
}
```

---

## Phase 2: API-Endpunkte

Diese Phase erstellt die REST-API für Room Layouts.

### 2.1 GET /api/room-layouts

**Ziel:** Alle Layouts abrufen mit Filter-Optionen.

**Datei:** `app/api/room-layouts/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getRoomLayouts } from '@/lib/db/roomLayouts';
import type { LayoutFilterOptions } from '@/lib/roomlayouts/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: LayoutFilterOptions = {};

    if (searchParams.has('roomType')) {
      filters.roomType = searchParams.get('roomType')!;
    }
    if (searchParams.has('minWidth')) {
      filters.minWidth = parseInt(searchParams.get('minWidth')!);
    }
    if (searchParams.has('maxWidth')) {
      filters.maxWidth = parseInt(searchParams.get('maxWidth')!);
    }
    if (searchParams.has('minHeight')) {
      filters.minHeight = parseInt(searchParams.get('minHeight')!);
    }
    if (searchParams.has('maxHeight')) {
      filters.maxHeight = parseInt(searchParams.get('maxHeight')!);
    }
    if (searchParams.has('difficulty')) {
      filters.difficulty = parseInt(searchParams.get('difficulty')!);
    }
    if (searchParams.has('doorSide')) {
      filters.doorSide = searchParams.get('doorSide') as any;
    }

    const layouts = getRoomLayouts(filters);

    return NextResponse.json(layouts);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 2.2 POST /api/room-layouts

**Ziel:** Neues Layout erstellen.

```typescript
import { createRoomLayout } from '@/lib/db/roomLayouts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const layout = createRoomLayout(body);
    return NextResponse.json(layout, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

### 2.3 GET /api/room-layouts/[id]

**Ziel:** Einzelnes Layout abrufen.

**Datei:** `app/api/room-layouts/[id]/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getRoomLayoutById, updateRoomLayout, deleteRoomLayout } from '@/lib/db/roomLayouts';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const layout = getRoomLayoutById(id);

    if (!layout) {
      return NextResponse.json(
        { error: 'Layout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(layout);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const layout = updateRoomLayout(id, body);
    return NextResponse.json(layout);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const success = deleteRoomLayout(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Layout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 2.4 GET /api/room-layouts/random

**Ziel:** Zufälliges Layout für Dungeon-Generation.

**Datei:** `app/api/room-layouts/random/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getRandomRoomLayout } from '@/lib/db/roomLayouts';
import type { LayoutFilterOptions } from '@/lib/roomlayouts/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: LayoutFilterOptions = {};

    if (searchParams.has('roomType')) {
      filters.roomType = searchParams.get('roomType')!;
    }
    if (searchParams.has('doorSide')) {
      filters.doorSide = searchParams.get('doorSide') as any;
    }

    const layout = getRandomRoomLayout(filters);

    if (!layout) {
      return NextResponse.json(
        { error: 'No layouts found matching filters' },
        { status: 404 }
      );
    }

    return NextResponse.json(layout);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Phase 3: Neue Dungeon-Generierung

Diese Phase implementiert die Layout-basierte Dungeon-Generierung.

### 3.1 Layout-Pool-Manager

**Ziel:** System zum Verwalten und Auswählen von Layouts.

**Datei:** `lib/roomlayouts/LayoutPool.ts`

```typescript
import { getRoomLayouts, getRandomRoomLayout } from '../db/roomLayouts';
import type { RoomLayout, LayoutFilterOptions } from './types';

export class LayoutPool {
  private layouts: RoomLayout[] = [];

  constructor() {
    this.reload();
  }

  /**
   * Reloads all layouts from database
   */
  reload(): void {
    this.layouts = getRoomLayouts();
  }

  /**
   * Gets a random layout matching filters
   */
  getRandomLayout(filters?: LayoutFilterOptions): RoomLayout | null {
    return getRandomRoomLayout(filters);
  }

  /**
   * Gets all layouts matching filters
   */
  getLayouts(filters?: LayoutFilterOptions): RoomLayout[] {
    return getRoomLayouts(filters);
  }

  /**
   * Gets a random layout with a specific door on a specific side
   */
  getLayoutWithDoor(side: 'north' | 'south' | 'east' | 'west', roomType?: string): RoomLayout | null {
    const filters: LayoutFilterOptions = { doorSide: side };
    if (roomType) {
      filters.roomType = roomType;
    }
    return this.getRandomLayout(filters);
  }

  /**
   * Gets total count of layouts in pool
   */
  getCount(): number {
    return this.layouts.length;
  }
}

// Singleton instance
let poolInstance: LayoutPool | null = null;

export function getLayoutPool(): LayoutPool {
  if (!poolInstance) {
    poolInstance = new LayoutPool();
  }
  return poolInstance;
}
```

### 3.2 Layout-basierte Dungeon-Generierung

**Ziel:** Neue Generierungs-Logik die Layouts verwendet.

**Datei:** `lib/dungeon/layoutGeneration.ts`

```typescript
import type { Room, TileType } from '../constants';
import { TILE, DUNGEON_WIDTH, DUNGEON_HEIGHT } from '../constants';
import { getLayoutPool } from '../roomlayouts/LayoutPool';
import type { RoomLayout, DoorPositions } from '../roomlayouts/types';

interface PlacedRoom {
  layout: RoomLayout;
  x: number;  // Top-left position in dungeon grid
  y: number;
  roomId: number;
}

interface DoorConnection {
  roomId: number;
  side: 'north' | 'south' | 'east' | 'west';
  x: number;  // Door position in dungeon grid
  y: number;
}

/**
 * Generates a dungeon from room layouts
 */
export function generateDungeonFromLayouts(
  targetRoomCount: number = 20,
  seed?: number
): {
  dungeon: TileType[][];
  rooms: Room[];
  roomMap: number[][];
} {
  const pool = getLayoutPool();

  if (pool.getCount() === 0) {
    throw new Error('No room layouts available in pool. Please seed layouts first.');
  }

  // Initialize empty dungeon
  const dungeon: TileType[][] = Array(DUNGEON_HEIGHT).fill(null).map(() =>
    Array(DUNGEON_WIDTH).fill(TILE.EMPTY)
  );

  const roomMap: number[][] = Array(DUNGEON_HEIGHT).fill(null).map(() =>
    Array(DUNGEON_WIDTH).fill(-1)
  );

  const placedRooms: PlacedRoom[] = [];
  const openDoors: DoorConnection[] = [];
  const rooms: Room[] = [];

  // Step 1: Place first room in center
  const firstLayout = pool.getRandomLayout();
  if (!firstLayout) {
    throw new Error('Failed to get initial room layout');
  }

  const startX = Math.floor((DUNGEON_WIDTH - firstLayout.width) / 2);
  const startY = Math.floor((DUNGEON_HEIGHT - firstLayout.height) / 2);

  placeRoomInDungeon(dungeon, roomMap, firstLayout, startX, startY, 0, placedRooms, openDoors, rooms);

  // Step 2: Expand from doors
  let attempts = 0;
  const maxAttempts = targetRoomCount * 10;

  while (placedRooms.length < targetRoomCount && openDoors.length > 0 && attempts < maxAttempts) {
    attempts++;

    // Pick random open door
    const doorIndex = Math.floor(Math.random() * openDoors.length);
    const door = openDoors[doorIndex];

    // Get opposite side for new layout
    const oppositeSide = getOppositeSide(door.side);

    // Try to get layout with matching door
    const newLayout = pool.getLayoutWithDoor(oppositeSide);

    if (!newLayout) {
      // No matching layout, remove door from open list
      openDoors.splice(doorIndex, 1);
      continue;
    }

    // Calculate position for new room
    const { x: newX, y: newY } = calculateNewRoomPosition(door, newLayout, oppositeSide);

    // Check if room would fit and not overlap
    if (!canPlaceRoom(dungeon, newLayout, newX, newY)) {
      // Can't place here, remove door from open list
      openDoors.splice(doorIndex, 1);
      continue;
    }

    // Place the room
    const newRoomId = placedRooms.length;
    placeRoomInDungeon(dungeon, roomMap, newLayout, newX, newY, newRoomId, placedRooms, openDoors, rooms);

    // Remove the used door
    openDoors.splice(doorIndex, 1);
  }

  // Step 3: Assign room types
  assignRoomTypes(rooms);

  return { dungeon, rooms, roomMap };
}

/**
 * Places a room layout into the dungeon grid
 */
function placeRoomInDungeon(
  dungeon: TileType[][],
  roomMap: number[][],
  layout: RoomLayout,
  x: number,
  y: number,
  roomId: number,
  placedRooms: PlacedRoom[],
  openDoors: DoorConnection[],
  rooms: Room[]
): void {
  // Copy tiles from layout to dungeon
  for (let ly = 0; ly < layout.height; ly++) {
    for (let lx = 0; lx < layout.width; lx++) {
      const dungeonX = x + lx;
      const dungeonY = y + ly;

      if (dungeonX >= 0 && dungeonX < DUNGEON_WIDTH && dungeonY >= 0 && dungeonY < DUNGEON_HEIGHT) {
        dungeon[dungeonY][dungeonX] = layout.tileGrid[ly][lx];

        // Mark in roomMap (only floors and doors, not walls)
        if (layout.tileGrid[ly][lx] === TILE.FLOOR) {
          roomMap[dungeonY][dungeonX] = roomId;
        } else if (layout.tileGrid[ly][lx] === TILE.DOOR) {
          roomMap[dungeonY][dungeonX] = -2; // Door marker
        }
      }
    }
  }

  // Add to placed rooms
  placedRooms.push({ layout, x, y, roomId });

  // Create Room object
  const room: Room = {
    id: roomId,
    x,
    y,
    width: layout.width,
    height: layout.height,
    visible: roomId === 0, // First room is visible
    neighbors: [],
    type: 'empty' // Will be assigned later
  };
  rooms.push(room);

  // Add open doors
  if (layout.doorPositions.north) {
    // Find door tile in north edge
    for (let lx = 0; lx < layout.width; lx++) {
      if (layout.tileGrid[0][lx] === TILE.DOOR) {
        openDoors.push({
          roomId,
          side: 'north',
          x: x + lx,
          y: y
        });
      }
    }
  }
  if (layout.doorPositions.south) {
    for (let lx = 0; lx < layout.width; lx++) {
      if (layout.tileGrid[layout.height - 1][lx] === TILE.DOOR) {
        openDoors.push({
          roomId,
          side: 'south',
          x: x + lx,
          y: y + layout.height - 1
        });
      }
    }
  }
  if (layout.doorPositions.west) {
    for (let ly = 0; ly < layout.height; ly++) {
      if (layout.tileGrid[ly][0] === TILE.DOOR) {
        openDoors.push({
          roomId,
          side: 'west',
          x: x,
          y: y + ly
        });
      }
    }
  }
  if (layout.doorPositions.east) {
    for (let ly = 0; ly < layout.height; ly++) {
      if (layout.tileGrid[ly][layout.width - 1] === TILE.DOOR) {
        openDoors.push({
          roomId,
          side: 'east',
          x: x + layout.width - 1,
          y: y + ly
        });
      }
    }
  }
}

/**
 * Checks if a room can be placed at given position
 */
function canPlaceRoom(
  dungeon: TileType[][],
  layout: RoomLayout,
  x: number,
  y: number
): boolean {
  // Check bounds
  if (x < 0 || y < 0) return false;
  if (x + layout.width > DUNGEON_WIDTH) return false;
  if (y + layout.height > DUNGEON_HEIGHT) return false;

  // Check for overlap (all tiles must be EMPTY)
  for (let ly = 0; ly < layout.height; ly++) {
    for (let lx = 0; lx < layout.width; lx++) {
      const dungeonX = x + lx;
      const dungeonY = y + ly;

      if (dungeon[dungeonY][dungeonX] !== TILE.EMPTY) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Calculates position for new room based on door connection
 */
function calculateNewRoomPosition(
  door: DoorConnection,
  newLayout: RoomLayout,
  doorSide: 'north' | 'south' | 'east' | 'west'
): { x: number; y: number } {
  let x = 0;
  let y = 0;

  switch (doorSide) {
    case 'north':
      // New room's north door connects to existing door
      // Existing door is at (door.x, door.y)
      // New room should be placed so its north edge is at door.y - 1
      x = door.x - Math.floor(newLayout.width / 2);
      y = door.y - newLayout.height + 1;
      break;
    case 'south':
      x = door.x - Math.floor(newLayout.width / 2);
      y = door.y;
      break;
    case 'west':
      x = door.x - newLayout.width + 1;
      y = door.y - Math.floor(newLayout.height / 2);
      break;
    case 'east':
      x = door.x;
      y = door.y - Math.floor(newLayout.height / 2);
      break;
  }

  return { x, y };
}

/**
 * Gets opposite door side
 */
function getOppositeSide(side: 'north' | 'south' | 'east' | 'west'): 'north' | 'south' | 'east' | 'west' {
  switch (side) {
    case 'north': return 'south';
    case 'south': return 'north';
    case 'east': return 'west';
    case 'west': return 'east';
  }
}

/**
 * Assigns room types to rooms
 */
function assignRoomTypes(rooms: Room[]): void {
  // First room is always empty (player start)
  rooms[0].type = 'empty';

  // Assign types to remaining rooms
  for (let i = 1; i < rooms.length; i++) {
    const rand = Math.random();

    if (rand < 0.1) {
      rooms[i].type = 'treasure';
    } else if (rand < 0.2) {
      rooms[i].type = 'combat';
    } else if (rand < 0.28) {
      rooms[i].type = 'shop';
    } else {
      rooms[i].type = 'empty';
    }
  }

  // Ensure at least one shop (max 2)
  const shopCount = rooms.filter(r => r.type === 'shop').length;
  if (shopCount === 0 && rooms.length > 5) {
    rooms[Math.floor(Math.random() * (rooms.length - 1)) + 1].type = 'shop';
  } else if (shopCount > 2) {
    // Remove excess shops
    const shopRooms = rooms.filter(r => r.type === 'shop');
    for (let i = 2; i < shopCount; i++) {
      shopRooms[i].type = 'empty';
    }
  }
}
```

### 3.3 Integration in DungeonManager

**Ziel:** DungeonManager um Layout-Generierung erweitern.

**Datei:** `lib/game/DungeonManager.ts` (erweitern)

```typescript
import { generateDungeonFromLayouts } from '../dungeon/layoutGeneration';

export class DungeonManager {
  // ... existing code ...

  /**
   * Generates a new dungeon using room layouts
   */
  generateFromLayouts(seed?: number): void {
    const result = generateDungeonFromLayouts(20, seed);

    this.dungeon = result.dungeon;
    this.rooms = result.rooms;
    this.roomMap = result.roomMap;

    // Initialize other systems (enemies, treasures, etc.)
    this.initializeRoomSystems();
  }

  // ... existing code ...
}
```

---

## Phase 4: Starter-Layouts erstellen

Diese Phase erstellt 15-20 vorgenerierte Layouts zum Seeden.

### 4.1 Seed-Daten-Struktur

**Ziel:** JSON-Datei mit Starter-Layouts erstellen.

**Datei:** `lib/data/seed-room-layouts.json`

```json
[
  {
    "name": "Kleiner Korridor",
    "width": 10,
    "height": 5,
    "tileGrid": [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [3, 1, 1, 1, 1, 1, 1, 1, 1, 3],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    ],
    "doorPositions": {
      "north": false,
      "south": false,
      "east": true,
      "west": true
    },
    "roomType": "any",
    "difficulty": 3,
    "tags": ["korridor", "schmal"]
  },
  {
    "name": "Standard Raum 8x8",
    "width": 8,
    "height": 8,
    "tileGrid": [
      [2, 2, 2, 3, 3, 2, 2, 2],
      [2, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 2],
      [3, 1, 1, 1, 1, 1, 1, 3],
      [3, 1, 1, 1, 1, 1, 1, 3],
      [2, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 2],
      [2, 2, 2, 3, 3, 2, 2, 2]
    ],
    "doorPositions": {
      "north": true,
      "south": true,
      "east": true,
      "west": true
    },
    "roomType": "any",
    "difficulty": 5,
    "tags": ["standard", "quadratisch"]
  },
  {
    "name": "Große Halle",
    "width": 12,
    "height": 12,
    "tileGrid": [
      [2, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
      [3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2]
    ],
    "doorPositions": {
      "north": true,
      "south": true,
      "east": true,
      "west": true
    },
    "roomType": "any",
    "difficulty": 7,
    "tags": ["groß", "halle", "boss"]
  }
]
```

**Hinweis:** In der Praxis sollten 15-20 verschiedene Layouts manuell designed werden.

### 4.2 Seeding-Funktion

**Ziel:** Starter-Layouts beim ersten Start einfügen.

**Datei:** `lib/db/roomLayouts.ts` (erweitern)

```typescript
import seedLayouts from '../data/seed-room-layouts.json';

/**
 * Seeds starter room layouts into database
 */
export function seedRoomLayouts(): void {
  const db = getDatabase();

  // Check if already seeded
  const count = db.prepare('SELECT COUNT(*) as count FROM room_layouts').get() as { count: number };
  if (count.count > 0) {
    console.log('Room layouts already seeded, skipping...');
    return;
  }

  console.log('Seeding room layouts...');

  for (const layout of seedLayouts) {
    try {
      createRoomLayout(layout as any);
      console.log(`  ✓ Seeded layout: ${layout.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to seed layout ${layout.name}:`, error);
    }
  }

  console.log(`Seeded ${seedLayouts.length} room layouts`);
}
```

### 4.3 Auto-Seeding beim Start

**Ziel:** Layouts automatisch beim Datenbank-Init seeden.

**Datei:** `lib/db/index.ts` (erweitern)

```typescript
import { seedRoomLayouts } from './roomLayouts';

export function initializeDatabase(): Database.Database {
  // ... existing initialization ...

  // Seed room layouts
  seedRoomLayouts();

  return db;
}
```

---

## Phase 5: Room Layout Editor

Diese Phase erstellt den visuellen Editor zum Erstellen/Bearbeiten von Layouts.

### 5.1 Editor-Route

**Ziel:** Separate Route für den Editor.

**Datei:** `app/editor/page.tsx`

```typescript
'use client';

import { RoomLayoutEditor } from '@/components/editor/RoomLayoutEditor';

export default function EditorPage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <RoomLayoutEditor />
    </div>
  );
}
```

### 5.2 Layout-Manager Komponente

**Ziel:** Übersicht aller Layouts mit Thumbnails.

**Datei:** `components/editor/LayoutManager.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { RoomLayout } from '@/lib/roomlayouts/types';

interface LayoutManagerProps {
  onSelectLayout: (layout: RoomLayout | null) => void;
  onCreateNew: () => void;
}

export function LayoutManager({ onSelectLayout, onCreateNew }: LayoutManagerProps) {
  const [layouts, setLayouts] = useState<RoomLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadLayouts();
  }, []);

  async function loadLayouts() {
    setLoading(true);
    try {
      const response = await fetch('/api/room-layouts');
      const data = await response.json();
      setLayouts(data);
    } catch (error) {
      console.error('Failed to load layouts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Layout wirklich löschen?')) return;

    try {
      await fetch(`/api/room-layouts/${id}`, { method: 'DELETE' });
      loadLayouts();
    } catch (error) {
      console.error('Failed to delete layout:', error);
    }
  }

  const filteredLayouts = layouts.filter(layout =>
    layout.name.toLowerCase().includes(filter.toLowerCase()) ||
    layout.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
  );

  if (loading) {
    return <div style={{ padding: '20px' }}>Lade Layouts...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Room Layouts ({layouts.length})</h1>
        <button
          onClick={onCreateNew}
          style={{
            padding: '10px 20px',
            fontSize: '18px',
            cursor: 'pointer',
            background: '#4ade80',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          + Neues Layout
        </button>
        <input
          type="text"
          placeholder="Suchen..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            marginLeft: 'auto',
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '200px'
          }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        {filteredLayouts.map(layout => (
          <div
            key={layout.id}
            style={{
              border: '2px solid #ccc',
              borderRadius: '8px',
              padding: '10px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              background: '#f9f9f9'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div
              onClick={() => onSelectLayout(layout)}
              style={{ marginBottom: '10px' }}
            >
              <LayoutThumbnail layout={layout} />
              <h3 style={{ margin: '8px 0 4px 0', fontSize: '16px' }}>{layout.name}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                {layout.width}x{layout.height} • {layout.roomType}
              </p>
              {layout.tags.length > 0 && (
                <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {layout.tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        background: '#e0e0e0',
                        borderRadius: '3px'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(layout.id);
              }}
              style={{
                width: '100%',
                padding: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                background: '#ef4444',
                border: 'none',
                borderRadius: '4px',
                color: 'white'
              }}
            >
              Löschen
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LayoutThumbnail({ layout }: { layout: RoomLayout }) {
  const canvasSize = 150;
  const tileSize = Math.min(
    canvasSize / layout.width,
    canvasSize / layout.height
  );

  return (
    <div style={{
      width: canvasSize,
      height: canvasSize,
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${layout.width}, ${tileSize}px)`,
        gap: 0
      }}>
        {layout.tileGrid.flat().map((tile, i) => (
          <div
            key={i}
            style={{
              width: tileSize,
              height: tileSize,
              background: getTileColor(tile)
            }}
          />
        ))}
      </div>
    </div>
  );
}

function getTileColor(tile: number): string {
  switch (tile) {
    case 0: return '#000'; // EMPTY
    case 1: return '#888'; // FLOOR
    case 2: return '#444'; // WALL
    case 3: return '#0f0'; // DOOR
    default: return '#f0f';
  }
}
```

### 5.3 Layout-Canvas Komponente

**Ziel:** Haupt-Zeichen-Canvas mit Toolbar.

**Datei:** `components/editor/LayoutCanvas.tsx`

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import type { TileType } from '@/lib/constants';
import { TILE } from '@/lib/constants';

interface LayoutCanvasProps {
  width: number;
  height: number;
  tileGrid: TileType[][];
  onTileChange: (x: number, y: number, tile: TileType) => void;
  onGridResize: (width: number, height: number) => void;
}

export function LayoutCanvas({
  width,
  height,
  tileGrid,
  onTileChange,
  onGridResize
}: LayoutCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTile, setSelectedTile] = useState<TileType>(TILE.FLOOR);
  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(1);

  const TILE_SIZE = 32 * zoom;

  useEffect(() => {
    renderCanvas();
  }, [tileGrid, zoom]);

  function renderCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * TILE_SIZE;
    canvas.height = height * TILE_SIZE;

    // Draw tiles
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tileGrid[y][x];
        ctx.fillStyle = getTileColor(tile);
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Grid lines
        ctx.strokeStyle = '#333';
        ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  function getTileColor(tile: TileType): string {
    switch (tile) {
      case TILE.EMPTY: return '#000';
      case TILE.FLOOR: return '#888';
      case TILE.WALL: return '#444';
      case TILE.DOOR: return '#0f0';
      default: return '#f0f';
    }
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      onTileChange(x, y, selectedTile);
    }
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    handleCanvasClick(e);
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{
        padding: '10px',
        background: '#f0f0f0',
        marginBottom: '10px',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <TileButton
            tile={TILE.FLOOR}
            label="Boden"
            selected={selectedTile === TILE.FLOOR}
            onClick={() => setSelectedTile(TILE.FLOOR)}
          />
          <TileButton
            tile={TILE.WALL}
            label="Wand"
            selected={selectedTile === TILE.WALL}
            onClick={() => setSelectedTile(TILE.WALL)}
          />
          <TileButton
            tile={TILE.DOOR}
            label="Tür"
            selected={selectedTile === TILE.DOOR}
            onClick={() => setSelectedTile(TILE.DOOR)}
          />
          <TileButton
            tile={TILE.EMPTY}
            label="Leer"
            selected={selectedTile === TILE.EMPTY}
            onClick={() => setSelectedTile(TILE.EMPTY)}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label>Zoom:</label>
          <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>-</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(2, zoom + 0.25))}>+</button>
        </div>

        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <label>Größe:</label>
          <input
            type="number"
            min={5}
            max={15}
            value={width}
            onChange={(e) => onGridResize(parseInt(e.target.value), height)}
            style={{ width: '50px', padding: '4px' }}
          />
          <span>×</span>
          <input
            type="number"
            min={5}
            max={15}
            value={height}
            onChange={(e) => onGridResize(width, parseInt(e.target.value))}
            style={{ width: '50px', padding: '4px' }}
          />
        </div>
      </div>

      {/* Canvas */}
      <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 300px)', border: '2px solid #ccc' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={(e) => {
            setIsDrawing(true);
            handleCanvasClick(e);
          }}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
          onMouseMove={handleCanvasMouseMove}
          style={{ cursor: 'crosshair', display: 'block' }}
        />
      </div>
    </div>
  );
}

function TileButton({
  tile,
  label,
  selected,
  onClick
}: {
  tile: TileType;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const colors = {
    [TILE.EMPTY]: '#000',
    [TILE.FLOOR]: '#888',
    [TILE.WALL]: '#444',
    [TILE.DOOR]: '#0f0'
  };

  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        cursor: 'pointer',
        background: selected ? '#4ade80' : colors[tile],
        color: selected || tile === TILE.EMPTY ? '#fff' : '#000',
        border: selected ? '3px solid #22c55e' : '2px solid #666',
        borderRadius: '4px',
        fontWeight: selected ? 'bold' : 'normal'
      }}
    >
      {label}
    </button>
  );
}
```

### 5.4 Layout-Settings Komponente

**Ziel:** Formular für Metadaten (Name, Türen, etc.).

**Datei:** `components/editor/LayoutSettings.tsx`

```typescript
'use client';

import type { DoorPositions, LayoutMetadata } from '@/lib/roomlayouts/types';

interface LayoutSettingsProps {
  metadata: LayoutMetadata;
  doorPositions: DoorPositions;
  onMetadataChange: (metadata: LayoutMetadata) => void;
  onDoorPositionsChange: (doors: DoorPositions) => void;
}

export function LayoutSettings({
  metadata,
  doorPositions,
  onMetadataChange,
  onDoorPositionsChange
}: LayoutSettingsProps) {
  return (
    <div style={{
      padding: '20px',
      background: '#f9f9f9',
      border: '2px solid #ccc',
      borderRadius: '8px'
    }}>
      <h2 style={{ marginTop: 0 }}>Layout-Einstellungen</h2>

      {/* Name */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Name:
        </label>
        <input
          type="text"
          value={metadata.name}
          onChange={(e) => onMetadataChange({ ...metadata, name: e.target.value })}
          placeholder="z.B. Großer Thronsaal"
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        />
      </div>

      {/* Room Type */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Raum-Typ:
        </label>
        <select
          value={metadata.roomType}
          onChange={(e) => onMetadataChange({ ...metadata, roomType: e.target.value as any })}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        >
          <option value="any">Beliebig</option>
          <option value="empty">Leer</option>
          <option value="treasure">Schatz</option>
          <option value="combat">Kampf</option>
          <option value="shop">Shop</option>
        </select>
      </div>

      {/* Difficulty */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Schwierigkeit: {metadata.difficulty}
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={metadata.difficulty}
          onChange={(e) => onMetadataChange({ ...metadata, difficulty: parseInt(e.target.value) })}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
          <span>Leicht</span>
          <span>Mittel</span>
          <span>Schwer</span>
        </div>
      </div>

      {/* Door Positions */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Türpositionen:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={doorPositions.north}
              onChange={(e) => onDoorPositionsChange({ ...doorPositions, north: e.target.checked })}
            />
            Norden
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={doorPositions.south}
              onChange={(e) => onDoorPositionsChange({ ...doorPositions, south: e.target.checked })}
            />
            Süden
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={doorPositions.west}
              onChange={(e) => onDoorPositionsChange({ ...doorPositions, west: e.target.checked })}
            />
            Westen
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={doorPositions.east}
              onChange={(e) => onDoorPositionsChange({ ...doorPositions, east: e.target.checked })}
            />
            Osten
          </label>
        </div>
      </div>

      {/* Tags */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Tags (kommagetrennt):
        </label>
        <input
          type="text"
          value={metadata.tags.join(', ')}
          onChange={(e) => onMetadataChange({
            ...metadata,
            tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
          })}
          placeholder="z.B. boss, arena, schwierig"
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        />
      </div>
    </div>
  );
}
```

### 5.5 Haupt-Editor Komponente

**Ziel:** Orchestriert alle Sub-Komponenten.

**Datei:** `components/editor/RoomLayoutEditor.tsx`

```typescript
'use client';

import { useState } from 'react';
import { LayoutManager } from './LayoutManager';
import { LayoutCanvas } from './LayoutCanvas';
import { LayoutSettings } from './LayoutSettings';
import type { RoomLayout, RoomLayoutInput, DoorPositions, LayoutMetadata } from '@/lib/roomlayouts/types';
import type { TileType } from '@/lib/constants';
import { TILE } from '@/lib/constants';
import { validateRoomLayout } from '@/lib/roomlayouts/validation';

type EditorMode = 'manager' | 'editing';

export function RoomLayoutEditor() {
  const [mode, setMode] = useState<EditorMode>('manager');
  const [currentLayout, setCurrentLayout] = useState<RoomLayout | null>(null);
  const [editingLayout, setEditingLayout] = useState<RoomLayoutInput | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  function handleCreateNew() {
    const newLayout: RoomLayoutInput = {
      name: 'Neues Layout',
      width: 8,
      height: 8,
      tileGrid: Array(8).fill(null).map(() => Array(8).fill(TILE.WALL)),
      doorPositions: { north: false, south: false, east: false, west: false },
      roomType: 'any',
      difficulty: 5,
      tags: []
    };
    setEditingLayout(newLayout);
    setCurrentLayout(null);
    setMode('editing');
    validateLayout(newLayout);
  }

  function handleSelectLayout(layout: RoomLayout | null) {
    if (!layout) {
      setMode('manager');
      return;
    }

    const input: RoomLayoutInput = {
      name: layout.name,
      width: layout.width,
      height: layout.height,
      tileGrid: layout.tileGrid,
      doorPositions: layout.doorPositions,
      roomType: layout.roomType,
      difficulty: layout.difficulty,
      tags: layout.tags
    };
    setEditingLayout(input);
    setCurrentLayout(layout);
    setMode('editing');
    validateLayout(input);
  }

  function handleTileChange(x: number, y: number, tile: TileType) {
    if (!editingLayout) return;

    const newGrid = editingLayout.tileGrid.map(row => [...row]);
    newGrid[y][x] = tile;

    const updated = { ...editingLayout, tileGrid: newGrid };
    setEditingLayout(updated);
    validateLayout(updated);
  }

  function handleGridResize(newWidth: number, newHeight: number) {
    if (!editingLayout) return;

    const newGrid: TileType[][] = Array(newHeight).fill(null).map((_, y) =>
      Array(newWidth).fill(null).map((_, x) => {
        if (y < editingLayout.height && x < editingLayout.width) {
          return editingLayout.tileGrid[y][x];
        }
        return TILE.WALL;
      })
    );

    const updated = { ...editingLayout, width: newWidth, height: newHeight, tileGrid: newGrid };
    setEditingLayout(updated);
    validateLayout(updated);
  }

  function handleMetadataChange(metadata: LayoutMetadata) {
    if (!editingLayout) return;

    const updated = { ...editingLayout, ...metadata };
    setEditingLayout(updated);
    validateLayout(updated);
  }

  function handleDoorPositionsChange(doors: DoorPositions) {
    if (!editingLayout) return;

    const updated = { ...editingLayout, doorPositions: doors };
    setEditingLayout(updated);
    validateLayout(updated);
  }

  function validateLayout(layout: RoomLayoutInput) {
    const result = validateRoomLayout(layout);
    setValidationErrors(result.errors);
  }

  async function handleSave() {
    if (!editingLayout) return;

    const validation = validateRoomLayout(editingLayout);
    if (!validation.isValid) {
      alert('Layout ist nicht valide:\n' + validation.errors.join('\n'));
      return;
    }

    try {
      if (currentLayout) {
        // Update existing
        await fetch(`/api/room-layouts/${currentLayout.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingLayout)
        });
        alert('Layout aktualisiert!');
      } else {
        // Create new
        await fetch('/api/room-layouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingLayout)
        });
        alert('Layout erstellt!');
      }

      setMode('manager');
    } catch (error) {
      console.error('Failed to save layout:', error);
      alert('Fehler beim Speichern!');
    }
  }

  if (mode === 'manager') {
    return (
      <LayoutManager
        onSelectLayout={handleSelectLayout}
        onCreateNew={handleCreateNew}
      />
    );
  }

  if (!editingLayout) return null;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Left: Canvas */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setMode('manager')}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            ← Zurück zur Übersicht
          </button>
          <h1 style={{ margin: 0 }}>
            {currentLayout ? `Bearbeiten: ${currentLayout.name}` : 'Neues Layout'}
          </h1>
          <button
            onClick={handleSave}
            disabled={validationErrors.length > 0}
            style={{
              marginLeft: 'auto',
              padding: '10px 20px',
              cursor: validationErrors.length > 0 ? 'not-allowed' : 'pointer',
              background: validationErrors.length > 0 ? '#ccc' : '#4ade80',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            Speichern
          </button>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div style={{
            padding: '10px',
            marginBottom: '10px',
            background: '#fee',
            border: '2px solid #f00',
            borderRadius: '4px'
          }}>
            <strong>Validierungsfehler:</strong>
            <ul style={{ margin: '5px 0 0 20px' }}>
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <LayoutCanvas
          width={editingLayout.width}
          height={editingLayout.height}
          tileGrid={editingLayout.tileGrid}
          onTileChange={handleTileChange}
          onGridResize={handleGridResize}
        />
      </div>

      {/* Right: Settings */}
      <div style={{ width: '350px', padding: '20px', background: '#f5f5f5', overflow: 'auto' }}>
        <LayoutSettings
          metadata={{
            name: editingLayout.name,
            roomType: editingLayout.roomType || 'any',
            difficulty: editingLayout.difficulty || 5,
            tags: editingLayout.tags || []
          }}
          doorPositions={editingLayout.doorPositions}
          onMetadataChange={handleMetadataChange}
          onDoorPositionsChange={handleDoorPositionsChange}
        />
      </div>
    </div>
  );
}
```

---

## Abhängigkeiten zwischen Phasen

```
Phase 1 (Datenbank & Typen)
    ↓
Phase 2 (API-Endpunkte) ←→ Phase 4 (Starter-Layouts)
    ↓                              ↓
Phase 3 (Dungeon-Generation) ←────┘
    ↓
Phase 5 (Editor)
```

**Hinweise:**
- Phase 1 muss komplett abgeschlossen sein
- Phase 2 und 4 können parallel bearbeitet werden
- Phase 3 benötigt Phase 1 und 4
- Phase 5 benötigt Phase 1 und 2

---

## Testing-Checkliste

### Phase 1 Tests
- [ ] Datenbank-Migration läuft ohne Fehler
- [ ] TypeScript-Typen kompilieren ohne Errors
- [ ] Validierung lehnt invalide Layouts ab
- [ ] Validierung akzeptiert valide Layouts
- [ ] Flood-Fill erkennt isolierte Bereiche
- [ ] CRUD-Operationen funktionieren

### Phase 2 Tests
- [ ] GET /api/room-layouts liefert alle Layouts
- [ ] POST /api/room-layouts erstellt neues Layout
- [ ] PUT /api/room-layouts/:id aktualisiert Layout
- [ ] DELETE /api/room-layouts/:id löscht Layout
- [ ] Filter-Optionen funktionieren korrekt
- [ ] Fehlerhafte Requests geben 400/404 zurück

### Phase 3 Tests
- [ ] Dungeon wird aus Layouts generiert
- [ ] Alle Räume sind verbunden
- [ ] Keine Raum-Überlappungen
- [ ] Türen sind korrekt verbunden
- [ ] Raum-Typen werden zugewiesen
- [ ] Player kann spawnen und bewegen
- [ ] Enemies spawnen korrekt

### Phase 4 Tests
- [ ] Seeding läuft beim ersten Start
- [ ] Seeding wird bei wiederholtem Start übersprungen
- [ ] Alle Starter-Layouts sind valide
- [ ] Layouts können für Generation verwendet werden

### Phase 5 Tests
- [ ] Editor öffnet sich unter /editor
- [ ] Layout-Manager zeigt alle Layouts
- [ ] Neues Layout erstellen funktioniert
- [ ] Canvas-Zeichnen funktioniert
- [ ] Zoom funktioniert
- [ ] Grid-Resize funktioniert
- [ ] Metadaten-Änderungen werden gespeichert
- [ ] Validierung zeigt Fehler live an
- [ ] Speichern erstellt/aktualisiert Layout
- [ ] Löschen entfernt Layout

---

## Nächste Schritte

1. **Review dieses Plans** mit Team (Tobias, Tim, Michi)
2. **Phase 1 starten**: Datenbank & Typen (1-2h)
3. **Phase 4 parallel**: Starter-Layouts designen (2-3h)
4. **Phase 2**: API-Endpunkte (1h)
5. **Phase 3**: Neue Generierung (3-4h)
6. **Phase 5**: Editor bauen (6-8h)
7. **Testing & Polish**: (2-3h)

**Geschätzte Gesamtdauer**: 15-20 Stunden

---

**Erstellt:** 2026-01-27
**Status:** Bereit für Implementierung
**Review-Status:** Pending
