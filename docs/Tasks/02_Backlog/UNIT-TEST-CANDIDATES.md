# Unit Test Kandidaten

**Erstellt:** 2025-11-26
**Status:** Backlog
**Zweck:** Identifikation stabiler, testbarer Code-Elemente im Dungeon-Scroller Spike

---

## Zusammenfassung

Nach Analyse des Spikes `Spikes/2025-11-20-tw-dungeon-scroller/next-app` wurden **23 testbare Komponenten** identifiziert. Diese Liste priorisiert nach:

1. **Stabilität** - Wie wahrscheinlich ist es, dass sich die API ändert?
2. **Wichtigkeit** - Wie kritisch ist die korrekte Funktion für das Spiel?
3. **Testbarkeit** - Wie einfach lassen sich Tests schreiben?

---

## Priorität 1: Kern-Algorithmen (Sofort testen)

Diese Komponenten sind mathematisch definiert, kritisch fürs Gameplay und sehr stabil.

### 1.1 EloCalculator
**Pfad:** `lib/scoring/EloCalculator.ts`

**Funktionen:**
- `calculateProgressiveElo(answers, startingElo)` - ELO-Berechnung aus Antwort-Historie
- `calculateRoundedElo(answers, startingElo)` - Gerundete ELO
- `calculateEloOrNull(answers, startingElo)` - ELO oder null bei leerer Liste
- `calculateAverageElo(questionAnswers, startingElo)` - Durchschnitt über mehrere Fragen

**Testfälle:**
```typescript
describe('EloCalculator', () => {
  describe('calculateProgressiveElo', () => {
    it('should return startingElo for empty array', () => {
      expect(calculateProgressiveElo([], 5)).toBe(5);
    });

    it('should increase ELO for correct answer', () => {
      const result = calculateProgressiveElo([{ is_correct: true, timeout_occurred: false }], 5);
      expect(result).toBeGreaterThan(5);
    });

    it('should decrease ELO for wrong answer', () => {
      const result = calculateProgressiveElo([{ is_correct: false, timeout_occurred: false }], 5);
      expect(result).toBeLessThan(5);
    });

    it('should decrease ELO for timeout', () => {
      const result = calculateProgressiveElo([{ is_correct: false, timeout_occurred: true }], 5);
      expect(result).toBeLessThan(5);
    });

    it('should converge towards 10 with all correct answers', () => {
      const manyCorrect = Array(20).fill({ is_correct: true, timeout_occurred: false });
      const result = calculateProgressiveElo(manyCorrect, 5);
      expect(result).toBeGreaterThan(9);
    });

    it('should converge towards 1 with all wrong answers', () => {
      const manyWrong = Array(20).fill({ is_correct: false, timeout_occurred: false });
      const result = calculateProgressiveElo(manyWrong, 5);
      expect(result).toBeLessThan(2);
    });
  });

  describe('calculateEloOrNull', () => {
    it('should return null for empty array', () => {
      expect(calculateEloOrNull([])).toBeNull();
    });
  });

  describe('calculateAverageElo', () => {
    it('should return startingElo for empty outer array', () => {
      expect(calculateAverageElo([], 5)).toBe(5);
    });

    it('should use startingElo for empty inner arrays', () => {
      expect(calculateAverageElo([[], []], 5)).toBe(5);
    });
  });
});
```

**Warum Prio 1:** ELO ist das zentrale Balancing-System des Spiels. Fehler hier beeinflussen Schwierigkeit und Spielerfahrung direkt.

---

### 1.2 LevelCalculator
**Pfad:** `lib/scoring/LevelCalculator.ts`

**Funktionen:**
- `getXpForLevel(level)` - XP-Schwelle für Level
- `getLevelFromXp(xp)` - Level aus XP berechnen
- `getLevelInfo(xp)` - Vollständige Level-Info inkl. Progress
- `calculateBaseEnemyXp(enemyLevel)` - Basis-XP für Gegner
- `calculateEnemyXpReward(enemyLevel, playerElo)` - XP-Reward mit Skill-Multiplier

