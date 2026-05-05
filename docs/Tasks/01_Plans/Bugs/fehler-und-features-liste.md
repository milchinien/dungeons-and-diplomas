# Fehler & Features Liste

**Datum:** 2026-02-03
**Referenz:** dungeon-generation-fixes.md

---

## 🐛 Fehler zu beheben

### **1. Wand-Ausrichtung**

#### Problem:
Wände werden nicht korrekt orientiert gerendert (horizontal vs. vertikal)

#### Symptome:
- Horizontale Wände sehen aus wie vertikale Wände
- Vertikale Wände sehen aus wie horizontale Wände
- Tiles passen nicht zum Layout
- Visuell inkonsistent

#### Betroffene Dateien:
- `lib/tiletheme/WallTypeDetector.ts` - Falsche Orientierungs-Erkennung
- `lib/rendering/TileRenderer.ts` - Rendering verwendet falsche Tiles
- `lib/tiletheme/WallTileset.ts` - Tile-Mapping

#### Lösungsansatz:
1. **Verbesserte Nachbar-Erkennung:**
   - Alle 4 Richtungen prüfen (oben, unten, links, rechts)
   - Diagonal-Checks für Ecken
   - Robuste Logik für T-Kreuzungen und X-Kreuzungen

2. **Neue Orientierungs-Typen:**
   ```typescript
   type WallOrientation = 'horizontal' | 'vertical' | 'corner' | 'junction';
   ```

3. **Klare Regel:**
   - **Horizontal:** Boden links UND rechts
   - **Vertikal:** Boden oben UND unten
   - **Ecke:** Genau 2 angrenzende Böden (L-Form)
   - **Kreuzung:** 3-4 angrenzende Böden (T oder X)

#### Test-Strategie:
- Unit-Tests für alle Konstellationen
- Visual-Test: Screenshot-Vergleich
- E2E-Test: Generiere Dungeon, prüfe keine magenta-Tiles

#### Erwartete Dauer: 2-3 Stunden

---

### **2. Türen ohne Raum dahinter**

#### Problem:
Türen werden platziert, führen aber zu Wänden oder leeren Bereichen statt zu Räumen

#### Symptome:
- Spieler kann nicht durch Tür gehen
- Kollision mit unsichtbarer Wand
- Tür öffnet sich, dahinter ist Wand
- Dungeon ist nicht vollständig traversierbar

#### Betroffene Dateien:
- `lib/dungeon/layoutGeneration.ts` - `placeRoomInDungeon()` validiert nicht
- `lib/dungeon/layoutGeneration.ts` - `canPlaceRoom()` prüft nur Überlappung

#### Lösungsansatz:
1. **Pre-Validierung bei Platzierung:**
   ```typescript
   function validateDoorConnection(
     dungeon: TileType[][],
     doorX: number,
     doorY: number,
     doorSide: 'north' | 'south' | 'east' | 'west'
   ): boolean {
     // Prüfe ob auf beiden Seiten FLOOR oder EMPTY (für zukünftige Räume)
     // Keine WALL direkt dahinter
   }
   ```

2. **Post-Generation Scan:**
   ```typescript
   function validateAllDoors(dungeon, rooms): ValidationError[] {
     // Scan alle Türen
     // Mind. 2 angrenzende Floors
     // Keine blockierenden Wände
   }
   ```

3. **Automatisches Cleanup:**
   - Ungültige Türen werden zu Wänden konvertiert
   - Logging für Debugging

#### Test-Strategie:
- Unit-Test: Tür zwischen 2 Räumen → valid
- Unit-Test: Tür mit Wand dahinter → invalid
- E2E-Test: Laufe durch alle Türen, keine Kollision
- Playwright: 100 Dungeons, alle Türen begehbar

#### Erwartete Dauer: 2-3 Stunden

---

### **3. Doppelte Wände zwischen Räumen**

#### Problem:
Zwei Wand-Tiles nebeneinander zwischen Räumen statt einer geteilten Wand

#### Symptome:
- Visuell zu dicke Wände
- Räume wirken weiter auseinander als sie sind
- Verschwendeter Platz

