-- Sea Zero — Cloudflare D1 Schema
-- Run: wrangler d1 execute sea-zero-db --file=./d1/schema.sql

-- ─── Auth ───

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email COLLATE NOCASE);

-- ─── Competition Data ───

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4A90CC',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_color TEXT NOT NULL,
  config TEXT NOT NULL,
  sim_result TEXT NOT NULL,
  economics TEXT NOT NULL,
  emissions TEXT NOT NULL,
  score REAL NOT NULL,
  breakdown TEXT NOT NULL,
  submitted_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_submissions_team ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_score ON submissions(score);

CREATE TABLE IF NOT EXISTS custom_routes (
  id INTEGER PRIMARY KEY DEFAULT 1,
  ports TEXT NOT NULL,
  legs TEXT NOT NULL,
  route_name TEXT NOT NULL DEFAULT 'Custom Route',
  uploaded_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- ─── Admin Frozen Controls ───

CREATE TABLE IF NOT EXISTS frozen_controls (
  id INTEGER PRIMARY KEY DEFAULT 1,
  locked_keys TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- ─── User Saved Simulation Config ───

CREATE TABLE IF NOT EXISTS user_configs (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  config TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

