# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an educational browser-based dungeon crawler with procedural dungeon generation, real-time combat, and quiz-based enemy encounters. Built as a proof-of-concept in vanilla JavaScript, this project is designed to be refactored into a Next.js application with dynamic data loading and persistence.

### Core Features

- **Procedural Dungeon Generation**: BSP (Binary Space Partitioning) algorithm creates random dungeon layouts
- **Character System**: Player and enemy sprites with full directional animation support (14 animation types)
- **AI-Driven Enemies**: Goblins with idle, wandering, and player-following behaviors
- **Quiz-Based Combat**: Educational combat system with timed multiple-choice questions
- **Fog of War**: Progressive room revelation as player explores
- **Room Types**: Empty, treasure, and combat rooms with visual differentiation
- **Minimap**: Real-time overview of explored areas

## Architecture

### Single-File Prototype
Currently implemented as `dungeon.html` - a single HTML file with embedded JavaScript, CSS, and external question database. No build process required - simply open in a browser or serve via local HTTP server.

**This is a spike/prototype** intended for migration to Next.js for:
- Dynamic question loading from database/API
- Progress persistence
- User authentication
- Extended educational content
- Analytics and performance tracking

### Core Systems

**1. Dungeon Generation (BSP-based)**
- `BSPNode` class implements recursive binary space partitioning (dungeon.html:989-1110)
- `generateRooms()` creates BSP tree and fills partitions with floor tiles (dungeon.html:1112-1135)
- `connectRooms()` uses Union-Find algorithm to ensure full connectivity (dungeon.html:1162-1248)
- Room type distribution: 70% empty, 20% treasure, 10% combat (dungeon.html:1061-1069)
- Constants: `MIN_ROOM_SIZE=4`, `MAX_ROOM_SIZE=8`, grid size 100×100

**2. Sprite System**
- `SpriteSheetLoader` class handles spritesheet parsing and animation (dungeon.html:192-304)
- Embedded spritesheet configurations avoid CORS issues (dungeon.html:139-180)
- 14 animation types: spellcast, thrust, walk, slash, shoot, hurt, climb, idle, jump, sit, emote, run, watering, combat
- 4-directional support (up, down, left, right) for most animations
- Frame dimensions: 64×64 pixels
- Variable animation speeds defined in `ANIM_SPEEDS` (dungeon.html:183-189)

**3. Player System**
- Player sprite: `Assets/player.png` with embedded configuration
- Movement: 6 tiles/second using WASD or arrow keys (dungeon.html:738-813)
- Collision detection: Reduced hitbox (0.5 of tile size) checks all 4 corners (dungeon.html:815-848)
- Animation states: idle, run (mapped based on movement)
- HP system: 100 max HP, takes 15 damage per wrong answer

**4. Enemy AI System**
- `Enemy` class with state machine (dungeon.html:362-597)
- Three AI states (dungeon.html:330-335):
  - `IDLE`: Waiting at position (2 second timer)
  - `WANDERING`: Moving to random waypoint within room
  - `FOLLOWING`: Chasing player within aggro radius
