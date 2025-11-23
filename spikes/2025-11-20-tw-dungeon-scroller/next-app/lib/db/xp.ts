/**
 * XP-related database operations
 */
import { getDatabase } from './connection';
import type { XpLogEntry } from '../types/api';

// Re-export type for convenience
export type { XpLogEntry };

/**
 * Add XP to a user and log the gain
 */
export function addXp(entry: XpLogEntry): void {
  const db = getDatabase();

  // Log the XP gain
  db.prepare(`
    INSERT INTO xp_log (user_id, xp_amount, reason, enemy_level)
    VALUES (?, ?, ?, ?)
  `).run(
    entry.user_id,
    entry.xp_amount,
    entry.reason,
    entry.enemy_level || null
  );

  // Update user's total XP
  db.prepare(`
    UPDATE users SET xp = xp + ? WHERE id = ?
  `).run(entry.xp_amount, entry.user_id);
}
