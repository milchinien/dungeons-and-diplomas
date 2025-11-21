# Dungeon Seeding System

## Übersicht

Das Dungeon-Generierungssystem verwendet drei separate Seeds für reproduzierbare Dungeons:

1. **Structure Seed** - Steuert die Dungeon-Struktur (BSP, Räume, Türen)
2. **Decoration Seed** - Steuert visuelle Varianz (Tile-Varianten, Dekorationen)
3. **Spawn Seed** - Steuert Entity-Spawning (Player, Enemies, Treasures)

## Verwendung

### Neue Zufalls-Dungeon (Default)

```typescript
// Automatisch generierte Seeds (komplett zufällig)
await dungeonManager.generateNewDungeon(availableSubjects, userId);
```

### Reproduzierbare Dungeons

```typescript
// Spezifische Seeds für exakt gleichen Dungeon
await dungeonManager.generateNewDungeon(
  availableSubjects,
  userId,
  1,  // structureSeed
  1,  // decorationSeed
  1   // spawnSeed
);
```

### Gleiche Struktur, verschiedene Deko/Spawns

```typescript
// Gleicher Layout, aber andere visuelle Varianz
await dungeonManager.generateNewDungeon(
  availableSubjects,
  userId,
  12345,  // Gleicher Structure-Seed
  99999,  // Anderer Decoration-Seed
  88888   // Anderer Spawn-Seed
);
```

## Seed-Bereiche

Jeder Seed steuert folgende Aspekte:

### Structure Seed (BSP, Räume, Türen)

**Datei**: `lib/dungeon/BSPNode.ts`, `lib/dungeon/generation.ts`

**Steuert**:
- ✅ BSP Split-Entscheidungen (wann aufhören zu splitten)
- ✅ BSP Split-Richtung (horizontal vs. vertikal)
- ✅ BSP Split-Position (wo genau splitten)
- ✅ Room-Typ (empty, treasure, combat)
- ✅ Connection-Reihenfolge (Tür-Platzierung)
- ✅ Extra-Doors (2% Chance für Loops)

**Ergebnis**: Identische Raumstruktur und Verbindungen

### Decoration Seed (Visuelle Varianz)

**Datei**: `lib/dungeon/generation.ts`

**Steuert**:
- ✅ Tile-Varianten für Floors (5 verschiedene Varianten)
- ✅ Tile-Varianten für Walls (5 verschiedene Varianten)
- ✅ Zukünftig: Deko-Platzierung (Tische, Fackeln, etc.)

**Ergebnis**: Identisches visuelles Erscheinungsbild

### Spawn Seed (Entities)

**Datei**: `lib/game/DungeonManager.ts`, `lib/spawning/LevelDistribution.ts`

**Steuert**:
- ✅ Player Spawn-Position
- ✅ Enemy Spawn-Positionen
- ✅ Enemy Count (1-3 in combat rooms)
- ✅ Enemy Subjects (weighted by ELO)
- ✅ Enemy Levels (normal distribution)
- ✅ Treasure Spawn-Positionen

**Ergebnis**: Identische Entity-Platzierung und Eigenschaften

## Was bleibt zufällig?

Folgende Aspekte bleiben absichtlich **nicht-deterministisch** für dynamisches Gameplay:

❌ **Enemy AI während des Spiels**:
- Waypoint-Selektion (`Enemy.pickRandomWaypoint()`)
- Bewegungsentscheidungen während des Spiels

❌ **Combat System**:
- Question-Selektion (`QuestionSelector.ts`)
- Answer-Shuffling (`AnswerShuffler.ts`)

**Grund**: Diese müssen dynamisch bleiben, damit das Gameplay nicht vorhersagbar wird.

## Challenge-Mode Anwendung

Für einen Challenge-Mode, bei dem alle Spieler den gleichen Dungeon spielen:

```typescript
// Beispiel: Daily Challenge mit Datum als Seed-Basis
const date = new Date();
const dateString = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const structureSeed = hashString(dateString + '-structure');
const decorationSeed = hashString(dateString + '-decoration');
const spawnSeed = hashString(dateString + '-spawn');

await dungeonManager.generateNewDungeon(
  availableSubjects,
  userId,
  structureSeed,
  decorationSeed,
  spawnSeed
);
```

**Ergebnis**: Alle Spieler am gleichen Tag erhalten:
- ✅ Identische Dungeon-Struktur
- ✅ Identische Deko
- ✅ Identische Enemy-Positionen und Levels
- ❌ Aber unterschiedliche Questions (ELO-basiert)

## Seed-Logging

Seeds werden automatisch in der Console geloggt:

```
Dungeon Seeds - Structure: 1, Decoration: 1, Spawn: 1
```

**Verwendung**:
- Zum Reproduzieren interessanter Dungeons
- Zum Debuggen von Generierungsproblemen
- Zum Teilen von "Seed Challenges" in der Community

## Technische Details

### Seeded Random Number Generator

**Implementierung**: Mulberry32 Algorithm
**Datei**: `lib/dungeon/SeededRandom.ts`

**Eigenschaften**:
- ✅ Deterministisch (gleicher Seed → gleiche Sequenz)
- ✅ Schnell (einfache Bitoperationen)
- ✅ Gute statistische Eigenschaften
- ✅ 32-bit Seed-Space (4.3 Milliarden Kombinationen)

