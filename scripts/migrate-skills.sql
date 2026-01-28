-- Migration: Add skill system tables
-- Run this to add skill tables to existing database

-- Create skill_points table if not exists
CREATE TABLE IF NOT EXISTS skill_points (
  user_id INTEGER PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  spent_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create user_skills table if not exists
CREATE TABLE IF NOT EXISTS user_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  skill_id TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  UNIQUE(user_id, skill_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indices if not exist
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id);

-- Initialize skill_points for existing users
INSERT OR IGNORE INTO skill_points (user_id, total_points, spent_points, available_points)
SELECT id, 0, 0, 0 FROM users;
