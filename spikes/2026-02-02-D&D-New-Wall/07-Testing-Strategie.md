# Testing-Strategie

**Datum:** 2026-02-04
**Datei:** 07-Testing-Strategie.md

---

## Übersicht

Nach der Tileset-Änderung müssen **alle visuellen und logischen Aspekte** getestet werden.

**Test-Ebenen:**
1. **Unit-Tests** - Logik (WallTypeDetector, etc.)
2. **E2E-Tests** - Visuell (Playwright Screenshots)
3. **Manuelle Tests** - Exploratives Testing
4. **Performance-Tests** - Rendering-Geschwindigkeit

---

## 1. Unit-Tests

### 1.1 WallTypeDetector Tests

**Datei:** `tests/dungeon-wall-type.test.ts` (neu erstellen)

**Zweck:** Validiere dass `detectWallType()` korrekte Wand-Typen zurückgibt

**Test-Cases:**

```typescript
import { detectWallType } from '../lib/tiletheme/WallTypeDetector';
import { WALL_TYPE } from '../lib/tiletheme/types';
import { TILE } from '../lib/constants';

describe('WallTypeDetector', () => {
  it('should detect HORIZONTAL wall (top-bottom neighbors)', () => {
    const dungeon = [
      [TILE.EMPTY, TILE.WALL, TILE.EMPTY],
      [TILE.EMPTY, TILE.WALL, TILE.EMPTY],
      [TILE.EMPTY, TILE.WALL, TILE.EMPTY],
    ];

    const type = detectWallType(dungeon, 1, 1);
    expect(type).toBe(WALL_TYPE.HORIZONTAL);
  });

  it('should detect VERTICAL wall (left-right neighbors)', () => {
    const dungeon = [
      [TILE.EMPTY, TILE.EMPTY, TILE.EMPTY],
      [TILE.WALL, TILE.WALL, TILE.WALL],
      [TILE.EMPTY, TILE.EMPTY, TILE.EMPTY],
    ];

    const type = detectWallType(dungeon, 1, 1);
    expect(type).toBe(WALL_TYPE.VERTICAL);
  });

  it('should detect CORNER_TL (right + bottom)', () => {
    const dungeon = [
      [TILE.EMPTY, TILE.EMPTY, TILE.EMPTY],
      [TILE.EMPTY, TILE.WALL, TILE.WALL],
      [TILE.EMPTY, TILE.WALL, TILE.EMPTY],
    ];

    const type = detectWallType(dungeon, 1, 1);
    expect(type).toBe(WALL_TYPE.CORNER_TL);
  });

  // ... analog für alle anderen Wand-Typen
});
```

**Ausführen:**
```bash
npm run test tests/dungeon-wall-type.test.ts
```

**Erwartung:** ✅ Alle Tests PASS

---

### 1.2 Doppel-Wände Tests

**Datei:** `tests/dungeon-double-walls.test.ts` (existiert bereits)

**Zweck:** Prüfe dass keine doppelten Wände generiert werden

**Status:** ⚠️ Muss aktualisiert werden (siehe Dokument 06)

**Ausführen:**
```bash
npm run test tests/dungeon-double-walls.test.ts
```

**Erwartung:** ✅ Alle Tests PASS (nach Bug-Fix)

---

## 2. E2E-Tests (Playwright)

### 2.1 Visuelle Wand-Tests

**Datei:** `tests/e2e/dungeon-walls-visual-check.spec.ts` (existiert)

**Zweck:** Screenshot-basiertes Testing

