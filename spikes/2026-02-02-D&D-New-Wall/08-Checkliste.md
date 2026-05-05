# Finale Checkliste: Tileset-Umstellung

**Datum:** 2026-02-04
**Datei:** 08-Checkliste.md
**Spike:** 2026-02-02-D&D-New-Wall

---

## Verwendung

Diese Checkliste führt dich **Schritt für Schritt** durch die gesamte Tileset-Umstellung.

**Ablauf:**
1. Lese alle Dokumente (00-07) **VOR** dem Start
2. Arbeite diese Checkliste von oben nach unten ab
3. Hake jeden Punkt ab (✅) wenn erledigt
4. Notiere Probleme im Abschnitt "Probleme & Lösungen"

---

## Phase 1: Vorbereitung

### 1.1 Dokumentation gelesen
- [ ] `00-Überblick.md` gelesen und verstanden
- [ ] `01-Tileset-Analyse.md` gelesen
- [ ] `02-Tileset-Erstellung.md` gelesen
- [ ] `03-Code-Mapping.md` gelesen
- [ ] `04-Tile-Koordinaten-Update.md` gelesen
- [ ] `05-Room-Editor-Anpassung.md` gelesen
- [ ] `06-Wand-Bug-Fix.md` gelesen
- [ ] `07-Testing-Strategie.md` gelesen

**Notizen:**
```
Fragen/Unklarheiten:
-
-
```

---

### 1.2 Backups erstellt
- [ ] Tileset-Backup: `Tileset_backup_2026-02-04.png` erstellt
- [ ] Git-Branch erstellt: `feature/tileset-wall-update`
- [ ] Git-Commit (Initial): "chore: backup before tileset update"

**Git-Commands:**
```bash
cd c:/src/dungeons-and-diplomas
git checkout -b feature/tileset-wall-update
cp public/Assets/Castle-Dungeon2_Tiles/Tileset.png public/Assets/Castle-Dungeon2_Tiles/Tileset_backup_2026-02-04.png
git add .
git commit -m "chore: backup before tileset update"
```

---

### 1.3 Werkzeuge bereit
- [ ] GIMP installiert und getestet
- [ ] Tilesets verfügbar:
  - [ ] `Tileset.png` (aktuell)
  - [ ] `Tileset_old.png` (Quelle)
- [ ] Code-Editor offen (VS Code)
- [ ] Browser offen (Chrome/Firefox)
- [ ] Dev-Tools bereit (F12)

---

## Phase 2: Tileset-Analyse

### 2.1 GIMP Setup
- [ ] `Tileset_old.png` in GIMP geöffnet
- [ ] Grid aktiviert (64×64 px)
- [ ] Grid gut sichtbar (rote/gelbe Farbe)

---

### 2.2 Koordinaten identifizieren

**Pflicht-Wand-Typen:** (11 Stück)
- [ ] HORIZONTAL gefunden → Koordinaten: `(____, ____)`
- [ ] VERTICAL gefunden → Koordinaten: `(____, ____)`
- [ ] CORNER_TL gefunden → Koordinaten: `(____, ____)`
- [ ] CORNER_TR gefunden → Koordinaten: `(____, ____)`
- [ ] CORNER_BL gefunden → Koordinaten: `(____, ____)`
- [ ] CORNER_BR gefunden → Koordinaten: `(____, ____)`
- [ ] T_UP gefunden → Koordinaten: `(____, ____)`
- [ ] T_DOWN gefunden → Koordinaten: `(____, ____)`
- [ ] T_LEFT gefunden → Koordinaten: `(____, ____)`
- [ ] T_RIGHT gefunden → Koordinaten: `(____, ____)`
- [ ] CROSS gefunden → Koordinaten: `(____, ____)`

**Pflicht-Tür-Typen:** (4 Stück)
- [ ] HORIZONTAL_CLOSED gefunden → Koordinaten: `(____, ____)`
- [ ] HORIZONTAL_OPEN gefunden → Koordinaten: `(____, ____)`
- [ ] VERTICAL_CLOSED gefunden → Koordinaten: `(____, ____)`
- [ ] VERTICAL_OPEN gefunden → Koordinaten: `(____, ____)`

**Optional-Wand-Typen:** (5 Stück - falls vorhanden)
- [ ] ISOLATED gefunden → Koordinaten: `(____, ____)` oder ⚠️ Fallback nutzen
- [ ] END_LEFT gefunden → Koordinaten: `(____, ____)` oder ⚠️ Fallback nutzen
- [ ] END_RIGHT gefunden → Koordinaten: `(____, ____)` oder ⚠️ Fallback nutzen
- [ ] END_TOP gefunden → Koordinaten: `(____, ____)` oder ⚠️ Fallback nutzen
- [ ] END_BOTTOM gefunden → Koordinaten: `(____, ____)` oder ⚠️ Fallback nutzen

