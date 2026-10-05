CREATE TABLE IF NOT EXISTS profiles (
  user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  mobile        TEXT NOT NULL,
  address       TEXT NOT NULL,
  business_name TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);