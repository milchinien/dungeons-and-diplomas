/**
 * Database initialization and seeding
 */
import type Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { migrateEditorLevelsIfNeeded, migrateQuestionsIfNeeded, migrateUserXpIfNeeded, migrateSkillsIfNeeded, migrateUserGoldIfNeeded, migrateRoomLayoutDoorPositionsIfNeeded } from './migrations';

export interface InitOptions {
  /** Whether to seed with initial question data (default: true) */
  seed?: boolean;
}

export function initializeDatabase(database: Database.Database, options: InitOptions = {}) {
  const shouldSeed = options.seed ?? true;
  // Create users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      xp INTEGER DEFAULT 0,
      gold INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create questions table (migrate old schema to new)
  database.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_key TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      question TEXT NOT NULL,
      answers TEXT NOT NULL,
      correct_index INTEGER NOT NULL,
      difficulty INTEGER DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create answer_log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS answer_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      question_id INTEGER NOT NULL,
      selected_answer_index INTEGER NOT NULL,
      is_correct BOOLEAN NOT NULL,
      answer_time_ms INTEGER,
      timeout_occurred BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);

  // Create xp_log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS xp_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      gained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      xp_amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      enemy_level INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create gold_log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS gold_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      gold_amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      enemy_level INTEGER,
      item_sold TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create highscores table
  database.exec(`
    CREATE TABLE IF NOT EXISTS highscores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      enemies_defeated INTEGER DEFAULT 0,
      rooms_explored INTEGER DEFAULT 0,
      xp_gained INTEGER DEFAULT 0,
      max_combo INTEGER DEFAULT 0,
      play_time_seconds INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create index for highscores
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_highscores_score ON highscores(score DESC)
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_highscores_user ON highscores(user_id)
  `);

  // Create skill_points table
  database.exec(`
    CREATE TABLE IF NOT EXISTS skill_points (
      user_id INTEGER PRIMARY KEY,
      total_points INTEGER DEFAULT 0,
      spent_points INTEGER DEFAULT 0,
      available_points INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create user_skills table
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      skill_id TEXT NOT NULL,
      level INTEGER DEFAULT 0,
      UNIQUE(user_id, skill_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create indices for user_skills
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id)
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id)
  `);

  // Create editor_levels table
  database.exec(`
    CREATE TABLE IF NOT EXISTS editor_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      structure_seed INTEGER NOT NULL,
      decoration_seed INTEGER NOT NULL,
      spawn_seed INTEGER NOT NULL,
      width INTEGER NOT NULL DEFAULT 100,
      height INTEGER NOT NULL DEFAULT 100,
      algorithm INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Create room_layouts table
  database.exec(`
    CREATE TABLE IF NOT EXISTS room_layouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      width INTEGER NOT NULL CHECK (width >= 5 AND width <= 15),
      height INTEGER NOT NULL CHECK (height >= 5 AND height <= 15),
      tile_grid TEXT NOT NULL,
      door_positions TEXT NOT NULL,
      room_type TEXT DEFAULT 'any' CHECK (room_type IN ('empty', 'treasure', 'combat', 'shop', 'any')),
      difficulty INTEGER DEFAULT 5 CHECK (difficulty >= 1 AND difficulty <= 10),
      tags TEXT DEFAULT '[]',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Create tileset/theme tables (mirror SQLite adapter so sync seed works)
  database.exec(`
    CREATE TABLE IF NOT EXISTS tilesets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      width_tiles INTEGER NOT NULL,
      height_tiles INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS tile_themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      floor_config TEXT NOT NULL,
      wall_config TEXT NOT NULL,
      door_config TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add new columns to existing editor_levels table if needed
  migrateEditorLevelsIfNeeded(database);

  // Create indices for editor_levels
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_editor_levels_created_by ON editor_levels(created_by)
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_editor_levels_name ON editor_levels(name)
  `);

  // Create indices for room_layouts
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_room_layouts_type ON room_layouts(room_type)
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_room_layouts_size ON room_layouts(width, height)
  `);
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_room_layouts_difficulty ON room_layouts(difficulty)
  `);

  // Check if we need to migrate old questions format
  migrateQuestionsIfNeeded(database);

  // Check if we need to add XP column to existing users table
  migrateUserXpIfNeeded(database);

  // Check if we need to initialize skill_points for existing users
  migrateSkillsIfNeeded(database);

  // Check if we need to add gold column to existing users table
  migrateUserGoldIfNeeded(database);

  // Check if we need to migrate room layout door positions
  migrateRoomLayoutDoorPositionsIfNeeded(database);

  // Check if we need to seed the database
  if (shouldSeed) {
    const count = database.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };

    if (count.count === 0) {
      seedQuestions(database);
    } else {
      // Existing installs were seeded with the German question set: update those rows in place
      migrateSeedQuestionsToEnglish(database);
    }

    // Seed room layouts
    seedRoomLayouts(database);

    // Seed default tileset and theme so the dungeon renderer has a theme on first run
    seedDefaultTheme(database);
  }
}