**Validierung:**
- [ ] Keine Duplikate (zwei Typen mit gleichen Koordinaten)
- [ ] Alle Koordinaten in Dokument `04-Tile-Koordinaten-Update.md` eingetragen
- [ ] Visuell im Tileset überprüft (richtige Tiles?)

---

## Phase 3: Tileset erstellen

### 3.1 Tiles kopieren
- [ ] `Tileset.png` als `Tileset_work.png` kopiert
- [ ] `Tileset_old.png` und `Tileset_work.png` in GIMP geöffnet
- [ ] Alle Wand-Tiles kopiert (11-16 Stück)
- [ ] Alle Tür-Tiles kopiert (4 Stück)

**Kopierte Tiles:** (Strichliste)
```
Wände: ____ / 11 (Pflicht) + ____ / 5 (Optional)
Türen: ____ / 4
```

---

### 3.2 Qualitätskontrolle
- [ ] Visuelle Inspektion (keine Artefakte)
- [ ] Grid-Alignment geprüft (alle Tiles 64×64)
- [ ] Keine Überlappungen
- [ ] Keine Lücken
- [ ] Transparenz korrekt (falls benötigt)

---

### 3.3 Export
- [ ] Als `Tileset_new.png` exportiert
- [ ] Kompression: 9 (max)
- [ ] Dateigröße geprüft (< 1 MB)
- [ ] Alpha-Kanal aktiviert (falls Transparenz)

**Dateigröße:** `______ KB`

---

## Phase 4: Code-Änderungen

### 4.1 Tileset aktivieren
- [ ] Backup: `Tileset.png` → `Tileset_before_wall_update.png`
- [ ] `Tileset_new.png` → `Tileset.png` kopiert
- [ ] Datei-Existenz geprüft: `ls public/Assets/Castle-Dungeon2_Tiles/Tileset.png`

---

### 4.2 spriteConfig.ts updaten
- [ ] Datei geöffnet: `lib/spriteConfig.ts`
- [ ] Zeilen 89-135: `TILESET_COORDS` gefunden
- [ ] **Alle Wand-Koordinaten aktualisiert:**
  - [ ] WALL_TOP (HORIZONTAL)
  - [ ] WALL_BOTTOM (HORIZONTAL)
  - [ ] WALL_LEFT (VERTICAL)
  - [ ] WALL_RIGHT (VERTICAL)
  - [ ] WALL_HORIZONTAL
  - [ ] WALL_VERTICAL
  - [ ] CORNER_TL
  - [ ] CORNER_TR
  - [ ] CORNER_BL
  - [ ] CORNER_BR
  - [ ] T_UP
  - [ ] T_DOWN
  - [ ] T_LEFT
  - [ ] T_RIGHT
  - [ ] CROSS
- [ ] **Alle Tür-Koordinaten aktualisiert:**
  - [ ] DOOR_HORIZONTAL_CLOSED
  - [ ] DOOR_HORIZONTAL_OPEN
  - [ ] DOOR_VERTICAL_CLOSED
  - [ ] DOOR_VERTICAL_OPEN
- [ ] **Optional: Spezial-Wand-Koordinaten** (falls gefunden)
- [ ] Datei gespeichert

**Git-Commit:**
```bash
git add lib/spriteConfig.ts public/Assets/Castle-Dungeon2_Tiles/Tileset.png
git commit -m "feat: update tileset with new walls and doors from Tileset_old.png"
```

---

### 4.3 Erste Überprüfung
- [ ] `npm run dev` gestartet
- [ ] Browser geöffnet: `http://localhost:3000`
- [ ] Hard Reload: `Ctrl + Shift + R`
- [ ] Dungeon generiert
- [ ] **Visuell geprüft:**
  - [ ] Wände werden angezeigt (keine schwarzen Quadrate)
  - [ ] Türen werden angezeigt
  - [ ] Wände haben Details/Tiefe (neue Grafik sichtbar)

**Bei schwarzen Quadraten:**
→ Koordinaten in `spriteConfig.ts` nochmal prüfen!

---

## Phase 5: Wand-Bug Fix (optional)

**⚠️ NUR ausführen wenn Bugs gefunden wurden!**

### 5.1 Bug-Validierung
- [ ] Doppel-Wände visuell identifiziert
  - Screenshot: `bug-double-walls.png`
  - Position: `(x: ____, y: ____)`
