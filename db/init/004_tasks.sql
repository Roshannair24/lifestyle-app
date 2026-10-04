CREATE TABLE IF NOT EXISTS task_categories (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES task_categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  UNIQUE (category_id, name)
);

-- Which tasks each user picked (many-to-many)
CREATE TABLE IF NOT EXISTS user_tasks (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, task_id)   -- a task can't be picked twice
);