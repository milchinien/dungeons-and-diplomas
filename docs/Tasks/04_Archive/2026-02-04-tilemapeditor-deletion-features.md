# Tilemap Editor - Deletion Features

**Datum**: 2026-02-04
**Autor**: Claude (Michi)
**Status**: ✅ Implementiert

## Problem-Beschreibung

Der Benutzer hat zwei neue Features für den Tilemap-Editor (`/tilemapeditor`) angefragt:

1. **"Alles löschen" Button** - Ein Button um alle Tiles auf einmal zu entfernen
2. **Individuelle "X" Buttons** - Ein "X" oben rechts bei jedem Tile-Slot zum Löschen einzelner Slots

**Anfrage**: "kannst du dort noch ein knopf hinzufügen alles zu entfernen und kannst du oben rechts von jeden tile ein 'x' machen wo man das einzelne löschen kann?"

## Implementierung

### Feature 1: "Alles löschen" Button

**Backend-Logik** (`hooks/tilemapeditor/useTileThemeState.ts`):

```typescript
const clearAllVariants = useCallback(() => {
  setTheme(prev => {
    if (!prev) return null;
    return {
      ...prev,
      floor: { default: [] },
      wall: {},
      door: {}
    };
  });
  setIsDirty(true);
}, []);
```

**Eigenschaften**:
- Löscht alle Floor-Varianten
- Löscht alle Wall-Varianten (alle Slot-Typen)
- Löscht alle Door-Varianten (alle Slot-Typen)
- Markiert Theme als "dirty" (ungespeichert)
- Behält Theme-Metadaten (ID, Name, Timestamps)

**UI-Komponente** (`components/tilemapeditor/ThemeToolbar.tsx`):

```typescript
<button
  onClick={onClearAll}
  disabled={isLoading}
  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded disabled:bg-gray-500 disabled:cursor-not-allowed"
  title="Alle Tiles entfernen"
>
  Alles löschen
</button>
```

**Position**: In der Toolbar zwischen "Laden" und "Speichern"
**Style**: Roter Button (warning color für destructive action)
**Disabled**: Während des Ladens deaktiviert

### Feature 2: Individuelle "X" Buttons

**Backend-Logik** (`hooks/tilemapeditor/useTileThemeState.ts`):

```typescript
const clearSlotVariants = useCallback((category: SlotCategory, type: string) => {
  setTheme(prev => {
    if (!prev) return null;

    const updated = { ...prev };

    if (category === 'floor') {
      updated.floor = { ...updated.floor, default: [] };
    } else if (category === 'wall') {
      updated.wall = { ...updated.wall, [type as WallType]: [] };
    } else if (category === 'door') {
      updated.door = { ...updated.door, [type as DoorType]: [] };
    }

    return updated;
  });
  setIsDirty(true);
}, []);
```

**Eigenschaften**:
- Löscht nur die Varianten des spezifischen Slots
- Andere Slots bleiben unverändert
- Markiert Theme als "dirty"
- Funktioniert für Floor, Wall, und Door Slots

**UI-Komponente** (`components/tilemapeditor/TileSlot.tsx`):

```typescript
{/* Clear button - only show when slot has variants */}
{isFilled && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClear();
    }}
    className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-full flex items-center justify-center shadow-md transition-colors"
    title="Slot leeren"
  >
    ×
  </button>
)}
```

**Eigenschaften**:
- Nur sichtbar wenn Slot Varianten enthält (`isFilled = variants.length > 0`)
- Runder roter Button mit "×" Symbol
- Positioniert oben rechts (`absolute -top-1 -right-1`)
- `e.stopPropagation()` verhindert Slot-Selektion beim Klicken
- Hover-Effect: Helleres Rot
- Shadow für bessere Sichtbarkeit
- Tooltip: "Slot leeren"

## Datenfluss

### "Alles löschen" Button:
```
User clicks button in ThemeToolbar
  ↓
onClearAll prop in TilemapEditorCanvas
  ↓
actions.clearAllVariants (from useTilemapEditorState)
  ↓
themeActions.clearAllVariants (from useTileThemeState)
  ↓
setTheme() updates state
  ↓
UI re-renders, all slots show empty
```

### Individuelles "X" Button:
```
User clicks X on TileSlot
  ↓
onClear prop in TileSlot
  ↓
onClearSlot(category, type) in TileSlotGrid
  ↓
actions.clearSlotVariants (from useTilemapEditorState)
  ↓
themeActions.clearSlotVariants (from useTileThemeState)
  ↓
setTheme() updates state
  ↓
UI re-renders, specific slot shows empty
```

## Betroffene Dateien

### Backend (Hooks):

1. **`hooks/tilemapeditor/useTileThemeState.ts`**
   - Zeilen 21-23: Neue Actions in `TileThemeActions` interface
   - Zeilen 192-205: `clearAllVariants` Funktion
   - Zeilen 207-225: `clearSlotVariants` Funktion
   - Zeilen 257-258: Actions zu Export hinzugefügt

