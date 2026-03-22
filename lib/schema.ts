import { getDb } from "@/lib/db";

const ddl = `
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expected_usd REAL NOT NULL DEFAULT 0,
  actual_usd REAL NOT NULL DEFAULT 0,
  source_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS task_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  stage TEXT NOT NULL,
  message TEXT NOT NULL,
  screenshot_path TEXT,
  decision_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS earnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER,
  platform TEXT NOT NULL,
  amount_usd REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  note TEXT,
  FOREIGN KEY(task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total_usd REAL NOT NULL,
  task_success_rate REAL NOT NULL,
  by_platform_json TEXT NOT NULL,
  active_platform TEXT,
  active_stage TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  active_platform TEXT,
  active_stage TEXT,
  context_json TEXT NOT NULL DEFAULT '{}',
  last_heartbeat TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS installed_deps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_name TEXT NOT NULL UNIQUE,
  version TEXT,
  installed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function migrate() {
  const db = getDb();
  db.exec(ddl);
  db.prepare(
    `INSERT INTO agent_state(id, active_platform, active_stage, context_json)
     VALUES(1, NULL, 'idle', '{}')
     ON CONFLICT(id) DO NOTHING`
  ).run();
}
