# Dungeons & Diplomas

## Dokumentation / Planung

`/docs/Tasks/01_Plans` -- High Level Plans / Details
`/docs/Tasks/02_Backlog` -- Backlog of implementation tasks
`/docs/Tasks/03_InProgress` -- Current tasks that are worked on
`/docs/Tasks/04_Archive` -- Finalized tasks

`/docs/History` -- Implementation history

## Anweisungen

### Benutzer

* **[Tobias](https://github.com/tobiaswaggoner):** Senior Dev (51 Jahre)
* **[Michi](https://github.com/milchinien):** Junior Dev (16 Jahre) / Rapid Prototyping
* **[Tim](https://github.com/Timiwagg):** Junior Dev (15 Jahre) / Rapid Prototyping

Finde den aktuellen User z.B. mit `git config user.name`. Wenn unklar: Frage!

### Branch Protection

Der main-Branch ist protected. Stelle sicher, dass nur auf feature/branches gearbeitet wird. Erstelle den Branch nicht selber, sondern erkläre den Junior Devs was sie in der CLI tun müssen.

### Sprache

Projektsprache, Markdowns, Planungsdokumente, Logs: deutsch
Typen, Kommentare, Code, Git Commit Kommentare: englisch

## Project Overview

Educational browser-based dungeon crawler with procedural dungeon generation, real-time combat, and quiz-based enemy encounters. Originally built as a vanilla JavaScript prototype (dungeon.html), now fully migrated to a Next.js application with SQLite database, ELO-based difficulty system, and persistent progress tracking.

### Core Features

- **Procedural Dungeon Generation**: BSP (Binary Space Partitioning) algorithm creates random dungeon layouts
- **Character System**: Player and enemy sprites with full directional animation support (14 animation types)
- **AI-Driven Enemies**: Goblins with idle, wandering, and player-following behaviors
- **Quiz-Based Combat**: Educational combat system with timed multiple-choice questions
- **ELO Difficulty System**: Dynamic question difficulty based on player performance
- **Progress Tracking**: SQLite database logs all answers with timestamps
- **Statistics Dashboard**: Per-question breakdown and subject mastery visualization
- **Fog of War**: Progressive room revelation as player explores
- **Room Types**: Empty, treasure, and combat rooms with visual differentiation
- **Minimap**: Real-time overview of explored areas

## Architecture

### File Structure

```
dungeons-and-diplomas/
├── app/
│   ├── layout.tsx                      # Root layout with metadata
│   ├── page.tsx                        # Main page (renders GameCanvas)
│   └── api/                            # API Routes
│       ├── questions/route.ts          # GET all questions grouped by subject
│       ├── questions-with-elo/route.ts # GET questions with ELO for subject/user
│       ├── answers/route.ts            # POST answer log entry
│       ├── stats/route.ts              # GET user statistics
│       ├── subjects/route.ts           # GET all distinct subjects
│       ├── session-elo/route.ts        # GET session ELO scores per subject
│       └── auth/
│           ├── login/route.ts           # POST login/register user
│           └── logout/route.ts          # POST logout
├── components/
│   ├── GameCanvas.tsx                  # Main game orchestrator
│   ├── CombatModal.tsx                  # Combat UI overlay
│   ├── CharacterPanel.tsx               # Top-left user panel with ELO display
│   ├── LoginModal.tsx                  # Login/registration modal
│   └── SkillDashboard.tsx               # Full-screen statistics dashboard
├── hooks/
│   ├── useAuth.ts                       # Authentication state management
│   ├── useScoring.ts                    # Session ELO tracking
│   ├── useCombat.ts                     # Combat logic and state
│   └── useGameState.ts                  # Game engine and rendering loop
├── lib/
│   ├── constants.ts                     # Game constants and TypeScript types
│   ├── db/                              # SQLite database operations
│   ├── questions.ts                     # Question types and legacy data
│   ├── SpriteSheetLoader.ts            # Sprite animation system
│   ├── Enemy.ts                         # Enemy class with AI
│   ├── combat/
│   │   ├── QuestionSelector.ts          # ELO-based question selection algorithm
│   │   └── AnswerShuffler.ts            # Fisher-Yates answer shuffling
│   ├── dungeon/
│   │   ├── BSPNode.ts                   # Binary Space Partitioning tree
│   │   ├── UnionFind.ts                 # Union-Find for connectivity
│   │   └── generation.ts                # Dungeon generation functions
│   ├── game/
│   │   ├── GameEngine.ts                # Core game loop logic
│   │   └── DungeonManager.ts            # Dungeon state management
│   ├── movement/
│   │   └── DirectionCalculator.ts       # Direction calculation utility
│   ├── physics/
│   │   └── CollisionDetector.ts         # Collision detection utility
│   ├── scoring/
│   │   └── EloCalculator.ts             # Progressive ELO calculation
│   ├── rendering/
│   │   ├── GameRenderer.ts              # Main canvas rendering
│   │   └── MinimapRenderer.ts           # Minimap rendering
│   └── data/
│       └── seed-questions.json          # Question seed data (30 questions)
├── data/
│   └── game.db                          # SQLite database
└── public/
    └── Assets/                          # Game assets (sprites, tilesets)
```

### Component Hierarchy

```
GameCanvas (Main Orchestrator)
├── LoginModal (conditional - shown on app start)
├── CharacterPanel (persistent top-left UI)
├── CombatModal (conditional - shown during combat)
├── SkillDashboard (conditional - toggled with 'D' key)
├── <canvas> (main game rendering)
└── <canvas> (minimap overlay)
```

### Hook Architecture

The application uses a sophisticated hook-based state management system:

**useAuth** (hooks/useAuth.ts)
- Manages user authentication state
- LocalStorage persistence for userId/username
- API calls for login/logout

**useScoring** (hooks/useScoring.ts)
- Tracks session-based ELO scores per subject
- Compares starting ELO vs current ELO
- Provides visual indicators (green/red glows in CharacterPanel)
- Updates after each answer

**useGameState** (hooks/useGameState.ts)
- Manages game loop using requestAnimationFrame
- Orchestrates DungeonManager and GameEngine
- Handles tileset loading
- Controls player movement and enemy updates
- Triggers rendering via GameRenderer and MinimapRenderer

**useCombat** (hooks/useCombat.ts)
- Combat state machine (idle, active, showing feedback)
- Question selection using ELO algorithm
- Timer management (10-second countdown)
- Answer validation and damage calculation
- Answer logging to database
- Session score updates

## Database Schema (SQLite)

### Tables

**users**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL COLLATE NOCASE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**questions**
```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_key TEXT NOT NULL,              -- e.g., 'mathe', 'chemie', 'physik'
  subject_name TEXT NOT NULL,             -- e.g., 'Mathematik', 'Chemie', 'Physik'
  question TEXT NOT NULL,
  answers TEXT NOT NULL,                  -- JSON array: ["A", "B", "C", "D"]
  correct_index INTEGER NOT NULL,         -- 0-3
  difficulty INTEGER DEFAULT 5,          -- Initial difficulty (unused)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**answer_log**
```sql
CREATE TABLE answer_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  question_id INTEGER NOT NULL,
  selected_answer_index INTEGER NOT NULL,  -- 0-3
  is_correct BOOLEAN NOT NULL,
  answer_time_ms INTEGER,                  -- Time taken to answer
  timeout_occurred BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
)
```

### Key Database Functions (lib/db/)

**Core Operations:**
- `getDatabase()`: Singleton database connection
- `initializeDatabase()`: Creates tables and seeds 30 questions (10 per subject)
- `loginUser(username)`: Login or create user, updates last_login
- `getAllQuestions()`: Returns all questions grouped by subject
- `getQuestionsWithEloBySubject(subject, userId)`: Returns questions with calculated ELO
- `getSessionEloScores(userId)`: Returns average ELO per subject
- `logAnswer(entry)`: Records answer with timing and correctness

**ELO Calculation:**
```typescript
function calculateElo(correctCount: number, totalCount: number): number | null {
  if (totalCount === 0) return null;
  return Math.round(10.0 * correctCount / totalCount);
}
```
- Returns 0-10 scale based on percentage correct
- `null` if question never answered

**Database Seeding:**
- Automatically seeds 30 questions on first run
- 10 questions each: Mathematik, Chemie, Physik
- Questions sourced from `lib/data/seed-questions.json`

## API Routes

### GET /api/questions
Returns all questions grouped by subject:
```typescript
Response: {
  [subject_key]: {
    subject: string,
    questions: Question[]
  }
}
```

### GET /api/questions-with-elo?subject=X&userId=Y
Returns questions with per-user ELO for a specific subject:
```typescript
Response: QuestionWithElo[] = {
  id: number,
  question: string,
  answers: string[],
  correct: number,
  elo: number | null,           // 0-10 or null if never answered
  correctCount: number,
  wrongCount: number,
  timeoutCount: number
}
```

### POST /api/answers
Logs an answer:
```typescript
Body: {
  user_id: number,
  question_id: number,
  selected_answer_index: number,
  is_correct: boolean,
  answer_time_ms: number,
  timeout_occurred: boolean
}
Response: { success: true }
```

### GET /api/stats?userId=X
Returns comprehensive statistics (uses progressive ELO calculation):
```typescript
Response: {
  [subject_key]: {
    subject_name: string,
    average_elo: number,
    questions: [{
      id: number,
      question: string,
      correct: number,
      wrong: number,
      timeout: number,
      elo: number
    }]
  }
}
```

**Note**: This endpoint uses a different ELO calculation (progressive incremental updates) compared to `/api/questions-with-elo` (simple percentage).

### GET /api/subjects
Returns array of subject keys:
```typescript
Response: string[]  // e.g., ['mathe', 'chemie', 'physik']
```

### GET /api/session-elo?userId=X
Returns session starting ELO per subject:
```typescript
Response: SubjectEloScore[] = {
  subjectKey: string,
  subjectName: string,
  averageElo: number
}
```

### POST /api/auth/login
Login or register user:
```typescript
Body: { username: string }
Response: { id: number, username: string }
```
- Creates new user if username doesn't exist
- Updates last_login timestamp
- No password required (simple educational prototype)

### POST /api/auth/logout
Clears session (currently no-op on server, client-side only)

## Core Systems

### 1. Dungeon Generation (BSP-based)

**Implementation**: lib/dungeon/

**Process:**
1. Create empty grid (100×100)
2. BSP: Recursively split space into rooms using BSPNode class
3. Fill rooms with floor tiles
4. Connect rooms using Union-Find algorithm (ensures full connectivity)
5. Add walls around floor tiles
6. Assign room types: 70% empty, 20% treasure, 10% combat

**Key Files:**
- `BSPNode.ts`: Recursive binary space partitioning tree
- `UnionFind.ts`: Union-Find data structure for connectivity
- `generation.ts`: Main generation functions

**Room Types:**
- **Empty**: Default floor tiles (random variants)
- **Treasure**: Golden floor tile (18, 11)
- **Combat**: Dark floor tile (7, 12)

**Constants:**
- `DUNGEON_WIDTH/HEIGHT`: 100×100 grid
- `MIN_ROOM_SIZE`: 4 tiles
- `MAX_ROOM_SIZE`: 8 tiles

### 2. Sprite System

**Implementation**: lib/SpriteSheetLoader.ts

**Features:**
- 14 animation types: spellcast, thrust, walk, slash, shoot, hurt, climb, idle, jump, sit, emote, run, watering, combat
- 4-directional support (up, down, left, right) for most animations
- Frame dimensions: 64×64 pixels
- Variable animation speeds defined in constants.ts

**Spritesheet Configuration:**
- Embedded in constants.ts to avoid CORS issues
- Both player and goblin use same structure
- Configuration includes frame counts and row layout per animation

### 3. Player System

**Implementation**: useGameState hook, GameEngine.ts

**Features:**
- Movement: 6 tiles/second using WASD or arrow keys
- Collision detection: Reduced hitbox (0.5 of tile size) checks all 4 corners
- Animation states: idle, run (mapped based on movement)
- HP system: 100 max HP, takes 15 damage per wrong answer

**Player Object:**
```typescript
{
  x: number,
  y: number,
  width: number,
  height: number,
  direction: Direction,      // 'up' | 'down' | 'left' | 'right'
  isMoving: boolean,
  hp: number,
  maxHp: number
}
```

### 4. Enemy AI System

**Implementation**: lib/Enemy.ts

**Three AI States:**
- `IDLE`: Waiting at position (2 second timer)
- `WANDERING`: Moving to random waypoint within room
- `FOLLOWING`: Chasing player within aggro radius (3 tiles)

**State Transitions:**
- Aggro: Distance ≤ 3 tiles → FOLLOWING
- Deaggro: Distance > 6 tiles → IDLE
- Waypoint reached → IDLE
- Combat trigger: Distance < 0.5 tiles → startCombat()

**Enemy Properties:**
```typescript
{
  x: number,
  y: number,
  room: Room,
  hp: number,
  maxHp: number,
  state: AIStateType,          // 'idle' | 'wandering' | 'following'
  level: number,               // 1-10 (determines question difficulty)
  subject: string,             // 'mathe' | 'chemie' | 'physik'
  waypoint: {x: number, y: number} | null
}
```

**Enemy Stats:**
- HP: 30 (GOBLIN_MAX_HP)
- Speed: 3 tiles/second
- Aggro radius: 3 tiles
- Deaggro radius: 6 tiles
- One goblin spawns per room (except player's starting room)

**Visual Indicators:**
- Green goblin: Level 1-3 (easy)
- Yellow goblin: Level 4-7 (medium)
- Red goblin: Level 8-10 (hard)

### 5. Combat System

**Implementation**: hooks/useCombat.ts, components/CombatModal.tsx

**Combat Flow:**
1. Enemy reaches player → `startCombat(enemy)`
2. `askQuestion()`:
   - Fetch questions with ELO via `/api/questions-with-elo`
   - Select question using ELO algorithm (QuestionSelector.ts)
   - Shuffle answers to prevent memorization
   - Start 10-second timer
3. `answerQuestion(index)`:
   - Log answer to database via `/api/answers`
   - Update session scores via useScoring hook
   - Apply damage (10 to enemy or 15 to player)
   - Show feedback (1.5 seconds)
   - Check win/loss conditions
   - Next question or end combat
4. `endCombat()`:
   - Clear timers
   - Reset state
   - Trigger game restart if player died

**Damage Model:**
- Correct answer: 10 damage to enemy
- Wrong answer or timeout: 15 damage to player
- Correct answer is always shown after wrong/timeout

**Combat UI:**
- Modal overlay with HP bars
- Timer countdown (10 seconds)
- Question text
- Shuffled answer buttons
- Difficulty indicator (enemy level)
- Subject indicator

### 6. ELO System

**Two ELO Calculation Methods:**

**Method 1: Simple Percentage** (used in lib/db/ and `/api/questions-with-elo`)
```typescript
ELO = Math.round(10.0 * correctCount / totalCount)
```
- Returns 0-10 scale
- Based on lifetime correct percentage
- Used for question selection

**Method 2: Progressive Updates** (used in `/api/stats`)
```typescript
// Starting at 5, incrementally updated per answer:
// Correct: elo = ceil((elo + (10 - elo) / 3) * 10) / 10
// Wrong/Timeout: elo = floor((elo - (elo - 1) / 4) * 10) / 10
```
- More granular tracking with decimal precision
- Used for statistics dashboard

**Question Selection Algorithm** (lib/combat/QuestionSelector.ts)

**Difficulty Matching:**
- Enemy Level (1-10) → Maximum Question ELO: `11 - enemyLevel`
- Example: Level 5 enemy → questions with ELO ≤ 6 (easier questions)
- Example: Level 9 enemy → questions with ELO ≤ 2 (only hardest questions)

**Selection Logic:**
1. Filter out already-asked questions in this combat
2. Filter by difficulty threshold (ELO ≤ max for enemy level)
3. If suitable questions exist: pick hardest matching question (lowest ELO)
4. Fallback 1: Unanswered questions (ELO = null)
5. Fallback 2: Next hardest available question (ignore difficulty threshold)

### 7. Session Score Tracking

**Implementation**: hooks/useScoring.ts, components/CharacterPanel.tsx

**CharacterPanel Display:**
- 10 circles per subject (representing ELO 1-10)
- Filled circles = current ELO level
- Green glow = gained points this session
- Red glow = lost points this session
- Gold badge = number of questions answered this session

**Data Flow:**
1. On login: `loadSessionElos()` → saves starting ELO per subject
2. After each answer: `updateSessionScores()` → fetches new ELO
3. Comparison: `startElo` vs `currentElo` → visual indicators

**State Structure:**
```typescript
{
  startElo: { [subjectKey]: number },      // ELO at session start
  currentElo: { [subjectKey]: number },    // Current ELO
  questionsAnswered: { [subjectKey]: number }
}
```

### 8. Rendering System

**Implementation**: lib/rendering/GameRenderer.ts, lib/rendering/MinimapRenderer.ts

**GameRenderer:**
- Canvas-based rendering with camera centered on player
- Tile-by-tile rendering with weighted random variants
- Fog of War: Only visible rooms rendered
- Door rendering: Horizontal/vertical based on neighbors
- Enemy rendering: Status bar with level/subject/HP
- Player rendering: Directional sprite animation

**Tile Variants:**
- Wall variants: 5 options with weights 20/15/15/15/1
- Floor variants: 5 options with weights 200/50/30/2/1
- Pre-selected on dungeon generation for consistency

**MinimapRenderer:**
- 200×200 pixel overlay (top-right)
- Color coding:
  - Gold: Treasure rooms
  - Red: Combat rooms
  - Gray: Empty rooms
  - Green: Doors
  - Cyan: Player position
- Respects fog of war

### 9. Fog of War System

**Implementation**: DungeonManager, GameRenderer

**Mechanism:**
- Each room has a `visible` boolean property
- `roomMap` 2D array maps each tile to its room index
  - `-1`: Walls
  - `-2`: Doors
  - `>= 0`: Room ID
- Player position updates visibility (current room becomes visible)
- Walls/doors visible if any adjacent room is visible
- Minimap respects fog of war

## TypeScript Types (lib/constants.ts)

### Core Types

```typescript
export interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  neighbors: number[];
  type: 'empty' | 'treasure' | 'combat';
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: Direction;
  isMoving: boolean;
  hp: number;
  maxHp: number;
}

export interface TileCoord {
  x: number;
  y: number;
}

export interface TileVariant {
  floor: TileCoord;
  wall: TileCoord;
}

export type Direction = 'up' | 'down' | 'left' | 'right';
export type AnimationType = 'idle' | 'run' | 'walk' | 'hurt' | 'spellcast' | 'thrust' | 'slash' | 'shoot' | 'climb' | 'jump' | 'sit' | 'emote' | 'watering' | 'combat';
export type TileType = 0 | 1 | 2 | 3 | 4; // EMPTY, FLOOR, WALL, DOOR, CORNER
export type AIStateType = 'idle' | 'wandering' | 'following';
```

### Question Types

```typescript
export interface Question {
  id: number;
  question: string;
  answers: string[];
  correct: number;
}

export interface QuestionWithElo extends Question {
  elo: number | null;
  correctCount: number;
  wrongCount: number;
  timeoutCount: number;
}

export interface AnswerLogEntry {
  user_id: number;
  question_id: number;
  selected_answer_index: number;
  is_correct: boolean;
  answer_time_ms: number;
  timeout_occurred: boolean;
}
```

## Configuration Constants (lib/constants.ts)

### Dungeon
- `DUNGEON_WIDTH`: 100
- `DUNGEON_HEIGHT`: 100
- `MIN_ROOM_SIZE`: 4
- `MAX_ROOM_SIZE`: 8

### Player
- `PLAYER_SPEED_TILES`: 6 (tiles per second)
- `PLAYER_SIZE`: 0.5 (hitbox size multiplier)
- `PLAYER_MAX_HP`: 100

### Enemy
- `ENEMY_SPEED_TILES`: 3 (tiles per second)
- `ENEMY_AGGRO_RADIUS`: 3 (tiles)
- `ENEMY_DEAGGRO_RADIUS`: 6 (tiles)
- `ENEMY_IDLE_WAIT_TIME`: 2 (seconds)
- `GOBLIN_MAX_HP`: 30

### Combat
- `COMBAT_TIME_LIMIT`: 10 (seconds per question)
- `DAMAGE_CORRECT`: 10 (damage to enemy)
- `DAMAGE_WRONG`: 15 (damage to player)

### Rendering
- `TILE_SIZE`: 64 (pixels)
- `MINIMAP_WIDTH`: 200 (pixels)
- `MINIMAP_HEIGHT`: 200 (pixels)

## Development Workflow

### Running the Next.js App

```bash
npm install
npm run dev
# Navigate to http://localhost:3000
```

### Building for Production

```bash
npm run build
npm start
```

### Database Management

**Location**: `data/game.db`

**Reset Database:**
```bash
rm data/game.db
# Database will be recreated on next app start
```

**Seed Questions:**
- Automatically seeded on first run
- Edit `lib/data/seed-questions.json` to modify seed data
- Questions: 30 total (10 per subject)

### Controls

**In-Game:**
- **WASD** or **Arrow Keys**: Move player
- **D**: Toggle statistics dashboard
- **ESC**: Close modals

**Login Screen:**
- Enter username (no password required)
- Username is case-insensitive

## Important Implementation Details

### Collision System
- Reduced player size (0.5 of tile size) for forgiving collision
- Checks all 4 corners of bounding box against dungeon grid
- Walls (type 2) and empty tiles (type 0) block movement
- Floors (type 1) and doors (type 3) are passable
- Doors convert to floors on player contact

### Union-Find for Connectivity
- Ensures all rooms are reachable via minimal spanning tree
- Scans for valid door positions where rooms are adjacent
- Shuffles connections for randomness
- Adds connections until all rooms connected
- 2% chance for extra doors to create loops

### Answer Shuffling
- Answers are shuffled during combat to prevent memorization
- Correct index is tracked separately
- Original question data unchanged in database

### Database Migration
- Code includes migration logic for old schema (separate answer columns) to new schema (JSON array)
- Automatically runs on database initialization

### Asset Paths
- Assets must be in `public/Assets/`
- Referenced as `/Assets/...` in code
- Player sprite: `/Assets/player.png`
- Goblin sprite: `/Assets/goblin.png`
- Tileset: `/Assets/Castle-Dungeon2_Tiles/Tileset.png`

## Known Issues / Technical Debt

### ELO Calculation Inconsistency
Two different ELO calculation methods exist:
1. **Simple Percentage** (question selection): `ELO = 10 * correct / total`
2. **Progressive Updates** (statistics): Incremental updates per answer

**Recommendation**: Standardize on one method or clearly document use cases.

### No Password Authentication
- Authentication is intentionally simple (username only)
- Suitable for educational/prototype purposes
- **Not production-ready** for multi-user environments

### Client-Side Game State
- Game state (dungeon, enemies, player) is entirely client-side
- Database only tracks questions and answers
- No server-side validation of combat results

### No Error Handling in API Routes
- Minimal error handling in API routes
- Database errors may crash the app
- **Recommendation**: Add try-catch blocks and proper error responses

### Database Abstraction Layer (Future Task)

**Current State:**
- Application uses SQLite (better-sqlite3) for local development
- SQLite is not available on Vercel deployment platform

**Required Solution:**
- Implement database abstraction layer that:
  - Uses SQLite locally (current implementation)
  - Uses Supabase (PostgreSQL) in production/Vercel
- This is a **critical task** before production deployment
- Supabase migrations already exist in `/supabase/migrations/`


### 10. Shop System

**Implementation**: lib/shop/, hooks/useShopPurchase.ts, components/ShopConfirmModal.tsx

**Status**: ✅ **Fully Implemented** (SHOP-01 through SHOP-17 complete)

**Overview:**
The shop system allows players to purchase items and perks from special shop rooms in the dungeon. Shops spawn during dungeon generation and offer random items/perks with varying rarities. Each shop has a unique layout with counters, floating merchandise, and locked doors that open after clearing adjacent rooms.

**Room Generation:**
- Shop rooms spawn with 8% probability (max 2 per dungeon)
- Minimum room size: 6x6 tiles
- Never spawns as starting room
- Each shop gets a unique inventory with 3 items and 3 perks
- Items and perks have random rarities with weighted distribution

**Rarity System** (lib/shop/Rarity.ts):
```typescript
enum Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY }

