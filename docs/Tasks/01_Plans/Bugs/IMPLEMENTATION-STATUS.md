# Implementation Status & Next Steps

**Datum:** 2026-02-03
**Status:** 2/11 Tasks abgeschlossen
**Token-Verwendung:** 123k/200k (61%)

---

## ✅ ABGESCHLOSSEN (Tasks 1-2)

### Task #1: Codebase-Analyse ✅

**Gefundene kritische Issues:**

1. **Door Orientation Detection (HIGH)** - `lib/tiletheme/WallTypeDetector.ts:84-102`
   - Prüft nur left/right für walls, nicht floor/door neighbors
   - Vertikale Türen sollten oben/unten Boden haben, nicht links/rechts

2. **removeDoubleWalls() Incomplete (HIGH)** - `lib/dungeon/layoutGeneration.ts:324-364`
   - Verwendet `rooms` Parameter nicht
   - Verifiziert nicht ob Wände tatsächlich Räume trennen

3. **No Door-Floor Validation (HIGH)** - `lib/dungeon/layoutGeneration.ts:183-220`
   - Türen werden platziert ohne zu prüfen ob Floor auf beiden Seiten

4. **RoomMap Not Updated (CRITICAL)** - `lib/dungeon/layoutGeneration.ts:111`
   - Nach removeDoubleWalls() ist roomMap veraltet
   - Wände sind EMPTY aber roomMap zeigt noch -1
   - Verursacht Visibility-Bugs

5. **Door Alignment Math Wrong (MEDIUM)** - `lib/dungeon/layoutGeneration.ts:282-303`
   - calculateNewRoomPosition() könnte Türen falsch ausrichten

6. **No Dead-End Detection (MEDIUM)** - `lib/roomlayouts/LayoutPool.ts:57-78`
   - Kann Räume mit nur 1 Tür nicht filtern

7. **canPlaceRoom() No Verification (MEDIUM)** - `lib/dungeon/layoutGeneration.ts:226-257`
   - Vertraut shared wall ohne Alignment-Check

### Task #2: Room-Editor Erweiterungen ✅

**Durchgeführte Änderungen:**

1. **lib/roomlayouts/types.ts** - Type Definitionen erweitert:
```typescript
// ALT:
roomType: 'empty' | 'treasure' | 'combat' | 'shop' | 'any';

// NEU:
roomType: 'empty' | 'treasure' | 'combat' | 'shop' | 'spawn' | 'end' | 'any';
```

Geändert in:
- Line 37: `LayoutMetadata` interface
- Line 52: `RoomLayout` interface
- Line 68: `RoomLayoutInput` interface

2. **lib/roomlayouts/validation.ts** - Neue Validierungsfunktionen hinzugefügt:

```typescript
// Zeile 62-72: Integration in validateRoomLayout()
if (layout.roomType === 'spawn') {
  const spawnErrors = validateSpawnRoom(layout);
  errors.push(...spawnErrors);
}
if (layout.roomType === 'end') {
  const endErrors = validateEndRoom(layout);
  errors.push(...endErrors);
}

// Zeile 80-115: validateSpawnRoom()
export function validateSpawnRoom(layout: RoomLayoutInput): string[] {
  // Muss genau 3 Türen haben: Nord, Ost, West (NICHT Süd)
  // Gibt errors Array zurück
}

// Zeile 117-138: validateEndRoom()
export function validateEndRoom(layout: RoomLayoutInput): string[] {
  // Muss mindestens 3 Türen haben
  // Gibt errors Array zurück
}

// Zeile 140-150: countDoors() Helper
export function countDoors(doorPositions): number {
  // Zählt Türen
}
```

**Status:** TypeScript kompiliert erfolgreich, Build-Warnings sind nur Next.js dynamic server issues (OK).

---

## 🔴 NOCH ZU TUN (Tasks 3-11)

### PRIORITÄT 1: KRITISCHE FIXES (Tasks 3-4)

#### Task #3: Wand-Ausrichtung korrigieren

