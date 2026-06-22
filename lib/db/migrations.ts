/**
 * Database migrations
 */
import type Database from 'better-sqlite3';
import { TILE } from '../constants';
import {
  DEFAULT_TILESETS,
  DEFAULT_NORMAL_TILESET_PATH,
  DEFAULT_THEME_NAME,
  THEME_SEED_VERSION,
  buildDefaultThemeConfigJSON,
} from './defaultTheme';

export function migrateUserXpIfNeeded(database: Database.Database) {
  // Check if users table has xp column
  const tableInfo = database.pragma('table_info(users)') as Array<{ name: string }>;
  const hasXpColumn = tableInfo.some((col) => col.name === 'xp');

  if (!hasXpColumn) {
    console.log('Adding XP column to users table...');
    database.exec('ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0');
  }
}

export function migrateUserGoldIfNeeded(database: Database.Database) {
  // Check if users table has gold column
  const tableInfo = database.pragma('table_info(users)') as Array<{ name: string }>;
  const hasGoldColumn = tableInfo.some((col) => col.name === 'gold');

  if (!hasGoldColumn) {
    console.log('Adding gold column to users table...');
    database.exec('ALTER TABLE users ADD COLUMN gold INTEGER DEFAULT 0');
  }
}

export function migrateEditorLevelsIfNeeded(database: Database.Database) {
  // Check if editor_levels table has the new columns
  const tableInfo = database.pragma('table_info(editor_levels)') as Array<{ name: string }>;
  const hasWidthColumn = tableInfo.some((col) => col.name === 'width');
  const hasHeightColumn = tableInfo.some((col) => col.name === 'height');
  const hasAlgorithmColumn = tableInfo.some((col) => col.name === 'algorithm');

  if (tableInfo.length > 0 && !hasWidthColumn) {
    console.log('Adding width column to editor_levels table...');
    database.exec('ALTER TABLE editor_levels ADD COLUMN width INTEGER NOT NULL DEFAULT 100');
  }

  if (tableInfo.length > 0 && !hasHeightColumn) {
    console.log('Adding height column to editor_levels table...');
    database.exec('ALTER TABLE editor_levels ADD COLUMN height INTEGER NOT NULL DEFAULT 100');
  }

  if (tableInfo.length > 0 && !hasAlgorithmColumn) {
    console.log('Adding algorithm column to editor_levels table...');
    database.exec('ALTER TABLE editor_levels ADD COLUMN algorithm INTEGER NOT NULL DEFAULT 1');
  }
}

