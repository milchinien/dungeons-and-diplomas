/**
 * User-related database operations
 */
import { getDatabase } from './connection';

export interface User {
  id: number;
  username: string;
  xp: number;
  created_at: string;
  last_login: string;
}

/**
 * Login or create a user
 */
export function loginUser(username: string): User {
  const db = getDatabase();

  // Try to find existing user (case-insensitive)
  let user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username) as User | undefined;

  if (!user) {
    // Create new user
    const result = db.prepare('INSERT INTO users (username) VALUES (?)').run(username);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
  } else {
    // Update last_login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  }

  return user;
}

/**
 * Get user by ID
 */
export function getUserById(id: number): User | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}