**Datei:** `lib/tiletheme/WallTypeDetector.ts`

**Problem:** `detectDoorType()` Zeile 84-102 prüft nur walls left/right, nicht floor neighbors

**Fix:**
```typescript
// ERSETZE Zeile 84-102 mit:

export function detectDoorType(
  dungeon: TileType[][],
  x: number,
  y: number,
  isOpen: boolean
): DoorVariant {
  const width = dungeon[0]?.length || 0;
  const height = dungeon.length;

  // Check all 4 neighbors for floor/door tiles
  const hasFloorOrDoorAbove = y > 0 && (dungeon[y - 1][x] === TILE.FLOOR || dungeon[y - 1][x] === TILE.DOOR);
  const hasFloorOrDoorBelow = y < height - 1 && (dungeon[y + 1][x] === TILE.FLOOR || dungeon[y + 1][x] === TILE.DOOR);
  const hasFloorOrDoorLeft = x > 0 && (dungeon[y][x - 1] === TILE.FLOOR || dungeon[y][x - 1] === TILE.DOOR);
  const hasFloorOrDoorRight = x < width - 1 && (dungeon[y][x + 1] === TILE.FLOOR || dungeon[y][x + 1] === TILE.DOOR);

  // Vertical door: Has floor/door above AND below (connects rooms vertically)
  const isVertical = hasFloorOrDoorAbove && hasFloorOrDoorBelow;

  // Horizontal door: Has floor/door left AND right (connects rooms horizontally)
  const isHorizontal = hasFloorOrDoorLeft && hasFloorOrDoorRight;

  // If both or neither, default to vertical
  if (isVertical && !isHorizontal) {
    return isOpen ? 'vertical_open' : 'vertical_closed';
  } else if (isHorizontal && !isVertical) {
    return isOpen ? 'horizontal_open' : 'horizontal_closed';
  } else {
    // Ambiguous or corner case - default to vertical
    return isOpen ? 'vertical_open' : 'vertical_closed';
  }
}
```

**Test:** Generiere Dungeon, prüfe visuell dass Türen richtig gedreht sind

---

#### Task #4: Tür-Validierung & RoomMap Fix (KRITISCH!)

**Problem 1:** RoomMap nicht geupdatet nach removeDoubleWalls()

**Datei:** `lib/dungeon/layoutGeneration.ts`

**Fix:** Nach Zeile 111 `removeDoubleWalls(dungeon, rooms);` hinzufügen:

```typescript
// Zeile 111
removeDoubleWalls(dungeon, rooms);

// NEU: RoomMap aktualisieren
updateRoomMapAfterWallRemoval(dungeon, roomMap, rooms);
```

**Neue Funktion hinzufügen (am Ende der Datei vor export):**

```typescript
/**
 * Updates roomMap after walls have been removed
 * Converts removed walls (now EMPTY) to proper room IDs or -1
 */
function updateRoomMapAfterWallRemoval(
  dungeon: TileType[][],
  roomMap: number[][],
  rooms: Room[]
): void {
  for (let y = 0; y < DUNGEON_HEIGHT; y++) {
    for (let x = 0; x < DUNGEON_WIDTH; x++) {
      const tile = dungeon[y][x];
      const currentRoomId = roomMap[y][x];

      // If tile is EMPTY but roomMap says it's a wall (-1), reset it
      if (tile === TILE.EMPTY && currentRoomId === -1) {
        roomMap[y][x] = -1; // Keep as -1 (empty space)
      }

      // If tile became FLOOR after wall removal, find which room it should belong to
      else if (tile === TILE.FLOOR && currentRoomId === -1) {
        // Check neighbors to find room ID
        const neighbors = [
          { x: x - 1, y },
          { x: x + 1, y },
          { x, y: y - 1 },
          { x, y: y + 1 }
        ];

        for (const neighbor of neighbors) {
          if (neighbor.x >= 0 && neighbor.x < DUNGEON_WIDTH &&
              neighbor.y >= 0 && neighbor.y < DUNGEON_HEIGHT) {
            const neighborRoomId = roomMap[neighbor.y][neighbor.x];
            if (neighborRoomId >= 0) {
              roomMap[y][x] = neighborRoomId;
              break;
            }
          }
        }
      }
    }
  }
}
```

