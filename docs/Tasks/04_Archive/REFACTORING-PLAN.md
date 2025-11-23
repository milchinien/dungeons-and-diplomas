# Refactoring-Plan 2025-11-23

## Zusammenfassung

Die Codebasis ist grundsätzlich gut strukturiert mit klarer Schichtentrennung (UI → Hooks → Engine → Utilities → Database). Die Hauptprobleme sind zwei **God Files** (`Enemy.ts` mit 498 Zeilen, `CombatModal.tsx` mit 484 Zeilen), **Testbarkeits-Probleme** durch direkte Abhängigkeits-Instanziierung und Browser-API-Kopplung, sowie **Code-Duplikation** bei API-Error-Handling (58+ Stellen) und CRUD-Routes.

## Architektur-Snapshot

```
next-app/
├── app/                     # Next.js App Router + API Routes (19 Endpoints)
├── components/ (25)         # React Components (~5.100 Zeilen)
├── hooks/ (6)               # Custom Hooks (~1.200 Zeilen)
├── lib/ (40+)               # Core Game Logic (~6.400 Zeilen)
│   ├── api/                 # Client-side API Layer
│   ├── db/                  # Database Layer (modular)
│   ├── game/                # Core Engine (GameEngine, DungeonManager)
│   ├── dungeon/             # Dungeon Generation (BSP)
│   ├── rendering/           # Canvas Rendering
│   ├── combat/              # Combat Utilities
│   ├── physics/             # Collision Detection
│   ├── pathfinding/         # A* Pathfinding
│   ├── scoring/             # ELO Calculation
│   └── tiletheme/           # Tile Theme System
└── public/Assets/           # Sprites, Tilesets
```

**Gesamtumfang:** ~110 Dateien, ~15.400 Zeilen Code

---

## Identifizierte Refactorings

### [R01] Enemy.ts in Module aufteilen (God File)

**Problem:** `lib/Enemy.ts` (498 Zeilen) vereint AI-State-Machine, Pathfinding, Collision, Rendering und Animation in einer Klasse. Verstößt gegen Single Responsibility Principle und ist kaum testbar.

**Betroffene Dateien:**
- `lib/Enemy.ts:1-498` - Gesamte Datei muss aufgeteilt werden
- `lib/game/GameEngine.ts:245` - Enemy-Referenzen
- `lib/game/DungeonManager.ts:283-290` - Enemy-Instanziierung
- `hooks/useCombat.ts:170` - Enemy.takeDamage() Aufruf

**Lösung:** Aufteilen in Module:
```
lib/enemy/
├── Enemy.ts (~100 Zeilen)        # Daten & Properties
├── EnemyAI.ts (~200 Zeilen)      # AI State Machine
├── EnemyRenderer.ts (~120 Zeilen) # Rendering & HP-Bar
└── index.ts                       # Re-exports
```

**Aufwand:** L | **Risiko:** mittel

**Schritte:**
1. `lib/enemy/` Verzeichnis erstellen
2. `EnemyRenderer.ts` extrahieren: `draw()` Methode + HP-Bar + Status-Anzeige
3. `EnemyAI.ts` extrahieren: `update()` Logik, State-Machine (IDLE/WANDERING/FOLLOWING)
4. `Enemy.ts` als Datenklasse belassen: Properties, `takeDamage()`, `load()`
5. Dependencies über Constructor Injection: `constructor(ai: EnemyAI, renderer: EnemyRenderer)`
6. Imports in allen konsumierenden Dateien aktualisieren
7. Unit Tests für AI State-Machine schreiben

**Temporäre Tests:**
- Test: AI-State-Übergänge (IDLE → WANDERING → FOLLOWING)
- Test: Aggro-Radius basierend auf Player-ELO
- Test: Pathfinding-Integration
- Diese Tests bleiben permanent (keine Löschung)

---

### [R02] CombatModal.tsx aufteilen (God Component)

**Problem:** `components/CombatModal.tsx` (484 Zeilen) mischt UI, Timer-Logik, Animationen und State-Management.

**Betroffene Dateien:**
- `components/CombatModal.tsx:1-484` - Gesamte Komponente
- `components/GameCanvas.tsx:~150` - CombatModal-Verwendung

**Lösung:** In kleinere Komponenten aufteilen:
```
components/combat/
├── CombatModal.tsx (~150 Zeilen)    # Container, Layout
├── CombatQuestion.tsx (~100 Zeilen) # Frage-Anzeige
├── CombatAnswers.tsx (~100 Zeilen)  # Antwort-Buttons
├── CombatTimer.tsx (~60 Zeilen)     # Timer mit Animation
└── CombatFeedback.tsx (~80 Zeilen)  # Feedback nach Antwort
```