**Testfälle:**
```typescript
describe('LevelCalculator', () => {
  describe('getXpForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(getXpForLevel(1)).toBe(0);
    });

    it('should return 500 for level 2', () => {
      expect(getXpForLevel(2)).toBe(500);
    });

    it('should follow formula (level-1)*500', () => {
      expect(getXpForLevel(10)).toBe(4500);
    });
  });

  describe('getLevelFromXp', () => {
    it('should return level 1 for 0 XP', () => {
      expect(getLevelFromXp(0)).toBe(1);
    });

    it('should return level 1 for 499 XP', () => {
      expect(getLevelFromXp(499)).toBe(1);
    });

    it('should return level 2 for 500 XP', () => {
      expect(getLevelFromXp(500)).toBe(2);
    });

    // Inverse-Relation Test
    it('should be inverse of getXpForLevel', () => {
      for (let level = 1; level <= 20; level++) {
        const xp = getXpForLevel(level);
        expect(getLevelFromXp(xp)).toBe(level);
      }
    });
  });

  describe('getLevelInfo', () => {
    it('should calculate correct progress percent', () => {
      const info = getLevelInfo(250); // Halfway through level 1
      expect(info.progressPercent).toBe(50);
    });
  });

  describe('calculateEnemyXpReward', () => {
    it('should give less XP for easy kills (high ELO vs low level)', () => {
      const easyKill = calculateEnemyXpReward(1, 10); // Level 1 vs ELO 10
      const hardKill = calculateEnemyXpReward(10, 1); // Level 10 vs ELO 1
      expect(easyKill).toBeLessThan(hardKill);
    });
  });
});
```

**Warum Prio 1:** XP/Level-Progression ist ein zentrales Spielelement, Formel ist stabil definiert.

---

### 1.3 DamageCalculator
**Pfad:** `lib/combat/DamageCalculator.ts`

**Funktionen:**
- `calculatePlayerDamage(playerElo, enemyLevel)` - Spieler-Schaden gegen Feind
- `calculateEnemyDamage(playerElo, enemyLevel)` - Feind-Schaden gegen Spieler

**Testfälle:**
```typescript
describe('DamageCalculator', () => {
  describe('calculatePlayerDamage', () => {
    it('should return 10 for equal ELO and level', () => {
      expect(calculatePlayerDamage(5, 5)).toBe(10);
    });

    it('should cap at 30 max damage', () => {
      expect(calculatePlayerDamage(10, 1)).toBe(28); // 10 + 9*2 = 28
      expect(calculatePlayerDamage(20, 1)).toBe(30); // Would be 48, capped
    });

    it('should have minimum 5 damage', () => {
      expect(calculatePlayerDamage(1, 10)).toBe(5); // 10 + (-9)*2 = -8 -> 5
    });
  });

  describe('calculateEnemyDamage', () => {
    it('should be inverse of player damage', () => {
      // When player is strong, enemy is weak and vice versa
      const playerDmg = calculatePlayerDamage(10, 5);
      const enemyDmg = calculateEnemyDamage(10, 5);
      expect(playerDmg).toBeGreaterThan(enemyDmg);
    });
  });
});
```

**Warum Prio 1:** Kampf-Balancing, einfache Formel mit klaren Grenzen (5-30).

---

## Priorität 2: Datenstrukturen & Algorithmen

### 2.1 SeededRandom
**Pfad:** `lib/dungeon/SeededRandom.ts`

**Funktionen:**
- `next()` - Nächste Zufallszahl [0, 1)
- `nextInt(min, max)` - Integer im Bereich [min, max)
- `nextIntMax(max)` - Integer im Bereich [0, max)
- `nextBoolean(probability)` - Boolean mit Wahrscheinlichkeit

**Testfälle:**
```typescript
describe('SeededRandom', () => {
  it('should produce same sequence for same seed', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('should produce different sequences for different seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(54321);

    const seq1 = Array(10).fill(0).map(() => rng1.next());
    const seq2 = Array(10).fill(0).map(() => rng2.next());
    expect(seq1).not.toEqual(seq2);
  });

  it('next() should return values in [0, 1)', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('nextInt should return values in [min, max)', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 1000; i++) {
      const val = rng.nextInt(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThan(10);
    }
  });

  it('nextBoolean(0) should always return false', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 100; i++) {
      expect(rng.nextBoolean(0)).toBe(false);
    }
  });

  it('nextBoolean(1) should always return true', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 100; i++) {
      expect(rng.nextBoolean(1)).toBe(true);
    }
  });

  it('setSeed should reset sequence', () => {
    const rng = new SeededRandom(12345);
    const first = rng.next();
    rng.next(); rng.next(); // Advance
    rng.setSeed(12345);
    expect(rng.next()).toBe(first);
  });
});
```

