# Tilemap Editor - Implementierungsplan

## Übersicht

Der Tilemap Editor (`/tilemapeditor`) ermöglicht das Erstellen von **TileThemes** durch Drag & Drop von Tiles aus beliebigen Tilesets. Ein **DungeonTheme** kombiniert zwei TileThemes (Dark + Light) für das finale Rendering.

### Konzept-Hierarchie

```
DungeonTheme
├── darkTheme: TileTheme      (wenn Enemies im Raum)
└── lightTheme: TileTheme     (wenn Raum gecleant)

TileTheme
├── floor: TileSlot[]         (1+ Varianten mit Weight)
├── wall: WallSlots           (11 Pflicht-Slots + 5 Optional)
└── door: DoorSlots           (4 Pflicht-Slots)
```

### Kernfeatures

- **Tileset-Import**: Beliebige 64x64 PNG-Tilesets importieren
- **Tile-Mixing**: Tiles aus verschiedenen Tilesets in einem Theme kombinieren
- **Autotiling**: Automatische Wand-Erkennung (Ecken, T-Stücke, Kreuzungen)
- **Varianten mit Gewichtung**: Mehrere Tiles pro Slot mit Weight für natürliche Variation
- **Live-Preview**: Statische Test-Map zeigt alle Tile-Typen in Aktion
- **Validierung**: Theme ist nur speicherbar wenn alle Pflicht-Slots belegt sind
- **Pink-Platzhalter**: Fehlende Tiles werden pink dargestellt (wie Unity)

---

## Neue Dateien

```
next-app/
├── app/
│   └── tilemapeditor/
│       └── page.tsx                          # Route /tilemapeditor
├── components/
│   └── tilemapeditor/
│       ├── TilemapEditorCanvas.tsx           # Haupt-Container
│       ├── TilesetViewer.tsx                 # Linke Seite: Tileset-Ansicht
│       ├── TileSlotGrid.tsx                  # Rechte Seite: Ziel-Slots
│       ├── TileSlot.tsx                      # Einzelner Slot (Drop-Target)
│       ├── VariantEditor.tsx                 # Unten: Varianten mit Weights
│       ├── ThemePreview.tsx                  # Live-Preview mit Test-Map
│       ├── TilesetSelector.tsx               # Dropdown für Tileset-Wechsel
│       └── ThemeToolbar.tsx                  # Save/Load/Validate Buttons
├── hooks/
│   └── useTilemapEditorState.ts              # Editor State Management
├── lib/
│   ├── tiletheme/
│   │   ├── types.ts                          # TypeScript Interfaces
│   │   ├── WallTypeDetector.ts               # Autotiling-Logik
│   │   ├── RenderMapGenerator.ts             # RenderMap aus Dungeon+Theme generieren
│   │   ├── ThemeValidator.ts                 # Validierung vollständiger Themes
│   │   └── TestMapGenerator.ts               # Statische Test-Map für Preview
│   ├── rendering/
│   │   └── ThemeRenderer.ts                  # Neuer Renderer mit Theme-Support
│   └── db.ts                                 # Erweiterung: Tileset/Theme CRUD
└── app/api/
    └── tilemapeditor/
        ├── tilesets/
        │   ├── route.ts                      # GET/POST Tilesets
        │   └── [id]/route.ts                 # GET/DELETE einzelnes Tileset
        ├── themes/
        │   ├── route.ts                      # GET/POST TileThemes
        │   └── [id]/route.ts                 # GET/PUT/DELETE einzelnes Theme
        └── dungeon-themes/
            ├── route.ts                      # GET/POST DungeonThemes
            └── [id]/route.ts                 # GET/PUT/DELETE einzelnes DungeonTheme
```

### Zu modifizierende Dateien

```
lib/constants.ts                              # Neue Konstanten für Wall-Types
lib/db.ts                                     # Neue Tabellen + CRUD
lib/rendering/GameRenderer.ts                 # Optional später: Theme-Support
lib/rendering/EditorRenderer.ts               # Optional später: Theme-Support
```

---

## 1. Datenstrukturen

### 1.1 TypeScript Types (`lib/tiletheme/types.ts`)

