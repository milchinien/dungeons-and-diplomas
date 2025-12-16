/**
 * Database connection management
 *
 * Supports both file-based and in-memory databases for testing.
 */
import Database from 'better-sqlite3';
import path from 'path';

// Database path
export const DB_PATH = path.join(process.cwd(), 'data', 'game.db');

// Default database connection (production singleton)
let db: Database.Database | null = null;

/**
 * Database configuration options
 */
export interface DatabaseOptions {
  /** Path to database file, or ':memory:' for in-memory database */
  path?: string;
  /** Whether to seed with initial data (default: true for file-based, false for in-memory) */
  seed?: boolean;
}

/**
 * Create a new database connection
 *
 * Use this for testing with in-memory databases or custom paths.
 * For production, use getDatabase() which manages a singleton.
 *
 * @param options Configuration options
 * @returns New database connection
 */
export function createDatabase(options: DatabaseOptions = {}): Database.Database {
  const dbPath = options.path ?? DB_PATH;
  const isInMemory = dbPath === ':memory:';
  const shouldSeed = options.seed ?? !isInMemory;

  const database = new Database(dbPath);

  // Import and run initialization (avoid circular dependency)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initializeDatabase } = require('./init');
  initializeDatabase(database, { seed: shouldSeed });

  return database;
}

/**
 * Get or initialize the default database connection (production singleton)
 *
 * For testing, prefer createDatabase({ path: ':memory:' }) instead.
 */
export function getDatabase(): Database.Database {
  if (!db) {
    db = createDatabase();
  }
  return db;
}

/**
 * Reset the database connection (useful for testing)
 *
 * Closes the current connection and clears the singleton.
 * Next call to getDatabase() will create a new connection.
 */
export function resetDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Create an in-memory database for testing
 *
 * Convenience function that creates an isolated in-memory database.
 * Each call returns a new, independent database instance.
 *
 * @param seed Whether to seed with initial question data
 * @returns In-memory database instance
 */
export function createTestDatabase(seed: boolean = false): Database.Database {
  return createDatabase({ path: ':memory:', seed });
}
