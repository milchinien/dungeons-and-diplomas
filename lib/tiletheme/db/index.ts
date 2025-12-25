/**
 * Tiletheme Database Operations
 *
 * Re-exports all tiletheme CRUD operations.
 * Note: initializeTilethemeTables is now handled automatically by the SQLite adapter.
 */

// Tileset CRUD
export { saveTileset, getTilesets, getTileset, deleteTileset } from './tilesets';

// Tile Theme CRUD
export {
  saveTileTheme,
  getTileThemes,
  getTileTheme,
  updateTileTheme,
  deleteTileTheme,
} from './tileThemes';

// Dungeon Theme CRUD
export {
  saveDungeonTheme,
  getDungeonThemes,
  getDungeonTheme,
  updateDungeonTheme,
  deleteDungeonTheme,
} from './dungeonThemes';