/**
 * Seeds the Castle Dungeon tileset and a default tile theme (id=1) so the
 * dungeon renderer can load a theme on first run. The theme/tileset CRUD
 * normally happens via the async adapter — but we want this seeded
 * synchronously before any request arrives.
 */
function seedDefaultTheme(database: Database.Database) {
  const tilesetCount = database
    .prepare('SELECT COUNT(*) as count FROM tilesets')
    .get() as { count: number };

  if (tilesetCount.count === 0) {
    const insertTileset = database.prepare(
      `INSERT INTO tilesets (name, path, width_tiles, height_tiles) VALUES (?, ?, ?, ?)`
    );
    // Tileset.png is a 10x10 sheet; the Dark/Bright variants are 25x13.
    insertTileset.run('Castle Dungeon (Normal)', '/Assets/Castle-Dungeon2_Tiles/Tileset.png', 10, 10);
    insertTileset.run('Castle Dungeon (Dark)', '/Assets/Castle-Dungeon2_Tiles/Tileset_Dark.png', 25, 13);
    insertTileset.run('Castle Dungeon (Bright)', '/Assets/Castle-Dungeon2_Tiles/Tileset_Bright.png', 25, 13);
    console.log('Seeded 3 default tilesets');
  } else {
    // Repair dimensions for installs seeded with the old (incorrect) values.
    const fixDims = database.prepare(
      `UPDATE tilesets SET width_tiles = ?, height_tiles = ? WHERE path = ?`
    );
    fixDims.run(10, 10, '/Assets/Castle-Dungeon2_Tiles/Tileset.png');
    fixDims.run(25, 13, '/Assets/Castle-Dungeon2_Tiles/Tileset_Dark.png');
    fixDims.run(25, 13, '/Assets/Castle-Dungeon2_Tiles/Tileset_Bright.png');
  }

  const themeCount = database
    .prepare('SELECT COUNT(*) as count FROM tile_themes')
    .get() as { count: number };

  if (themeCount.count > 0) {
    return;
  }

  // Theme renders against the Dark tileset (25x13). Coordinates below are
  // verified tile indices on Tileset_Dark.png: clean stone floors on row 1,
  // brick walls on row 0, wooden doors at cols 9/10 of row 0.
  const darkTileset = database
    .prepare(`SELECT id FROM tilesets WHERE path = ?`)
    .get('/Assets/Castle-Dungeon2_Tiles/Tileset_Dark.png') as { id: number } | undefined;

  if (!darkTileset) return;

  const tilesetId = darkTileset.id;
  const floorVariants = [
    { source: { tilesetId, x: 9, y: 1 }, weight: 200 },
    { source: { tilesetId, x: 10, y: 1 }, weight: 50 },
    { source: { tilesetId, x: 11, y: 1 }, weight: 30 },
    { source: { tilesetId, x: 12, y: 1 }, weight: 20 },
    { source: { tilesetId, x: 13, y: 1 }, weight: 10 }
  ];
  const wallVariants = [
    { source: { tilesetId, x: 1, y: 0 }, weight: 40 },
    { source: { tilesetId, x: 2, y: 0 }, weight: 20 },
    { source: { tilesetId, x: 6, y: 0 }, weight: 15 }
  ];
  const doorHorizontal = [{ source: { tilesetId, x: 9, y: 0 }, weight: 100 }];
  const doorVertical = [{ source: { tilesetId, x: 8, y: 0 }, weight: 100 }];

  const wallTypes = [
    'horizontal','vertical','corner_tl','corner_tr','corner_bl','corner_br',
    't_up','t_down','t_left','t_right','cross','isolated',
    'end_left','end_right','end_top','end_bottom'
  ];
  const wallConfig: Record<string, typeof wallVariants> = {};
  for (const t of wallTypes) wallConfig[t] = wallVariants;

  const doorConfig = {
    horizontal_closed: doorHorizontal,
    horizontal_open: doorHorizontal,
    vertical_closed: doorVertical,
    vertical_open: doorVertical
  };

  database
    .prepare(
      `INSERT INTO tile_themes (name, floor_config, wall_config, door_config)
       VALUES (?, ?, ?, ?)`
    )
    .run(
      'Castle Dungeon (Default)',
      JSON.stringify({ default: floorVariants }),
      JSON.stringify(wallConfig),
      JSON.stringify(doorConfig)
    );

  console.log('Seeded default tile theme');
}

