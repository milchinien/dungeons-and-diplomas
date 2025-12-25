/**
 * Tiletheme database operations
 *
 * Re-exports all database operations from the db/ subdirectory.
 * This file maintains backwards compatibility with existing imports.
 *
 * Note: initializeTilethemeTables is now handled automatically by the SQLite adapter.
 */

// Re-export everything from the db module
export {
  // Tileset CRUD
  saveTileset,
  getTilesets,
  getTileset,
  deleteTileset,

  // Tile Theme CRUD
  saveTileTheme,
  getTileThemes,
  getTileTheme,
  updateTileTheme,
  deleteTileTheme,

  // Dungeon Theme CRUD
  saveDungeonTheme,
  getDungeonThemes,
  getDungeonTheme,
  updateDungeonTheme,
  deleteDungeonTheme
} from './db/index';