**Methoden**:
```typescript
class SeededRandom {
  next(): number                    // 0-1 (float)
  nextInt(min, max): number         // min bis max-1 (integer)
  nextIntMax(max): number           // 0 bis max-1 (integer)
  nextBoolean(probability): boolean // true mit probability
  setSeed(seed): void               // Seed neu setzen
}
```

### RNG-Instanzen

**Datei**: `lib/dungeon/DungeonRNG.ts`

Drei globale RNG-Instanzen werden verwaltet:
- `structureRng` - Für BSP und Connections
- `decorationRng` - Für Tile-Varianten
- `spawnRng` - Für Entity-Spawning

**Initialisierung**:
```typescript
initializeDungeonRNG(structureSeed, decorationSeed, spawnSeed);
```

**Zugriff**:
```typescript
const rng = getStructureRng();   // In BSP-Code
const rng = getDecorationRng();  // In Tile-Varianten-Code
const rng = getSpawnRng();       // In Spawn-Code
```

## Migration von Math.random()

Alle relevanten `Math.random()` Aufrufe wurden ersetzt:

| Datei | Funktion | RNG |
|-------|----------|-----|
| BSPNode.ts | split() | Structure |
| BSPNode.ts | fillRooms() | Structure |
| generation.ts | getWeightedRandomVariant() | Decoration |
| generation.ts | connectRooms() | Structure |
| DungeonManager.ts | spawnPlayer() | Spawn |
| DungeonManager.ts | spawnEnemies() | Spawn |
| DungeonManager.ts | spawnTreasures() | Spawn |
| LevelDistribution.ts | generateNormalRoomLevel() | Spawn |
| LevelDistribution.ts | generateCombatRoomLevel() | Spawn |
| LevelDistribution.ts | selectWeightedSubject() | Spawn |

## Beispiele

### Test-Seeds für Entwicklung

```typescript
// Kleiner Dungeon mit wenigen Räumen
await dungeonManager.generateNewDungeon(subjects, userId, 1, 1, 1);

// Großer Dungeon mit vielen Räumen
await dungeonManager.generateNewDungeon(subjects, userId, 999999, 999999, 999999);

// Dungeon mit vielen Combat-Rooms (je nach BSP-Glück)
await dungeonManager.generateNewDungeon(subjects, userId, 54321, 11111, 22222);
```

### Seed-Speicherung für Replay

```typescript
interface SavedDungeon {
  name: string;
  structureSeed: number;
  decorationSeed: number;
  spawnSeed: number;
  timestamp: number;
}

const favoriteDungeons: SavedDungeon[] = [
  {
    name: "Perfect Layout",
    structureSeed: 1,
    decorationSeed: 1,
    spawnSeed: 1,
    timestamp: Date.now()
  }
];

// Später abspielen
const saved = favoriteDungeons[0];
await dungeonManager.generateNewDungeon(
  subjects,
  userId,
  saved.structureSeed,
  saved.decorationSeed,
  saved.spawnSeed
);
```

## Testing

### Unit-Tests für Determinismus

```typescript
test('Same seeds produce identical dungeons', async () => {
  const seed1 = { structure: 123, decoration: 456, spawn: 789 };

  // Generate dungeon 1
  const dm1 = new DungeonManager(player1);
  await dm1.generateNewDungeon(subjects, null,
    seed1.structure, seed1.decoration, seed1.spawn);

  // Generate dungeon 2 with same seeds
  const dm2 = new DungeonManager(player2);
  await dm2.generateNewDungeon(subjects, null,
    seed1.structure, seed1.decoration, seed1.spawn);

  // Assert identical structure
  expect(dm1.rooms.length).toBe(dm2.rooms.length);
  expect(dm1.enemies.length).toBe(dm2.enemies.length);

  for (let i = 0; i < dm1.rooms.length; i++) {
    expect(dm1.rooms[i].x).toBe(dm2.rooms[i].x);
    expect(dm1.rooms[i].y).toBe(dm2.rooms[i].y);
    expect(dm1.rooms[i].type).toBe(dm2.rooms[i].type);
  }
});
```

### Visual Seed Testing

Empfohlene Seeds für verschiedene Layouts:
- `Structure: 42` - Viele kleine Räume
- `Structure: 1337` - Wenige große Räume
- `Structure: 99999` - Lange Korridore

Diese können visuell im Game geprüft werden.

## Zukünftige Erweiterungen

### Decoration Seed erweitern

Wenn das Dekoration-System implementiert ist:
- ✅ Prefab-Platzierung (Tische, Regale, etc.)
- ✅ Fackel-Positionen
- ✅ Interior Walls
- ✅ Deko-Arrangements

### Seed-Compression

Für Challenge-Mode URLs:
```typescript
// Statt drei 32-bit Zahlen
const compressed = compressSeeds(structureSeed, decorationSeed, spawnSeed);
const url = `https://game.com/challenge/${compressed}`;

// Beispiel: Base64-encoded
const seedString = btoa(`${structureSeed},${decorationSeed},${spawnSeed}`);
```

### Seed-Analytics

Tracking welche Seeds gute/schlechte Dungeons erzeugen:
- Durchschnittliche Completion-Time
- Player-Ratings
- Enemy-Density-Metriken

---

**Erstellt**: 2025-11-21
**Autor**: Dungeons & Diplomas Team
**Status**: Implemented