```typescript
// ============================================
// TILESET (importierte PNG-Dateien)
// ============================================

export interface ImportedTileset {
  id: number;
  name: string;
  path: string;                 // z.B. "/Assets/tilesets/custom/castle.png"
  widthTiles: number;           // Anzahl Tiles horizontal
  heightTiles: number;          // Anzahl Tiles vertikal
  created_at?: string;
}

// ============================================
// TILE SOURCE (Referenz auf ein Tile in einem Tileset)
// ============================================

export interface TileSource {
  tilesetId: number;            // Welches Tileset?
  x: number;                    // Tile-Koordinate X (0-basiert)
  y: number;                    // Tile-Koordinate Y (0-basiert)
}

export interface TileVariant {
  source: TileSource;
  weight: number;               // Gewichtung für Zufallsauswahl (1-100)
}

// ============================================
// WALL TYPES (für Autotiling)
// ============================================

export const WALL_TYPE = {
  // Lineare Wände
  HORIZONTAL: 'horizontal',     // ═══ Wände links UND/ODER rechts, keine oben/unten
  VERTICAL: 'vertical',         // ║   Wände oben UND/ODER unten, keine links/rechts

  // Ecken (genau 2 benachbarte Wände im rechten Winkel)
  CORNER_TL: 'corner_tl',       // ╔   Wand rechts + unten
  CORNER_TR: 'corner_tr',       // ╗   Wand links + unten
  CORNER_BL: 'corner_bl',       // ╚   Wand rechts + oben
  CORNER_BR: 'corner_br',       // ╝   Wand links + oben

  // T-Stücke (genau 3 benachbarte Wände)
  T_UP: 't_up',                 // ╩   Öffnung nach oben (Wände links, rechts, unten)
  T_DOWN: 't_down',             // ╦   Öffnung nach unten (Wände links, rechts, oben)
  T_LEFT: 't_left',             // ╣   Öffnung nach links (Wände oben, unten, rechts)
  T_RIGHT: 't_right',           // ╠   Öffnung nach rechts (Wände oben, unten, links)

  // Kreuzung (alle 4 Seiten haben Wände)
  CROSS: 'cross',               // ╬

  // Sonderfälle (optional - Fallback auf lineare)
  ISOLATED: 'isolated',         // ▢   Keine Nachbar-Wände
  END_LEFT: 'end_left',         // ═   Nur Wand rechts
  END_RIGHT: 'end_right',       // ═   Nur Wand links
  END_TOP: 'end_top',           // ║   Nur Wand unten
  END_BOTTOM: 'end_bottom',     // ║   Nur Wand oben
} as const;

export type WallType = typeof WALL_TYPE[keyof typeof WALL_TYPE];

// Pflicht-Slots (müssen belegt sein)
export const REQUIRED_WALL_TYPES: WallType[] = [
  WALL_TYPE.HORIZONTAL,
  WALL_TYPE.VERTICAL,
  WALL_TYPE.CORNER_TL,
  WALL_TYPE.CORNER_TR,
  WALL_TYPE.CORNER_BL,
  WALL_TYPE.CORNER_BR,
  WALL_TYPE.T_UP,
  WALL_TYPE.T_DOWN,
  WALL_TYPE.T_LEFT,
  WALL_TYPE.T_RIGHT,
  WALL_TYPE.CROSS,
];

// Optional (Fallback auf andere wenn nicht belegt)
export const OPTIONAL_WALL_TYPES: WallType[] = [
  WALL_TYPE.ISOLATED,
  WALL_TYPE.END_LEFT,
  WALL_TYPE.END_RIGHT,
  WALL_TYPE.END_TOP,
  WALL_TYPE.END_BOTTOM,
];

// ============================================
// DOOR TYPES
// ============================================

export const DOOR_TYPE = {
  HORIZONTAL_CLOSED: 'horizontal_closed',
  HORIZONTAL_OPEN: 'horizontal_open',
  VERTICAL_CLOSED: 'vertical_closed',
  VERTICAL_OPEN: 'vertical_open',
} as const;

export type DoorType = typeof DOOR_TYPE[keyof typeof DOOR_TYPE];

export const REQUIRED_DOOR_TYPES: DoorType[] = [
  DOOR_TYPE.HORIZONTAL_CLOSED,
  DOOR_TYPE.HORIZONTAL_OPEN,
  DOOR_TYPE.VERTICAL_CLOSED,
  DOOR_TYPE.VERTICAL_OPEN,
];

// ============================================
// TILE THEME (einzelnes Theme für Dark ODER Light)
// ============================================

export interface TileTheme {
  id: number;
  name: string;

  floor: {
    default: TileVariant[];     // Mind. 1 Variante
  };

  wall: {
    [key in WallType]?: TileVariant[];  // Pflicht-Typen müssen belegt sein
  };

  door: {
    [key in DoorType]?: TileVariant[];  // Alle 4 müssen belegt sein
  };

  created_at?: string;
  updated_at?: string;
}

// ============================================
// DUNGEON THEME (Kombination aus Dark + Light TileTheme)
// ============================================

export interface DungeonTheme {
  id: number;
  name: string;
  darkThemeId: number;          // Referenz auf TileTheme
  lightThemeId: number;         // Referenz auf TileTheme
  created_at?: string;
  updated_at?: string;
}

// ============================================
// VALIDATION
// ============================================

export interface ValidationResult {
  isValid: boolean;
  missingSlots: string[];       // z.B. ["wall.corner_tl", "door.horizontal_open"]
  warnings: string[];           // z.B. ["wall.isolated nicht belegt - Fallback auf horizontal"]
}
```

---

## 2. Datenbank-Schema

### 2.1 Neue Tabellen (`lib/db.ts` erweitern)