2. **`hooks/useTilemapEditorState.ts`**
   - Zeilen 60-61: Neue Actions in `TilemapEditorActions` interface
   - Zeilen 105-106: Actions durchgereicht

### Frontend (Components):

3. **`components/tilemapeditor/ThemeToolbar.tsx`**
   - Zeile 11: `onClearAll` zu `ThemeToolbarProps` interface
   - Zeile 26: `onClearAll` zu function parameters
   - Zeilen 91-99: "Alles löschen" Button UI

4. **`components/tilemapeditor/TileSlot.tsx`**
   - Zeile 17: `onClear` zu `TileSlotProps` interface
   - Zeile 32: `onClear` zu function parameters
   - Zeilen 161-177: Wrapper div und X Button

5. **`components/tilemapeditor/TileSlotGrid.tsx`**
   - Zeile 16: `onClearSlot` zu `TileSlotGridProps` interface
   - Zeile 27: `onClearSlot` zu function parameters
   - Zeile 84, 106, 129, 152: `onClear` prop zu jedem TileSlot

6. **`components/tilemapeditor/TilemapEditorCanvas.tsx`**
   - Zeile 116: `onClearAll` prop zu ThemeToolbar
   - Zeile 161: `onClearSlot` prop zu TileSlotGrid

### Tests:

7. **`tests/unit/tilemap-deletion-features.test.ts`** (NEU)
   - 18 Unit-Tests für Deletion-Features

## Test-Ergebnisse

### Unit-Tests: ✅ **18 von 18 Tests bestehen**

```bash
npx vitest run tests/unit/tilemap-deletion-features.test.ts
```

**Test-Abdeckung**:

1. **Clear All Variants** (5 Tests):
   - ✅ Clears all floor variants
   - ✅ Clears all wall variants
   - ✅ Clears all door variants
   - ✅ Clears all variants across all categories at once
   - ✅ Preserves theme metadata when clearing

2. **Clear Single Slot Variants** (5 Tests):
   - ✅ Clears only floor variants when specified
   - ✅ Clears only specified wall slot
   - ✅ Clears only specified door slot
   - ✅ Handles clearing empty slots gracefully
   - ✅ Does not affect other categories when clearing a slot

3. **Edge Cases** (3 Tests):
   - ✅ Handles clearing all from already empty theme
   - ✅ Handles clearing a non-existent wall slot
   - ✅ Handles clearing a non-existent door slot

4. **Multiple Operations** (2 Tests):
   - ✅ Supports sequential slot clearing
   - ✅ Supports clear all followed by individual slot clears

5. **Variant Count Verification** (3 Tests):
   - ✅ Reduces variant count to 0 when clearing all
   - ✅ Reduces specific slot variant count to 0
   - ✅ Preserves variant counts in other slots

**Ergebnis**:
```
✓ tests/unit/tilemap-deletion-features.test.ts (18 tests) 9ms
  Test Files  1 passed (1)
       Tests  18 passed (18)
```

## UI/UX Details

### "Alles löschen" Button:
- **Farbe**: Rot (`bg-red-600`, `hover:bg-red-700`)
- **Position**: In Toolbar rechts, zwischen "Laden" und "Speichern"
- **Disabled State**: Grau (`bg-gray-500`), Cursor: `not-allowed`
- **Tooltip**: "Alle Tiles entfernen"
- **Icon**: Keines (nur Text "Alles löschen")

### Individuelle "X" Buttons:
- **Sichtbarkeit**: Nur wenn Slot gefüllt ist (`variants.length > 0`)
- **Farbe**: Rot (`bg-red-600`, `hover:bg-red-700`)
- **Position**: Absolut, oben rechts (`-top-1 -right-1`)
- **Größe**: 5×5 (`w-5 h-5`)
- **Form**: Rund (`rounded-full`)
- **Symbol**: × (multiplication sign)
- **Schrift**: Extra klein (`text-xs`)
- **Shadow**: Medium (`shadow-md`)
- **Tooltip**: "Slot leeren"
- **Transition**: Farbe (`transition-colors`)

### Design-Konsistenz:
- X-Button-Stil ist identisch mit VariantEditor.tsx (Zeilen 174-180)
- Rot als Warnfarbe für destruktive Aktionen (konsistent mit Theme)
- Disabled States haben grauen Hintergrund (Standard-Pattern)

## Verwendung

### "Alles löschen" Button verwenden:
1. Tilemap Editor öffnen (`/tilemapeditor`)
2. Theme laden oder neu erstellen
3. Tiles zu Slots hinzufügen
4. "Alles löschen" Button klicken (in Toolbar)
5. Alle Slots sind jetzt leer
6. Theme als "dirty" markiert (Stern erscheint)

### Individuellen Slot löschen:
1. Tilemap Editor öffnen (`/tilemapeditor`)
2. Theme laden oder neu erstellen
3. Tiles zu Slots hinzufügen
4. "X" Button auf gewünschtem Slot klicken
5. Nur dieser Slot wird geleert
6. Andere Slots bleiben unverändert
7. Theme als "dirty" markiert