#### Betroffene Dateien:
- `lib/dungeon/layoutGeneration.ts` - `removeDoubleWalls()` unvollständig
- `lib/dungeon/layoutGeneration.ts` - `placeRoomInDungeon()` überspringt nicht alle Wände

#### Lösungsansatz:
1. **Erweiterte `removeDoubleWalls()`:**
   - Scan für horizontale Doppel-Wände (vertikal gestapelt)
   - Scan für vertikale Doppel-Wände (horizontal nebeneinander)
   - Zusätzlicher Scan für Ecken und L-Formen

2. **Shared Wall Skip:**
   ```typescript
   // In placeRoomInDungeon():
   if (tile === TILE.WALL && sharedWallSide) {
     if (isOnSharedEdge(lx, ly, layout, sharedWallSide)) {
       skipThisTile = true; // Don't overwrite existing wall
     }
   }
   ```

3. **Post-Validierung:**
   - `findDoubleWalls()` Funktion
   - Logging aller gefundenen Doppel-Wände
   - Optional: Automatisches Entfernen

#### Test-Strategie:
- Unit-Test: Erstelle 2 angrenzende Räume, prüfe keine Doppel-Wände
- E2E-Test: `findDoubleWalls()` gibt leeres Array zurück
- Visual-Test: Screenshot, manuelle Inspektion

#### Erwartete Dauer: 1-2 Stunden

---

### **4. Sackgassen-Räume werden nicht genutzt**

#### Problem:
Räume mit nur 1 Tür existieren im Pool, werden aber nicht verwendet

#### Symptome:
- Alle Pfade enden abrupt ohne "End"-Gefühl
- Keine natürlichen Abschlüsse von Abzweigungen

#### Betroffene Dateien:
- `lib/dungeon/pathGeneration.ts` - Wählt nie Sackgassen
- `lib/roomlayouts/LayoutPool.ts` - Keine Filterung nach Tür-Anzahl

#### Lösungsansatz:
1. **Dead-End Detection:**
   ```typescript
   function identifyDeadEndLayouts(pool: LayoutPool): RoomLayout[] {
     return pool.getLayouts().filter(layout => {
       const doorCount = countDoors(layout.doorPositions);
       return doorCount === 1;
     });
   }
   ```

2. **Smart Usage:**
   - Am Ende von Abzweigungen: Sackgasse verwenden
   - Am Ende von Haupt-Pfaden: Normalen Raum oder Sackgasse (zufällig)
   - Niemals im Haupt-Pfad mitten drin

3. **Logging:**
   - `console.log` wenn Sackgasse verwendet wird
   - Statistik: X von Y Sackgassen-Räumen verwendet

#### Test-Strategie:
- Unit-Test: `identifyDeadEndLayouts()` findet alle
- E2E-Test: Manche Dungeons haben Sackgassen
- Visual-Test: Abzweigungen enden in Sackgassen

#### Erwartete Dauer: 1 Stunde

---

## ✨ Neue Features

### **1. Spawn-Raum System**

#### Beschreibung:
Neuer Raumtyp "spawn" mit genau 3 Türen (Nord, Ost, West) wo der Spieler startet

#### Funktionalität:
- Mehrere verschiedene Spawn-Raum-Layouts im Editor
- Pro Dungeon nur 1 Spawn-Raum
- Genau 3 Türen: Nord, Ost, West (fest definiert)
- Spieler spawnt immer in Spawn-Raum
- Spawn-Raum ist immer sichtbar (kein Fog of War)

#### Neue Dateien:
- `lib/dungeon/spawnRoomGeneration.ts`
- `components/roomeditor/SpawnRoomValidator.tsx` (optional)

#### Geänderte Dateien:
- `lib/roomlayouts/types.ts` - Neuer Typ 'spawn'
- `lib/roomlayouts/validation.ts` - `validateSpawnRoom()`
- `lib/db/roomLayouts.ts` - Schema-Update
- `components/roomeditor/LayoutSettings.tsx` - UI Dropdown
- `lib/data/seed-room-layouts.json` - 3-5 Spawn-Layouts

