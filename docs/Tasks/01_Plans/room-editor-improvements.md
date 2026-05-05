c# Room Editor & Layout System — Verbesserungen & Optimierungen

**Erstellt:** 2026-01-28
**Aufgrund:** Playwright-Testlauf (32/32 passed) + Code-Review
**Branch:** feature/michi-bugs

---

## Gefundene Bugs (bereits behoben)

| # | Bug | Datei | Fix |
|---|-----|-------|-----|
| 1 | SQL-Fehler bei `roomType`-Filter: double-quotes `"any"` werden als Spaltenname interpretiert | `lib/db/roomLayouts.ts:66` | Umgeändert auf single-quotes `'any'` |
| 2 | Keyboard-Shortcut `Ctrl+Shift+Z` funktionierte nicht im Browser (Playwright: `shift` vs `Shift`) | `components/roomeditor/LayoutCanvas.tsx:50` | Handler nutzt `e.shiftKey` korrekt; Playwright-Test angepasst |

---

## Verbesserungsvorschläge

### 1. Fehlende Assets gracefully behandeln

**Problem:** `/Assets/menu-background.jpg` gibt 404 — das Spiel lädt trotzdem, aber der Fehler wird im Browser-Console geworfen und kann bei CI-Checks auffallen.

**Vorschlag:**
- Entweder das Asset hinzufügen oder das `backgroundImage` in `MainMenu.tsx:85` mit einem Fallback versehen:
```tsx
backgroundImage: 'url(/Assets/menu-background.jpg)',
// Alternative: weglassen wenn Datei nicht vorhanden
```

### 2. Undo-History bei Drag-Painting optimieren

**Problem:** Beim Malen mit gedrückter Maus wird pro Tile ein History-Eintrag erstellt. Bei einem 15x15-Grid mit Fill-Malen entstehen hunderte Einträge — History wird auf 30 begrenzt, was nützliche Undo-Schritte verdrängt.

**Vorschlag:** Verwende `mouseDown`/`mouseUp` zur Gruppierung:
- Bei `mouseDown`: Snapshot vor dem Zug speichern
- Während Drag: Änderungen direkt auf aktuelles Grid anwenden (kein neuer History-Eintrag)
- Bei `mouseUp`: Erst jetzt neuen History-Eintrag pushen

```typescript
// In RoomLayoutEditor:
type GridAction = /* ... */
  | { type: 'BEGIN_STROKE' }    // Snapshot vor dem Zug
  | { type: 'END_STROKE' };     // History-Eintrag pushen

// In LayoutCanvas: mouseDown → dispatch BEGIN_STROKE, mouseUp → dispatch END_STROKE
```

### 3. Preview-Tileset Caching

**Problem:** `LayoutPreview.tsx` lädt das Tileset-PNG beim jedes Mal neu wenn der Preview-Mode aktiviert wird.

**Vorschlag:** Tileset-Image in einem `useRef` cachen oder zu einem Shared-Context hoist:
```typescript
const tilesetRef = useRef<HTMLImageElement | null>(null);
// Nur laden wenn noch nicht vorhanden
if (!tilesetRef.current) { /* load */ }
```

### 4. Live-Validierung debounced

**Problem:** `useMemo` validiert bei jeder einzelnen Tile-Änderung sofort. Bei schnellem Malen kann das zu ruckelnd wirken (Flood-Fill auf 15x15 = 225 Tiles gleichzeitig).

**Vorschlag:** Verwende einen `useEffect` mit `setTimeout`-Debounce:
```typescript
const [validationResult, setValidationResult] = useState(/* initial */);
useEffect(() => {
  const timer = setTimeout(() => {
    setValidationResult(validateRoomLayout(layoutInput));
  }, 150); // 150ms Debounce
  return () => clearTimeout(timer);
}, [tileGrid, width, height, layoutName, roomType, difficulty, tags]);
```

### 5. Door-Orientierung im Preview verbessern

**Aktuell:** Türorientierung wird nur anhand von Wall-Nachbarn links/rechts bestimmt. Doors an Ecken oder ohne klare Nachbarn können falsche Orientierung zeigen.

**Vorschlag:** Nutze die `doorPositions` Metadaten:
- North/South Doors → horizontal (Player läuft durch)
- East/West Doors → vertikal

```typescript
// In LayoutPreview: Übergabe von doorPositions
// Prüfe ob Tile an North-Edge (y===0) → horizontal
// Prüfe ob Tile an East/West-Edge → vertikal
```

### 6. Layout-Manager: Bestätigungsdialoge ersetzen

**Problem:** `confirm()` und `alert()` blockieren den Hauptthread und sehen unprofessionell aus.

**Vorschlag:** Eigenes Modal-System verwenden:
```tsx
<ConfirmModal
  message="Ungültige Änderungen gehen verloren?"
  onConfirm={() => { /* reset */ }}
  onCancel={() => {}}
/>
```

### 7. Seed-Layouts Redundancy-Check

**Problem:** `seedRoomLayouts()` prüft nur ob die Tabelle leer ist. Beim Hinzufügen neuer Seed-Layouts in der JSON-Datei werden sie nicht nachträglich eingefügt.

**Vorschlag:** Hash-basierter Check:
```typescript
// Vergleiche Anzahl Seeds vs DB-Einträge mit createdBy = null
const seedCount = db.prepare("SELECT COUNT(*) as c FROM room_layouts WHERE created_by IS NULL").get();
if (seedCount.c < seedLayouts.length) {
  // Neue Seeds einfügen (nur wenn Name nicht existiert)
}
```

### 8. LayoutPool: Fehlerbehandlung bei leerem Pool

**Aktuell:** Wenn der Pool leer ist (z.B. bei fehlgeschlagenem Seeding), gibt `getRandomLayout()` `null` zurück — der Dungeon-Generator kann crlichen.

**Vorschlag:** Fallback auf BSP-Generierung wenn der Pool leer ist:
```typescript
// In DungeonManager.generateFromLayouts:
const layouts = pool.getLayouts();
if (layouts.length === 0) {
  console.warn('Layout pool empty, falling back to BSP generation');
  return this.generateNewDungeon(availableSubjects);
}
```

---

## Test-Abdeckung (aktuell)

| Bereich | Tests | Status |
|---------|-------|--------|
| Editor Laden | 2 | ✅ |
| Zeichenwerkzeuge (Pen/Eraser/Fill/Door) | 4 | ✅ |
| Undo/Redo (Buttons + Keyboard) | 5 | ✅ |
| Preview-Modus | 4 | ✅ |
| Live-Validierung | 3 | ✅ |
| Speichern & Laden | 3 | ✅ |
| Layout-Manager (Neu/Löschen) | 1 | ✅ |
| Spiel Login & Laden | 2 | ✅ |
| Spieler-Bewegung | 2 | ✅ |
| Layout-Pool Integration | 5 | ✅ |
| Statistik-Dashboard | 1 | ✅ |
| **Gesamt** | **32** | **100% passed** |

---

## Prioritäten

1. **Hoch:** Fehlende Asset (`menu-background.jpg`) — CI-Blocker
2. **Mittel:** Undo-Gruppierung bei Drag-Malen — UX-Qualität
3. **Mittel:** Fallback auf BSP wenn Pool leer — Robustheit
4. **Niedrig:** Preview-Tileset Caching — Performance
5. **Niedrig:** Debounced Validation — Performance bei großen Grids
6. **Niedrig:** Bestätigungsdialoge ersetzen — UX-Polish