**Aufwand:** M | **Risiko:** niedrig

**Schritte:**
1. `CombatTimer.tsx` extrahieren (einfachste Komponente)
2. `CombatQuestion.tsx` extrahieren (Frage + Difficulty-Indicator)
3. `CombatAnswers.tsx` extrahieren (Buttons + Shuffle-State)
4. `CombatFeedback.tsx` extrahieren (Richtig/Falsch Animation)
5. `CombatModal.tsx` als Container belassen mit Props-Drilling
6. Shared State über Context oder Props

---

### [R03] API Error Handler extrahieren

**Problem:** Identisches Try-Catch-Pattern in 58+ API-Route-Stellen:
```typescript
try { ... } catch (error) {
  console.error('Error [action]:', error);
  return NextResponse.json({ error: 'Failed to [action]' }, { status: 500 });
}
```

**Betroffene Dateien:**
- `app/api/answers/route.ts:50-52`
- `app/api/xp/route.ts:33-38`
- `app/api/session-elo/route.ts:18-20`
- `app/api/questions-with-elo/route.ts:18-22`
- `app/api/stats/route.ts:128-131`
- Und 13+ weitere API Routes

**Lösung:** Shared Error Handler erstellen:
```typescript
// lib/api/errorHandler.ts
export function handleApiError(error: unknown, action: string): NextResponse {
  console.error(`Error ${action}:`, error);
  return NextResponse.json({ error: `Failed to ${action}` }, { status: 500 });
}

// Oder Higher-Order-Function:
export function withErrorHandler<T>(
  handler: () => Promise<T>,
  action: string
): Promise<NextResponse> { ... }
```

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. `lib/api/errorHandler.ts` erstellen
2. In einer Route testen (z.B. `/api/subjects`)
3. Alle 18+ API Routes refactoren
4. Lint-Rule für konsistente Verwendung

---

### [R04] useGameState Dependency Injection

**Problem:** Hook instanziiert Abhängigkeiten direkt, Browser-APIs werden direkt aufgerufen:
```typescript
const gameEngineRef = useRef<GameEngine>(new GameEngine());
window.addEventListener('resize', handleResize);
gameLoopIdRef.current = requestAnimationFrame(gameLoop);
```

**Betroffene Dateien:**
- `hooks/useGameState.ts:72-74` - Direkte Instanziierung
- `hooks/useGameState.ts:94-103` - Direkte fetch() Aufrufe
- `hooks/useGameState.ts:215` - requestAnimationFrame
- `hooks/useGameState.ts:272-274` - window.addEventListener

**Lösung:** Factory-Pattern und Abstraktion:
```typescript
interface GameStateConfig {
  gameEngineFactory?: () => GameEngine;
  rendererFactory?: () => GameRenderer;
  scheduler?: { requestFrame: (cb: () => void) => number };
  eventTarget?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}

export function useGameState(config: GameStateConfig = {}) { ... }
```

**Aufwand:** M | **Risiko:** mittel

**Schritte:**
1. `GameStateConfig` Interface definieren
2. Default-Factories für Production erstellen
3. Hook Parameter erweitern mit optionalem Config
4. Browser-APIs durch injizierbare Abstraktionen ersetzen
5. Unit Tests mit Mock-Factories schreiben

**Temporäre Tests:**
- Test: Game Loop startet/stoppt korrekt
- Test: Keyboard-Events werden verarbeitet
- Test: Player-Collision funktioniert
- Tests bleiben permanent

---

### [R05] QuestionSelector von API-Call trennen

**Problem:** `QuestionSelector.ts` führt API-Call und Selection-Logik in einer Funktion aus:
```typescript
const response = await fetch(`/api/questions-with-elo?subject=${enemy.subject}&userId=${userId}`);
```

**Betroffene Dateien:**
- `lib/combat/QuestionSelector.ts:9` - fetch() Aufruf
- `lib/combat/QuestionSelector.ts:17-47` - Selection-Logik mit `any` Types
- `hooks/useCombat.ts:97` - selectQuestion() Aufruf

**Lösung:** Pure Function + API-Call Separation:
```typescript
// Pure Selection (testbar)
export function selectQuestionFromPool(
  questions: QuestionWithElo[],
  enemyLevel: number,
  askedQuestions: Set<number>
): QuestionWithElo | null { ... }

// API Wrapper (in useCombat.ts)
const questions = await api.questions.getQuestionsWithElo(enemy.subject, userId);
const question = selectQuestionFromPool(questions, enemy.level, askedQuestionsRef.current);
```

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. `selectQuestionFromPool()` als pure function extrahieren
2. Proper Typing mit `QuestionWithElo[]` statt `any`
3. API-Call in `useCombat.ts` verschieben
4. Optional: Seeded RNG Parameter für deterministische Tests
5. Unit Tests für Selection-Algorithmus