**Test-Cases:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dungeon Wall Visuals', () => {
  test('should render walls correctly with new tileset', async ({ page }) => {
    await page.goto('/');

    // Warte auf Dungeon-Generierung
    await page.waitForSelector('canvas', { timeout: 5000 });

    // Screenshot erstellen
    const screenshot = await page.screenshot();

    // Visueller Vergleich (optional)
    expect(screenshot).toMatchSnapshot('dungeon-with-new-walls.png');
  });

  test('should show wall details in room editor', async ({ page }) => {
    await page.goto('/room-editor');

    // Erstelle Raum mit Wänden
    await page.click('[data-testid="create-room-btn"]');
    await page.fill('[data-testid="room-width"]', '10');
    await page.fill('[data-testid="room-height"]', '10');

    // Wähle Wall-Tool
    await page.click('[data-testid="tool-wall"]');

    // Zeichne Wand
    await page.click('canvas', { position: { x: 100, y: 100 } });

    // Screenshot
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchSnapshot('room-editor-walls.png');
  });
});
```

**Ausführen:**
```bash
npm run test:e2e tests/e2e/dungeon-walls-visual-check.spec.ts
```

**Erwartung:**
- ✅ Neue Screenshots werden erstellt
- ⚠️ Erste Ausführung: Baseline erstellen
- ⚠️ Zweite Ausführung: Vergleich mit Baseline

---

### 2.2 Doppel-Wände E2E-Test

**Datei:** `tests/e2e/dungeon-double-walls.spec.ts` (existiert)

**Zweck:** Prüfe visuell dass keine Doppel-Wände existieren

**Ausführen:**
```bash
npm run test:e2e tests/e2e/dungeon-double-walls.spec.ts
```

**Erwartung:** ✅ PASS (nach Bug-Fix)

---

### 2.3 Room Editor Integration Test

**Datei:** `tests/e2e/room-editor.spec.ts` (existiert)

**Erweitere um Tileset-Tests:**

```typescript
test('should use new tileset in room editor', async ({ page }) => {
  await page.goto('/room-editor');

  // Prüfe ob Tileset geladen wurde
  const tilesetLoaded = await page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    // Prüfe ob Tileset-Image geladen ist
    // (implementierungsabhängig)
    return true; // Placeholder
  });

  expect(tilesetLoaded).toBe(true);
});
```

---

## 3. Manuelle Tests

### 3.1 Explorative Dungeon-Tests

**Zweck:** Finde Edge-Cases die automatisierte Tests nicht finden

**Schritte:**
1. Spiel starten (`npm run dev`)
2. **20 Dungeons generieren** (Page Refresh)
3. Für jeden Dungeon prüfen:
   - [ ] Alle Wände korrekt gerendert?
   - [ ] Keine schwarzen Quadrate?
   - [ ] Keine Doppel-Wände?
   - [ ] Keine fehlenden Wände?
   - [ ] Türen korrekt?
   - [ ] Autotiling funktioniert (Ecken/T-Stücke)?

**Dokumentation:**
```markdown
## Test-Session: 2026-02-04

### Dungeon 1:
- ✅ Alle Wände OK
- ✅ Türen OK
- ✅ Autotiling OK

### Dungeon 2:
- ❌ Doppel-Wand bei (45, 23)
- Screenshot: dungeon2-double-wall.png

### Dungeon 3:
- ⚠️ Fehlende Wand bei (78, 56)
- Screenshot: dungeon3-missing-wall.png

...
```

---

### 3.2 Room Editor Manuell-Test

**Schritte:**
1. Öffne `/room-editor`
2. **Test 1: Neuen Raum erstellen**
   - [ ] Erstelle 8×8 Raum
   - [ ] Zeichne Wände mit Pen-Tool
   - [ ] Alle Wand-Typen testen (horizontal, vertikal, Ecken, T-Stücke, Kreuz)
   - [ ] Screenshot: `editor-new-room.png`

3. **Test 2: Existierenden Raum laden**
   - [ ] Lade "Small Corridor"
   - [ ] Visuell prüfen
   - [ ] Screenshot: `editor-existing-room.png`

4. **Test 3: Türen platzieren**
   - [ ] Wähle Door-Tool
   - [ ] Platziere horizontale Tür
   - [ ] Platziere vertikale Tür
   - [ ] Visuell prüfen
   - [ ] Screenshot: `editor-doors.png`

5. **Test 4: Autotiling**
   - [ ] Zeichne L-Form → prüfe ob Ecke automatisch
   - [ ] Zeichne T-Form → prüfe ob T-Stück automatisch
   - [ ] Zeichne Kreuz → prüfe ob Kreuz automatisch
   - [ ] Screenshot: `editor-autotiling.png`

---

### 3.3 Performance-Test

**Zweck:** Stelle sicher dass neue Tiles nicht langsamer sind

**Schritte:**
1. Browser Dev-Tools öffnen (F12)
2. Performance-Tab
3. Dungeon generieren
4. Recording stoppen
5. Analyse:
   - FPS während Rendering?
   - Tileset-Ladezeit?
   - Rendering-Bottlenecks?

**Benchmark:**
```javascript
// Im Browser Console:
console.time('dungeon-generation');
// Trigger Dungeon-Generierung (Page Refresh)
console.timeEnd('dungeon-generation');

