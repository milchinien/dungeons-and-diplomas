# Room Editor Anpassung

**Datum:** 2026-02-04
**Datei:** 05-Room-Editor-Anpassung.md

---

## Übersicht

Der **Room Editor** (`/room-editor`) nutzt das gleiche Tileset wie das Hauptspiel.

**Nach der Tileset-Änderung** sollte der Editor automatisch die neuen Tiles verwenden, **aber** es gibt einige Bereiche, die manuell getestet werden müssen.

---

## Betroffene Komponenten

### 1. LayoutCanvas.tsx
**Pfad:** `components/roomeditor/LayoutCanvas.tsx`

**Funktion:** Haupt-Canvas zum Zeichnen von Räumen

**Was passiert:**
- Lädt Tileset: `/Assets/Castle-Dungeon2_Tiles/Tileset.png`
- Zeichnet Grid mit 32×32 px pro Tile (halbe Größe für Editor)
- Zeigt Wände, Böden, Türen

**Potenzielle Probleme:**
1. **Tileset wird nicht aktualisiert** (Browser-Cache)
2. **Koordinaten zeigen falsche Tiles** (wenn `spriteConfig.ts` falsch)
3. **Rendering-Fehler** bei neuen Wand-Typen

**Test-Plan:**
```typescript
// Manueller Test im Browser
1. Öffne /room-editor
2. Erstelle neuen Raum
3. Zeichne Wände mit "Pen" Tool
4. Prüfe:
   - Werden Wände korrekt dargestellt?
   - Stimmen die Tiles mit dem Tileset überein?
   - Funktionieren Ecken und T-Stücke?
```

**Änderung nötig:** ❌ **NEIN** (automatisch, aber TESTING!)

---

### 2. LayoutPreview.tsx
**Pfad:** `components/roomeditor/LayoutPreview.tsx`

**Funktion:** Kleine SVG-Vorschau eines Raum-Layouts

**Was passiert:**
- Generiert SVG mit vereinfachten Tiles
- Nutzt NICHT das Tileset direkt (nur Farben)

**Änderung nötig:** ❌ **NEIN**

---

### 3. LayoutManager.tsx
**Pfad:** `components/roomeditor/LayoutManager.tsx`

**Funktion:** Raum-Browser und CRUD-Controls

**Was passiert:**
- Zeigt Liste aller Räume
- Nutzt `LayoutPreview` für Thumbnails

**Änderung nötig:** ❌ **NEIN**

---

### 4. ThemePreview.tsx (Tilemap Editor)
**Pfad:** `components/tilemapeditor/ThemePreview.tsx`

**Funktion:** Preview für Tile-Themes

**Was passiert:**
- Zeichnet Test-Dungeon mit Theme
- Nutzt `TileRenderer` automatisch

**Änderung nötig:** ❌ **NEIN** (automatisch, aber TESTING!)

---

## Test-Strategie: Room Editor

### Test 1: Canvas-Rendering
**Ziel:** Prüfen ob neue Tiles im Editor angezeigt werden

**Schritte:**
1. Öffne `/room-editor`
2. Erstelle neuen Raum (5×5)
3. Wähle "Pen" Tool → "Wall"
4. Zeichne folgende Strukturen:
   - Gerade Wand (horizontal)
   - Gerade Wand (vertikal)
   - L-Form (2 Ecken)
   - T-Stück
   - Kreuzung

**Erwartetes Ergebnis:**
- ✅ Alle Wand-Typen werden korrekt angezeigt
- ✅ Autotiling funktioniert (Ecken/T-Stücke automatisch)
- ✅ Keine schwarzen Quadrate (= falsche Koordinaten)

**Bei Fehler:**
- Koordinaten in `spriteConfig.ts` prüfen
- Browser-Cache leeren (Ctrl+Shift+R)
- Tileset-Datei überprüfen

---

### Test 2: Türen im Editor
**Ziel:** Prüfen ob Türen korrekt dargestellt werden

**Schritte:**
1. Im Room Editor: Wähle "Door" Tool
2. Platziere Tür an Rand (oben/unten/links/rechts)
3. Prüfe visuelle Darstellung

**Erwartetes Ergebnis:**
- ✅ Horizontale Türen korrekt (links-rechts)
- ✅ Vertikale Türen korrekt (oben-unten)
- ✅ Türen haben richtige Grafik aus Tileset

**Bei Fehler:**
- `DOOR_*` Koordinaten in `spriteConfig.ts` prüfen

---

### Test 3: Existierende Räume
**Ziel:** Prüfen ob bereits erstellte Räume korrekt geladen werden

**Schritte:**
1. Öffne `/room-editor`
2. Lade einen existierenden Raum (z.B. "Small Corridor")
3. Prüfe visuelle Darstellung

**Erwartetes Ergebnis:**
- ✅ Raum wird korrekt angezeigt
- ✅ Wände an den richtigen Stellen
- ✅ Autotiling funktioniert

**Bei Fehler:**
- Raum-Daten inkonsistent?
- Tileset-Cache-Problem?

---

### Test 4: Tilemap Editor (Theme-System)
**Ziel:** Prüfen ob Theme-Preview funktioniert

**Schritte:**
1. Öffne `/tilemap-editor` (falls vorhanden)
2. Wähle ein Theme
3. Prüfe Preview