/**
 * Seeds starter room layouts
 */
function seedRoomLayouts(database: Database.Database) {
  // Check if already seeded
  const count = database.prepare('SELECT COUNT(*) as count FROM room_layouts').get() as { count: number };
  if (count.count > 0) {
    console.log('Room layouts already seeded, skipping...');
    return;
  }

  console.log('Seeding room layouts...');

  // Load layouts from JSON file
  const layoutsPath = path.join(process.cwd(), 'lib', 'data', 'seed-room-layouts.json');
  const layoutsJson = fs.readFileSync(layoutsPath, 'utf-8');
  const layouts = JSON.parse(layoutsJson);

  // Prepare insert statement
  const insert = database.prepare(`
    INSERT INTO room_layouts (
      name, width, height, tile_grid, door_positions,
      room_type, difficulty, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Insert all layouts in a transaction
  const insertMany = database.transaction((layouts: any[]) => {
    for (const layout of layouts) {
      insert.run(
        layout.name,
        layout.width,
        layout.height,
        JSON.stringify(layout.tileGrid),
        JSON.stringify(layout.doorPositions),
        layout.roomType || 'any',
        layout.difficulty || 5,
        JSON.stringify(layout.tags || [])
      );
    }
  });

  insertMany(layouts);
  console.log(`✓ Seeded ${layouts.length} room layouts`);
}

function seedQuestions(database: Database.Database) {
  // Load questions from JSON file
  const questionsPath = path.join(process.cwd(), 'lib', 'data', 'seed-questions.json');
  const questionsJson = fs.readFileSync(questionsPath, 'utf-8');
  const questions = JSON.parse(questionsJson);

  // Prepare insert statement
  const insert = database.prepare(`
    INSERT INTO questions (subject_key, subject_name, question, answers, correct_index, difficulty)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Insert all questions in a transaction
  const insertMany = database.transaction((questions: any[]) => {
    for (const q of questions) {
      const answersJson = JSON.stringify(q.answers);
      insert.run(
        q.subjectKey,
        q.subjectName,
        q.question,
        answersJson,
        q.correct,
        5 // default difficulty
      );
    }
  });

  insertMany(questions);
}

/**
 * Idempotent update for databases seeded with the original German questions.
 * Rows are matched by subject key + the exact German question text (see
 * seed-questions-legacy-de.json, same order as seed-questions.json) and replaced with
 * the English text/answers. Question ids, correct_index, difficulty and the answer log
 * stay untouched. Custom questions never match and are left alone. Subject display
 * names are only renamed where they still hold the original German name.
 */
function migrateSeedQuestionsToEnglish(database: Database.Database) {
  const dataDir = path.join(process.cwd(), 'lib', 'data');
  const legacyPath = path.join(dataDir, 'seed-questions-legacy-de.json');
  if (!fs.existsSync(legacyPath)) return;

  const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf-8')) as any[];
  const current = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-questions.json'), 'utf-8')) as any[];
  if (legacy.length !== current.length) return;

  const updateQuestion = database.prepare(`
    UPDATE questions SET subject_name = ?, question = ?, answers = ?
    WHERE subject_key = ? AND question = ? AND correct_index = ?
  `);
  const renameSubject = database.prepare(
    `UPDATE questions SET subject_name = ? WHERE subject_key = ? AND subject_name = ?`
  );

  const migrate = database.transaction(() => {
    let changed = 0;
    const subjectNames = new Map<string, [string, string]>();
    legacy.forEach((de, i) => {
      const en = current[i];
      if (!en || en.subjectKey !== de.subjectKey || en.correct !== de.correct) return;
      changed += updateQuestion.run(
        en.subjectName, en.question, JSON.stringify(en.answers),
        de.subjectKey, de.question, de.correct
      ).changes;
      subjectNames.set(de.subjectKey, [de.subjectName, en.subjectName]);
    });
    subjectNames.forEach(([deName, enName], key) => {
      changed += renameSubject.run(enName, key, deName).changes;
    });
    return changed;
  });

  const changed = migrate();
  if (changed > 0) console.log(`Updated ${changed} seeded question rows to English`);
}
