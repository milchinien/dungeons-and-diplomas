-- Seed data for app_metadata table
-- This provides initial version and configuration data

INSERT INTO app_metadata (key, value, description) VALUES
  ('app_version', '0.1.0', 'Current application version (Phase 1 - MVP Development)'),
  ('db_schema_version', '1', 'Database schema version number'),
  ('game_mode', 'development', 'Current game mode: development, staging, or production'),
  ('feature_flag_combat', 'true', 'Enable combat system'),
  ('feature_flag_multiplayer', 'false', 'Enable multiplayer features (not yet implemented)'),
  ('last_updated', NOW()::TEXT, 'Last time metadata was updated')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();
