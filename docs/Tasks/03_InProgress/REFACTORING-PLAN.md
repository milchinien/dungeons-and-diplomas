# Refactoring-Plan 2025-11-23

## Fortschritt

**Sprint 1 (Quick Wins) - ABGESCHLOSSEN ✅**
- [R01] API-Abstraktionsschicht konsequent nutzen ✅
- [R05] Duplizierte ELO-Lade-Logik extrahieren ✅
- [R06] Inkonsistente API-Validierung vereinheitlichen ✅
- [R07] Enemy-AI Pathfinder injizierbar machen ✅
- [R10] Zentrales Error-Handling für Hooks ✅

**Sprint 2 (Komponenten-Aufspaltung) - ABGESCHLOSSEN ✅**
- [R04] SkillDashboard Component modularisieren ✅
- [R02] useCombat Hook aufteilen ✅ (via Combat Reducer Pattern in R06)
- [R03] DungeonView Component aufteilen ✅

**Sprint 3 (Komplexe Refactorings) - ABGESCHLOSSEN ✅**
- [R08] useTilemapEditorState Hook aufteilen ✅
- [R09] TileRenderer aus GameRenderer extrahieren ✅

## Zusammenfassung

Die Codebasis ist insgesamt gut strukturiert mit klarer Trennung von Concerns. Es gibt jedoch einige "God-Files" (>300 Zeilen), inkonsistente Verwendung der API-Abstraktionsschicht und Testbarkeits-Probleme durch direkte Abhängigkeiten. Die bestehenden Abstraktionen (Storage, Clock, Database) sind gut, werden aber nicht konsequent genutzt.

## Architektur-Snapshot

```
next-app/
├── app/api/         # 22 API Routes - gut strukturiert, kleine Dateien
├── components/      # 32 Komponenten - einige kritisch große Dateien
│   ├── combat/      # 8 Combat-UI-Komponenten
│   ├── editor/      # 5 Editor-Komponenten
│   ├── tilemapeditor/ # 7 Tilemap-Editor-Komponenten
│   └── character/   # 5 Character-UI-Komponenten
├── hooks/           # 9 Hooks - 3 sind zu groß (>250 Zeilen)
└── lib/             # 118 Dateien - gut modularisiert
    ├── api/         # API-Client mit Error-Handling
    ├── combat/      # Combat-System mit Reducer
    ├── db/          # Datenbank-Operationen
    ├── game/        # Game-Engine
    ├── enemy/       # Enemy-AI-System
    ├── rendering/   # Canvas-Rendering
    └── tiletheme/   # Tileset-System
```

**Metriken:**
- 167 TypeScript/TSX Dateien
- 15.853 LOC total
- 3 Dateien >300 Zeilen (kritisch)
- 9 Dateien >250 Zeilen (überwachungspflichtig)
- Durchschnittliche Dateigröße: 95 Zeilen (gesund)

## Identifizierte Refactorings

### [R01] API-Abstraktionsschicht konsequent nutzen

**Problem:** Einige Komponenten und Hooks umgehen die existierende API-Abstraktionsschicht (`lib/api/`) und rufen `fetch()` direkt auf. Dies macht Tests schwierig und führt zu inkonsistenter Fehlerbehandlung.

**Betroffene Dateien:**
- `components/LoginModal.tsx:26-32` - Direkter fetch() Aufruf statt api.auth.login()
- `hooks/useAuth.ts:46` - Direkter fetch('/api/auth/logout') statt api.auth.logout()
- `components/SkillDashboard.tsx:71` - Direkter fetch(/api/stats) statt API-Client

**Lösung:** Alle direkten fetch()-Aufrufe durch die existierende API-Abstraktionsschicht ersetzen.

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. In LoginModal.tsx: `fetch('/api/auth/login')` durch `api.auth.login()` ersetzen
2. In useAuth.ts: `fetch('/api/auth/logout')` durch `api.auth.logout()` ersetzen
3. In SkillDashboard.tsx: `fetch(/api/stats)` durch API-Client ersetzen (falls nicht vorhanden, erstellen)
4. Prüfen ob weitere direkte fetch()-Aufrufe existieren

---

### [R02] useCombat Hook aufteilen

**Problem:** Der useCombat Hook hat 282 Zeilen und mischt mehrere Verantwortlichkeiten: State-Management, API-Aufrufe, Timer-Logik und Schadens-Berechnung. Dies erschwert Tests und Wartung.

**Betroffene Dateien:**
- `hooks/useCombat.ts:1-282` - Gesamter Hook ist zu groß

**Lösung:** Den Hook in fokussierte Sub-Hooks aufteilen, die jeweils eine klare Verantwortlichkeit haben.

**Aufwand:** M | **Risiko:** mittel

