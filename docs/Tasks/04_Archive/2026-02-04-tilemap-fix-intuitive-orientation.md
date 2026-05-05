# Tilemap Editor - Fix auf intuitive Orientierung

**Datum**: 2026-02-04
**Autor**: Claude (Michi)
**Status**: ✅ Behoben

## Problem

Das gesamte Wall-Type-System war kontraintuitiv:
- `WALL_TYPE.HORIZONTAL` wurde für **top-bottom** Wände (↕) verwendet
- `WALL_TYPE.VERTICAL` wurde für **left-right** Wände (↔) verwendet

Das ist das **Gegenteil** von dem, was man erwarten würde!

## Lösung

Komplette Umkehrung auf **INTUITIVE** Logik:

### 1. WallTypeDetector.ts (Zeilen 52-55)

**VORHER** (kontraintuitiv):
```typescript
if (hasLeft && hasRight) return WALL_TYPE.VERTICAL;    // ❌ left-right → VERTICAL
if (hasTop && hasBottom) return WALL_TYPE.HORIZONTAL;  // ❌ top-bottom → HORIZONTAL
```

**NACHHER** (intuitiv):
```typescript
if (hasLeft && hasRight) return WALL_TYPE.HORIZONTAL;    // ✅ left-right → HORIZONTAL
if (hasTop && hasBottom) return WALL_TYPE.VERTICAL;      // ✅ top-bottom → VERTICAL
```

### 2. ThemeValidator.ts Labels

**VORHER**:
```typescript
'wall.horizontal': 'Wall ↕ (top-bottom)',    // ❌ verwirrend!
'wall.vertical': 'Wall ↔ (left-right)',      // ❌ verwirrend!
```

**NACHHER**:
```typescript
'wall.horizontal': 'Wall ↔ (left-right)',    // ✅ intuitiv!
'wall.vertical': 'Wall ↕ (top-bottom)',      // ✅ intuitiv!
```

### 3. ThemeValidator.ts Symbole

**VORHER**:
```typescript
'wall.horizontal': '║',      // ❌ vertikal aussehend für "horizontal"
'wall.vertical': '═══',      // ❌ horizontal aussehend für "vertical"
```

**NACHHER**:
```typescript
'wall.horizontal': '═══',    // ✅ horizontal aussehend für horizontal
'wall.vertical': '║',        // ✅ vertikal aussehend für vertical
```

### 4. Fallbacks korrigiert

**VORHER**:
```typescript
[WALL_TYPE.END_LEFT]: WALL_TYPE.VERTICAL,      // ❌
[WALL_TYPE.END_RIGHT]: WALL_TYPE.VERTICAL,     // ❌
[WALL_TYPE.END_TOP]: WALL_TYPE.HORIZONTAL,     // ❌
[WALL_TYPE.END_BOTTOM]: WALL_TYPE.HORIZONTAL,  // ❌
```

**NACHHER**:
```typescript
[WALL_TYPE.END_LEFT]: WALL_TYPE.HORIZONTAL,    // ✅ left-right end
[WALL_TYPE.END_RIGHT]: WALL_TYPE.HORIZONTAL,   // ✅ left-right end
[WALL_TYPE.END_TOP]: WALL_TYPE.VERTICAL,       // ✅ top-bottom end
[WALL_TYPE.END_BOTTOM]: WALL_TYPE.VERTICAL,    // ✅ top-bottom end
```

### 5. Optional End Pieces entfernt

**Zusätzlich**: END_LEFT, END_RIGHT, END_TOP, END_BOTTOM aus `OPTIONAL_WALL_TYPES` entfernt.
Nur noch `ISOLATED` ist optional.

## Ergebnis

Jetzt ist alles **intuitiv**:

| Wall Typ | Läuft | Tile Symbol | Slot Name |
|----------|-------|-------------|-----------|
| HORIZONTAL | ↔ left-right | `═══` | Wall ↔ (left-right) |
| VERTICAL | ↕ top-bottom | `║` | Wall ↕ (top-bottom) |

## Betroffene Dateien

1. `lib/tiletheme/WallTypeDetector.ts`:
   - Zeilen 52-55: Detection umgekehrt (HORIZONTAL ↔ left-right, VERTICAL ↔ top-bottom)
   - Zeilen 75-81: Fallbacks korrigiert

2. `lib/tiletheme/ThemeValidator.ts`:
   - Zeilen 146-148: Labels korrigiert
   - Zeilen 179-181: Symbole korrigiert

3. `lib/tiletheme/types.ts`:
   - Zeilen 78-84: END_* Pieces aus OPTIONAL_WALL_TYPES entfernt

## Git Commit

```bash
fix: make wall orientation system intuitive (HORIZONTAL=left-right, VERTICAL=top-bottom)

- Reverse wall type detection: HORIZONTAL for left-right walls, VERTICAL for top-bottom
- Update labels: "Wall ↔ (left-right)" for horizontal, "Wall ↕ (top-bottom)" for vertical
- Swap symbols: horizontal='═══', vertical='║'
- Fix fallbacks: END_LEFT/RIGHT→HORIZONTAL, END_TOP/BOTTOM→VERTICAL
- Remove END_* pieces from optional walls (only ISOLATED remains)

The previous "swapped" system was counter-intuitive. Now it matches expectations:
- Horizontal walls run left-right and use horizontal-looking tiles (═══)
- Vertical walls run top-bottom and use vertical-looking tiles (║)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Fazit

✅ System ist jetzt intuitiv und klar
✅ Labels passen zu den Tiles
✅ Symbole passen zu den Orientierungen
✅ Keine verwirrenden END Pieces mehr im UI