export function migrateQuestionsIfNeeded(database: Database.Database) {
  // Check if old schema exists (has answer_0 column)
  const tableInfo = database.pragma('table_info(questions)') as Array<{ name: string }>;
  const hasOldSchema = tableInfo.some((col) => col.name === 'answer_0');

  if (hasOldSchema) {
    console.log('Migrating questions table to new schema...');

    // Get all old questions
    const oldQuestions = database.prepare('SELECT * FROM questions').all() as any[];

    // Drop old table
    database.exec('DROP TABLE questions');

    // Create new table
    database.exec(`
      CREATE TABLE questions (
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

    // Migrate data
    const insert = database.prepare(`
      INSERT INTO questions (id, subject_key, subject_name, question, answers, correct_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const migrate = database.transaction((questions: any[]) => {
      for (const q of questions) {
        const answers = JSON.stringify([q.answer_0, q.answer_1, q.answer_2, q.answer_3]);
        insert.run(q.id, q.subject_key, q.subject_name, q.question, answers, q.correct_index, q.created_at);
      }
    });

    migrate(oldQuestions);
    console.log(`Migrated ${oldQuestions.length} questions to new schema`);
  }
}

/**
 * Helper to calculate level from XP
 */
function getLevelFromXp(xp: number): number {
  if (xp < 500) return 1;
  return Math.floor(xp / 500) + 1;
}

/**
 * Helper to calculate skill points from level
 */
function calculateSkillPointsFromLevel(level: number): number {
  if (level < 2) return 0;
  const basePoints = level - 1;
  const bonusPoints = Math.floor((level - 1) / 5);
  return basePoints + bonusPoints;
}

/**
 * Migrate skills system if needed
 *
 * Initializes skill_points for existing users who don't have an entry yet.
 * Also fixes skill points for users who have XP but incorrect skill points.
 */
export function migrateSkillsIfNeeded(database: Database.Database) {
  // Check if skill_points table exists
  const tables = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='skill_points'").all();

  if (tables.length === 0) {
    // Table doesn't exist yet, will be created by init.ts
    return;
  }

  // Initialize skill_points for users who don't have an entry
  database.exec(`
    INSERT OR IGNORE INTO skill_points (user_id, total_points, spent_points, available_points)
    SELECT id, 0, 0, 0 FROM users
  `);

  // Fix skill points for users with XP but incorrect skill points
  // Conditions to fix:
  // 1. total_points = 0 but user has XP >= 500 (should have points)
  // 2. spent_points > total_points (inconsistent data)
  const usersNeedingFix = database.prepare(`
    SELECT u.id, u.xp, sp.spent_points, sp.total_points
    FROM users u
    JOIN skill_points sp ON u.id = sp.user_id
    WHERE (u.xp >= 500 AND sp.total_points = 0)
       OR (sp.spent_points > sp.total_points)
  `).all() as Array<{ id: number; xp: number; spent_points: number; total_points: number }>;

  if (usersNeedingFix.length > 0) {
    console.log(`Fixing skill points for ${usersNeedingFix.length} users...`);

    const updateStmt = database.prepare(`
      UPDATE skill_points
      SET total_points = ?, available_points = ?
      WHERE user_id = ?
    `);

    const fix = database.transaction(() => {
      for (const user of usersNeedingFix) {
        const level = getLevelFromXp(user.xp);
        const totalPoints = calculateSkillPointsFromLevel(level);
        // Ensure total_points is at least spent_points
        const finalTotalPoints = Math.max(totalPoints, user.spent_points);
        const availablePoints = Math.max(0, finalTotalPoints - user.spent_points);

        updateStmt.run(finalTotalPoints, availablePoints, user.id);
        console.log(`  ✓ User ${user.id}: Level ${level}, XP ${user.xp} → ${finalTotalPoints} total points (${availablePoints} available, ${user.spent_points} spent)`);
      }
    });

    fix();
  }
}

/**
 * Migrates room layout door positions from boolean to exact positions
 * Converts {north: boolean} to {north: number | null}
 */
export function migrateRoomLayoutDoorPositionsIfNeeded(database: Database.Database) {
  console.log('Checking room_layouts door_positions migration...');

  // Check if room_layouts table exists
  const tables = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='room_layouts'").all() as any[];
  if (tables.length === 0) {
    console.log('room_layouts table does not exist yet, skipping migration.');
    return;
  }

  // Get all layouts
  const layouts = database.prepare('SELECT id, door_positions, tile_grid, width, height FROM room_layouts').all() as any[];

  if (layouts.length === 0) {
    console.log('No layouts to migrate.');
    return;
  }

  // Check first layout to see if migration is needed
  const firstLayout = layouts[0];
  const doorPositions = JSON.parse(firstLayout.door_positions);

  // If already migrated (has number or null values), skip
  if (typeof doorPositions.north === 'number' || doorPositions.north === null) {
    console.log('Door positions already migrated.');
    return;
  }

  console.log(`Migrating ${layouts.length} room layouts to exact door positions...`);

  const updateStmt = database.prepare('UPDATE room_layouts SET door_positions = ? WHERE id = ?');

  const migrate = database.transaction((layouts: any[]) => {
    for (const layout of layouts) {
      const oldDoorPositions = JSON.parse(layout.door_positions);
      const tileGrid = JSON.parse(layout.tile_grid);
      const width = layout.width;
      const height = layout.height;

      const newDoorPositions = convertLegacyDoorPositions(
        oldDoorPositions,
        tileGrid,
        width,
        height
      );

      updateStmt.run(JSON.stringify(newDoorPositions), layout.id);
    }
  });

  migrate(layouts);
  console.log(`✓ Migrated ${layouts.length} room layouts to exact door positions`);
}

/**
 * Converts legacy boolean door positions to exact positions
 * Strategy: Find all doors on each side, use the middle one (or only one)
 */
function convertLegacyDoorPositions(
  legacy: any,
  tileGrid: number[][],
  width: number,
  height: number
): { north: number | null; south: number | null; east: number | null; west: number | null } {
  const result = {
    north: null as number | null,
    south: null as number | null,
    east: null as number | null,
    west: null as number | null
  };

  // North (top row, y=0)
  if (legacy.north) {
    const doorPositions: number[] = [];
    for (let x = 0; x < width; x++) {
      if (tileGrid[0]?.[x] === TILE.DOOR) {
        doorPositions.push(x);
      }
    }
    if (doorPositions.length > 0) {
      // Use middle door if multiple
      result.north = doorPositions[Math.floor(doorPositions.length / 2)];
    }
  }

  // South (bottom row, y=height-1)
  if (legacy.south) {
    const doorPositions: number[] = [];
    for (let x = 0; x < width; x++) {
      if (tileGrid[height - 1]?.[x] === TILE.DOOR) {
        doorPositions.push(x);
      }
    }
    if (doorPositions.length > 0) {
      result.south = doorPositions[Math.floor(doorPositions.length / 2)];
    }
  }

  // West (left column, x=0)
  if (legacy.west) {
    const doorPositions: number[] = [];
    for (let y = 0; y < height; y++) {
      if (tileGrid[y]?.[0] === TILE.DOOR) {
        doorPositions.push(y);
      }
    }
    if (doorPositions.length > 0) {
      result.west = doorPositions[Math.floor(doorPositions.length / 2)];
    }
  }

  // East (right column, x=width-1)
  if (legacy.east) {
    const doorPositions: number[] = [];
    for (let y = 0; y < height; y++) {
      if (tileGrid[y]?.[width - 1] === TILE.DOOR) {
        doorPositions.push(y);
      }
    }
    if (doorPositions.length > 0) {
      result.east = doorPositions[Math.floor(doorPositions.length / 2)];
    }
  }

  return result;
}

/**
 * Heals stale/legacy tile themes on existing databases.
 *
 * Background: the renderer maps tile coordinates against a fixed 64px grid on
 * the 1600x832 Castle Dungeon tileset. Older databases were seeded with wrong
 * tileset dimensions (20x12) and, in some cases, the default theme drifted to a
 * different tileset / coordinate set via the editor — producing the "doors and
 * corners rendered as floor" bug. The plain seed only runs on empty tables, so
 * those existing rows never get corrected.
 *
 * This migration is versioned via app_settings.theme_seed_version. When the
 * stored version is below THEME_SEED_VERSION it normalizes the three default
 * tilesets (path + dimensions) and rewrites the default theme to the canonical
 * configuration, then records the new version. It is a no-op once applied.
 */
export function migrateTileThemeIfNeeded(database: Database.Database) {
  // The tileset/theme tables are created in init.ts before this runs.
  const tables = database
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('tilesets','tile_themes')")
    .all() as Array<{ name: string }>;
  if (tables.length < 2) return;

  // Fresh database: nothing seeded yet. Let the normal seed path populate the
  // canonical data (with the corrected dimensions) instead of healing here.
  // This keeps empty test/in-memory databases empty.
  const tilesetCount = (database.prepare('SELECT COUNT(*) as count FROM tilesets').get() as { count: number }).count;
  const themeCount = (database.prepare('SELECT COUNT(*) as count FROM tile_themes').get() as { count: number }).count;
  if (tilesetCount === 0 && themeCount === 0) return;

  database.exec(`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT)`);

  const versionRow = database
    .prepare(`SELECT value FROM app_settings WHERE key = 'theme_seed_version'`)
    .get() as { value: string } | undefined;
  const currentVersion = versionRow ? parseInt(versionRow.value, 10) || 0 : 0;

  if (currentVersion >= THEME_SEED_VERSION) return;

  console.log(`Migrating tile themes to seed version ${THEME_SEED_VERSION}...`);

  const heal = database.transaction(() => {
    // 1. Normalize the three default tilesets (path + grid dimensions) by name.
    const findByName = database.prepare(`SELECT id FROM tilesets WHERE name = ?`);
    const updateTileset = database.prepare(
      `UPDATE tilesets SET path = ?, width_tiles = ?, height_tiles = ? WHERE id = ?`
    );
    const insertTileset = database.prepare(
      `INSERT INTO tilesets (name, path, width_tiles, height_tiles) VALUES (?, ?, ?, ?)`
    );
    for (const ts of DEFAULT_TILESETS) {
      const existing = findByName.get(ts.name) as { id: number } | undefined;
      if (existing) {
        updateTileset.run(ts.path, ts.widthTiles, ts.heightTiles, existing.id);
      } else {
        insertTileset.run(ts.name, ts.path, ts.widthTiles, ts.heightTiles);
      }
    }

    // 2. Rewrite the default theme to the canonical config bound to the Normal tileset.
    const normalTileset = database
      .prepare(`SELECT id FROM tilesets WHERE path = ?`)
      .get(DEFAULT_NORMAL_TILESET_PATH) as { id: number } | undefined;

    if (normalTileset) {
      const cfg = buildDefaultThemeConfigJSON(normalTileset.id);
      const existingTheme = database
        .prepare(`SELECT id FROM tile_themes WHERE name = ?`)
        .get(DEFAULT_THEME_NAME) as { id: number } | undefined;

      if (existingTheme) {
        database
          .prepare(
            `UPDATE tile_themes
             SET floor_config = ?, wall_config = ?, door_config = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          )
          .run(cfg.floor, cfg.wall, cfg.door, existingTheme.id);
      } else {
        database
          .prepare(
            `INSERT INTO tile_themes (name, floor_config, wall_config, door_config)
             VALUES (?, ?, ?, ?)`
          )
          .run(DEFAULT_THEME_NAME, cfg.floor, cfg.wall, cfg.door);
      }
    }

    // 3. Record the applied version.
    database
      .prepare(
        `INSERT INTO app_settings (key, value) VALUES ('theme_seed_version', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      )
      .run(String(THEME_SEED_VERSION));
  });

  heal();
  console.log(`✓ Tile themes migrated to seed version ${THEME_SEED_VERSION}`);
}