**Warum Prio 2:** Basis für deterministische Dungeon-Generation, kritisch für Reproduzierbarkeit.

---

### 2.2 UnionFind
**Pfad:** `lib/dungeon/UnionFind.ts`

**Funktionen:**
- `find(i)` - Root des Elements finden (mit Path Compression)
- `union(i, j)` - Zwei Sets vereinigen

**Testfälle:**
```typescript
describe('UnionFind', () => {
  it('should initialize each element as its own set', () => {
    const uf = new UnionFind(5);
    for (let i = 0; i < 5; i++) {
      expect(uf.find(i)).toBe(i);
    }
  });

  it('union should connect two elements', () => {
    const uf = new UnionFind(5);
    uf.union(0, 1);
    expect(uf.find(0)).toBe(uf.find(1));
  });

  it('union should return true for new connection', () => {
    const uf = new UnionFind(5);
    expect(uf.union(0, 1)).toBe(true);
  });

  it('union should return false if already connected', () => {
    const uf = new UnionFind(5);
    uf.union(0, 1);
    expect(uf.union(0, 1)).toBe(false);
  });

  it('should handle transitive connections', () => {
    const uf = new UnionFind(5);
    uf.union(0, 1);
    uf.union(1, 2);
    expect(uf.find(0)).toBe(uf.find(2));
  });

  it('should use path compression', () => {
    const uf = new UnionFind(5);
    uf.union(0, 1);
    uf.union(1, 2);
    uf.union(2, 3);

    // After find, path should be compressed
    uf.find(0);
    expect(uf.parent[0]).toBe(uf.find(3));
  });
});
```

**Warum Prio 2:** Garantiert Dungeon-Konnektivität, klassische Datenstruktur mit klaren Invarianten.

---

### 2.3 TileCoordinates
**Pfad:** `lib/physics/TileCoordinates.ts`

**Funktionen:**
- `getTilePosition(worldX, worldY, tileSize)` - World -> Tile Koordinaten
- `worldToTile(worldCoord, tileSize)` - Einzelne Koordinate
- `tileToWorld(tileX, tileY, tileSize)` - Tile -> World Koordinaten
- `getEntityTilePosition(entity, tileSize)` - Entity-Position zu Tile

**Testfälle:**
```typescript
describe('TileCoordinates', () => {
  const TILE_SIZE = 64;

  describe('getTilePosition', () => {
    it('should return (0,0) for world origin', () => {
      const { tx, ty } = getTilePosition(0, 0, TILE_SIZE);
      expect(tx).toBe(0);
      expect(ty).toBe(0);
    });

    it('should return (1,1) for center of tile (1,1)', () => {
      const { tx, ty } = getTilePosition(64, 64, TILE_SIZE);
      expect(tx).toBe(1);
      expect(ty).toBe(1);
    });

    it('should handle tile center offset correctly', () => {
      // At 32,32 we're at center of tile (0,0) -> should still be tile 0
      const { tx, ty } = getTilePosition(32, 32, TILE_SIZE);
      expect(tx).toBe(0);
      expect(ty).toBe(0);
    });
  });

  describe('tileToWorld', () => {
    it('should return tile origin', () => {
      const { x, y } = tileToWorld(1, 1, TILE_SIZE);
      expect(x).toBe(64);
      expect(y).toBe(64);
    });
  });

  describe('round-trip conversion', () => {
    it('world -> tile -> world should preserve tile origin', () => {
      const worldX = 128;
      const worldY = 192;
      const { tx, ty } = getTilePosition(worldX, worldY, TILE_SIZE);
      const { x, y } = tileToWorld(tx, ty, TILE_SIZE);

      // Should return tile origin, not exact position
      expect(x).toBe(tx * TILE_SIZE);
      expect(y).toBe(ty * TILE_SIZE);
    });
  });
});
```