---

### [R06] RNG-Duplikation konsolidieren

**Problem:** Zwei verschiedene RNG-Algorithmen (Mulberry32 vs LCG), identische `createRng()` Funktion dupliziert:

**Betroffene Dateien:**
- `lib/dungeon/SeededRandom.ts:1-68` - Mulberry32 Implementation
- `lib/spawning/LevelDistribution.ts:13-37` - LCG createRng() Funktion
- `lib/tiletheme/RenderMapGenerator.ts:14-37` - Identische createRng() Kopie

**Lösung:** Einheitliche RNG-Klasse verwenden:
```typescript
// lib/random/SeededRandom.ts (existiert bereits)
import { SeededRandom } from '../dungeon/SeededRandom';

// In LevelDistribution.ts und RenderMapGenerator.ts:
const rng = new SeededRandom(seed);
const value = rng.next(); // statt createRng(seed)()
```

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. `SeededRandom` als zentrale Klasse definieren
2. `createRng()` in `LevelDistribution.ts` durch `SeededRandom` ersetzen
3. `createRng()` in `RenderMapGenerator.ts` durch `SeededRandom` ersetzen
4. Verify: Dungeon-Generation produziert identische Ergebnisse mit gleichem Seed

---

### [R07] Overlay Components konsolidieren

**Problem:** `VictoryOverlay.tsx` und `DefeatOverlay.tsx` haben nahezu identische Struktur:
- Identisches CSS-Positioning
- Identische Animation-Patterns
- Gleiche setTimeout-Logik

**Betroffene Dateien:**
- `components/VictoryOverlay.tsx:20-50` - Overlay-Struktur
- `components/DefeatOverlay.tsx:20-50` - Nahezu identischer Code

**Lösung:** Shared Base Component:
```typescript
// components/GameOverlay.tsx
interface GameOverlayProps {
  title: string;
  subtitle?: string;
  backgroundColor: string;
  onContinue: () => void;
  autoCloseDelay?: number;
}

export function GameOverlay({ ... }: GameOverlayProps) { ... }

// Usage:
<GameOverlay title="VICTORY!" backgroundColor="rgba(0,100,0,0.9)" ... />
<GameOverlay title="DEFEAT!" backgroundColor="rgba(100,0,0,0.9)" ... />
```

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. `GameOverlay.tsx` Base Component erstellen
2. `VictoryOverlay.tsx` refactoren um GameOverlay zu nutzen
3. `DefeatOverlay.tsx` refactoren um GameOverlay zu nutzen
4. CSS Animations in shared styles extrahieren

---

### [R08] useCombat Timer-Logik extrahieren

**Problem:** Timer-Management mit setInterval ist direkt im Hook implementiert:
```typescript
combatTimerIntervalRef.current = setInterval(() => {
  setCombatTimer(prev => {
    if (prev <= 1) { clearInterval(...); answerQuestion(-1); return 0; }
    return prev - 1;
  });
}, 1000);
```

**Betroffene Dateien:**
- `hooks/useCombat.ts:114-123` - Timer-Implementierung
- `hooks/useCombat.ts:41-46` - Multiple Refs für State

**Lösung:** Custom `useTimer` Hook extrahieren:
```typescript
// hooks/useTimer.ts
interface UseTimerOptions {
  duration: number;
  onExpire: () => void;
  scheduler?: { setInterval: typeof setInterval; clearInterval: typeof clearInterval };
}

export function useTimer({ duration, onExpire, scheduler }: UseTimerOptions) {
  // ... Timer-Logik
  return { timeRemaining, start, stop, reset };
}
```

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. `useTimer.ts` Hook erstellen
2. Timer-Logik aus `useCombat.ts` extrahieren
3. Scheduler als optionaler Parameter für Tests
4. `useCombat.ts` refactoren um `useTimer` zu nutzen
5. Unit Tests mit Fake Timers

---

### [R09] GameEngine Parameter Object Pattern

**Problem:** `updatePlayer()` hat 13 Parameter, was Lesbarkeit und Testbarkeit erschwert:
```typescript
public updatePlayer(
  dt: number, player: Player, keys: KeyboardState, tileSize: number,
  dungeon: TileType[][], roomMap: number[][], rooms: Room[],
  playerSprite: SpriteSheetLoader | null, inCombat: boolean,
  doorStates: Map<string, boolean>, enemies: Enemy[],
  treasures?: Set<string>, onTreasureCollected?: (x, y) => void
)
```