#### Validierung:
```typescript
export function validateSpawnRoom(layout: RoomLayout): ValidationResult {
  const doorCount = countDoors(layout.doorPositions);

  if (doorCount !== 3) {
    return { valid: false, error: 'Spawn-Raum muss genau 3 Türen haben' };
  }

  // Muss Nord, Ost, West haben (nicht Süd)
  if (!layout.doorPositions.north ||
      !layout.doorPositions.east ||
      !layout.doorPositions.west ||
      layout.doorPositions.south !== null) {
    return {
      valid: false,
      error: 'Spawn-Raum: Türen müssen in Nord, Ost und West sein'
    };
  }

  return { valid: true };
}
```

#### Test-Strategie:
- Unit-Test: Validierung funktioniert
- Unit-Test: Spawn-Raum wird als `rooms[0]` platziert
- E2E-Test: Spieler spawnt in Spawn-Raum
- E2E-Test: Spawn-Raum hat 3 Türen
- Playwright: Kann durch alle 3 Türen gehen

#### Erwartete Dauer: 3-4 Stunden

---

### **2. End-Raum System**

#### Beschreibung:
Neuer Raumtyp "end" mit mindestens 3 Türen, wo alle 3 Pfade zusammenlaufen

#### Funktionalität:
- Mehrere verschiedene End-Raum-Layouts im Editor
- Pro Dungeon nur 1 End-Raum
- Mindestens 3 Türen (für die 3 Wege)
- Optionale 4. Tür für weitere Verbindungen
- End-Raum am "Ende" des Dungeons platziert

#### Neue Dateien:
- `lib/dungeon/endRoomPlacement.ts`
- `lib/dungeon/corridorGeneration.ts` - Verbindungskorridore

#### Geänderte Dateien:
- `lib/roomlayouts/types.ts` - Neuer Typ 'end'
- `lib/roomlayouts/validation.ts` - `validateEndRoom()`
- `lib/db/roomLayouts.ts` - Schema-Update
- `components/roomeditor/LayoutSettings.tsx` - UI Dropdown
- `lib/data/seed-room-layouts.json` - 2-3 End-Layouts

#### Platzierungs-Algorithmus:
```typescript
function placeEndRoom(
  dungeon, roomMap, rooms, placedRooms, paths, pool
): number {
  // Finde Zentrum zwischen den 3 Pfad-Enden
  const pathEnds = paths.map(p => getPathEndPosition(p));
  const centerX = average(pathEnds.map(p => p.x));
  const centerY = average(pathEnds.map(p => p.y));

  // Platziere End-Raum nahe Zentrum
  const endLayout = pool.getRandomLayout({ roomType: 'end' });
  const position = findNearestValidPosition(centerX, centerY, endLayout);

  placeRoomInDungeon(...);

  return endRoomId;
}
```

#### Verbindung der Pfade:
```typescript
function connectPathsToEndRoom(dungeon, roomMap, rooms, paths, endRoomId) {
  for (const path of paths) {
    const lastRoom = rooms[path.rooms[path.rooms.length - 1]];
    const corridor = createCorridor(dungeon, lastRoom, endRoom);
    // ... connect ...
  }
}
```

#### Test-Strategie:
- Unit-Test: End-Raum wird platziert
- Unit-Test: Alle 3 Pfade sind verbunden
- E2E-Test: Laufe von Spawn zu End auf allen 3 Wegen
- Playwright: End-Raum erreichbar
- Stress-Test: 50 Dungeons, alle haben End-Raum

#### Erwartete Dauer: 3-4 Stunden

---

### **3. 3-Wege-Generierung**

#### Beschreibung:
Vom Spawn-Raum gehen 3 separate Pfade ab, die zum End-Raum führen

#### Funktionalität:
- 3 Pfade mit unterschiedlichen Längen (zufällig)
- Jeder Pfad: 5-10 Räume (konfigurierbar)
- Pfade können gerade oder kurvig sein
- Pfade können sich kreuzen (maximal 1 Mal)
- Pfade führen alle zum End-Raum

#### Neue Dateien:
- `lib/dungeon/pathGeneration.ts`