**Warum Prio 2:** Fundamentale Konvertierung, wird überall verwendet.

---

### 2.4 DirectionCalculator
**Pfad:** `lib/movement/DirectionCalculator.ts`

**Funktionen:**
- `calculateDirection(dx, dy)` - Bewegungsrichtung aus Delta

**Testfälle:**
```typescript
describe('DirectionCalculator', () => {
  it('should return RIGHT for positive dx', () => {
    expect(DirectionCalculator.calculateDirection(10, 0)).toBe(DIRECTION.RIGHT);
  });

  it('should return LEFT for negative dx', () => {
    expect(DirectionCalculator.calculateDirection(-10, 0)).toBe(DIRECTION.LEFT);
  });

  it('should return DOWN for positive dy', () => {
    expect(DirectionCalculator.calculateDirection(0, 10)).toBe(DIRECTION.DOWN);
  });

  it('should return UP for negative dy', () => {
    expect(DirectionCalculator.calculateDirection(0, -10)).toBe(DIRECTION.UP);
  });

  it('should prioritize vertical when magnitudes are equal', () => {
    // When |dx| == |dy|, dy wins (else branch)
    expect(DirectionCalculator.calculateDirection(5, 5)).toBe(DIRECTION.DOWN);
    expect(DirectionCalculator.calculateDirection(5, -5)).toBe(DIRECTION.UP);
  });

  it('should prioritize larger magnitude', () => {
    expect(DirectionCalculator.calculateDirection(10, 5)).toBe(DIRECTION.RIGHT);
    expect(DirectionCalculator.calculateDirection(5, 10)).toBe(DIRECTION.DOWN);
  });
});
```

**Warum Prio 2:** Einfache Logik, aber kritisch für Animation und AI-Verhalten.

---

## Priorität 3: Spielmechanik-Logik

### 3.1 QuestionSelector
**Pfad:** `lib/combat/QuestionSelector.ts`

**Funktionen:**
- `selectQuestionFromPool(questions, enemyLevel, askedQuestions, randomFn)` - Frage auswählen

**Testfälle:**
```typescript
describe('QuestionSelector', () => {
  const mockQuestions: QuestionWithElo[] = [
    { id: 1, elo: 2, answers: ['a', 'b', 'c', 'd'], correct: 0, /* ... */ },
    { id: 2, elo: 5, answers: ['a', 'b', 'c', 'd'], correct: 1, /* ... */ },
    { id: 3, elo: 8, answers: ['a', 'b', 'c', 'd'], correct: 2, /* ... */ },
    { id: 4, elo: null, answers: ['a', 'b', 'c', 'd'], correct: 0, /* ... */ },
  ];

  it('should return null for empty question pool', () => {
    expect(selectQuestionFromPool([], 5, new Set())).toBeNull();
  });

  it('should select hardest suitable question (lowest ELO)', () => {
    // Enemy level 5: maxElo = 11 - 5 = 6
    // Suitable: id 1 (elo 2), id 2 (elo 5)
    // Should pick id 1 (hardest = lowest ELO)
    const result = selectQuestionFromPool(mockQuestions, 5, new Set());
    expect(result?.id).toBe(1);
  });

  it('should skip already asked questions', () => {
    const asked = new Set([1]);
    const result = selectQuestionFromPool(mockQuestions, 5, asked);
    expect(result?.id).toBe(2);
  });

  it('should add selected question to askedQuestions', () => {
    const asked = new Set<number>();
    selectQuestionFromPool(mockQuestions, 5, asked);
    expect(asked.size).toBe(1);
  });

  it('should clear askedQuestions when all questions used', () => {
    const asked = new Set([1, 2, 3, 4]);
    selectQuestionFromPool(mockQuestions, 5, asked);
    expect(asked.size).toBe(1); // Cleared + new selection
  });

  it('should use randomFn for deterministic testing', () => {
    const result1 = selectQuestionFromPool(mockQuestions, 1, new Set(), () => 0);
    const result2 = selectQuestionFromPool(mockQuestions, 1, new Set(), () => 0);
    expect(result1?.id).toBe(result2?.id);
  });
});
```