- [ ] Fehlende Wände identifiziert
  - Screenshot: `bug-missing-walls.png`
  - Position: `(x: ____, y: ____)`

---

### 5.2 Bug-Fix (siehe Dokument 06)
- [ ] `lib/tiletheme/WallTypeDetector.ts` geprüft
  - [ ] Zeilen 53-56: HORIZONTAL/VERTICAL swap korrekt?
  - [ ] Zeilen 60-65: END_* swap korrekt?
- [ ] `lib/dungeon/generation.ts` geprüft
  - [ ] Doppel-Wände deduplizieren?
- [ ] `lib/dungeon/BSPNode.ts` geprüft
  - [ ] Wand-Generierung refactorn?

**Code-Änderungen:**
- [ ] Fix implementiert
- [ ] Tests aktualisiert

**Git-Commit:**
```bash
git add .
git commit -m "fix: resolve double walls and missing walls in dungeon generation"
```

---

## Phase 6: Testing

### 6.1 Unit-Tests
- [ ] `npm run test` ausgeführt
- [ ] Alle Tests: ✅ PASS

**Bei Fehlern:**
```
Test-Fehler:
- Test: ____________________
- Fehler: ____________________
- Lösung: ____________________
```

---

### 6.2 E2E-Tests
- [ ] `npm run test:e2e` ausgeführt
- [ ] Alle Tests: ✅ PASS

**Screenshot-Updates:**
- [ ] Neue Baselines erstellt: `npm run test:e2e -- --update-snapshots`

---

### 6.3 Manuelle Tests: Hauptspiel
- [ ] **20 Dungeons generiert** (Page Refresh)

**Checkliste pro Dungeon:** (Stichproben)
- [ ] Dungeon 1: Wände ✅ / Türen ✅ / Autotiling ✅
- [ ] Dungeon 5: Wände ✅ / Türen ✅ / Autotiling ✅
- [ ] Dungeon 10: Wände ✅ / Türen ✅ / Autotiling ✅
- [ ] Dungeon 15: Wände ✅ / Türen ✅ / Autotiling ✅
- [ ] Dungeon 20: Wände ✅ / Türen ✅ / Autotiling ✅

**Probleme gefunden:**
```
- Dungeon ____: Problem: ____________________
- Dungeon ____: Problem: ____________________
```

---

### 6.4 Manuelle Tests: Room Editor
- [ ] `/room-editor` geöffnet
- [ ] Neuen Raum erstellt (8×8)
- [ ] Wände gezeichnet (Pen Tool)
- [ ] Türen platziert (Door Tool)
- [ ] Autotiling funktioniert (Ecken/T-Stücke automatisch)
- [ ] Existierenden Raum geladen ("Small Corridor")
- [ ] Screenshots erstellt:
  - [ ] `editor-new-room.png`
  - [ ] `editor-doors.png`
  - [ ] `editor-autotiling.png`

---

### 6.5 Performance-Test
- [ ] Browser Dev-Tools geöffnet (F12)
- [ ] Performance-Tab → Recording gestartet
- [ ] Dungeon generiert
- [ ] Recording gestoppt

**Ergebnisse:**
- FPS: ______
- Generierung-Zeit: ______ ms
- Rendering-Bottlenecks: ____________________

**Vergleich mit vorher:**
- Differenz: < 10% → ✅ OK
- Differenz: > 10% → ⚠️ Optimierung nötig

---

### 6.6 Regression-Tests
**Bestehende Features prüfen:**
- [ ] Dungeon-Generierung (BSP) funktioniert
- [ ] Räume verbunden (keine isolierten Räume)
- [ ] Spieler-Bewegung funktioniert
- [ ] Enemy-Spawning funktioniert
- [ ] Combat-System funktioniert
- [ ] Fog of War funktioniert
- [ ] Minimap zeigt korrekt
- [ ] Shop-Räume werden generiert
- [ ] Shrine-Räume werden generiert
- [ ] Room-Layouts funktionieren

**UI-Elemente:**
- [ ] CharacterPanel wird angezeigt
- [ ] TopRightPanel (Gold, Minimap) wird angezeigt
- [ ] Combat-Modal funktioniert
- [ ] Shop-Tooltips funktionieren
- [ ] Skill-Dashboard öffnet mit 'D'
- [ ] Login-Modal funktioniert

---

## Phase 7: Dokumentation

### 7.1 Screenshots
**Vor/Nach Vergleich:**
- [ ] `before-game.png` erstellt (aus Backup-Branch)
- [ ] `after-game.png` erstellt
- [ ] `before-editor.png` erstellt
- [ ] `after-editor.png` erstellt