```sql
-- Importierte Tilesets
CREATE TABLE IF NOT EXISTS tilesets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  width_tiles INTEGER NOT NULL,
  height_tiles INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tile Themes (für Dark oder Light)
CREATE TABLE IF NOT EXISTS tile_themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  floor_config TEXT NOT NULL,       -- JSON: { default: TileVariant[] }
  wall_config TEXT NOT NULL,        -- JSON: { [WallType]: TileVariant[] }
  door_config TEXT NOT NULL,        -- JSON: { [DoorType]: TileVariant[] }
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dungeon Themes (Dark + Light Kombination)
CREATE TABLE IF NOT EXISTS dungeon_themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  dark_theme_id INTEGER NOT NULL,
  light_theme_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dark_theme_id) REFERENCES tile_themes(id),
  FOREIGN KEY (light_theme_id) REFERENCES tile_themes(id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_tile_themes_name ON tile_themes(name);
CREATE INDEX IF NOT EXISTS idx_dungeon_themes_name ON dungeon_themes(name);
```

### 2.2 CRUD-Funktionen

```typescript
// ============================================
// TILESET CRUD
// ============================================

export function saveTileset(tileset: Omit<ImportedTileset, 'id' | 'created_at'>): number;
export function getTilesets(): ImportedTileset[];
export function getTileset(id: number): ImportedTileset | null;
export function deleteTileset(id: number): void;

// ============================================
// TILE THEME CRUD
// ============================================

export function saveTileTheme(theme: Omit<TileTheme, 'id' | 'created_at' | 'updated_at'>): number;
export function getTileThemes(): TileTheme[];
export function getTileTheme(id: number): TileTheme | null;
export function updateTileTheme(id: number, updates: Partial<TileTheme>): void;
export function deleteTileTheme(id: number): void;

// ============================================
// DUNGEON THEME CRUD
// ============================================

export function saveDungeonTheme(theme: Omit<DungeonTheme, 'id' | 'created_at' | 'updated_at'>): number;
export function getDungeonThemes(): DungeonTheme[];
export function getDungeonTheme(id: number): DungeonTheme | null;
export function updateDungeonTheme(id: number, updates: Partial<DungeonTheme>): void;
export function deleteDungeonTheme(id: number): void;
```

---

## 3. Autotiling-Logik

### 3.1 Wall Type Detector (`lib/tiletheme/WallTypeDetector.ts`)

```typescript
import { WALL_TYPE, WallType, DOOR_TYPE, DoorType } from './types';
import { TILE } from '../constants';
import type { TileType } from '../constants';

/**
 * Prüft ob eine Position eine Wand oder Tür ist
 * WICHTIG: Türen werden wie Wände behandelt für Autotiling!
 */
function isWallOrDoor(dungeon: TileType[][], x: number, y: number): boolean {
  if (y < 0 || y >= dungeon.length || x < 0 || x >= dungeon[0].length) {
    return false; // Außerhalb = keine Wand
  }
  const tile = dungeon[y][x];
  return tile === TILE.WALL || tile === TILE.DOOR;
}

/**
 * Ermittelt den Wall-Type basierend auf den 4 direkten Nachbarn
 */
export function detectWallType(
  dungeon: TileType[][],
  x: number,
  y: number
): WallType {
  const hasTop = isWallOrDoor(dungeon, x, y - 1);
  const hasBottom = isWallOrDoor(dungeon, x, y + 1);
  const hasLeft = isWallOrDoor(dungeon, x - 1, y);
  const hasRight = isWallOrDoor(dungeon, x + 1, y);

  const count = [hasTop, hasBottom, hasLeft, hasRight].filter(Boolean).length;

  // 4 Nachbarn = Kreuzung
  if (count === 4) {
    return WALL_TYPE.CROSS;
  }

  // 3 Nachbarn = T-Stück
  if (count === 3) {
    if (!hasTop) return WALL_TYPE.T_UP;
    if (!hasBottom) return WALL_TYPE.T_DOWN;
    if (!hasLeft) return WALL_TYPE.T_LEFT;
    if (!hasRight) return WALL_TYPE.T_RIGHT;
  }

  // 2 Nachbarn = Ecke oder Linear
  if (count === 2) {
    // Ecken (rechtwinklig)
    if (hasRight && hasBottom) return WALL_TYPE.CORNER_TL;
    if (hasLeft && hasBottom) return WALL_TYPE.CORNER_TR;
    if (hasRight && hasTop) return WALL_TYPE.CORNER_BL;
    if (hasLeft && hasTop) return WALL_TYPE.CORNER_BR;

    // Linear (gegenüberliegend)
    if (hasLeft && hasRight) return WALL_TYPE.HORIZONTAL;
    if (hasTop && hasBottom) return WALL_TYPE.VERTICAL;
  }

  // 1 Nachbar = Ende
  if (count === 1) {
    if (hasRight) return WALL_TYPE.END_LEFT;
    if (hasLeft) return WALL_TYPE.END_RIGHT;
    if (hasBottom) return WALL_TYPE.END_TOP;
    if (hasTop) return WALL_TYPE.END_BOTTOM;
  }

  // 0 Nachbarn = Isoliert
  return WALL_TYPE.ISOLATED;
}

/**
 * Lookup-Map für Fallbacks wenn optionale Typen nicht belegt sind
 */
export const WALL_TYPE_FALLBACKS: { [key in WallType]?: WallType } = {
  [WALL_TYPE.ISOLATED]: WALL_TYPE.HORIZONTAL,
  [WALL_TYPE.END_LEFT]: WALL_TYPE.HORIZONTAL,
  [WALL_TYPE.END_RIGHT]: WALL_TYPE.HORIZONTAL,
  [WALL_TYPE.END_TOP]: WALL_TYPE.VERTICAL,
  [WALL_TYPE.END_BOTTOM]: WALL_TYPE.VERTICAL,
};

/**
 * Ermittelt den Door-Type basierend auf Orientierung
 * isOpen: Im Spiel wird die Tür "geöffnet" wenn der Spieler durchgeht
 */
export function detectDoorType(
  dungeon: TileType[][],
  x: number,
  y: number,
  isOpen: boolean = false
): DoorType {
  // Prüfe horizontale vs vertikale Orientierung
  const hasWallLeft = x > 0 && dungeon[y][x - 1] === TILE.WALL;
  const hasWallRight = x < dungeon[0].length - 1 && dungeon[y][x + 1] === TILE.WALL;

  // Tür ist vertikal wenn Wände links/rechts
  const isVertical = hasWallLeft || hasWallRight;

  if (isVertical) {
    return isOpen ? DOOR_TYPE.VERTICAL_OPEN : DOOR_TYPE.VERTICAL_CLOSED;
  } else {
    return isOpen ? DOOR_TYPE.HORIZONTAL_OPEN : DOOR_TYPE.HORIZONTAL_CLOSED;
  }
}
```

