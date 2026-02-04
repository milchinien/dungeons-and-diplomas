/**
 * Database migrations
 */
import type Database from 'better-sqlite3';
import { TILE } from '../constants';

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