#### Algorithmus:
```typescript
interface Path {
  doorConnection: DoorConnection;  // Start-Tür vom Spawn
  rooms: number[];                  // Raum-IDs
  endDoor: DoorConnection | null;   // Tür zum End-Raum
  length: number;
}

function generateThreePaths(
  dungeon, roomMap, rooms, placedRooms, openDoors, pool
): Path[] {
  const spawnDoors = openDoors.filter(d => d.roomId === 0);
  // Für jede Tür: Generiere Pfad
  const paths: Path[] = [];

  for (const spawnDoor of spawnDoors) {
    const targetLength = 5 + random(6); // 5-10
    const path = generatePathFromDoor(spawnDoor, targetLength, ...);
    paths.push(path);
  }

  return paths;
}

function generatePathFromDoor(
  startDoor: DoorConnection,
  targetLength: number,
  ...
): Path {
  const path: Path = { doorConnection: startDoor, rooms: [], endDoor: null, length: 0 };

  let currentDoor = startDoor;

  while (path.length < targetLength) {
    // Platziere nächsten Raum
    const newRoom = placeNextRoom(currentDoor, ...);
    path.rooms.push(newRoom.id);
    path.length++;

    // Wähle nächste Richtung (zufällig für Kurven)
    const nextDoors = getAvailableDoors(newRoom);
    if (nextDoors.length === 0) break;

    currentDoor = nextDoors[random(nextDoors.length)];
  }

  return path;
}
```

#### Pfad-Varianz:
- **Gerade Pfade:** Immer gleiche Richtung wählen
- **Kurvige Pfade:** Zufällige Richtungsänderungen
- **Mit Abzweigungen:** `maybeAddBranch()` nach jedem Raum

#### Test-Strategie:
- Unit-Test: 3 Pfade werden generiert
- Unit-Test: Pfade haben unterschiedliche Längen
- E2E-Test: Alle 3 Pfade sind begehbar
- Visual-Test: Pfade sehen unterschiedlich aus
- Stress-Test: 100 Dungeons, alle haben 3 Pfade

#### Erwartete Dauer: 4-5 Stunden

---

### **4. Zufällige Abzweigungen**

#### Beschreibung:
Von Haupt-Pfaden können zufällige Abzweigungen abgehen (1-3 Räume)

#### Funktionalität:
- 30% Chance pro Raum für Abzweigung
- Abzweigung: 1-3 Räume
- Letzter Raum einer Abzweigung: Sackgasse (wenn verfügbar)
- Abzweigungen enden, führen nicht weiter

#### Neue Dateien:
- `lib/dungeon/branchGeneration.ts`

#### Algorithmus:
```typescript
function maybeAddBranch(
  dungeon, roomMap, rooms, placedRooms, openDoors, pool, currentRoomId
): boolean {
  // 30% Chance
  if (Math.random() > 0.3) return false;

  const branchLength = 1 + random(3); // 1-3 Räume
  const deadEndLayouts = identifyDeadEndLayouts(pool);

  let currentDoor = pickRandomDoor(currentRoomId, openDoors);

  for (let i = 0; i < branchLength; i++) {
    const useDeadEnd = i === branchLength - 1 && deadEndLayouts.length > 0;
    const layout = useDeadEnd
      ? randomFrom(deadEndLayouts)
      : pool.getLayoutWithDoor(oppositeSide(currentDoor.side));

    if (!layout) break;

    const newRoom = placeRoom(layout, currentDoor, ...);
    // ... connect ...

    if (i < branchLength - 1) {
      currentDoor = pickRandomDoor(newRoom.id, openDoors);
    }
  }

  return true;
}
```

#### Integration:
```typescript
// In generatePathFromDoor():
while (path.length < targetLength) {
  const newRoom = placeNextRoom(...);
  path.rooms.push(newRoom.id);

  // Chance für Abzweigung
  if (maybeAddBranch(..., newRoom.id)) {
    console.log('Added branch from room', newRoom.id);
  }

  // ... continue path ...
}
```

#### Test-Strategie:
- Unit-Test: Abzweigungen werden hinzugefügt
- E2E-Test: Manche Dungeons haben Abzweigungen
- E2E-Test: Abzweigungen enden in Sackgassen
- Visual-Test: Dungeons haben unterschiedliche Strukturen