// Spawn Weights:
// Common: 50 (60%), Uncommon: 25 (30%), Rare: 15 (18%), Epic: 8 (10%), Legendary: 2 (2%)

// Effect Multipliers:
// Common: 1.0x, Uncommon: 1.5x, Rare: 2.0x, Epic: 3.0x, Legendary: 5.0x

// Visual Colors:
// Common: Gray, Uncommon: Green, Rare: Blue, Epic: Purple, Legendary: Gold
```

**Item System** (lib/shop/Item.ts):
```typescript
interface Item {
  id: string;
  definition: ItemDefinition;
  rarity: Rarity;
  effectValue: number;  // baseEffect * rarityMultiplier
}

// 6 Item Types:
// - Sword: +5 damage (flat)
// - Chestplate: -10% damage taken (reduction)
// - Helmet: +10 HP (flat)
// - Shield: 10% block chance
// - Boots: +10% speed
// - Amulet: +5% all stats
```

**Perk System** (lib/shop/Perk.ts):
```typescript
interface Perk {
  id: string;
  definition: PerkDefinition;
  rarity: Rarity;
  effectValue: number;  // baseEffect * rarityMultiplier
}

// 9 Perk Types:
// - HP_FLAT: +5 HP
// - HP_PERCENT: +5% HP
// - DAMAGE_FLAT: +3 damage
// - DAMAGE_PERCENT: +5% damage
// - REGENERATION: 1 HP/5s
// - CRITICAL: 10% crit chance (2x damage)
// - TIME_BONUS: +2s quiz time
// - EXTRA_LIFE: 1 revive at 50% HP
// - ELO_BOOST: +1 to all subject ELOs
```

**Shop Layout** (lib/shop/ShopLayout.ts):
- Centered sign at top of room
- Left and right counters (2-3 tiles each)
- 3 items floating above counters (left side)
- 3 perks floating above counters (right side)
- Floating animation: Sine wave, ±5 pixels, 2 cycles/second
- Legendary items pulse with glow effect

**Shop Door Mechanics** (lib/shop/ShopDoor.ts):
- Doors are locked by default
- Automatically unlock when all enemies in adjacent rooms are defeated
- Visual indicator: Locked door sprite vs. open door
- Player cannot enter while locked
- Hint text displayed when approaching locked door

**Purchase System:**
1. **Detection**: Player within 1 tile of item/perk → proximity detected
2. **Interaction**: Press E key → ShopConfirmModal opens
3. **Confirmation**: Modal shows item/perk details, rarity, and effects
4. **Purchase**: Confirm → item/perk added to player, removed from shop inventory
5. **Application**: Effects immediately applied to player stats

**Gold Currency System:**
- Players earn gold by defeating enemies
- Gold displayed in TopRightPanel with animated shimmer effect
- Required for purchasing items/perks (future implementation)
- Persistent across dungeon runs

**Player Stats Integration:**
```typescript
interface PlayerShopData {
  equippedItems: Item[];        // Max 6 (one per slot)
  activePerks: Perk[];          // No limit
  bonusStats: BonusStats;       // Calculated from items + perks
}