**Warum Prio 3:** Wichtige Spielmechanik, aber komplexer wegen Fallback-Kette.

---

### 3.2 AnswerShuffler
**Pfad:** `lib/combat/AnswerShuffler.ts`

**Funktionen:**
- `shuffleAnswers(answers, correctIndex)` - Antworten mischen

**Testfälle:**
```typescript
describe('AnswerShuffler', () => {
  it('should preserve all answers', () => {
    const answers = ['A', 'B', 'C', 'D'];
    const { shuffledAnswers } = shuffleAnswers(answers, 0);

    expect(shuffledAnswers).toHaveLength(4);
    expect(shuffledAnswers.sort()).toEqual(['A', 'B', 'C', 'D']);
  });

  it('should track correct answer position', () => {
    const answers = ['Correct', 'Wrong1', 'Wrong2', 'Wrong3'];
    const { shuffledAnswers, correctIndex } = shuffleAnswers(answers, 0);

    expect(shuffledAnswers[correctIndex]).toBe('Correct');
  });

  it('should handle single element array', () => {
    const { shuffledAnswers, correctIndex } = shuffleAnswers(['Only'], 0);
    expect(shuffledAnswers).toEqual(['Only']);
    expect(correctIndex).toBe(0);
  });

  it('should not mutate original array', () => {
    const original = ['A', 'B', 'C', 'D'];
    const copy = [...original];
    shuffleAnswers(original, 0);
    expect(original).toEqual(copy);
  });
});
```

**Hinweis:** Fisher-Yates ist korrekt implementiert, nutzt aber `Math.random()`. Für deterministisches Testen könnte ein optionaler `randomFn`-Parameter hinzugefügt werden.

**Refactoring-Vorschlag:**
```typescript
// Optional: randomFn für deterministisches Testen
export function shuffleAnswers(
  answers: string[],
  correctIndex: number,
  randomFn: () => number = Math.random
): ShuffledQuestion
```

---

### 3.3 BrightnessCalculator
**Pfad:** `lib/rendering/BrightnessCalculator.ts`

**Funktionen:**
- `hasEnemiesInRoom(roomId, enemies)` - Prüft ob Raum Feinde hat
- `getSpatialNeighbors(roomId, rooms)` - Nachbar-Räume
- `isRoomClear(roomId, rooms, roomMap, enemies)` - Raum und Nachbarn feindfrei?
- `shouldUseBrightTileset(...)` - Hell/Dunkel Tileset Entscheidung

**Testfälle:**
```typescript
describe('BrightnessCalculator', () => {
  describe('hasEnemiesInRoom', () => {
    it('should return false for negative roomId', () => {
      expect(BrightnessCalculator.hasEnemiesInRoom(-1, [])).toBe(false);
    });

    it('should return false for empty enemy list', () => {
      expect(BrightnessCalculator.hasEnemiesInRoom(0, [])).toBe(false);
    });

    it('should return true if alive enemy in room', () => {
      const enemies = [{ roomId: 0, alive: true }] as Enemy[];
      expect(BrightnessCalculator.hasEnemiesInRoom(0, enemies)).toBe(true);
    });

    it('should return false if enemy is dead', () => {
      const enemies = [{ roomId: 0, alive: false }] as Enemy[];
      expect(BrightnessCalculator.hasEnemiesInRoom(0, enemies)).toBe(false);
    });
  });

  describe('isRoomClear', () => {
    it('should return false if room has enemies', () => {
      const enemies = [{ roomId: 0, alive: true }] as Enemy[];
      const rooms = [{ spatialNeighbors: [] }] as Room[];
      expect(BrightnessCalculator.isRoomClear(0, rooms, [], enemies)).toBe(false);
    });

    it('should return false if neighbor has enemies', () => {
      const enemies = [{ roomId: 1, alive: true }] as Enemy[];
      const rooms = [
        { spatialNeighbors: [1] },
        { spatialNeighbors: [0] }
      ] as Room[];
      expect(BrightnessCalculator.isRoomClear(0, rooms, [], enemies)).toBe(false);
    });
  });
});
```

**Warum Prio 3:** Visuelles Feature, aber logisch testbar.