---

## 4. Test-Map Generator

### 4.1 Statische Test-Map (`lib/tiletheme/TestMapGenerator.ts`)

Die Test-Map enthält ALLE Tile-Typen für die Live-Preview:

```
Layout (15x10):

╔═══════════╦═══╗
║           ║   ║
║  FLOOR    ╠═══╣
║           ║   ║
╠═══╦═══════╬═══╣
║   ║       ┋   ║
║   ║  FL   ─   ║
║   ║       ║   ║
╚═══╩═══════╩═══╝

Enthält:
- Alle 4 Ecken (╔ ╗ ╚ ╝)
- Alle 4 T-Stücke (╦ ╩ ╠ ╣)
- Kreuzung (╬)
- Horizontale und vertikale Wände (═ ║)
- Horizontale und vertikale Türen (┋ ─)
- Floor-Tiles
```

```typescript
import { TILE, TileType } from '../constants';

export function generateTestMap(): {
  dungeon: TileType[][],
  width: number,
  height: number
} {
  const width = 15;
  const height = 10;

  // W=Wall, F=Floor, D=Door
  const layout = [
    'WWWWWWWWWWWWWWW',
    'WFFFFFFFFFWFFFW',
    'WFFFFFFFFFWFFFW',
    'WFFFFFFFFFWWDWW',
    'WWWWDWWWWWWFFFW',
    'WFFWFFFFFFFDFFW',
    'WFFWFFFFFFFWFFW',
    'WFFWFFFFFFFWFFW',
    'WFFDFFFFFFFFFFFFW',
    'WWWWWWWWWWWWWWW',
  ];

  const dungeon: TileType[][] = [];

  for (let y = 0; y < height; y++) {
    dungeon[y] = [];
    for (let x = 0; x < width; x++) {
      const char = layout[y]?.[x] || 'W';
      switch (char) {
        case 'W': dungeon[y][x] = TILE.WALL; break;
        case 'F': dungeon[y][x] = TILE.FLOOR; break;
        case 'D': dungeon[y][x] = TILE.DOOR; break;
        default: dungeon[y][x] = TILE.EMPTY; break;
      }
    }
  }

  return { dungeon, width, height };
}
```

---

## 5. RenderMap (Pre-computed Tile Selection)

### 5.1 Konzept

**Problem**: Während des Renderns für jedes Tile den Wall-Type zu ermitteln und eine Variante auszuwählen ist ineffizient.

**Lösung**: Eine **RenderMap** wird einmalig bei der Dungeon-Generierung erstellt. Sie enthält für jede Tile-Position die finale Tile-Referenz (Tileset + Koordinaten).

```
Dungeon Generation
       │
       ▼
┌──────────────────┐
│  dungeon[][]     │  Logische Map (FLOOR, WALL, DOOR, EMPTY)
└────────┬─────────┘
         │
         ▼  generateRenderMap(dungeon, theme)
┌──────────────────┐
│  renderMap[][]   │  Vorberechnete Tile-Referenzen
└────────┬─────────┘
         │
         ▼  Rendering (schnell!)
┌──────────────────┐
│  Canvas          │  Nur noch drawImage() Aufrufe
└──────────────────┘
```

### 5.2 RenderMap Datenstruktur (`lib/tiletheme/types.ts` erweitern)