**Problem 2:** Keine Door-Floor Validierung

**Neue Funktion hinzufügen:**

```typescript
/**
 * Validates that a door connects two floor tiles
 */
function validateDoorConnection(
  dungeon: TileType[][],
  doorX: number,
  doorY: number
): boolean {
  const width = dungeon[0]?.length || 0;
  const height = dungeon.length;

  // Check all 4 neighbors
  const neighbors = {
    top: doorY > 0 ? dungeon[doorY - 1][doorX] : TILE.EMPTY,
    bottom: doorY < height - 1 ? dungeon[doorY + 1][doorX] : TILE.EMPTY,
    left: doorX > 0 ? dungeon[doorY][doorX - 1] : TILE.EMPTY,
    right: doorX < width - 1 ? dungeon[doorY][doorX + 1] : TILE.EMPTY
  };

  // Count floor neighbors
  const floorCount = Object.values(neighbors).filter(
    tile => tile === TILE.FLOOR || tile === TILE.EMPTY // EMPTY for future rooms
  ).length;

  // Must have at least 2 floor neighbors (one on each side)
  return floorCount >= 2;
}

/**
 * Validates all doors and removes invalid ones
 */
export function validateAllDoors(
  dungeon: TileType[][],
  rooms: Room[]
): Array<{x: number, y: number, error: string}> {
  const errors: Array<{x: number, y: number, error: string}> = [];
  const width = dungeon[0]?.length || 0;
  const height = dungeon.length;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (dungeon[y][x] === TILE.DOOR) {
        if (!validateDoorConnection(dungeon, x, y)) {
          errors.push({
            x, y,
            error: 'Door does not connect two valid areas'
          });

          // Convert invalid door to wall
          dungeon[y][x] = TILE.WALL;
          console.warn(`Removed invalid door at (${x}, ${y})`);
        }
      }
    }
  }

  return errors;
}
```

**Integration:** Nach Zeile 112 (nach removeDoubleWalls und updateRoomMap) hinzufügen:

```typescript
// Validate and fix doors
const doorErrors = validateAllDoors(dungeon, rooms);
if (doorErrors.length > 0) {
  console.warn(`Fixed ${doorErrors.length} invalid doors`);
}
```

---

### PRIORITÄT 2: SPAWN-RAUM SYSTEM (Tasks 5-7)

#### Task #5: Spawn-Raum Generierung

**Neue Datei erstellen:** `lib/dungeon/spawnRoomGeneration.ts`