**Erwartetes Ergebnis:**
- ✅ Preview zeigt neues Tileset
- ✅ Alle Wand-Typen korrekt

**Bei Fehler:**
- Theme-Daten überprüfen
- `TileRenderer` Logik prüfen

---

## Bekannte Probleme & Lösungen

### Problem 1: Editor zeigt alte Tiles
**Ursache:** Browser-Cache

**Lösung:**
```bash
# Hard Reload im Browser
Ctrl + Shift + R

# Oder: Inkognito-Fenster
Ctrl + Shift + N

# Oder: Cache manuell leeren
Dev Tools → Network → "Disable cache" aktivieren
```

---

### Problem 2: Schwarze Quadrate im Editor
**Ursache:** Koordinaten zeigen auf leere Bereiche

**Lösung:**
1. Öffne `lib/spriteConfig.ts`
2. Prüfe `TILESET_COORDS` Einträge
3. Vergleiche mit Tileset visuell
4. Korrigiere falsche Koordinaten

**Beispiel:**
```typescript
// FALSCH: Zeigt auf leeren Bereich
CORNER_TL: { x: 99, y: 99 },  // ❌ Tileset hat nur 16×16

// RICHTIG: Zeigt auf korrektes Tile
CORNER_TL: { x: 3, y: 2 },    // ✅ Korrekte Position
```

---

### Problem 3: Autotiling funktioniert nicht
**Ursache:** Wand-Typen sind falsch zugeordnet

**Lösung:**
1. Prüfe `lib/tiletheme/WallTypeDetector.ts`
2. Siehe Dokument `06-Wand-Bug-Fix.md`
3. Stelle sicher dass HORIZONTAL/VERTICAL korrekt sind

---

### Problem 4: Editor lädt Tileset nicht
**Ursache:** Pfad-Problem oder Datei fehlt

**Lösung:**
```bash
# Prüfe ob Tileset existiert
ls -lh public/Assets/Castle-Dungeon2_Tiles/Tileset.png

# Prüfe Dateigröße (sollte >0 sein)
# Erwartete Größe: ~50-200 KB

# Falls Datei fehlt oder 0 Bytes:
cp Tileset_new.png Tileset.png
```

---

## Canvas-Rendering Details

### Wie der Editor das Tileset nutzt

**Code-Struktur (vereinfacht):**
```typescript
// components/roomeditor/LayoutCanvas.tsx

const tileset = new Image();
tileset.src = '/Assets/Castle-Dungeon2_Tiles/Tileset.png';

function drawTile(x, y, tileType) {
  // Hole Koordinaten aus spriteConfig
  const coords = TILESET_COORDS[tileType];

  // Zeichne Tile auf Canvas
  ctx.drawImage(
    tileset,
    coords.x * TILE_SOURCE_SIZE,      // Source X (im Tileset)
    coords.y * TILE_SOURCE_SIZE,      // Source Y (im Tileset)
    TILE_SOURCE_SIZE,                 // Source Width (64px)
    TILE_SOURCE_SIZE,                 // Source Height (64px)
    x * EDITOR_TILE_SIZE,             // Target X (im Editor)
    y * EDITOR_TILE_SIZE,             // Target Y (im Editor)
    EDITOR_TILE_SIZE,                 // Target Width (32px für Editor)
    EDITOR_TILE_SIZE                  // Target Height (32px für Editor)
  );
}
```

**Wichtig:**
- `TILE_SOURCE_SIZE = 64` (Größe im Tileset)
- `EDITOR_TILE_SIZE = 32` (Größe im Editor, halbiert für Übersicht)

---

## Checkliste: Room Editor Tests

Nach der Tileset-Änderung:

- [ ] Editor öffnet ohne Fehler (`/room-editor`)
- [ ] Tileset wird geladen (keine Fehler in Console)
- [ ] Neue Räume können erstellt werden
- [ ] Wände zeichnen funktioniert (Pen Tool)
- [ ] Autotiling funktioniert (Ecken/T-Stücke)
- [ ] Türen können platziert werden (Door Tool)
- [ ] Türen haben korrekte Grafik
- [ ] Existierende Räume laden korrekt
- [ ] Keine schwarzen Quadrate
- [ ] Keine visuellen Artefakte
- [ ] Raum speichern funktioniert
- [ ] Raum löschen funktioniert
- [ ] Preview-Thumbnails korrekt

---

## Screenshot-Vergleich

**Vor der Änderung:**
```
Erstelle Screenshot: screenshot_editor_before.png
```

**Nach der Änderung:**
```
Erstelle Screenshot: screenshot_editor_after.png
```

**Vergleiche:**
- Sind neue Wände sichtbar?
- Haben Wände mehr Details/Tiefe?
- Sind Türen detaillierter?

---

## Nächste Schritte

1. ✅ Tileset austauschen
2. ✅ `spriteConfig.ts` updaten
3. ✅ Browser-Cache leeren
4. ✅ Room Editor öffnen (`/room-editor`)
5. ✅ Test 1-4 durchführen
6. ✅ Checkliste abhaken
7. ✅ Screenshots erstellen (vor/nach)

**Danach:** Weiter mit Dokument `06-Wand-Bug-Fix.md`

