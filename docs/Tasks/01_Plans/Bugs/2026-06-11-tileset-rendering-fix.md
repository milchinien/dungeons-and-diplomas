# Plan: Rendering-Fix — Wände/Ecken/Türen werden als Boden gerendert

**Datum:** 2026-06-11
**Status:** Phase A umgesetzt & verifiziert (Phase B/C offen)
**Symptome (User-Report):** „Ecken und Türen als Boden, manchmal falsche Wände"

---

## 0. Umsetzung (2026-06-11)

**Empirisch verifiziert vor dem Fix:**
- `Tileset.png` = 640×640; `Tileset_old/Dark/Bright.png` = 1600×832.
- Renderer rechnet `source.x * TILE_SOURCE_SIZE(64)` (feste Rasterung) — `width_tiles` ist nur Metadaten.
- Kachel-Crop-Vergleich beweist: Standard-Seed-Koordinaten treffen im 1600×832-Original Wand/Boden/Tür korrekt; im aktiven 640px-Bild trifft floor(1,1) ein **braunes Tür-Sprite** und door(13,0) liegt **out of bounds** → exakt das Screenshot-Chaos.
- Beide `game.db` (Worktree vs. Haupt-Checkout) haben **unterschiedliche** Themes → bestätigt, dass eine reine Asset-/Seed-Änderung bestehende DBs nicht heilt (Migration nötig).

**Umgesetzt (Phase A):**
1. `Tileset.png` ← Original 1600×832 wiederhergestellt (altes 640px-Bild bleibt via git-Historie + `Tileset-new.png` erhalten).
2. Seed-Dimensionen 20×12 → 25×13 in allen drei Seed-Stellen; Logik dedupliziert in neues `lib/db/defaultTheme.ts` (Single Source of Truth).
3. Versionierte Migration `migrateTileThemeIfNeeded` (`theme_seed_version` in neuer `app_settings`-Tabelle): normalisiert die drei Default-Tilesets und setzt das Default-Theme auf die kanonische Konfiguration → **bestehende DBs heilen automatisch beim Start**, kein manuelles Löschen nötig. Leere/Test-DBs bleiben unangetastet.
4. OOB-Guard in `ThemeRenderer.render()`: Quell-Rect außerhalb des Bildes → Magenta-Platzhalter statt unsichtbar nichts.

**Verifikation:** `tsc --noEmit` grün; Unit-Tests unverändert (59 grün, 22 vorbestehend rot — siehe Phase B); Render-Beweis (kanonische Koordinaten auf wiederhergestelltem Bild) zeigt korrekten Raum: Steinwände, Steinboden (alle Boden-Varianten), Türen in den Wänden, kein Magenta/OOB.

**Offen:** Phase B (WallTypeDetector END-Block U4 + 2 stale Testdateien → die 22 roten Tests), Phase C (echtes Per-Typ-Wand-Autotiling), U5 (Türen open≠closed, TILE.CORNER). Diese haben aktuell **keine** sichtbare Auswirkung, da alle Wandtypen denselben Sprite-Pool nutzen.

---

## 1. Diagnose (verifiziert)

Die Dungeon-**Struktur** (Grid) ist seit dem Fix vom 2026-06-10 korrekt (Property-Tests: versiegelt, alle Räume erreichbar). Die sichtbaren Fehler entstehen ausschließlich in der **Render-Pipeline**. Es sind fünf miteinander verzahnte Ursachen:

### U1 — Tileset.png wurde ausgetauscht, Koordinaten nicht (KRITISCH)