```typescript
/**
 * Spawn room generation for 3-path dungeon structure
 */

import type { Room, TileType } from '../constants';
import { TILE, DUNGEON_WIDTH, DUNGEON_HEIGHT } from '../constants';
import { getLayoutPool } from '../roomlayouts/LayoutPool';
import type { RoomLayout } from '../roomlayouts/types';

interface PlacedRoom {
  layout: RoomLayout;
  x: number;
  y: number;
  roomId: number;
}

interface DoorConnection {
  roomId: number;
  side: 'north' | 'south' | 'east' | 'west';
  x: number;
  y: number;
}

/**
 * Generates dungeon starting with a spawn room
 */
export function generateDungeonWithSpawnRoom(
  targetRoomCount: number = 20,
  seed?: number
): {
  dungeon: TileType[][];
  rooms: Room[];
  roomMap: number[][];
  spawnRoomId: number;
} {
  const pool = getLayoutPool();

  // Step 1: Select spawn room
  const spawnLayouts = pool.getLayouts({ roomType: 'spawn' });

  if (spawnLayouts.length === 0) {
    throw new Error('No spawn room layouts available. Please create spawn rooms in editor.');
  }

  const spawnLayout = spawnLayouts[Math.floor(Math.random() * spawnLayouts.length)];
  console.log(`[Dungeon] Selected spawn room: ${spawnLayout.name}`);

  // Step 2: Initialize dungeon
  const dungeon: TileType[][] = Array(DUNGEON_HEIGHT).fill(null).map(() =>
    Array(DUNGEON_WIDTH).fill(TILE.EMPTY)
  );

  const roomMap: number[][] = Array(DUNGEON_HEIGHT).fill(null).map(() =>
    Array(DUNGEON_WIDTH).fill(-1)
  );

  const rooms: Room[] = [];
  const placedRooms: PlacedRoom[] = [];
  const openDoors: DoorConnection[] = [];

  // Step 3: Place spawn room in center
  const startX = Math.floor((DUNGEON_WIDTH - spawnLayout.width) / 2);
  const startY = Math.floor((DUNGEON_HEIGHT - spawnLayout.height) / 2);

  // Import placeRoomInDungeon from layoutGeneration.ts or implement here
  // placeRoomInDungeon(dungeon, roomMap, spawnLayout, startX, startY, 0, placedRooms, openDoors, rooms, undefined);

  rooms[0].type = 'spawn';
  rooms[0].visible = true;
  rooms[0].state = 'exploring';

  console.log(`[Dungeon] Spawn room placed at (${startX}, ${startY})`);
  console.log(`[Dungeon] Open doors: ${openDoors.length}`);

  // Verify spawn room has 3 doors
  const spawnDoors = openDoors.filter(d => d.roomId === 0);
  if (spawnDoors.length !== 3) {
    throw new Error(`Spawn room must have 3 doors, found ${spawnDoors.length}`);
  }

  // TODO: Step 4-7 in subsequent tasks

  return {
    dungeon,
    rooms,
    roomMap,
    spawnRoomId: 0
  };
}
```

**Integration in DungeonManager:**

Datei: `lib/game/DungeonManager.ts`

Neue Methode hinzufügen:

```typescript
async generateFromSpawnRoom(
  availableSubjects: string[],
  userId: number | null = null,
  targetRoomCount: number = 20,
  seed?: number
) {
  const structure = generateDungeonWithSpawnRoom(targetRoomCount, seed);
  this.dungeon = structure.dungeon;
  this.rooms = structure.rooms;
  this.roomMap = structure.roomMap;
  // ... rest wie generateFromLayouts()
}
```

---

#### Task #6: 3-Wege-Generierung

**Neue Datei:** `lib/dungeon/pathGeneration.ts`

```typescript
/**
 * Three-path generation from spawn room
 */

import type { Room, TileType } from '../constants';
import { TILE } from '../constants';
import type { RoomLayout } from '../roomlayouts/types';
import { getLayoutPool } from '../roomlayouts/LayoutPool';

export interface Path {
  doorConnection: DoorConnection;
  rooms: number[];
  endDoor: DoorConnection | null;
  length: number;
}

interface DoorConnection {
  roomId: number;
  side: 'north' | 'south' | 'east' | 'west';
  x: number;
  y: number;
}

/**
 * Generates 3 paths from spawn room doors
 */
export function generateThreePaths(
  dungeon: TileType[][],
  roomMap: number[][],
  rooms: Room[],
  placedRooms: any[],
  openDoors: DoorConnection[],
  pool: any
): Path[] {
  const spawnDoors = openDoors.filter(d => d.roomId === 0);

  if (spawnDoors.length !== 3) {
    throw new Error(`Expected 3 spawn doors, found ${spawnDoors.length}`);
  }

  const paths: Path[] = [];

  for (const spawnDoor of spawnDoors) {
    const targetLength = 5 + Math.floor(Math.random() * 6); // 5-10 rooms

    const path: Path = {
      doorConnection: spawnDoor,
      rooms: [],
      endDoor: null,
      length: 0
    };

    let currentDoor = spawnDoor;
    let attempts = 0;
    const maxAttempts = 100;

    while (path.rooms.length < targetLength && attempts < maxAttempts) {
      attempts++;

      // Get layout for this door
      const oppositeSide = getOppositeSide(currentDoor.side);
      const newLayout = pool.getLayoutWithDoor(oppositeSide);

      if (!newLayout) {
        console.warn(`No layout with ${oppositeSide} door`);
        break;
      }

      // TODO: Place room, update path
      // const { x, y } = calculateNewRoomPosition(currentDoor, newLayout, oppositeSide);
      // if (!canPlaceRoom(...)) continue;
      // placeRoomInDungeon(...);
      // path.rooms.push(newRoomId);
      // path.length++;
    }

    paths.push(path);
    console.log(`[Path ${paths.length}] Generated ${path.length} rooms (target: ${targetLength})`);
  }

  return paths;
}

function getOppositeSide(side: 'north' | 'south' | 'east' | 'west'): 'north' | 'south' | 'east' | 'west' {
  switch (side) {
    case 'north': return 'south';
    case 'south': return 'north';
    case 'east': return 'west';
    case 'west': return 'east';
  }
}
```