---

### 3.4 VisibilityCalculator
**Pfad:** `lib/visibility/VisibilityCalculator.ts`

**Funktionen:**
- `isTileVisible(x, y, roomId, roomMap, rooms, ...)` - Fog of War Check
- `getPlayerRoomIds(player, tileSize, roomMap, ...)` - Spieler-Räume
- `shouldDimTile(...)` - Dimming-Entscheidung

**Testfälle:** Ähnlich zu BrightnessCalculator, fokussiert auf Sichtbarkeits-Logik.

---

## Priorität 4: Pathfinding & Kollision

### 4.1 AStarPathfinder
**Pfad:** `lib/pathfinding/AStarPathfinder.ts`

**Funktionen:**
- `findPath(startX, startY, goalX, goalY, dungeon, doorStates, maxIterations)` - A* Pfadsuche

**Testfälle:**
```typescript
describe('AStarPathfinder', () => {
  // Einfaches 5x5 Dungeon für Tests
  const createTestDungeon = () => {
    const dungeon = Array(5).fill(null).map(() =>
      Array(5).fill(TILE.FLOOR)
    );
    return dungeon;
  };

  it('should return empty path when start equals goal', () => {
    const dungeon = createTestDungeon();
    const path = AStarPathfinder.findPath(2, 2, 2, 2, dungeon, new Map());
    expect(path).toEqual([]);
  });

  it('should find straight path in open dungeon', () => {
    const dungeon = createTestDungeon();
    const path = AStarPathfinder.findPath(0, 0, 4, 0, dungeon, new Map());
    expect(path.length).toBeGreaterThan(0);
    expect(path[path.length - 1]).toEqual({ x: 4, y: 0 });
  });

  it('should navigate around walls', () => {
    const dungeon = createTestDungeon();
    dungeon[1][2] = TILE.WALL;
    dungeon[2][2] = TILE.WALL;
    dungeon[3][2] = TILE.WALL;

    const path = AStarPathfinder.findPath(0, 2, 4, 2, dungeon, new Map());
    expect(path.length).toBeGreaterThan(0);
    // Path should not contain wall positions
    expect(path.every(p => dungeon[p.y][p.x] !== TILE.WALL)).toBe(true);
  });

  it('should respect closed doors', () => {
    const dungeon = createTestDungeon();
    dungeon[2][2] = TILE.DOOR;
    const doorStates = new Map([['2,2', false]]); // Closed

    // Path should go around closed door
    const path = AStarPathfinder.findPath(0, 2, 4, 2, dungeon, doorStates);
    expect(path.every(p => !(p.x === 2 && p.y === 2))).toBe(true);
  });

  it('should pass through open doors', () => {
    const dungeon = createTestDungeon();
    dungeon[2][2] = TILE.DOOR;
    const doorStates = new Map([['2,2', true]]); // Open

    const path = AStarPathfinder.findPath(0, 2, 4, 2, dungeon, doorStates);
    // Path may include door position
    expect(path.length).toBeGreaterThan(0);
  });

  it('should return empty path when no path exists', () => {
    const dungeon = createTestDungeon();
    // Block completely with walls
    for (let y = 0; y < 5; y++) {
      dungeon[y][2] = TILE.WALL;
    }

    const path = AStarPathfinder.findPath(0, 2, 4, 2, dungeon, new Map());
    expect(path).toEqual([]);
  });
});
```

**Hinweis:** Tests benötigen DUNGEON_WIDTH/HEIGHT Mocking oder angepasste Test-Dungeons.

**Refactoring-Vorschlag:** Die Konstanten `DUNGEON_WIDTH` und `DUNGEON_HEIGHT` könnten als Parameter übergeben werden, um die Testbarkeit zu verbessern:
```typescript
static findPath(
  startX, startY, goalX, goalY,
  dungeon, doorStates,
  maxIterations = 1000,
  dungeonWidth = DUNGEON_WIDTH,  // Optional mit Default
  dungeonHeight = DUNGEON_HEIGHT
)
```

---

### 4.2 CollisionDetector
**Pfad:** `lib/physics/CollisionDetector.ts`