Commit `a1f4d76` (2025-11-23, „feat: tileset editor implemented") ersetzte
`public/Assets/Castle-Dungeon2_Tiles/Tileset.png`:

| | Alt (Original) | Neu (aktuell auf Disk) |
|---|---|---|
| Größe | 1600×832 px | 640×640 px |
| Raster | 64 px (25×13 Tiles) | 32 px (anderes Tileset!) |

Das geseedete Theme (`lib/db/init.ts:289-331`, dupliziert in `lib/db/adapters/sqlite.ts:634-705` und `app/api/tilemapeditor/seed/route.ts:33-86`) verwendet aber weiterhin die **alten 64px-Koordinaten**. Folgen im neuen Bild:

- **Wände** (0,0)-(3,0): treffen verschobene 2×2-Collagen aus 32px-Fragmenten, deren untere Hälfte wie Boden aussieht → „Wände/Ecken als Boden"
- **Boden-Varianten** (1,1)/(2,1) (zusammen ~29 % Gewicht): treffen die Deko-Zeile des neuen Bildes mit **Tür- und Tisch-Sprites** → braune Türen erscheinen mitten auf dem Boden (genau die verstreuten Türen im Screenshot!)
- **Vertikale Türen** (8,0)→Pixel (512,0): graue Fläche → „Türen als Boden"
- **Horizontale Türen** (13,0)→Pixel (832,0): **außerhalb** des 640px-Bildes → `drawImage` zeichnet nichts → schwarze Löcher (unsichtbare, aber solide Türen!)
- Seltene Varianten (3,11), (2,11), (19,8): ebenfalls out of bounds → schwarze Kacheln

`Tileset_old.png`, `Tileset_Dark.png`, `Tileset_Bright.png` sind noch im **alten 1600×832-Format** — alle geseedeten Koordinaten passen dort nachweislich (per Bild-Crop verifiziert).

### U2 — Keine Theme-Migration: bestehende game.db bleibt für immer kaputt

`seedDefaultTheme` bricht ab, sobald **irgendein** Theme existiert (`init.ts:274-280`). Die `data/game.db` im Haupt-Checkout referenziert sogar andere stale Koordinaten (tilesetId 2/Dark) als die Worktree-DB. **Deshalb war nach dem Branch-Wechsel keine Änderung sichtbar: Asset- und Seed-Fixes erreichen bestehende DBs nie.**

### U3 — Theme-Seed füllt alle 16 Wandtypen mit demselben Sprite-Pool

`for (const t of wallTypes) wallConfig[t] = wallVariants` (`init.ts:306-312`): horizontal, vertical, 4 Ecken, 4 T-Stücke, Kreuz, isolated, 4 Enden → **identische** generische Varianten, zufällig gewichtet. Das komplette Autotiling (WallTypeDetector) ist damit datenseitig wirkungslos → „manchmal falsche Wände". Die Koordinaten-Tabelle des Spikes `spikes/2026-02-02-D&D-New-Wall/04-Tile-Koordinaten-Update.md` steht komplett auf „??? TODO" — der Schritt wurde nie abgeschlossen.

### U4 — WallTypeDetector: END-Stück-Klassifikation 90° verdreht

Commit `4301131` drehte die Linear-Erkennung und Fallbacks auf die intuitive Konvention zurück, **vergaß aber den END-Block** (`WallTypeDetector.ts:60-65`): `hasRight → END_TOP` statt `END_LEFT` usw. Ein linkes Ende eines horizontalen Wandzugs bekommt das vertikale Sprite. Die 12/13 fehlschlagenden Tests in `wall-end-piece-detection.test.ts` und 6/27 in `tiletheme-labels.test.ts` dokumentieren genau diese Zone — kodieren aber selbst die ALTE Konvention (waren bei Commit bereits stale).

### U5 — Türen: open == closed, TILE.CORNER ungerendert (latent)

- Seed mappt `*_open` auf dieselben Sprites wie `*_closed` → Tür öffnen ändert visuell nie etwas.
- `TILE.CORNER` (4): kein Branch im RenderMapGenerator (→ schwarz), nicht in `isWallOrDoor`, Collision läuft durch, A* blockiert. Kein Producer existiert (alle Layouts/DBs geprüft: keine 4er) → latent, aber eine Datenbombe via unvalidierter API.

---

## 2. Fix-Plan

### Phase A — Bild & Theme wieder konsistent (behebt das Sichtbare)

1. **Tileset wiederherstellen:** `Tileset_old.png` → `Tileset.png` kopieren (Original 1600×832; konsistent mit Dark/Bright). Das neue 640×640-Bild als `Tileset_32px.png` aufheben (für den Editor-Spike).
2. **Seed korrigieren** (alle DREI Seed-Stellen: `lib/db/init.ts`, `lib/db/adapters/sqlite.ts`, `app/api/tilemapeditor/seed/route.ts`):
   - `width_tiles/height_tiles`: 25×13 (statt 20×12)
   - Tür-Open-Sprites ≠ Closed-Sprites (offene Tür: Boden-Sprite + ggf. Rahmen; im alten Tileset existieren offene Tür-Varianten)
   - Seed-Version einführen (z. B. `theme_seed_version` in einer Settings-Tabelle)
3. **Migration:** Beim DB-Init: wenn `theme_seed_version` < aktuell → Default-Theme (id 1) und Default-Tileset-Zeilen neu schreiben. Damit heilen **bestehende** game.db-Dateien automatisch — kein manuelles DB-Löschen nötig.
4. **Renderer-Guard:** In `ThemeRenderer`/`TileRenderer`: Quell-Rect gegen Bildgröße prüfen → Magenta-Platzhalter statt silently nothing. Macht künftige Asset/Koordinaten-Drift sofort sichtbar.

### Phase B — Code-Konsistenz

5. **WallTypeDetector END-Block** auf intuitive Konvention drehen (`hasRight → END_LEFT`, `hasLeft → END_RIGHT`, `hasBottom → END_TOP`, `hasTop → END_BOTTOM`), irreführende Kommentare entfernen.
6. **Die zwei stalen Testdateien** auf die intuitive Konvention umschreiben (sie sind die Spezifikation der Wand-Semantik — danach müssen alle 81 Unit-Tests grün sein).
7. **TILE.CORNER konsistent machen:** in `isWallOrDoor` aufnehmen, RenderMap-Branch wie WALL, Collision blockieren, Tile-Werte-Whitelist in `validateRoomLayout`. (Alternative: Typ ganz entfernen — invasiver, später.)

### Phase C — Echtes Wand-Autotiling (Verbesserung, optional nach A+B)

8. Per-Typ-Koordinaten im alten Tileset identifizieren (Ecken/T/Kreuz/Enden) und die Spike-Tabelle `04-Tile-Koordinaten-Update.md` ausfüllen → Seed pro Wandtyp distinkt befüllen. Erst dadurch zahlt sich der WallTypeDetector visuell aus.

### Phase D — Verifikation

9. Self-Render im Browser (RenderMap → Canvas, wie in der Analyse) vorher/nachher; prüfen: keine Out-of-bounds-Quellen, Wände visuell distinkt von Boden, keine Tür-Sprites auf Bodenflächen.
10. `npx vitest run tests/unit/` → 81/81 grün.
11. Frische DB **und** bestehende DB (Migrationspfad) testen.
12. Im Haupt-Checkout: nur Branch mergen + Server neu starten — Migration erledigt den Rest (kein `.next`/DB-Löschen durch den User nötig).

---

## 3. Warum gestern „nichts behoben" wirkte

Der Fix vom 2026-06-10 reparierte die **Grid-Struktur** (Wände lösten sich im Datenmodell auf — nachweisbar via ASCII-Dumps/Property-Tests, vorher↔nachher). Das **Rendering** ist ein davon unabhängiger, älterer Bug (Tileset-Tausch im November), der optisch fast dasselbe Chaos erzeugt. Zusätzlich konserviert U2 (fehlende Migration) den kaputten Zustand in jeder existierenden game.db — selbst mit korrektem Code+Asset bleibt das Bild falsch, bis das Theme migriert wird.