---

#### Task #7: End-Raum Platzierung

**Neue Datei:** `lib/dungeon/endRoomPlacement.ts`

```typescript
/**
 * End room placement where all 3 paths converge
 */

import type { Room, TileType } from '../constants';
import { TILE, DUNGEON_WIDTH, DUNGEON_HEIGHT } from '../constants';
import type { Path } from './pathGeneration';

/**
 * Places end room at center of 3 paths
 */
export function placeEndRoom(
  dungeon: TileType[][],
  roomMap: number[][],
  rooms: Room[],
  placedRooms: any[],
  paths: Path[],
  pool: any
): number {
  // Get end room layouts
  const endLayouts = pool.getLayouts({ roomType: 'end' });

  if (endLayouts.length === 0) {
    console.warn('No end room layouts, using random layout');
    const allLayouts = pool.getLayouts();
    endLayouts.push(allLayouts[Math.floor(Math.random() * allLayouts.length)]);
  }

  const endLayout = endLayouts[Math.floor(Math.random() * endLayouts.length)];

  // Calculate center position between path ends
  const pathEnds = paths.map(p => {
    if (p.rooms.length > 0) {
      const lastRoom = rooms[p.rooms[p.rooms.length - 1]];
      return {
        x: lastRoom.x + Math.floor(lastRoom.width / 2),
        y: lastRoom.y + Math.floor(lastRoom.height / 2)
      };
    }
    return { x: DUNGEON_WIDTH / 2, y: DUNGEON_HEIGHT / 2 };
  });

  const centerX = Math.floor(
    pathEnds.reduce((sum, p) => sum + p.x, 0) / pathEnds.length
  );
  const centerY = Math.floor(
    pathEnds.reduce((sum, p) => sum + p.y, 0) / pathEnds.length
  );

  // Place end room near center
  let endX = centerX - Math.floor(endLayout.width / 2);
  let endY = centerY - Math.floor(endLayout.height / 2);

  // TODO: Verify position is free with canPlaceRoom()
  // TODO: Place room with placeRoomInDungeon()

  const endRoomId = placedRooms.length;
  rooms[endRoomId].type = 'end';

  console.log(`[Dungeon] End room placed at (${endX}, ${endY})`);

  return endRoomId;
}

/**
 * Connects all 3 paths to end room via corridors
 */
export function connectPathsToEndRoom(
  dungeon: TileType[][],
  roomMap: number[][],
  rooms: Room[],
  paths: Path[],
  endRoomId: number
): void {
  const endRoom = rooms[endRoomId];

  for (const path of paths) {
    if (path.rooms.length === 0) continue;

    const lastRoomId = path.rooms[path.rooms.length - 1];
    const lastRoom = rooms[lastRoomId];

    // Create corridor from last room to end room
    // TODO: Implement corridor generation (straight line or A*)

    // Connect to end room
    lastRoom.neighbors.push(endRoomId);
    endRoom.neighbors.push(lastRoomId);

    console.log(`[Path Connection] Connected path to end room`);
  }
}
```