**Funktionen:**
- `checkCollision(x, y, tileSize, dungeon, entitySizeMultiplier)` - Basis-Kollision
- `checkPlayerCollision(...)` - Mit Tür-Support
- `checkEnemyCollision(...)` - Mit Tür-Support

**Testfälle:**
```typescript
describe('CollisionDetector', () => {
  const TILE_SIZE = 64;

  // Ähnliches Refactoring-Problem: DUNGEON_WIDTH/HEIGHT sind hard-coded

  it('should detect wall collision', () => {
    // Test erfordert DUNGEON_WIDTH x DUNGEON_HEIGHT Dungeon
  });

  it('should not collide with floor', () => {
    // ...
  });

  it('should check all 4 corners', () => {
    // ...
  });
});
```

**Refactoring-Vorschlag:** Dungeon-Dimensionen als Parameter, um kleinere Test-Dungeons zu ermöglichen.

---

## Priorität 5: API Validation (Optional)

### 5.1 Validation Utilities
**Pfad:** `lib/api/validation.ts`

**Funktionen:**
- `validatePositiveInt(value, fieldName)`
- `validateNonNegativeInt(value, fieldName)`
- `validateBoolean(value, fieldName)`
- `validateNonEmptyString(value, fieldName)`
- `validateAnswerIndex(value, fieldName)`

**Testfälle:**
```typescript
describe('Validation', () => {
  describe('validatePositiveInt', () => {
    it('should fail for 0', () => {
      expect(validatePositiveInt(0, 'test').success).toBe(false);
    });

    it('should fail for negative', () => {
      expect(validatePositiveInt(-1, 'test').success).toBe(false);
    });

    it('should succeed for positive', () => {
      expect(validatePositiveInt(1, 'test').success).toBe(true);
    });

    it('should fail for non-integer', () => {
      expect(validatePositiveInt(1.5, 'test').success).toBe(false);
    });

    it('should fail for string', () => {
      expect(validatePositiveInt('1', 'test').success).toBe(false);
    });
  });
});
```

**Warum Prio 5:** Wichtig für API-Sicherheit, aber weniger kritisch fürs Gameplay.

---

## Refactoring-Vorschläge für bessere Testbarkeit

### R1: Dependency Injection für Random
**Betroffene Dateien:**
- `lib/combat/AnswerShuffler.ts`
- `lib/dungeon/generation.ts`

**Änderung:** Optionaler `randomFn: () => number = Math.random` Parameter

### R2: Dungeon-Dimensionen parametrisieren
**Betroffene Dateien:**
- `lib/pathfinding/AStarPathfinder.ts`
- `lib/physics/CollisionDetector.ts`

**Änderung:** `dungeonWidth` und `dungeonHeight` als optionale Parameter mit Defaults

### R3: Konstanten-Export für Tests
**Datei:** `lib/constants.ts`

**Status:** Bereits gut exportiert, keine Änderung nötig.

---

## Test-Setup Empfehlungen

### Test-Framework
```bash
npm install -D vitest @testing-library/react jsdom
```

### Vitest Config
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts'],
      exclude: ['lib/db/**', 'lib/api/client.ts']
    }
  }
});
```

### Verzeichnisstruktur
```
lib/
├── scoring/
│   ├── EloCalculator.ts
│   ├── EloCalculator.test.ts      # Co-located tests
│   ├── LevelCalculator.ts
│   └── LevelCalculator.test.ts
├── dungeon/
│   ├── SeededRandom.ts
│   ├── SeededRandom.test.ts
│   └── ...
```

---

## Zusammenfassung

| Priorität | Komponenten | Geschätzter Aufwand |
|-----------|-------------|---------------------|
| **1** | EloCalculator, LevelCalculator, DamageCalculator | ~2h |
| **2** | SeededRandom, UnionFind, TileCoordinates, DirectionCalculator | ~2h |
| **3** | QuestionSelector, AnswerShuffler, BrightnessCalculator | ~2h |
| **4** | AStarPathfinder, CollisionDetector (nach Refactoring) | ~3h |
| **5** | API Validation | ~1h |

**Empfehlung:** Mit Priorität 1 starten, da diese Tests den höchsten Wert bei geringstem Aufwand liefern.
