-- Accounts
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- One row per signed-in device. Only the SHA-256 of the bearer token is stored.
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Failed login / registration attempts for rate limiting
CREATE TABLE IF NOT EXISTS auth_attempts (
  key TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_key_ts ON auth_attempts(key, ts);

-- Ledger data. The primary key includes user_id, so two users can never
-- collide or overwrite each other even if a client-generated id repeats.
-- updated_at is the client clock (used for last-write-wins); synced_at is the
-- server clock at write time (used as the pull cursor, so a device that was
-- offline for a week can still deliver old edits to other devices).
CREATE TABLE IF NOT EXISTS books (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  synced_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_books_user_synced ON books(user_id, synced_at);

CREATE TABLE IF NOT EXISTS transactions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in','out')),
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  party TEXT NOT NULL DEFAULT '',
  payment_mode TEXT NOT NULL DEFAULT '',
  remarks TEXT NOT NULL DEFAULT '',
  occurred_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  synced_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_txn_user_synced ON transactions(user_id, synced_at);
CREATE INDEX IF NOT EXISTS idx_txn_user_book ON transactions(user_id, book_id);