---

### PRIORITÄT 3: EXTRAS (Tasks 8-11)

#### Task #8: Sackgassen & Abzweigungen

**Helper-Funktion hinzufügen zu `lib/roomlayouts/LayoutPool.ts`:**

```typescript
/**
 * Gets all layouts with only 1 door (dead-ends)
 */
getDeadEndLayouts(): RoomLayout[] {
  return this.layouts.filter(layout => {
    const doorCount = [
      layout.doorPositions.north !== null,
      layout.doorPositions.south !== null,
      layout.doorPositions.east !== null,
      layout.doorPositions.west !== null
    ].filter(Boolean).length;

    return doorCount === 1;
  });
}
```

---

#### Task #9: Cheat-Menü

**Neue Datei:** `components/CheatMenu.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import type { Room } from '@/lib/constants';

interface CheatMenuProps {
  onTeleport: (roomId: number) => void;
  onRevealAll: () => void;
  onRegenerateDungeon: () => void;
  onToggleGodMode: () => void;
  rooms: Room[];
}

export function CheatMenu({
  onTeleport,
  onRevealAll,
  onRegenerateDungeon,
  onToggleGodMode,
  rooms
}: CheatMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [godMode, setGodMode] = useState(false);

  // Ctrl+Shift+C to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg z-[9999] max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">🛠️ Cheat Menu</h2>

      <div className="space-y-2">
        <button
          onClick={onRegenerateDungeon}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          🔄 Regenerate Dungeon
        </button>

        <button
          onClick={onRevealAll}
          className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded"
        >
          👁️ Reveal All Rooms
        </button>

        <button
          onClick={() => {
            setGodMode(prev => !prev);
            onToggleGodMode();
          }}
          className={`w-full px-3 py-2 rounded ${
            godMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {godMode ? '⚡ God Mode ON' : '💀 God Mode OFF'}
        </button>

        <div className="border-t border-gray-700 pt-2 mt-2">
          <h3 className="text-sm font-semibold mb-2">Teleport:</h3>
          <div className="grid grid-cols-3 gap-1 max-h-64 overflow-y-auto">
            {rooms.map((room, idx) => (
              <button
                key={idx}
                onClick={() => onTeleport(idx)}
                className={`px-2 py-1 text-xs rounded ${
                  room.type === 'spawn' ? 'bg-green-600 hover:bg-green-700' :
                  room.type === 'end' ? 'bg-red-600 hover:bg-red-700' :
                  room.type === 'shop' ? 'bg-cyan-600 hover:bg-cyan-700' :
                  room.type === 'treasure' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {idx}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded mt-4"
        >
          ✖ Close
        </button>
      </div>
    </div>
  );
}
```

**Integration in `components/GameCanvas.tsx`:**

```typescript
// Import
import { CheatMenu } from './CheatMenu';

// State
const [godMode, setGodMode] = useState(false);

// Handlers
const handleTeleport = (roomId: number) => {
  const room = rooms[roomId];
  if (room) {
    setPlayer(prev => ({
      ...prev,
      x: (room.x + room.width / 2) * TILE_SIZE,
      y: (room.y + room.height / 2) * TILE_SIZE
    }));
  }
};

const handleRevealAll = () => {
  setRooms(prev => prev.map(r => ({ ...r, visible: true })));
};

const handleToggleGodMode = () => {
  setGodMode(prev => !prev);
  if (!godMode) {
    setPlayer(prev => ({ ...prev, hp: 999, maxHp: 999 }));
  } else {
    setPlayer(prev => ({ ...prev, hp: 100, maxHp: 100 }));
  }
};

// In render (near end before </div>)
<CheatMenu
  onTeleport={handleTeleport}
  onRevealAll={handleRevealAll}
  onRegenerateDungeon={() => {
    // Trigger regeneration
    dungeonManager.generateFromSpawnRoom(availableSubjects, userId);
  }}
  onToggleGodMode={handleToggleGodMode}
  rooms={rooms}
/>
```

---

#### Task #10 & #11: Testing

**Playwright Tests erstellen:** `tests/e2e/spawn-room-validation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Spawn Room System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('input[name="username"]', 'test-spawn');
    await page.click('button:has-text("Login")');
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for dungeon generation
  });

  test('spawn room exists and is first room', async ({ page }) => {
    const spawnRoom = await page.evaluate(() => {
      const rooms = (window as any).gameState?.rooms;
      return rooms?.[0];
    });

    expect(spawnRoom).toBeDefined();
    expect(spawnRoom.type).toBe('spawn');
  });

  test('spawn room has exactly 3 doors', async ({ page }) => {
    const doorCount = await page.evaluate(() => {
      const rooms = (window as any).gameState?.rooms;
      return rooms?.[0]?.neighbors?.length || 0;
    });

    expect(doorCount).toBe(3);
  });

  test('all doors are accessible', async ({ page }) => {
    // Open cheat menu
    await page.keyboard.press('Control+Shift+C');
    await page.waitForSelector('text=Cheat Menu');
    await page.click('button:has-text("Reveal All")');

    const neighbors = await page.evaluate(() => {
      return (window as any).gameState?.rooms[0]?.neighbors || [];
    });

    expect(neighbors.length).toBe(3);

    // Try teleporting to each neighbor
    for (const neighborId of neighbors) {
      await page.click(`button:has-text("${neighborId}")`);
      await page.waitForTimeout(300);
    }
  });
});
```

**Weitere Tests:**
- `tests/e2e/wall-validation.spec.ts` - Keine Doppelwände
- `tests/e2e/door-validation.spec.ts` - Alle Türen führen zu Räumen
- `tests/e2e/dungeon-stress.spec.ts` - 10+ Dungeons generieren

**Ausführen:**
```bash
npx playwright test
```

---

## 📋 FORTSETZUNGS-ANLEITUNG

Nach Context-Reset, befolge diese Schritte:

1. **Kritische Fixes zuerst (Tasks 3-4):**
   - Wand-Ausrichtung fix in `WallTypeDetector.ts`
   - RoomMap update + Door-Validierung in `layoutGeneration.ts`
   - Build + Test

2. **Spawn-Raum implementieren (Task 5):**
   - `spawnRoomGeneration.ts` erstellen
   - In DungeonManager integrieren
   - Test mit Cheat-Menu

3. **3-Wege + End-Raum (Tasks 6-7):**
   - `pathGeneration.ts` + `endRoomPlacement.ts`
   - Integration testen

4. **Optional (Tasks 8-9):**
   - Sackgassen-Helper
   - Cheat-Menü UI

5. **Testing (Tasks 10-11):**
   - Playwright-Tests schreiben
   - Alle Tests laufen lassen
   - Fehler fixen

**Wichtig:** Jeder Schritt muss getestet werden bevor zum nächsten übergegangen wird!

---

## 🔧 QUICK REFERENCE

**Wichtige Dateien:**
- `lib/dungeon/layoutGeneration.ts` - Hauptgenerierung
- `lib/tiletheme/WallTypeDetector.ts` - Wand-Orientierung
- `lib/roomlayouts/validation.ts` - Spawn/End-Validierung
- `lib/game/DungeonManager.ts` - Manager-Integration

**Wichtige Konstanten:**
- Spawn-Raum: 3 Türen (Nord, Ost, West)
- End-Raum: Mind. 3 Türen
- Pfad-Länge: 5-10 Räume
- Target Rooms: 20

**Test-Commands:**
```bash
npm run dev                    # Dev-Server
npm run build                  # Build-Check
npx playwright test            # E2E-Tests
npx playwright test --headed   # Mit Browser
```

**Cheat-Menu:** Ctrl+Shift+C

---

**Status:** Bereit zur Fortsetzung nach Context-Reset