#### Erwartete Dauer: 2-3 Stunden

---

### **5. Cheat-Menü für Entwickler**

#### Beschreibung:
Developer-Tools zum schnellen Testen und Debuggen

#### Funktionalität:
- **Tastatur-Shortcut:** Ctrl+Shift+C öffnet Menü
- **Regenerate Dungeon:** Generiert neuen Dungeon ohne Reload
- **Reveal All Rooms:** Entfernt Fog of War
- **God Mode:** Unendlich HP
- **Teleport:** Zu jedem Raum teleportieren
- **Room Info:** Zeigt Raum-Typ und Eigenschaften

#### Neue Dateien:
- `components/CheatMenu.tsx`

#### UI:
```tsx
<div className="cheat-menu">
  <h2>Cheat Menu</h2>

  <button onClick={onRegenerateDungeon}>🔄 Regenerate</button>
  <button onClick={onRevealAll}>👁️ Reveal All</button>
  <button onClick={onToggleGodMode}>
    {godMode ? '⚡ God Mode ON' : '💀 God Mode OFF'}
  </button>

  <div className="teleport-grid">
    {rooms.map((room, idx) => (
      <button
        key={idx}
        onClick={() => onTeleport(idx)}
        className={`room-${room.type}`}
      >
        {idx}: {room.type}
      </button>
    ))}
  </div>
</div>
```

#### Integration:
```typescript
// In GameCanvas:
const handleTeleport = (roomId: number) => {
  const room = rooms[roomId];
  setPlayer(prev => ({
    ...prev,
    x: (room.x + room.width / 2) * TILE_SIZE,
    y: (room.y + room.height / 2) * TILE_SIZE
  }));
};

const handleRevealAll = () => {
  setRooms(prev => prev.map(r => ({ ...r, visible: true })));
};

const handleToggleGodMode = () => {
  setGodMode(prev => !prev);
  if (!godMode) {
    setPlayer(prev => ({ ...prev, hp: 999, maxHp: 999 }));
  }
};
```

#### Test-Strategie:
- Manual: Öffne Menü, prüfe alle Funktionen
- Manual: Teleport zu allen Raum-Typen
- Manual: God Mode, nehme Schaden → kein HP-Verlust
- Manual: Regenerate 10x, alle Dungeons valid

#### Erwartete Dauer: 2-3 Stunden

---

## 🧪 Test-Strategie Übersicht

### **Unit-Tests**
**Zweck:** Schnelle, isolierte Tests einzelner Funktionen
**Tools:** Jest / Vitest
**Dateien:** `tests/*.test.ts`

**Zu testen:**
- `validateSpawnRoom()` - Alle Edge-Cases
- `validateEndRoom()` - Alle Edge-Cases
- `validateDoorConnection()` - Valid/Invalid Szenarien
- `detectWallOrientation()` - Alle Konstellationen
- `removeDoubleWalls()` - Verschiedene Muster
- `identifyDeadEndLayouts()` - Filter-Logik
- `generateThreePaths()` - Pfad-Generierung
- `placeEndRoom()` - Platzierungs-Logik

**Erfolgskriterium:** 100% Code Coverage der neuen Funktionen

---

### **E2E-Tests mit Playwright**
**Zweck:** Vollständige Integration, realistische Szenarien
**Tools:** Playwright
**Dateien:** `tests/e2e/*.spec.ts`

**Zu testen:**
- Spawn-Raum System (Spieler spawnt, 3 Türen vorhanden)
- 3-Wege-Generierung (Alle Wege begehbar)
- End-Raum erreichbar (Von allen 3 Wegen)
- Tür-Validierung (Alle Türen führen zu Räumen)
- Wand-Orientierung (Visual mit Screenshots)
- Doppelte Wände (Scan im Game-State)
- Stress-Test (10-50 Dungeons generieren)

**Erfolgskriterium:** Alle Tests bestehen (0 Failures)

---

### **Visual-Tests**
**Zweck:** Manuelle Inspektion von Rendering und UX
**Tools:** Browser, Cheat-Menü, Screenshots
**Dateien:** `test-results/*.png`