interface BonusStats {
  damageFlat: number;           // Added to base damage
  damagePercent: number;        // Multiplier on total damage
  damageReduction: number;      // % damage reduction (cap: 50%)
  maxHpBonus: number;           // Added to max HP
  blockChance: number;          // % chance to block attack (cap: 75%)
  speedMultiplier: number;      // Multiplier on movement speed
  regeneration: number;         // HP regen per 5 seconds
  criticalChance: number;       // % chance for 2x damage (cap: 50%)
  timeBonus: number;            // Extra seconds on quiz timer
  extraLives: number;           // Revives remaining (cap: 3)
  eloBonus: number;             // Bonus to all subject ELOs
}
```

**Combat Integration:**
- Damage calculation includes damageFlat and damagePercent
- Block chance checked before taking damage
- Critical hits roll on player attacks
- Extra lives trigger on player death
- Time bonus added to combat timer
- Regeneration ticks every 5 seconds during exploration

**Enemy AI Integration:**
- Enemies cannot enter shop rooms
- Aggro ends if player enters shop
- Enemies cannot spawn in shop rooms
- Shop doors track adjacent room clear status

**UI Components:**
- **TopLeftPanel**: Compact HUD with HP, level, username, and equipped items/perks
- **TopRightPanel**: Gold counter and minimap
- **ShopItemsDisplay**: Shows equipped items (square icons) and perks (round icons)
- **ShopConfirmModal**: Purchase confirmation with item/perk details and rarity border
- **CharacterPanel**: Full player stats with shop equipment section
- **Minimap**: Shop rooms displayed in cyan (#00CED1) for easy identification

**Rendering:**
- **ShopRenderer**: Draws counters, sign, floating items/perks with rarity glows
- **TooltipRenderer**: Shows item/perk details on hover
- **MinimapRenderer**: Color-codes shop rooms (cyan)
- Glow effects scale with rarity intensity
- Legendary items have pulsing animation (1 cycle/second)

**Key Files:**
- `lib/shop/Rarity.ts` - Rarity system with weights and multipliers
- `lib/shop/Item.ts` - Item definitions and types (6 types)
- `lib/shop/Perk.ts` - Perk definitions and types (9 types)
- `lib/shop/ShopInventory.ts` - Shop inventory generation
- `lib/shop/ShopLayout.ts` - Counter and item position calculation
- `lib/shop/ShopDoor.ts` - Door lock/unlock mechanics
- `lib/shop/ShopInteraction.ts` - Proximity detection for purchases
- `lib/shop/ShopPurchase.ts` - Purchase execution logic
- `hooks/useShopPurchase.ts` - React hook for shop state management
- `components/ShopConfirmModal.tsx` - Purchase confirmation UI
- `components/character/ShopItemsDisplay.tsx` - Equipment display in CharacterPanel
- `components/hud/TopLeftPanel.tsx` - Compact HUD with equipment
- `components/hud/TopRightPanel.tsx` - Gold counter and minimap
- `lib/rendering/ShopRenderer.ts` - Canvas rendering for shop rooms
- `lib/rendering/TooltipRenderer.ts` - Hover tooltip rendering

**Constants:**
```typescript
// In lib/constants.ts
SHOP_SPAWN_CHANCE: 0.08           // 8% spawn rate
SHOP_MIN_ROOM_SIZE: 6             // Minimum 6x6 tiles
SHOP_MAX_PER_DUNGEON: 2           // Max 2 shops per run
SHOP_ITEMS_COUNT: 3               // 3 items per shop
SHOP_PERKS_COUNT: 3               // 3 perks per shop
FLOATING_ITEM_AMPLITUDE: 0.3      // Float animation amplitude
FLOATING_ITEM_SPEED: 2            // Float cycles per second
```

**Balancing Notes:**
- Rarity distribution ensures common items are frequent, legendaries are rare
- Effect multipliers make rarity meaningful (5x for legendary)
- Caps on powerful stats (75% block, 50% crit, 3 extra lives) prevent overpowered builds
- Shop spawn rate (8%) and max shops (2) balance progression pacing
- All values are configurable for future tuning

**Testing Coverage:**
- Unit tests for rarity rolling, item/perk generation
- Integration tests for shop spawning, layout calculation
- Playwright tests for shop interaction, purchase flow, tooltip display
- Visual regression tests for shop rendering, minimap colors
- Edge case tests: empty shop, multiple shops, shop at dungeon edge


## Future Enhancements (Planned)

1. **Database Abstraction Layer**
   - SQLite for local development
   - Supabase for production deployment
   - Unified API for database operations

2. **Multiplayer Support**
   - WebSocket-based real-time multiplayer
   - Shared dungeons
   - PvP combat

3. **Extended Content**
   - More subjects beyond Math/Chemistry/Physics
   - Item system (weapons, armor, potions)
   - Character classes
   - Boss enemies

4. **Analytics**
   - Learning curves per subject
   - Time-of-day performance tracking
   - Difficulty progression recommendations

5. **Authentication**
   - Password-based authentication
   - OAuth providers (Google, GitHub)
   - User profiles

6. **Performance Optimization**
   - Canvas rendering optimization
   - Database indexing
   - API response caching

## Technical Constraints

### Current Implementation
- TypeScript with strict typing
- SQLite with better-sqlite3 (synchronous API)
- Canvas rendering (no WebGL)
- Tileset tiles: 64×64 pixels
- Spritesheet frames: 64×64 pixels
- No build-time asset optimization

### Dependencies
- Next.js 14+
- React 18+
- better-sqlite3
- Tailwind CSS 4
- Minimal external dependencies (by design)

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Canvas API support
- LocalStorage for session persistence

---

**Last Updated**: 2025-11-23
**Author**: Dungeons & Diplomas Team
**Status**: Active Development (Migration to Root complete)