```typescript
// ============================================
// RENDER MAP (vorberechnete Tile-Auswahl)
// ============================================

/**
 * Einzelne Tile-Referenz für Rendering
 * Enthält Dark + Light Variante (Light optional)
 * null = nicht rendern (EMPTY)
 */
export interface RenderTile {
  // Dark Tileset (Default, immer vorhanden)
  darkTilesetId: number;
  darkSrcX: number;             // Source X in Pixeln (bereits berechnet!)
  darkSrcY: number;             // Source Y in Pixeln (bereits berechnet!)

  // Light Tileset (Optional - null = Fallback auf Dark)
  lightTilesetId: number | null;
  lightSrcX: number | null;
  lightSrcY: number | null;
}

/**
 * Komplette RenderMap für einen Dungeon
 */
export interface RenderMap {
  width: number;
  height: number;
  tiles: (RenderTile | null)[][];  // null = EMPTY, nicht rendern
}

/**
 * Generiert die RenderMap aus Dungeon + Theme
 * Wird einmalig bei Dungeon-Generierung aufgerufen!
 */
export function generateRenderMap(
  dungeon: TileType[][],
  theme: TileTheme,
  rngSeed: number
): RenderMap;
```

### 5.3 RenderMap Generator (`lib/tiletheme/RenderMapGenerator.ts`)

```typescript
import { TileTheme, TileVariant, RenderMap, RenderTile } from './types';
import { detectWallType, detectDoorType, WALL_TYPE_FALLBACKS } from './WallTypeDetector';
import { TILE, TILE_SOURCE_SIZE } from '../constants';
import type { TileType } from '../constants';

/**
 * Einfacher Seeded RNG für konsistente Varianten-Auswahl
 */
function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Wählt eine Tile-Variante basierend auf Gewichtung
 */
function selectVariant(variants: TileVariant[], rng: () => number): TileVariant | null {
  if (!variants || variants.length === 0) return null;

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = rng() * totalWeight;

  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) return variant;
  }

  return variants[0];
}

/**
 * Konvertiert Dark + Light Varianten zu RenderTile
 * Light ist optional - wenn null, wird beim Rendern Dark verwendet
 */
function variantsToRenderTile(
  darkVariant: TileVariant | null,
  lightVariant: TileVariant | null
): RenderTile | null {
  if (!darkVariant) return null;

  return {
    // Dark (immer vorhanden)
    darkTilesetId: darkVariant.source.tilesetId,
    darkSrcX: darkVariant.source.x * TILE_SOURCE_SIZE,
    darkSrcY: darkVariant.source.y * TILE_SOURCE_SIZE,

    // Light (optional)
    lightTilesetId: lightVariant?.source.tilesetId ?? null,
    lightSrcX: lightVariant ? lightVariant.source.x * TILE_SOURCE_SIZE : null,
    lightSrcY: lightVariant ? lightVariant.source.y * TILE_SOURCE_SIZE : null,
  };
}

/**
 * Generiert die komplette RenderMap mit Dark + Light Tiles
 * EINMALIG bei Dungeon-Generierung aufrufen!
 *
 * @param dungeon - Die logische Dungeon-Map
 * @param darkTheme - TileTheme für Dark-Modus (Pflicht)
 * @param lightTheme - TileTheme für Light-Modus (Optional, null = kein Light)
 * @param rngSeed - Seed für konsistente Varianten-Auswahl
 */
export function generateRenderMap(
  dungeon: TileType[][],
  darkTheme: TileTheme,
  lightTheme: TileTheme | null,
  rngSeed: number
): RenderMap {
  const height = dungeon.length;
  const width = dungeon[0]?.length ?? 0;

  // Zwei RNGs mit gleichem Seed für konsistente Dark/Light Auswahl
  const darkRng = createRng(rngSeed);
  const lightRng = createRng(rngSeed);

  const tiles: (RenderTile | null)[][] = [];

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      const tile = dungeon[y][x];

      if (tile === TILE.EMPTY) {
        tiles[y][x] = null;
        continue;
      }

      if (tile === TILE.FLOOR) {
        const darkVariant = selectVariant(darkTheme.floor.default, darkRng);
        const lightVariant = lightTheme
          ? selectVariant(lightTheme.floor.default, lightRng)
          : null;
        tiles[y][x] = variantsToRenderTile(darkVariant, lightVariant);
        continue;
      }

      if (tile === TILE.WALL) {
        const wallType = detectWallType(dungeon, x, y);

        // Dark Variante
        let darkVariants = darkTheme.wall[wallType];
        if (!darkVariants?.length) {
          const fallback = WALL_TYPE_FALLBACKS[wallType];
          if (fallback) darkVariants = darkTheme.wall[fallback];
        }
        const darkVariant = selectVariant(darkVariants || [], darkRng);

        // Light Variante (optional)
        let lightVariant: TileVariant | null = null;
        if (lightTheme) {
          let lightVariants = lightTheme.wall[wallType];
          if (!lightVariants?.length) {
            const fallback = WALL_TYPE_FALLBACKS[wallType];
            if (fallback) lightVariants = lightTheme.wall[fallback];
          }
          lightVariant = selectVariant(lightVariants || [], lightRng);
        }

        tiles[y][x] = variantsToRenderTile(darkVariant, lightVariant);
        continue;
      }

      if (tile === TILE.DOOR) {
        const doorType = detectDoorType(dungeon, x, y, false);

        const darkVariant = selectVariant(darkTheme.door[doorType] || [], darkRng);
        const lightVariant = lightTheme
          ? selectVariant(lightTheme.door[doorType] || [], lightRng)
          : null;

        tiles[y][x] = variantsToRenderTile(darkVariant, lightVariant);
        continue;
      }

      // Fallback
      tiles[y][x] = null;
    }
  }

  return { width, height, tiles };
}
```