**Schritte:**
1. Extrahiere `useCombatQuestion()` - Fragen-Logik (fetch, select, shuffle)
2. Extrahiere `useCombatDamage()` - Schadens-Berechnung und HP-Updates
3. Der Haupt-Hook orchestriert nur noch die Sub-Hooks
4. Tests für jeden Sub-Hook schreiben

**Abhängigkeiten:** Keine

---

### [R03] DungeonView Component aufteilen

**Problem:** DungeonView.tsx hat 379 Zeilen und kombiniert Canvas-Rendering, Theme-Loading und Sprite-Animation in einer Komponente.

**Betroffene Dateien:**
- `components/combat/DungeonView.tsx:1-379` - God-Component

**Lösung:** In fokussierte Sub-Komponenten aufteilen.

**Aufwand:** M | **Risiko:** mittel

**Schritte:**
1. Extrahiere `<DungeonCanvas />` - Pure Rendering-Logik
2. Extrahiere `useDungeonTheme()` Hook - Theme-Management
3. Extrahiere `useDungeonSprites()` Hook - Sprite-Animation
4. DungeonView wird zum Orchestrator

**Abhängigkeiten:** Keine

---

### [R04] SkillDashboard Component modularisieren

**Problem:** SkillDashboard.tsx hat 333 Zeilen mit inline definierten Sub-Komponenten und komplexer Filterung/Sortierung.

**Betroffene Dateien:**
- `components/SkillDashboard.tsx:1-333` - God-Component

**Lösung:** Sub-Komponenten extrahieren und State-Management vereinfachen.

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. Extrahiere `<SubjectStatCard />` - Fächer-Statistik-Karte
2. Extrahiere `<QuestionStatsList />` - Fragen-Liste mit Statistiken
3. Extrahiere `useDashboardData()` Hook - Daten-Fetching und Transformation
4. Dashboard-Layout bleibt als Container

**Abhängigkeiten:** [R01] sollte vorher abgeschlossen sein

---

### [R05] Duplizierte ELO-Lade-Logik extrahieren

**Problem:** Die gleiche ELO-Lade-Logik erscheint mehrfach in useCombat.ts und useScoring.ts.

**Betroffene Dateien:**
- `hooks/useCombat.ts:54-65` - loadPlayerElo Callback
- `hooks/useCombat.ts:210-216` - ELO-Laden in startCombat
- `hooks/useScoring.ts:16-38` - loadSessionElos
- `hooks/useScoring.ts:40-63` - updateSessionScores

**Lösung:** Gemeinsame ELO-Service-Funktionen oder Hook extrahieren.

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. Erstelle `lib/scoring/EloService.ts` mit Funktionen für ELO-Laden
2. Oder erstelle `useEloData()` Hook für gemeinsame Logik
3. Ersetze duplizierte Aufrufe durch Service/Hook
4. Unit-Tests für ELO-Service schreiben

**Abhängigkeiten:** Keine

---

### [R06] Inkonsistente Validierung in API-Routes vereinheitlichen

**Problem:** Einige API-Routes nutzen die Validierungs-Utilities aus `lib/api/validation.ts`, andere machen manuelle Typ-Checks.

**Betroffene Dateien:**
- `app/api/answers/route.ts:11-36` - Manuelle Validierung
- `app/api/questions-with-elo/route.ts:4-13` - Nutzt Validation-Utilities (gut!)

**Lösung:** Alle API-Routes auf die zentrale Validierung umstellen.

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. Identifiziere alle Routes mit manueller Validierung
2. Erstelle Validierungs-Schemas für fehlende Routen
3. Ersetze manuelle Checks durch `getRequiredIntParam`, `getRequiredStringParam`
4. Teste alle API-Endpoints

**Abhängigkeiten:** Keine

---

### [R07] Enemy-AI Pathfinder injizierbar machen

**Problem:** EnemyAI.ts ruft `AStarPathfinder.findPath()` direkt auf (statische Methode). Dies macht Unit-Tests schwierig, da der Pathfinder nicht gemockt werden kann.

**Betroffene Dateien:**
- `lib/enemy/EnemyAI.ts:177-181` - Direkter Aufruf von AStarPathfinder

**Lösung:** Pathfinder als Dependency Injection implementieren.

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. Definiere `Pathfinder` Interface in `lib/enemy/types.ts`
2. Erstelle `DefaultPathfinder` Wrapper um AStarPathfinder
3. EnemyAI akzeptiert Pathfinder als Constructor-Parameter
4. Tests können MockPathfinder injizieren

**Abhängigkeiten:** Keine

---

### [R08] useTilemapEditorState Hook aufteilen

**Problem:** Der Hook hat 317 Zeilen und verwaltet zu viele verschiedene State-Bereiche: Theme-State, Tileset-Selection, Drag-Drop-Logik.

**Betroffene Dateien:**
- `hooks/useTilemapEditorState.ts:1-317` - Überladen mit Verantwortlichkeiten

**Lösung:** In fokussierte Hooks aufteilen.