- Enemy stats: 30 HP, 3 tiles/second movement speed
- Aggro system: 3-tile aggro radius, 6-tile deaggro radius (dungeon.html:319-320)
- Death animation: Hurt animation stops on last frame (dungeon.html:548-553)
- One goblin spawns per room (except player's starting room)

**5. Combat System**
- Turn-based quiz combat triggered when enemy reaches player (dungeon.html:1602-1759)
- Questions loaded from `database/questions.js` with three subjects: Mathematik, Chemie, Physik
- 10-second timer per question with countdown display (dungeon.html:326)
- Damage model:
  - Correct answer: 10 damage to enemy
  - Wrong/timeout: 15 damage to player, shows correct answer
- Combat UI: Modal overlay with HP bars, timer, question, and shuffled answers
- Victory condition: Enemy HP reaches 0
- Defeat condition: Player HP reaches 0, triggers game restart

**6. Rendering System**
- Canvas-based rendering with camera system centered on player (dungeon.html:1320-1438)
- Tileset: `Assets/Castle-Dungeon2_Tiles/Tileset.png` (64×64 tiles)
- Weighted random tile variants for visual variety (dungeon.html:627-664)
  - Wall variants: 5 options with weights 20/15/15/15/1
  - Floor variants: 5 options with weights 200/50/30/2/1
- Room-specific floor tiles:
  - Treasure rooms: Tile (18, 11) - golden floor
  - Combat rooms: Tile (7, 12) - darker floor
  - Empty rooms: Random variants
- Minimap: 200×200 pixel overlay showing explored areas (dungeon.html:1440-1535)
  - Color coding: Gold (treasure), Red (combat), Gray (empty), Green (doors), Cyan (player)

**7. Fog of War System**
- Each room has a `visible` boolean property
- `roomMap` 2D array maps each tile to its room index
  - `-1`: Walls
  - `-2`: Doors
  - `>= 0`: Room ID
- Player position updates visibility (dungeon.html:850-861)
- Walls/doors visible if any adjacent room is visible (dungeon.html:1373-1390)
- Minimap respects fog of war

**8. Data Structures**
- `dungeon`: 2D array of tile types (EMPTY=0, FLOOR=1, WALL=2, DOOR=3, CORNER=4)
- `rooms`: Array of room objects with properties:
  ```javascript
  {
    id: number,
    x: number, y: number,
    width: number, height: number,
    visible: boolean,
    neighbors: number[],
    type: 'empty' | 'treasure' | 'combat'
  }
  ```
- `roomMap`: 2D array mapping grid positions to room IDs
- `tileVariants`: 2D array of pre-selected tile variants (floor/wall) for consistent rendering
- `enemies`: Array of Enemy instances
- `player`: Object with x, y, width, height, direction, isMoving, hp, maxHp

## File Structure

```
.
├── dungeon.html              # Main application file (all game code)
├── CLAUDE.md                 # This file
├── database/
│   ├── questions.js          # Question database (embedded to avoid CORS)
│   ├── mathe.json            # (unused - questions embedded in JS)
│   ├── chemie.json           # (unused - questions embedded in JS)
│   └── physik.json           # (unused - questions embedded in JS)
└── Assets/
    ├── player.png            # Player spritesheet (64×64 frames)
    ├── player.json           # Player animation configuration
    ├── goblin.png            # Goblin spritesheet (64×64 frames)
    └── Castle-Dungeon2_Tiles/
        ├── Tileset.png       # 64×64 tile atlas
        ├── Tileset_Matrix.png # Reference image showing tile coordinates
        └── Individual_Tiles/ # Individual tile exports (not used in-game)
```

## Development Workflow

### Running the Game
```bash
# Simply open the HTML file in a browser (no build process)
start dungeon.html  # Windows
open dungeon.html   # macOS
xdg-open dungeon.html  # Linux
```

Or use a local server to avoid CORS issues:
```bash
python -m http.server 8000
# Then navigate to http://localhost:8000/dungeon.html
```

### Controls
- **WASD** or **Arrow Keys**: Move player
- **Click doors**: Reveal adjacent rooms (currently not required - rooms reveal on entry)
- **Generate New Dungeon** button: Restart with fresh dungeon

### Key Configuration Constants

Located at top of `dungeon.html`:
- `DUNGEON_WIDTH/HEIGHT`: Grid size (100×100)
- `MIN_ROOM_SIZE/MAX_ROOM_SIZE`: BSP constraints (4-8 tiles)
- `PLAYER_SPEED_TILES`: 6 tiles/second
- `ENEMY_SPEED_TILES`: 3 tiles/second
- `ENEMY_AGGRO_RADIUS`: 3 tiles
- `ENEMY_DEAGGRO_RADIUS`: 6 tiles
- `ENEMY_IDLE_WAIT_TIME`: 2 seconds
- `PLAYER_MAX_HP`: 100
- `GOBLIN_MAX_HP`: 30
- `COMBAT_TIME_LIMIT`: 10 seconds per question
- `DAMAGE_CORRECT`: 10 damage to enemy
- `DAMAGE_WRONG`: 15 damage to player

### Spritesheet Format

Both player and goblin use the same spritesheet structure:
- **Frame size**: 64×64 pixels
- **Layout**: Multiple rows, each row contains one animation direction
- **Animations** (defined in `SPRITESHEET_CONFIGS`):
  - 4-directional (rows: up, left, down, right): spellcast, thrust, walk, slash, shoot, idle, jump, sit, emote, run, watering, combat
  - Single direction: hurt, climb

Configuration embedded in JavaScript to avoid CORS issues when loading JSON files locally.

## Important Implementation Details

### Tile Coordinate System
- Tiles referenced by `{x, y}` coordinates in tileset grid
- Example: `{x: 0, y: 1}` = column 0, row 1
- `getTileCoords()` maps tile types to tileset coordinates (dungeon.html:1264-1318)
- `Tileset_Matrix.png` shows grid overlay for reference

### Collision System
- Uses reduced player size (0.5 of tile size) for forgiving collision
- Checks all 4 corners of bounding box against dungeon grid
- Walls and empty tiles block movement
- Floors and doors are passable
- Doors convert to floors on player contact (dungeon.html:793-800)

### Union-Find for Connectivity
- Ensures all rooms are reachable via minimal spanning tree
- Scans for valid door positions where rooms are adjacent (dungeon.html:1164-1205)
- Shuffles connections for randomness
- Adds connections until all rooms connected
- 2% chance for extra doors to create loops (dungeon.html:1228-1242)

### Question Database Format
```javascript
{
  [subject_key]: {
    subject: "Display Name",
    questions: [
      {
        question: "Question text?",
        answers: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correct: 0  // Index of correct answer
      }
    ]
  }
}
```

Answers are shuffled during combat to prevent memorization (dungeon.html:1640-1653).

### Combat Flow
1. Enemy reaches player → `startCombat()` (dungeon.html:1608)
2. Random subject selected
3. Random question from subject pool
4. Answers shuffled, correct index tracked
5. 10-second timer starts
6. Player selects answer or times out
7. Feedback shown (1.5 seconds)
8. Damage applied, HP updated
9. Check win/loss conditions
10. If combat continues, next question (loop to step 3)
11. Combat ends when enemy dies or player dies

## Common Modifications

### Adjusting Difficulty
- Enemy HP: `GOBLIN_MAX_HP` (dungeon.html:325)
- Combat time: `COMBAT_TIME_LIMIT` (dungeon.html:326)
- Damage values: `DAMAGE_CORRECT`, `DAMAGE_WRONG` (dungeon.html:327-328)
- Enemy speed: `ENEMY_SPEED_TILES` (dungeon.html:318)
- Aggro radius: `ENEMY_AGGRO_RADIUS` (dungeon.html:319)

### Adding Questions
Edit `database/questions.js`:
```javascript
QUESTION_DATABASE.newSubject = {
  subject: "New Subject Name",
  questions: [
    { question: "...", answers: ["A", "B", "C", "D"], correct: 0 }
  ]
};
```

### Changing Dungeon Size
- Modify `DUNGEON_WIDTH` and `DUNGEON_HEIGHT` (dungeon.html:98-99)
- Adjust `MIN_ROOM_SIZE` and `MAX_ROOM_SIZE` for different room distribution (dungeon.html:100-101)

### Modifying Room Types
Room type distribution set in `BSPNode.fillRooms()` (dungeon.html:1061-1069):
```javascript
const typeRoll = Math.random() * 10;
if (typeRoll < 2) roomType = 'treasure';        // 20%
else if (typeRoll < 3) roomType = 'combat';     // 10%
else roomType = 'empty';                        // 70%
```

### Changing Tile Appearance
- **Floor tiles**: Modify `FLOOR_VARIANTS` array (dungeon.html:635-641)
- **Wall tiles**: Modify `WALL_VARIANTS` array (dungeon.html:627-633)
- **Room-specific tiles**: Edit `getTileCoords()` for treasure/combat rooms (dungeon.html:1270-1280)
- Use `Tileset_Matrix.png` to find tile coordinates

## Next.js Migration Plan

**WICHTIG: Dies ist Wegwerf-Code (Spike)**. Die Next.js-App wird von Grund auf neu gebaut, nicht refactored.

### Goals
1. **SQLite Database**: Fragen dynamisch laden statt embedded JS
2. **Progress Tracking**: Punkte und Statistiken speichern
3. **Simple UI**: Basis-Interface ohne komplexe Features

### Simple Architecture

```
next-app/
├── app/
│   ├── page.tsx            # Landing page
│   ├── game/
│   │   └── page.tsx        # Game (Client Component mit Canvas)
│   └── api/
│       ├── questions/route.ts
│       └── progress/route.ts
├── components/
│   └── GameCanvas.tsx      # Komplettes Spiel als ein Component
├── lib/
│   ├── game.ts             # Gesamter Game-Code aus dungeon.html
│   └── db.ts               # SQLite mit better-sqlite3
├── data/
│   └── game.db             # SQLite Datenbank
└── public/
    └── assets/             # Einfach Assets/ Ordner kopieren
```

### Migration Steps

1. **Setup**
   ```bash
   npx create-next-app@latest dungeon-game
   npm install better-sqlite3
   ```

2. **SQLite Setup**
   ```typescript
   // lib/db.ts
   import Database from 'better-sqlite3';
   const db = new Database('data/game.db');

   // Tabellen: questions, progress
   // Keine User-Auth, nur lokales Tracking
   ```

3. **Game Component**
   - Copy kompletten `<script>` aus dungeon.html nach `lib/game.ts`
   - Wrapper als React Component
   - Canvas Rendering bleibt identisch

4. **API Routes**
   - `GET /api/questions`: Alle Fragen laden
   - `POST /api/progress`: Score speichern

Das war's. Keep it simple!

## Technical Constraints

### Current Implementation
- No external dependencies - pure vanilla JavaScript
- All code in single HTML file for portability
- Assets must be in `Assets/` directory
- Canvas rendering only (no WebGL)
- Tileset tiles must be 64×64 pixels
- Spritesheet frames must be 64×64 pixels
- Question database embedded to avoid CORS issues

### For Next.js Migration
- TypeScript (einfache Types, kein Over-Engineering)
- SQLite mit better-sqlite3
- Canvas bleibt vanilla (kein Phaser/PixiJS)
- Minimale Dependencies

