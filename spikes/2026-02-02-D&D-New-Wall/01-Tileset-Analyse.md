# Tileset-Analyse: Alt vs. Neu

**Datum:** 2026-02-04
**Datei:** 01-Tileset-Analyse.md

---

## Übersicht der beiden Tilesets

### Tileset.png (Aktuell)
**Pfad:** `public/Assets/Castle-Dungeon2_Tiles/Tileset.png`

**Eigenschaften:**
- Tile-Größe: 64×64 Pixel
- Grid-Layout: Sauberes Raster
- Farben: Grautöne, wenig Kontrast
- Wände: Flach, minimale Tiefe
- Boden: Verschiedene Varianten (gut!)
- Dekorative Objekte: Türen, Fässer, Kisten (oben im Tileset)

**Was ist gut:**
- ✅ Sauberes Grid
- ✅ Gute Boden-Varianten
- ✅ Dekorative Elemente

**Was fehlt:**
- ❌ Wände haben keine Tiefe
- ❌ Wenig visuelle Variation bei Wänden
- ❌ Türen sind zu einfach dargestellt

---

### Tileset_old.png (Quelle für Wände)
**Pfad:** `public/Assets/Castle-Dungeon2_Tiles/Tileset_old.png`

**Eigenschaften:**
- Tile-Größe: 64×64 Pixel (kompatibel!)
- Layout: Umfangreiches Tileset mit vielen Varianten
- Wände: **Mehrere Perspektiven**
  - Von oben (vollständige Blöcke mit Tiefe)
  - Von der Seite (dünne Wände)
  - Verschiedene Ecken und Verbindungen
- Türen: Detaillierte Varianten (horizontal/vertikal)

**Was wir brauchen:**
- ✅ Vollständige Wand-Blöcke (von oben)
- ✅ Dünne Seitenwände
- ✅ Alle Tür-Varianten
- ✅ Ecken und T-Stücke

---

## Tile-Koordinaten im Tileset_old.png

### Wichtige Wand-Bereiche (zu identifizieren)

#### Obere linke Ecke (0, 0 bis ~5, 5)
- **Dünne Wände** (Seitenperspektive)
- Verschiedene Verbindungen und Ecken
- **WICHTIG:** Hier sind vermutlich die autotiling Wände

#### Mittlerer Bereich
- Vollständige Blöcke
- Türen (horizontal und vertikal)
- Boden-Tiles

#### Rechter Bereich
- Weitere Varianten
- Spezielle Tiles

### Türen im Tileset_old.png
Es gibt mindestens 4 Tür-Typen:
1. **Horizontal Closed** (Tür geht links-rechts, geschlossen)
2. **Horizontal Open** (Tür geht links-rechts, offen)
3. **Vertical Closed** (Tür geht oben-unten, geschlossen)
4. **Vertical Open** (Tür geht oben-unten, offen)

**Aufgabe:** Pixelgenaue Koordinaten identifizieren!

---

## Autotiling-System

Das Spiel nutzt ein **Autotiling-System** mit folgenden Wand-Typen:

### Lineare Wände
- `HORIZONTAL` - Wand verläuft horizontal (═══)
- `VERTICAL` - Wand verläuft vertikal (║)

### Ecken (90°-Winkel)
- `CORNER_TL` - Ecke oben-links (╔)
- `CORNER_TR` - Ecke oben-rechts (╗)
- `CORNER_BL` - Ecke unten-links (╚)
- `CORNER_BR` - Ecke unten-rechts (╝)

### T-Stücke (3 Verbindungen)
- `T_UP` - T-Stück öffnet nach oben (╩)
- `T_DOWN` - T-Stück öffnet nach unten (╦)
- `T_LEFT` - T-Stück öffnet nach links (╣)
- `T_RIGHT` - T-Stück öffnet nach rechts (╠)

### Kreuz (4 Verbindungen)
- `CROSS` - Kreuzung (╬)

### Spezialfälle (optional)
- `ISOLATED` - Alleinstehende Wand (▢)
- `END_LEFT` - Ende links (═)
- `END_RIGHT` - Ende rechts (═)
- `END_TOP` - Ende oben (║)
- `END_BOTTOM` - Ende unten (║)

**Quelle:** `lib/tiletheme/types.ts` (Zeilen 33-59)

---

## Mapping-Aufgabe

Für **JEDEN** Wand-Typ müssen wir die Koordinaten im `Tileset_old.png` finden:

| Wand-Typ | Aktuell (x,y) | Neu (x,y) | Status |
|----------|---------------|-----------|--------|
| HORIZONTAL | (0, 0) | ??? | ❌ TODO |
| VERTICAL | (0, 0) | ??? | ❌ TODO |
| CORNER_TL | (0, 0) | ??? | ❌ TODO |
| CORNER_TR | (0, 0) | ??? | ❌ TODO |
| CORNER_BL | (0, 0) | ??? | ❌ TODO |
| CORNER_BR | (0, 0) | ??? | ❌ TODO |
| T_UP | (0, 0) | ??? | ❌ TODO |
| T_DOWN | (0, 0) | ??? | ❌ TODO |
| T_LEFT | (0, 0) | ??? | ❌ TODO |
| T_RIGHT | (0, 0) | ??? | ❌ TODO |
| CROSS | (0, 0) | ??? | ❌ TODO |
| ISOLATED | (0, 0) | ??? | ❌ TODO |
| END_LEFT | (0, 0) | ??? | ❌ TODO |
| END_RIGHT | (0, 0) | ??? | ❌ TODO |
| END_TOP | (0, 0) | ??? | ❌ TODO |
| END_BOTTOM | (0, 0) | ??? | ❌ TODO |

### Türen

| Tür-Typ | Aktuell (x,y) | Neu (x,y) | Status |
|---------|---------------|-----------|--------|
| HORIZONTAL_CLOSED | (1, 0) | ??? | ❌ TODO |
| HORIZONTAL_OPEN | (1, 1) | ??? | ❌ TODO |
| VERTICAL_CLOSED | (0, 0) | ??? | ❌ TODO |
| VERTICAL_OPEN | (0, 1) | ??? | ❌ TODO |

---

## Nächste Schritte

1. **Bildbearbeitungs-Software öffnen** (GIMP, Photoshop, etc.)
2. **Tileset_old.png öffnen**
3. **64×64 Grid overlay aktivieren**
4. **Jeden Wand-Typ identifizieren**
5. **Koordinaten notieren** (0-basiert, von oben-links)
6. **Tabelle in Dokument 04 ausfüllen**

---

## Wichtige Hinweise

### Koordinaten-System
```
(0,0)  (1,0)  (2,0)  ...
(0,1)  (1,1)  (2,1)  ...
(0,2)  (1,2)  (2,2)  ...
...
```
- **x**: Spalte (von links nach rechts)
- **y**: Reihe (von oben nach unten)
- Tile-Größe: 64×64 Pixel
- **Pixel-Koordinate:** `(x * 64, y * 64)`

### Fallbacks
Falls ein Wand-Typ im alten Tileset nicht gefunden wird:
- `ISOLATED` → fällt zurück auf `VERTICAL`
- `END_*` → fällt zurück auf `HORIZONTAL` oder `VERTICAL`

Siehe: `lib/tiletheme/WallTypeDetector.ts` (Zeilen 75-81)

---

**Nächstes Dokument:** `02-Tileset-Erstellung.md`
