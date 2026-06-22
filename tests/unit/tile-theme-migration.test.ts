/**
 * Regression test for the tile-theme healing migration.
 *
 * Reproduces the "drifted" database state observed in the main checkout
 * (default theme pointing at the Dark tileset with custom coordinates and
 * wrong tileset dimensions) and asserts that migrateTileThemeIfNeeded() resets
 * it to the canonical configuration — and is idempotent on a second run.
 */

import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { migrateTileThemeIfNeeded } from '../../lib/db/migrations';
import { DEFAULT_NORMAL_TILESET_PATH, THEME_SEED_VERSION } from '../../lib/db/defaultTheme';

function makeSchema(db: Database.Database) {
  db.exec(`CREATE TABLE tilesets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, path TEXT NOT NULL,
    width_tiles INTEGER NOT NULL, height_tiles INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE TABLE tile_themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, floor_config TEXT NOT NULL,
    wall_config TEXT NOT NULL, door_config TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

/** Seed the exact drifted state from the main checkout's game.db. */
function seedDriftedState(db: Database.Database) {
  const insTs = db.prepare('INSERT INTO tilesets (name, path, width_tiles, height_tiles) VALUES (?,?,?,?)');
  insTs.run('Castle Dungeon (Normal)', '/Assets/Castle-Dungeon2_Tiles/Tileset.png', 10, 10); // wrong dims
  insTs.run('Castle Dungeon (Dark)', '/Assets/Castle-Dungeon2_Tiles/Tileset_Dark.png', 25, 13);
  insTs.run('Castle Dungeon (Bright)', '/Assets/Castle-Dungeon2_Tiles/Tileset_Bright.png', 25, 13);
  // Theme drifted to tilesetId 2 (Dark) with custom coordinates
  const floor = { default: [{ source: { tilesetId: 2, x: 9, y: 1 }, weight: 200 }] };
  const wall = { horizontal: [{ source: { tilesetId: 2, x: 1, y: 0 }, weight: 40 }] };
  const door = { horizontal_closed: [{ source: { tilesetId: 2, x: 9, y: 0 }, weight: 100 }] };
  db.prepare('INSERT INTO tile_themes (name, floor_config, wall_config, door_config) VALUES (?,?,?,?)')
    .run('Castle Dungeon (Default)', JSON.stringify(floor), JSON.stringify(wall), JSON.stringify(door));
}

describe('migrateTileThemeIfNeeded', () => {
  it('heals a drifted default theme to the canonical Normal-tileset config', () => {
    const db = new Database(':memory:');
    makeSchema(db);
    seedDriftedState(db);

    migrateTileThemeIfNeeded(db);

    // Normal tileset id
    const normal = db.prepare('SELECT id, width_tiles, height_tiles FROM tilesets WHERE path = ?')
      .get(DEFAULT_NORMAL_TILESET_PATH) as { id: number; width_tiles: number; height_tiles: number };
    expect(normal.width_tiles).toBe(25);
    expect(normal.height_tiles).toBe(13);

    const theme = db.prepare('SELECT floor_config, wall_config, door_config FROM tile_themes WHERE name = ?')
      .get('Castle Dungeon (Default)') as { floor_config: string; wall_config: string; door_config: string };
    const floor = JSON.parse(theme.floor_config);
    const wall = JSON.parse(theme.wall_config);
    const door = JSON.parse(theme.door_config);

    // Floor now points at the Normal tileset, standard coord (0,1)
    expect(floor.default[0].source.tilesetId).toBe(normal.id);
    expect(floor.default[0].source.x).toBe(0);
    expect(floor.default[0].source.y).toBe(1);

    // Wall horizontal standard coord (0,0) on Normal tileset
    expect(wall.horizontal[0].source.tilesetId).toBe(normal.id);
    expect(wall.horizontal[0].source.x).toBe(0);
    expect(wall.horizontal[0].source.y).toBe(0);

    // Horizontal door standard coord (13,0) and all 16 wall types present
    expect(door.horizontal_closed[0].source.x).toBe(13);
    expect(Object.keys(wall).length).toBe(16);

    const version = db.prepare(`SELECT value FROM app_settings WHERE key='theme_seed_version'`).get() as { value: string };
    expect(parseInt(version.value, 10)).toBe(THEME_SEED_VERSION);

    db.close();
  });

  it('is idempotent and a no-op once the version is current', () => {
    const db = new Database(':memory:');
    makeSchema(db);
    seedDriftedState(db);

    migrateTileThemeIfNeeded(db);
    const after1 = db.prepare('SELECT floor_config FROM tile_themes WHERE name = ?').get('Castle Dungeon (Default)') as { floor_config: string };
    migrateTileThemeIfNeeded(db);
    const after2 = db.prepare('SELECT floor_config FROM tile_themes WHERE name = ?').get('Castle Dungeon (Default)') as { floor_config: string };

    expect(after2.floor_config).toBe(after1.floor_config);
    db.close();
  });

  it('leaves a fresh empty database untouched (lets the seed populate it)', () => {
    const db = new Database(':memory:');
    makeSchema(db);

    migrateTileThemeIfNeeded(db);

    const tilesetCount = (db.prepare('SELECT COUNT(*) as c FROM tilesets').get() as { c: number }).c;
    const themeCount = (db.prepare('SELECT COUNT(*) as c FROM tile_themes').get() as { c: number }).c;
    expect(tilesetCount).toBe(0);
    expect(themeCount).toBe(0);
    db.close();
  });
});