### Kombinierte Verwendung:
- "Alles löschen" + dann einzelne Slots neu füllen
- Einzelne Slots löschen + dann "Alles löschen" (überschreibt)
- Mehrere Slots nacheinander löschen

## Technische Details

### State Management:
- `clearAllVariants` und `clearSlotVariants` nutzen `useCallback` für Performance
- `setIsDirty(true)` wird nach jeder Änderung aufgerufen
- State-Updates sind immutable (spread operator)
- Theme-Metadaten bleiben erhalten

### Event Handling:
- X-Button nutzt `e.stopPropagation()` um Slot-Selektion zu verhindern
- Click-Events werden korrekt durch Component-Hierarchie propagiert
- Disabled States verhindern ungewollte Aktionen während Loading

### TypeScript Type Safety:
- `SlotCategory` Type: `'floor' | 'wall' | 'door'`
- `WallType` und `DoorType` für spezifische Slot-Typen
- Props sind vollständig typisiert
- Null-Checks für `theme` State

### Performance:
- Callbacks mit Dependencies für effizientes Re-Rendering
- Nur betroffene Komponenten re-rendern
- Canvas-Updates nur wenn Varianten sich ändern

## Sicherheit / Validierung

### Keine Undo-Funktion:
- ⚠️ **Warnung**: Es gibt KEINE Undo-Funktion
- User muss nach Löschen manuell neu befüllen oder Theme neu laden
- Theme muss gespeichert werden, sonst gehen Änderungen verloren

### Empfehlungen für zukünftige Verbesserungen:
1. **Confirmation Dialog**: "Wirklich alle Tiles löschen?" vor clearAllVariants
2. **Undo/Redo Stack**: History-System für Änderungen
3. **Auto-Save**: Periodisches Speichern von Draft-Themes
4. **Batch Delete**: Mehrere Slots auf einmal auswählen und löschen

## Vorher/Nachher Vergleich

### Vorher ❌:
- Kein "Alles löschen" Button
- Einzelne Slots konnten nur über VariantEditor geleert werden (umständlich)
- Nur über "Neu" Button konnte man Theme komplett zurücksetzen (verliert Name/ID)

### Nachher ✅:
- "Alles löschen" Button in Toolbar (schnell)
- X-Button auf jedem Slot (direkt sichtbar und zugänglich)
- Behält Theme-Metadaten (Name, ID bleiben erhalten)
- Konsistente UX mit roter Warnfarbe für destruktive Aktionen

## Git Commit

```bash
# Empfohlene Commit-Message:
feat: add deletion features to tilemap editor (clear all + individual slots)

- Add "Alles löschen" button to toolbar for clearing all variants at once
- Add "X" button to top-right of each tile slot for individual clearing
- Implement clearAllVariants() function in useTileThemeState hook
- Implement clearSlotVariants(category, type) function in useTileThemeState hook
- Update ThemeToolbar with onClearAll prop and red deletion button
- Update TileSlot with onClear prop and conditional X button overlay
- Update TileSlotGrid to pass onClearSlot handler to all slots
- Wire up actions through TilemapEditorCanvas component
- Add 18 unit tests for deletion features (all passing)
- X button only shows when slot is filled (variants.length > 0)
- e.stopPropagation() prevents slot selection when clicking X
- Red color scheme for destructive actions (consistent with UX)
- Theme marked as dirty after any deletion operation
- Preserves theme metadata (id, name, timestamps)

Features requested by user to improve tilemap editor workflow.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Nächste Schritte

1. ✅ Backend-Logik implementiert (`clearAllVariants`, `clearSlotVariants`)
2. ✅ "Alles löschen" Button in Toolbar hinzugefügt
3. ✅ X-Buttons auf Tile-Slots hinzugefügt
4. ✅ State-Management durchgereicht
5. ✅ Unit-Tests erstellt (18 Tests, alle bestehen)
6. **TODO**: Manuelle Verifikation im Browser
7. **TODO**: Code committen (Commit-Message oben verwenden)
8. **OPTIONAL**: Confirmation Dialog für "Alles löschen"
9. **OPTIONAL**: E2E-Tests für Editor-Workflow

## Fazit

Beide Features wurden erfolgreich implementiert:

1. ✅ **"Alles löschen" Button** - Löscht alle Tiles auf einmal, roter Button in Toolbar
2. ✅ **Individuelle "X" Buttons** - Oben rechts bei jedem gefüllten Slot, nur sichtbar wenn nötig
3. ✅ **18 Unit-Tests** - Vollständige Test-Abdeckung aller Deletion-Szenarien
4. ✅ **Type-Safe** - Vollständige TypeScript-Typisierung
5. ✅ **UX-Konsistent** - Rote Farbe für destruktive Aktionen, Disabled States
6. ✅ **State Management** - Saubere Trennung zwischen UI und Logik
7. ✅ **Performance** - Effiziente Re-Renders mit useCallback

Die Änderungen sind nicht-breaking und verbessern die Benutzerfreundlichkeit des Tilemap-Editors erheblich.
