import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getEnv } from "@/lib/env";

let db: Database.Database | null = null;

export function getDb() {
  if (db) return db;

  const { SQLITE_PATH } = getEnv();
  const dir = path.dirname(SQLITE_PATH);
  fs.mkdirSync(dir, { recursive: true });

  db = new Database(SQLITE_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  return db;
}