// Erwartung: < 500ms für gesamte Generierung
```

---

## 4. Regression-Tests

### 4.1 Bestehende Features prüfen

**Zweck:** Stelle sicher dass nichts kaputt gegangen ist

**Checkliste:**
- [ ] **Dungeon-Generierung** funktioniert (BSP-Algorithmus)
- [ ] **Räume verbunden** (keine isolierten Räume)
- [ ] **Spieler-Bewegung** funktioniert (keine Kollisions-Bugs)
- [ ] **Enemy-Spawning** funktioniert
- [ ] **Combat-System** funktioniert
- [ ] **Fog of War** funktioniert
- [ ] **Minimap** zeigt korrekt
- [ ] **Shop-Räume** werden generiert
- [ ] **Shrine-Räume** werden generiert
- [ ] **Room-Layouts** funktionieren (Layout-basierte Generierung)

---

### 4.2 UI-Elemente prüfen

**Checkliste:**
- [ ] CharacterPanel wird angezeigt
- [ ] TopRightPanel (Gold, Minimap) wird angezeigt
- [ ] Combat-Modal funktioniert
- [ ] Shop-Tooltips funktionieren
- [ ] Skill-Dashboard öffnet mit 'D'
- [ ] Login-Modal funktioniert

---

## 5. Screenshot-Vergleich

### 5.1 Vor/Nach Vergleich

**Erstelle Screenshots:**

**Vor der Änderung:**
1. Hauptspiel: `before-game.png`
2. Room Editor: `before-editor.png`
3. Minimap: `before-minimap.png`

**Nach der Änderung:**
1. Hauptspiel: `after-game.png`
2. Room Editor: `after-editor.png`
3. Minimap: `after-minimap.png`

**Vergleich:**
- Sind Wände detaillierter?
- Haben Türen mehr Tiefe?
- Ist der Kontrast besser?

---

### 5.2 Playwright Screenshot-Tests

**Automatisiert:**
```typescript
test('visual regression - dungeon', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  const screenshot = await page.screenshot();
  expect(screenshot).toMatchSnapshot('dungeon-main.png', {
    threshold: 0.2  // 20% Toleranz (Tileset-Änderung ist erwünscht)
  });
});
```

**Erste Ausführung:**
```bash
npm run test:e2e -- --update-snapshots
```
→ Erstellt neue Baseline

**Folgende Ausführungen:**
```bash
npm run test:e2e
```
→ Vergleicht mit Baseline

---

## 6. Test-Dokumentation

### 6.1 Test-Report erstellen

**Vorlage:**

```markdown
# Test-Report: Tileset-Änderung

**Datum:** 2026-02-04
**Tester:** Michi

---

## Zusammenfassung
- ✅ 15/18 Tests PASS
- ⚠️ 2/18 Tests FAIL (bekannte Issues)
- ❌ 1/18 Tests ERROR (Bug gefunden)

---

## Unit-Tests
| Test | Status | Notizen |
|------|--------|---------|
| WallTypeDetector - HORIZONTAL | ✅ PASS | - |
| WallTypeDetector - VERTICAL | ✅ PASS | - |
| WallTypeDetector - CORNER_TL | ✅ PASS | - |
| ... | ... | ... |

---

## E2E-Tests
| Test | Status | Screenshot | Notizen |
|------|--------|------------|---------|
| Dungeon Visual | ✅ PASS | dungeon-main.png | Neue Wände sichtbar |
| Room Editor | ✅ PASS | editor.png | Tiles korrekt |
| ... | ... | ... | ... |

---

## Manuelle Tests
| Test | Status | Notizen |
|------|--------|---------|
| 20 Dungeons generiert | ✅ PASS | Keine Doppel-Wände gefunden |
| Room Editor Autotiling | ✅ PASS | Ecken/T-Stücke korrekt |
| Performance | ✅ PASS | ~450ms Generierung (vorher: 430ms) |

---

## Bugs gefunden
1. **[BUG-001]** Doppel-Wand bei Raum-Kreuzungen
   - Priorität: HOCH
   - Reproduzierbar: Ja
   - Screenshot: bug-001.png

---

## Nächste Schritte
1. Bug-001 fixen (siehe Dokument 06)
2. Visuelle Tests aktualisieren (neue Baselines)
3. Performance optimieren (optional)
```

---

## 7. Test-Automatisierung

### 7.1 Pre-Commit Hook

**Datei:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Führe Unit-Tests vor Commit aus
npm run test

# Bei Fehler: Commit abbrechen
```

---

### 7.2 CI/CD Pipeline

**Datei:** `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v2
        with:
          name: test-screenshots
          path: test-results/
```

---

## 8. Test-Checkliste

**Vor dem Merge:**

### Unit-Tests
- [ ] `tests/dungeon-wall-type.test.ts` → ✅ PASS
- [ ] `tests/dungeon-double-walls.test.ts` → ✅ PASS

### E2E-Tests
- [ ] `tests/e2e/dungeon-walls-visual-check.spec.ts` → ✅ PASS
- [ ] `tests/e2e/dungeon-double-walls.spec.ts` → ✅ PASS
- [ ] `tests/e2e/room-editor.spec.ts` → ✅ PASS

### Manuelle Tests
- [ ] 20 Dungeons visuell geprüft → ✅ OK
- [ ] Room Editor getestet → ✅ OK
- [ ] Performance-Test durchgeführt → ✅ OK (< 10% Unterschied)

### Regression-Tests
- [ ] Alle bestehenden Features funktionieren → ✅ OK
- [ ] Keine UI-Bugs → ✅ OK

### Screenshots
- [ ] Vor/Nach Screenshots erstellt → ✅ OK
- [ ] Visueller Vergleich dokumentiert → ✅ OK

### Dokumentation
- [ ] Test-Report erstellt → ✅ OK
- [ ] Bugs dokumentiert → ✅ OK

---

**Nächstes Dokument:** `08-Checkliste.md` (Finale Checkliste für gesamtes Projekt)