### 5.4 Integration in DungeonManager

Die RenderMap wird Teil des DungeonManager-States:

```typescript
// In DungeonManager.ts erweitern:

class DungeonManager {
  // Bestehend:
  dungeon: TileType[][];
  tileVariants: TileVariant[][];  // Kann später entfallen!
  roomMap: number[][];
  rooms: Room[];

  // NEU:
  renderMap: RenderMap | null = null;

  async generateNewDungeon(..., dungeonTheme?: DungeonTheme) {
    // ... bestehende Generierung ...

    // NEU: RenderMap generieren (einmalig!)
    if (dungeonTheme) {
      const darkTheme = getTileTheme(dungeonTheme.darkThemeId);
      const lightTheme = dungeonTheme.lightThemeId
        ? getTileTheme(dungeonTheme.lightThemeId)
        : null;

      this.renderMap = generateRenderMap(
        this.dungeon,
        darkTheme,
        lightTheme,
        decorationSeed  // Gleicher Seed für konsistente Varianten
      );
    }
  }
}
```

**Hinweis:** Das bestehende `tileVariants[][]` Array kann langfristig durch die RenderMap ersetzt werden. Für die Migration können beide parallel existieren.

---

## 6. Theme Renderer (vereinfacht)

### 6.1 Theme-basierter Renderer (`lib/rendering/ThemeRenderer.ts`)

Der Renderer ist jetzt **sehr einfach**, weil die ganze Logik in der RenderMap steckt:

```typescript
import { RenderMap, RenderTile } from '../tiletheme/types';
import { TILE_SOURCE_SIZE } from '../constants';

// Pink Platzhalter für fehlende Tiles (wie Unity)
const MISSING_TILE_COLOR = '#FF00FF';

export class ThemeRenderer {
  private tilesetImages: Map<number, HTMLImageElement> = new Map();

  /**
   * Lädt ein Tileset-Image und cached es
   */
  async loadTileset(tilesetId: number, path: string): Promise<void> {
    if (this.tilesetImages.has(tilesetId)) return;

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load tileset: ${path}`));
      img.src = path;
    });

    this.tilesetImages.set(tilesetId, img);
  }

  /**
   * Rendert die gesamte Map mit vorberechneter RenderMap
   * KEINE Logik hier - nur drawImage() Aufrufe!
   */
  render(
    ctx: CanvasRenderingContext2D,
    renderMap: RenderMap,
    tileSize: number,
    viewportX: number,      // Kamera-Position
    viewportY: number,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    // Berechne sichtbaren Bereich in Tile-Koordinaten
    const startCol = Math.floor(viewportX / tileSize);
    const endCol = Math.ceil((viewportX + viewportWidth) / tileSize);
    const startRow = Math.floor(viewportY / tileSize);
    const endRow = Math.ceil((viewportY + viewportHeight) / tileSize);

    // Nur sichtbare Tiles rendern
    for (let y = Math.max(0, startRow); y < Math.min(renderMap.height, endRow); y++) {
      for (let x = Math.max(0, startCol); x < Math.min(renderMap.width, endCol); x++) {
        const renderTile = renderMap.tiles[y][x];

        const destX = x * tileSize - viewportX;
        const destY = y * tileSize - viewportY;

        if (renderTile === null) {
          // EMPTY - nichts rendern (oder optional: schwarzes Tile)
          continue;
        }

        const tileset = this.tilesetImages.get(renderTile.tilesetId);

        if (!tileset) {
          // Tileset nicht geladen - Pink Platzhalter
          ctx.fillStyle = MISSING_TILE_COLOR;
          ctx.fillRect(destX, destY, tileSize, tileSize);
          continue;
        }

        // Einfaches drawImage - alle Koordinaten sind vorberechnet!
        ctx.drawImage(
          tileset,
          renderTile.srcX, renderTile.srcY,
          TILE_SOURCE_SIZE, TILE_SOURCE_SIZE,
          destX, destY,
          tileSize, tileSize
        );
      }
    }
  }
}
```

### 6.2 Vorteile der RenderMap-Architektur

| Aspekt | Ohne RenderMap | Mit RenderMap |
|--------|----------------|---------------|
| **Pro Frame** | Wall-Type Detection + Varianten-Auswahl + Rendering | Nur Rendering |
| **CPU-Last** | O(n) Logik pro Frame | O(1) Lookup pro Frame |
| **Konsistenz** | RNG muss gleich sein | Garantiert konsistent |
| **Debugging** | Schwer nachvollziehbar | RenderMap inspizierbar |
| **Speicher** | Weniger | ~8 Bytes pro Tile mehr |

### 6.3 Dark/Light Theme Handling

Dark/Light wird **pro Raum beim Rendern** entschieden (Logik existiert bereits in `GameRenderer.shouldUseBrightTileset`).

**Ansatz:** Eine RenderMap, aber mit Referenzen auf **beide** Tilesets:

```typescript
/**
 * Erweiterte RenderTile mit Dark + Light Referenz
 */