**Zu testen:**
- Wände sehen korrekt aus (Orientierung, Tiles)
- Türen sehen gut aus (horizontal/vertikal)
- Keine visuellen Artefakte (Magenta-Tiles)
- Dungeon-Struktur ist klar erkennbar
- Spawn-Raum/End-Raum visuell unterscheidbar

**Erfolgskriterium:** Keine visuellen Fehler, professioneller Look

---

### **Stress-Tests**
**Zweck:** Stabilität und Performance unter Last
**Tools:** Playwright, Performance-Profiling
**Dateien:** `tests/e2e/stress.spec.ts`

**Zu testen:**
- 100 Dungeons generieren → alle valid
- Keine Memory-Leaks
- Generierungs-Zeit < 2 Sekunden
- FPS bleibt bei 60

**Erfolgskriterium:** Keine Crashes, konsistente Performance

---

## 📦 Lieferables

### **Code:**
- [ ] Alle neuen Dateien erstellt und implementiert
- [ ] Alle geänderten Dateien aktualisiert
- [ ] Keine Console-Errors
- [ ] TypeScript-Typen vollständig
- [ ] Code-Kommentare für komplexe Logik

### **Tests:**
- [ ] Unit-Tests für alle neuen Funktionen
- [ ] E2E-Tests mit Playwright
- [ ] Alle Tests bestehen (100%)

### **Dokumentation:**
- [ ] Dieser Plan (✅ fertig)
- [ ] Implementation-History in `/docs/History/`
- [ ] Inline-Kommentare im Code
- [ ] README-Updates falls nötig

### **Seed-Daten:**
- [ ] 3-5 Spawn-Raum-Layouts in `seed-room-layouts.json`
- [ ] 2-3 End-Raum-Layouts in `seed-room-layouts.json`
- [ ] Mehrere Sackgassen-Layouts

---

## ⏰ Zeitplan

| Phase | Schritte | Dauer | Status |
|-------|----------|-------|--------|
| **Phase 1** | 1-2 | 2-3h | ⏳ Pending |
| **Phase 2** | 3-4 | 3-4h | ⏳ Pending |
| **Phase 3** | 5-7 | 4-5h | ⏳ Pending |
| **Phase 4** | 8-10 | 3-4h | ⏳ Pending |
| **Gesamt** | 1-10 | 12-16h | ⏳ Pending |

---

## ✅ Finale Checkliste

### **Funktionalität:**
- [ ] Spawn-Raum wird immer als erstes platziert
- [ ] Spawn-Raum hat genau 3 Türen (Nord, Ost, West)
- [ ] 3 separate Pfade gehen vom Spawn-Raum ab
- [ ] End-Raum wird platziert
- [ ] Alle 3 Pfade führen zum End-Raum
- [ ] Pfade haben unterschiedliche Längen (zufällig)
- [ ] Manche Pfade haben Abzweigungen
- [ ] Sackgassen werden automatisch verwendet
- [ ] Spieler spawnt in Spawn-Raum
- [ ] Alle Räume sind vom Spawn-Raum erreichbar

### **Fehler-Fixes:**
- [ ] Keine doppelten Wände zwischen Räumen
- [ ] Alle Türen haben Raum auf beiden Seiten
- [ ] Wände haben korrekte Ausrichtung (horizontal/vertikal)
- [ ] Keine ungültigen Türen mehr

### **Testing:**
- [ ] Alle Unit-Tests bestehen (100%)
- [ ] Alle E2E-Tests bestehen (100%)
- [ ] Visual-Tests zeigen keine Fehler
- [ ] Stress-Tests (10+ Dungeons) erfolgreich
- [ ] Cheat-Menü funktioniert

### **Performance:**
- [ ] Generierung < 2 Sekunden
- [ ] 60 FPS beim Spielen
- [ ] Keine Memory-Leaks

### **Code-Qualität:**
- [ ] Keine Console-Errors
- [ ] TypeScript-Typen vollständig
- [ ] Code gut kommentiert
- [ ] Keine TODOs übrig

---

**Status:** ✅ Liste vollständig, bereit für Implementierung