**Aufwand:** M | **Risiko:** mittel

**Schritte:**
1. Extrahiere `useTileThemeState()` - Theme-Management
2. Extrahiere `useTilesetSelection()` - Tileset-Auswahl
3. Extrahiere `useTileDragDrop()` - Drag-Drop-Logik
4. Orchestrator-Hook kombiniert die Sub-Hooks

**Abhängigkeiten:** Keine

---

### [R09] TileRenderer aus GameRenderer extrahieren

**Problem:** GameRenderer.ts hat 250 Zeilen und mischt Tile-Rendering mit allgemeinem Rendering-Setup.

**Betroffene Dateien:**
- `lib/rendering/GameRenderer.ts:1-250` - Gemischte Verantwortlichkeiten

**Lösung:** Tile-Rendering in eigene Klasse extrahieren.

**Aufwand:** M | **Risiko:** mittel

**Schritte:**
1. Erstelle `lib/rendering/TileRenderer.ts`
2. Extrahiere `renderTile()`, `renderFloor()`, `renderWall()` Methoden
3. GameRenderer nutzt TileRenderer für Tile-Operationen
4. TileRenderer ist separat testbar

**Abhängigkeiten:** Keine

---

### [R10] Zentrales Error-Handling für Hooks

**Problem:** Jeder Hook hat seine eigene try-catch-console.error Struktur. Keine konsistente Fehlerbehandlung oder Recovery-Mechanismen.

**Betroffene Dateien:**
- `hooks/useAuth.ts:32` - console.error('Failed to reload user XP')
- `hooks/useCombat.ts:62,89,134,166,215` - 5x console.error()
- `hooks/useScoring.ts:36,61` - 2x console.error()

**Lösung:** Zentralen Error-Handler für Hooks erstellen.

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. Erstelle `lib/hooks/useErrorHandler.ts` mit zentraler Fehlerbehandlung
2. Definiere Error-Typen (NetworkError, ValidationError, etc.)
3. Optionales User-Feedback (Toast/Snackbar)
4. Ersetze console.error Aufrufe durch Error-Handler

**Abhängigkeiten:** Keine

---

## Priorisierung

### Sprint 1 (Quick Wins - niedriges Risiko)
1. **[R01]** API-Abstraktionsschicht konsequent nutzen
2. **[R05]** Duplizierte ELO-Lade-Logik extrahieren
3. **[R06]** Inkonsistente Validierung in API-Routes vereinheitlichen
4. **[R07]** Enemy-AI Pathfinder injizierbar machen
5. **[R10]** Zentrales Error-Handling für Hooks

### Sprint 2 (Komponenten-Aufspaltung - mittleres Risiko)
6. **[R04]** SkillDashboard Component modularisieren
7. **[R02]** useCombat Hook aufteilen
8. **[R03]** DungeonView Component aufteilen

### Sprint 3 (Komplexe Refactorings)
9. **[R08]** useTilemapEditorState Hook aufteilen
10. **[R09]** TileRenderer aus GameRenderer extrahieren

## Temporäre Tests zur Absicherung

### Für [R02] useCombat Hook aufteilen
- **Vor dem Refactoring:** Snapshot-Tests für Combat-Flow erstellen
- **Zu testende Verhaltensweisen:**
  - Combat-Start initialisiert korrekt
  - Richtige Antwort dealt Schaden an Enemy
  - Falsche Antwort dealt Schaden an Player
  - Timer-Ablauf gilt als falsche Antwort
  - Combat endet wenn HP <= 0
- **Nach Refactoring:** Tests können auf permanente Unit-Tests umgestellt werden

### Für [R03] DungeonView Component aufteilen
- **Vor dem Refactoring:** Visual Regression Tests (Screenshots)
- **Zu testende Verhaltensweisen:**
  - Theme wird korrekt geladen
  - Sprites animieren korrekt
  - Canvas-Größe ist responsiv
- **Nach Refactoring:** Component-Tests für jede Sub-Komponente

### Für [R09] TileRenderer extrahieren
- **Vor dem Refactoring:** Canvas-Output-Tests (Pixel-Vergleiche)
- **Zu testende Verhaltensweisen:**
  - Tiles rendern an korrekten Positionen
  - Tile-Varianten werden korrekt gewählt
  - Fog-of-War maskiert unsichtbare Bereiche
- **Nach Refactoring:** Unit-Tests für TileRenderer-Methoden

## Nicht in diesem Durchlauf

Folgende Punkte wurden identifiziert, aber für spätere Iterationen zurückgestellt:

1. **Multiplayer-Vorbereitung** - Zu umfangreich, erfordert Architektur-Entscheidungen
2. **Performance-Optimierung Canvas-Rendering** - Kein akutes Problem
3. **Sprite-Pooling/Caching** - Nice-to-have, kein Blocker
4. **Request-Deduplication/SWR** - Kann später hinzugefügt werden