---

### 7.2 Test-Report
- [ ] Test-Report erstellt (siehe Dokument 07)
- [ ] Alle Test-Ergebnisse dokumentiert
- [ ] Bugs dokumentiert (falls vorhanden)
- [ ] Screenshots beigefügt

**Datei:** `spikes/2026-02-02-D&D-New-Wall/TEST-REPORT.md`

---

### 7.3 CLAUDE.md Update (optional)
Falls nötig, CLAUDE.md aktualisieren:
- [ ] Neue Tileset-Koordinaten dokumentiert
- [ ] Wand-Bug-Fixes dokumentiert
- [ ] Screenshots aktualisiert

---

## Phase 8: Abschluss

### 8.1 Code-Review
- [ ] Alle Änderungen nochmal durchgehen
- [ ] Keine Debug-Logs im Code
- [ ] Keine TODOs vergessen
- [ ] Code formatiert (Prettier)

---

### 8.2 Git-Commit & Push
```bash
# Finale Änderungen committen
git add .
git commit -m "docs: add test report and screenshots for tileset update"

# Push to remote
git push origin feature/tileset-wall-update
```

---

### 8.3 Pull Request erstellen
- [ ] GitHub öffnen
- [ ] Pull Request erstellen: `feature/tileset-wall-update` → `main`
- [ ] Beschreibung:
  ```markdown
  ## Tileset-Umstellung: Neue Wände & Türen

  **Änderungen:**
  - Tileset aktualisiert mit detaillierteren Wänden aus `Tileset_old.png`
  - Alle Wand-Koordinaten in `spriteConfig.ts` angepasst
  - Wand-Bugs behoben (Doppel-Wände, fehlende Wände)

  **Testing:**
  - ✅ Unit-Tests: PASS
  - ✅ E2E-Tests: PASS
  - ✅ 20 Dungeons manuell getestet
  - ✅ Room Editor getestet
  - ✅ Performance: < 10% Unterschied

  **Screenshots:**
  - Vor: siehe `before-game.png`
  - Nach: siehe `after-game.png`

  **Review-Checkliste:**
  - [ ] Visuell im Spiel getestet
  - [ ] Room Editor getestet
  - [ ] Keine Regression
  ```

---

### 8.4 Review
- [ ] Code-Review von Tobias angefordert
- [ ] Feedback eingearbeitet
- [ ] Final approval erhalten

---

### 8.5 Merge
- [ ] PR gemerged
- [ ] Branch gelöscht (optional)
- [ ] Main-Branch aktualisiert: `git checkout main && git pull`

---

## Phase 9: Aufräumen

### 9.1 Temporäre Dateien löschen
- [ ] `Tileset_work.png` gelöscht
- [ ] Alte Backups archiviert (optional)
- [ ] Spike-Ordner aufgeräumt (optional)

---

### 9.2 Finale Validierung
- [ ] Spiel auf `main` Branch testen
- [ ] Produktions-Build testen: `npm run build && npm start`
- [ ] Alles funktioniert: ✅

---

## Probleme & Lösungen

**Problem 1:**
```
Problem: ____________________
Ursache: ____________________
Lösung: ____________________
Status: ✅ / ⚠️ / ❌
```

**Problem 2:**
```
Problem: ____________________
Ursache: ____________________
Lösung: ____________________
Status: ✅ / ⚠️ / ❌
```

---

## Zeitaufwand

**Geschätzte Zeit:** ~4-8 Stunden

**Tatsächliche Zeit:**
- Phase 1 (Vorbereitung): ______ Stunden
- Phase 2 (Analyse): ______ Stunden
- Phase 3 (Tileset): ______ Stunden
- Phase 4 (Code): ______ Stunden
- Phase 5 (Bug-Fix): ______ Stunden
- Phase 6 (Testing): ______ Stunden
- Phase 7 (Doku): ______ Stunden
- Phase 8 (Abschluss): ______ Stunden
- **Gesamt:** ______ Stunden

---

## Notizen

```
Wichtige Erkenntnisse:
-
-
-

Verbesserungsvorschläge:
-
-
-
```

---

## Finale Freigabe

- [ ] Alle Phasen abgeschlossen
- [ ] Alle Tests bestanden
- [ ] Dokumentation vollständig
- [ ] Pull Request gemerged
- [ ] Produktions-Build funktioniert

**Spike Status:** ✅ **ABGESCHLOSSEN**

**Datum:** ____________________
**Unterschrift:** Michi / Tobias

---

**Ende der Checkliste**

**Gut gemacht! 🎉**
