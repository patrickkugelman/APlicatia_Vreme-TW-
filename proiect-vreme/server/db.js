import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db;

export function initDb(caleDb = join(__dirname, 'data.db')) {
  db = new Database(caleDb);
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      city TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(client_id, city)
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      city TEXT NOT NULL,
      searched_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      client_id TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'intuneric',
      unit_temp TEXT DEFAULT 'C',
      unit_wind TEXT DEFAULT 'kmh',
      alert_temp_min REAL,
      alert_temp_max REAL
    );

    CREATE INDEX IF NOT EXISTS idx_history_client ON history(client_id, searched_at DESC);

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS community_searches (
      city TEXT PRIMARY KEY,
      search_count INTEGER NOT NULL DEFAULT 1,
      last_searched_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_community_count ON community_searches(search_count DESC);
  `);
  return db;
}

export function getDb() {
  if (!db) throw new Error('Baza de date nu a fost inițializată. Apelați initDb() mai întâi.');
  return db;
}