**Betroffene Dateien:**
- `lib/game/GameEngine.ts:143-157` - updatePlayer() Signatur
- `hooks/useGameState.ts:~200` - Aufruf mit vielen Parametern

**Lösung:** Parameter Object einführen:
```typescript
interface UpdatePlayerContext {
  dt: number;
  player: Player;
  keys: KeyboardState;
  tileSize: number;
  dungeon: TileType[][];
  roomMap: number[][];
  rooms: Room[];
  playerSprite: SpriteSheetLoader | null;
  inCombat: boolean;
  doorStates: Map<string, boolean>;
  enemies: Enemy[];
  treasures?: Set<string>;
  onTreasureCollected?: (x: number, y: number) => void;
}

public updatePlayer(context: UpdatePlayerContext) { ... }
```

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. `UpdatePlayerContext` Interface in `constants.ts` definieren
2. `updatePlayer()` Signatur ändern
3. Aufrufstellen in `useGameState.ts` anpassen
4. Optional: Ähnliche Pattern für andere große Funktionen

---

### [R10] Type Definitions konsolidieren

**Problem:** Identische Type-Interfaces an mehreren Stellen definiert:
- `AnswerLogEntry` in `lib/api/answers.ts` und `lib/db/index.ts`
- `SubjectEloScore` in `lib/api/elo.ts` und `lib/db/questions.ts`
- `LoginResponse` in `lib/api/auth.ts` und API-Route

**Betroffene Dateien:**
- `lib/api/answers.ts:7-14` - AnswerLogEntry
- `lib/api/elo.ts:7-11` - SubjectEloScore
- `lib/api/auth.ts:11-15` - LoginResponse
- `lib/db/questions.ts:47-51` - SubjectEloScore Duplikat

**Lösung:** Zentrale Types-Datei:
```typescript
// lib/types/api.ts
export interface AnswerLogEntry { ... }
export interface SubjectEloScore { ... }
export interface LoginResponse { ... }

// In allen Dateien:
import { AnswerLogEntry } from '../types/api';
```

**Aufwand:** S | **Risiko:** niedrig

**Schritte:**
1. `lib/types/api.ts` erstellen mit allen API-Types
2. Duplikate durch Imports ersetzen
3. Barrel Export in `lib/types/index.ts`
4. TypeScript-Compiler verifiziert korrekte Verwendung

---

## Abhängigkeiten zwischen Refactorings

```
R03 (API Error Handler) → unabhängig
R05 (QuestionSelector) → unabhängig
R06 (RNG Konsolidierung) → unabhängig
R07 (Overlay Components) → unabhängig
R08 (Timer Hook) → vor R02
R09 (Parameter Object) → vor R04
R10 (Type Definitions) → vor R05

R01 (Enemy Split) → nach R09 (für konsistente Patterns)
R02 (CombatModal Split) → nach R08 (Timer bereits extrahiert)
R04 (useGameState DI) → nach R09 (Parameter Object Pattern etabliert)
```

## Priorisierung nach Impact/Risiko

| Erledigt | Priorität | ID | Impact | Risiko | Quick Win? |
|----------|-----------|----|--------|--------|------------|
| ✅ | 1 | R03 | Hoch | Niedrig | ✅ |
| ✅ | 2 | R05 | Hoch | Niedrig | ✅ |
| ✅ | 3 | R06 | Mittel | Niedrig | ✅ |
| ✅ | 4 | R10 | Mittel | Niedrig | ✅ |
| ✅ | 5 | R07 | Niedrig | Niedrig | ✅ |
| ✅ | 6 | R08 | Mittel | Niedrig | ✅ |
| ✅ | 7 | R09 | Mittel | Niedrig | |
| ✅ | 8 | R02 | Hoch | Niedrig | |
| ✅ | 9 | R04 | Hoch | Mittel | |
| ✅ | 10 | R01 | Sehr Hoch | Mittel | |

**Empfohlene Reihenfolge:** R03 → R05 → R06 → R10 → R08 → R09 → R07 → R02 → R04 → R01

---

## Nicht behandelt in diesem Plan

- **CRUD Route Factory Pattern** - Würde 8+ Route-Files vereinfachen, aber niedrigerer Impact
- **ELO-Calculation Inkonsistenz** - Zwei verschiedene Algorithmen (Simple Percentage vs Progressive), benötigt Produkt-Entscheidung
- **Server-Side Combat Validation** - Aktuell rein client-seitig, größeres Feature
- **Error Boundaries für React** - Wichtig für Production, aber separates Thema
- **Test-Suite Aufbau** - Sollte nach Refactoring-Phase erfolgen
