-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Case-insensitive unique index for username lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Anyone can read users (for highscores display)
CREATE POLICY "Allow public read access to users"
  ON users FOR SELECT TO public USING (true);

-- Service role can manage users (for login/registration)
CREATE POLICY "Service role can manage users"
  ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