export interface RenderTile {
  // Dark Tileset (Default)
  darkTilesetId: number;
  darkSrcX: number;
  darkSrcY: number;

  // Light Tileset (Optional - null = Fallback auf Dark)
  lightTilesetId: number | null;
  lightSrcX: number | null;
  lightSrcY: number | null;
}

// Beim Rendering:
function renderTile(
  ctx: CanvasRenderingContext2D,
  tile: RenderTile,
  useBright: boolean,  // Aus bestehender shouldUseBrightTileset() Logik
  destX: number,
  destY: number,
  tileSize: number
): void {
  // Light-Tileset nur wenn verfügbar UND Raum ist clear
  const useLight = useBright && tile.lightTilesetId !== null;

  const tilesetId = useLight ? tile.lightTilesetId! : tile.darkTilesetId;
  const srcX = useLight ? tile.lightSrcX! : tile.darkSrcX;
  const srcY = useLight ? tile.lightSrcY! : tile.darkSrcY;

  const tileset = this.tilesetImages.get(tilesetId);
  // ... drawImage ...
}
```

**Vorteile:**
- Nur EINE RenderMap (weniger Speicher)
- Bestehende `shouldUseBrightTileset()` Logik wird wiederverwendet
- Automatischer Fallback auf Dark wenn Light nicht definiert
- DungeonTheme definiert nur welche TileThemes für Dark/Light verwendet werden

---

## 6. UI-Layout

### 6.1 Gesamtlayout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TileTheme Editor    [Theme: ____] [New] [Save] [Load] [Validate ❌]    │
├────────────────────────────────┬────────────────────────────────────────┤
│                                │                                        │
│  <TilesetViewer>               │  <TileSlotGrid>                        │
│  - Dropdown <TilesetSelector>  │  - Wall Slots (11 Pflicht + 5 Opt.)   │
│  - Canvas mit Grid             │  - Door Slots (4 Pflicht)             │
│  - Drag-Start Handler          │  - Floor Slots (1+)                   │
│  - Hover-Info                  │  - Drop-Targets                       │
│                                │  - Click = Select für VariantEditor  │
│                                │                                        │
├────────────────────────────────┴────────────────────────────────────────┤
│  <VariantEditor>                                                        │
│  - Zeigt Varianten des ausgewählten Slots                              │
│  - Weight-Slider pro Variante                                          │
│  - Delete-Button pro Variante                                          │
│  - Drop-Zone für neue Varianten                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  <ThemePreview>                                                         │
│  - Canvas mit Test-Map                                                 │
│  - Live-Update bei Änderungen                                          │
│  - Pink für fehlende Tiles                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Tile Slot Grid

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  WALLS (11 Pflicht)                                                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────┐ ┌─────┐   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                       ║
║  │ ═══ │ │ ║║║ │   │ ╔═  │ │  ═╗ │ │ ╚═  │ │  ═╝ │                       ║
║  │ HOR │ │ VER │   │ CTL │ │ CTR │ │ CBL │ │ CBR │                       ║
║  └─────┘ └─────┘   └─────┘ └─────┘ └─────┘ └─────┘                       ║
║                                                                           ║
║  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                                 ║
║  │ ═╦═ │ │ ═╩═ │ │ ╠═  │ │  ═╣ │ │ ═╬═ │                                 ║
║  │ T↓  │ │ T↑  │ │ T→  │ │ T←  │ │ X   │                                 ║
║  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                                 ║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  WALLS (5 Optional) - grau hinterlegt                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                                 ║
║  │  ▢  │ │ ═   │ │   ═ │ │  ║  │ │  ║  │                                 ║
║  │ ISO │ │ E-L │ │ E-R │ │ E-T │ │ E-B │                                 ║
║  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                                 ║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  DOORS (4 Pflicht)                                                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                                         ║
║  │ ┋┋┋ │ │ ░░░ │ │ ─── │ │ ░░░ │                                         ║
║  │V-CL │ │V-OP │ │H-CL │ │H-OP │                                         ║
║  └─────┘ └─────┘ └─────┘ └─────┘                                         ║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  FLOOR (1+ Varianten)                                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────────────────────────────────────────────────────┐     ║
║  │  ▓(0,1)  ▓(1,1)  ▓(2,1)  [+ Drop Zone]                          │     ║
║  └─────────────────────────────────────────────────────────────────┘     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 7. API Routes

### 7.1 Tilesets API

**`app/api/tilemapeditor/tilesets/route.ts`**
- `GET`: Liste aller importierten Tilesets
- `POST`: Neues Tileset importieren
  - PNG upload nach `/public/Assets/tilesets/custom/`
  - Berechnet `width_tiles`, `height_tiles` aus Image-Dimensionen
  - Erstellt DB-Eintrag

**`app/api/tilemapeditor/tilesets/[id]/route.ts`**
- `GET`: Einzelnes Tileset
- `DELETE`: Tileset löschen (DB + Datei)

### 7.2 TileThemes API

**`app/api/tilemapeditor/themes/route.ts`**
- `GET`: Liste aller TileThemes
- `POST`: Neues Theme erstellen

**`app/api/tilemapeditor/themes/[id]/route.ts`**
- `GET`: Einzelnes Theme mit allen Slots
- `PUT`: Theme aktualisieren
- `DELETE`: Theme löschen

### 7.3 DungeonThemes API

**`app/api/tilemapeditor/dungeon-themes/route.ts`**
- `GET`: Liste aller DungeonThemes
- `POST`: Neues DungeonTheme (Dark + Light Referenzen)

**`app/api/tilemapeditor/dungeon-themes/[id]/route.ts`**
- `GET`: Einzelnes DungeonTheme
- `PUT`: DungeonTheme aktualisieren
- `DELETE`: DungeonTheme löschen

---

## 8. Implementierungs-Reihenfolge

### Step 1: Datenstrukturen (1-2h)
- [ ] `lib/tiletheme/types.ts` erstellen
- [ ] `lib/constants.ts` erweitern (WALL_TYPE, DOOR_TYPE falls nötig)
- [ ] TypeScript Interfaces validieren

### Step 2: Datenbank (1h)
- [ ] Neue Tabellen in `lib/db.ts`
- [ ] CRUD-Funktionen implementieren
- [ ] Migration für bestehende DB

### Step 3: Autotiling-Logik (1-2h)
- [ ] `lib/tiletheme/WallTypeDetector.ts`
- [ ] `lib/tiletheme/TestMapGenerator.ts`
- [ ] Unit-Tests für Wall-Type-Detection

### Step 4: RenderMap Generator (1-2h)
- [ ] `lib/tiletheme/RenderMapGenerator.ts`
- [ ] Einmalige Generierung bei Dungeon-Erstellung
- [ ] Dark + Light RenderMap Support
- [ ] Integration in DungeonManager

### Step 5: Theme Renderer (1-2h)
- [ ] `lib/rendering/ThemeRenderer.ts`
- [ ] Pink-Platzhalter für fehlende Tiles
- [ ] Viewport-basiertes Rendering (nur sichtbare Tiles)

### Step 6: API Routes (1-2h)
- [ ] Tilesets CRUD
- [ ] TileThemes CRUD
- [ ] DungeonThemes CRUD

### Step 7: UI - Grundstruktur (2-3h)
- [ ] Route `/tilemapeditor`
- [ ] `TilemapEditorCanvas.tsx` (Container)
- [ ] `TilesetViewer.tsx` (linke Seite)
- [ ] `TileSlotGrid.tsx` (rechte Seite)

### Step 8: UI - Drag & Drop (2-3h)
- [ ] Drag from TilesetViewer
- [ ] Drop to TileSlot
- [ ] Visual Feedback (Hover, Valid/Invalid)

### Step 9: UI - Varianten & Preview (2-3h)
- [ ] `VariantEditor.tsx`
- [ ] Weight-Slider
- [ ] `ThemePreview.tsx` mit Live-Update

### Step 10: Validierung & Polish (1-2h)
- [ ] `ThemeValidator.ts`
- [ ] Validate-Button mit Feedback
- [ ] Save nur wenn valid
- [ ] Toast-Notifications

### Step 11: Integration (optional, später)
- [ ] `GameRenderer.ts` Theme-Support
- [ ] `EditorRenderer.ts` Theme-Support
- [ ] Theme-Auswahl im Map Editor

---

## Geschätzte Gesamtzeit: 17-25 Stunden

---

## Zukünftige Erweiterungen

### Phase 2 - Raumtyp-spezifische Themes
- Separate Floor-Tiles für `combat`, `treasure`, `boss`, etc.
- Pro Raumtyp ein optionales Override

### Phase 3 - Deko-Elemente
```typescript
decorations: {
  torch: { coord: TileCoord, placement: 'wall', spawnRate: 0.1 },
  barrel: { coord: TileCoord, placement: 'floor', spawnRate: 0.05 },
}
```

### Phase 4 - Prefabs
```typescript
prefabs: [
  {
    name: "Altar",
    tiles: [
      { dx: 0, dy: 0, coord: {x: 10, y: 5} },
      { dx: 1, dy: 0, coord: {x: 11, y: 5} },
    ],
    anchorPoint: { x: 0, y: 1 }
  }
]
```

---

**Erstellt**: 2025-11-21
**Autor**: Dungeons & Diplomas Team
**Status**: Implementation Plan
