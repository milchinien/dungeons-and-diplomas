# Tileset Umstellung - Projektübersicht

**Datum:** 2026-02-04
**Spike:** 2026-02-02-D&D-New-Wall
**Status:** Planung

---

## Zielsetzung

Das aktuelle Tileset (`Tileset.png`) soll mit Wänden und Türen aus dem alten Tileset (`Tileset_old.png`) kombiniert werden, um ein verbessertes visuelles Ergebnis mit mehr Tiefe und Detail zu erreichen.

### Was soll übernommen werden?

Aus **Tileset_old.png**:
- **Wände von oben**: Vollständige Blöcke mit sichtbarer Tiefe (von oben betrachtet)
- **Dünne Seitenwände**: Seitliche Perspektive der Wände
- **Türen**: Alle Türvarianten (horizontal/vertikal, offen/geschlossen)

Aus **Tileset.png** behalten:
- **Boden-Tiles**: Alle Floor-Varianten bleiben unverändert
- **Dekorative Elemente**: Fässer, Kisten, etc.

---

## Probleme die gelöst werden müssen

### 1. Visuelles Problem
Das aktuelle Tileset hat flache, wenig detaillierte Wände. Das alte Tileset hat:
- Bessere Tiefenwirkung
- Klarere Kantendarstellung
- Detailliertere Türen

### 2. Technisches Problem: Verbuggte Wand-Generierung
Es gibt bekannte Bugs in der Wand-Generierung:
- Doppelte Wände an manchen Stellen
- Fehlende Wände an anderen Stellen
- Falsche Wand-Typen (Horizontal/Vertikal vertauscht)

Siehe:
- `lib/tiletheme/WallTypeDetector.ts` (Zeilen 53-65: Bug-Fix Kommentare)
- Tests: `tests/e2e/dungeon-double-walls.spec.ts`, `tests/dungeon-double-walls.test.ts`

---

## Vorgehensweise (High-Level)

### Phase 1: Tileset-Anpassung
1. Analyse der beiden Tilesets (Pixelkoordinaten identifizieren)
2. Neues kombiniertes Tileset erstellen
3. Backup des aktuellen Tilesets erstellen

### Phase 2: Code-Anpassungen
1. Tile-Koordinaten in `lib/spriteConfig.ts` aktualisieren
2. Rendering-Logik in `lib/rendering/TileRenderer.ts` prüfen
3. Room Editor Koordinaten anpassen

### Phase 3: Wand-Bug Fixes
1. `lib/tiletheme/WallTypeDetector.ts` durchgehen
2. Doppel-Wand Problem in Dungeon-Generierung fixen
3. Autotiling-Logik validieren

### Phase 4: Testing
1. Visuelle Tests mit Playwright
2. Unit-Tests für Wand-Typen
3. Manuelle Überprüfung im Room Editor

---

## Betroffene Dateien (Übersicht)

### Tileset-Dateien
- `public/Assets/Castle-Dungeon2_Tiles/Tileset.png` (wird modifiziert)
- `public/Assets/Castle-Dungeon2_Tiles/Tileset_old.png` (Quelle für neue Wände)

### Sprite-Konfiguration
- `lib/spriteConfig.ts` - TILESET_COORDS (Zeilen 89-135)
- `lib/constants.ts` - WALL_VARIANTS, FLOOR_VARIANTS (Re-Export)

### Rendering
- `lib/rendering/TileRenderer.ts` - Haupt-Rendering Logik
- `lib/rendering/GameRenderer.ts` - Game-Loop Rendering
- `lib/rendering/MinimapRenderer.ts` - Minimap (nutzt Wand-Typen)

### Wand-Erkennung & Autotiling
- `lib/tiletheme/WallTypeDetector.ts` - **KRITISCH: Bug-Fixes hier**
- `lib/tiletheme/types.ts` - WallType, DoorType Definitionen
- `lib/tiletheme/RenderMapGenerator.ts` - Generiert Render-Map
- `lib/tiletheme/ThemeValidator.ts` - Validiert Theme-Vollständigkeit

### Dungeon-Generierung
- `lib/dungeon/generation.ts` - BSP-basierte Generierung
- `lib/dungeon/layoutGeneration.ts` - Layout-basierte Generierung
- `lib/dungeon/BSPNode.ts` - Room-Erstellung

### Room Editor
- `components/roomeditor/LayoutCanvas.tsx` - Canvas mit Tileset
- `components/roomeditor/LayoutPreview.tsx` - Preview-Rendering
- `components/tilemapeditor/ThemePreview.tsx` - Theme-Preview

### Tests (müssen nach Änderungen aktualisiert werden)
- `tests/e2e/dungeon-walls-visual-check.spec.ts`
- `tests/e2e/dungeon-double-walls.spec.ts`
- `tests/e2e/dungeon-visual-walls.spec.ts`
- `tests/dungeon-double-walls.test.ts`

---

## Reihenfolge der Umsetzung

Die Dateien sind in **separaten Markdown-Dokumenten** aufgeteilt:

1. **01-Tileset-Analyse.md** - Detaillierte Analyse beider Tilesets
2. **02-Tileset-Erstellung.md** - Schritt-für-Schritt Anleitung
3. **03-Code-Mapping.md** - Alle Code-Stellen mit Zeilen-Nummern
4. **04-Tile-Koordinaten-Update.md** - Konkrete Koordinaten-Änderungen
5. **05-Room-Editor-Anpassung.md** - Editor-spezifische Änderungen
6. **06-Wand-Bug-Fix.md** - Behebung der Wand-Bugs
7. **07-Testing-Strategie.md** - Test-Plan
8. **08-Checkliste.md** - Finale Checkliste

---

## Wichtige Hinweise

### ⚠️ Backup-Strategie
- **VOR jeder Änderung** Backup erstellen
- Spike-Ordner nutzen für Experimente
- Git-Commits nach jedem abgeschlossenen Schritt

### ⚠️ Kein Code schreiben - nur Planung!
Dieser Spike enthält **NUR Planungsdokumente**.
Code wird erst geschrieben, wenn alle Pläne durchgelesen und verstanden wurden.

### ⚠️ Kritische Review-Punkte
Vor der Implementierung müssen folgende Punkte geklärt sein:
1. Sind alle Wand-Koordinaten korrekt identifiziert?
2. Sind alle betroffenen Code-Stellen erfasst?
3. Ist die Wand-Bug-Behebung vollständig geplant?
4. Sind die Tests aktualisiert?

---

## Nächste Schritte

1. **Alle Dokumente lesen** (01-08)
2. **Fragen klären** falls etwas unklar ist
3. **Review-Meeting** mit Tobias
4. **Implementierung starten** (erst nach Freigabe!)

---

**Erstellt von:** Claude Sonnet 4.5
**Für:** Michi (Junior Dev)
