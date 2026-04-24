-- ============================================================
-- CLGBITES — New Users Table
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create the users table
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL UNIQUE,
  location   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Allow anyone to read and upsert users
--    (users identify themselves by phone number — no auth token needed)
CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update users"
  ON users FOR UPDATE
  USING (true);

-- 4. (Optional) Index on phone for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
