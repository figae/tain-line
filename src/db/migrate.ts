/**
 * Run this to create/update the database schema.
 * Usage: npx tsx src/db/migrate.ts
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "tain-line.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const schema = /* sql */ `

CREATE TABLE IF NOT EXISTS sources (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  type       TEXT NOT NULL CHECK(type IN ('manuscript','scholarly','online','folklore')),
  author     TEXT,
  year       INTEGER,
  url        TEXT,
  notes      TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS groups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  alt_names   TEXT,
  description TEXT,
  source_id   INTEGER REFERENCES sources(id),
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS characters (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  alt_names   TEXT,
  gender      TEXT DEFAULT 'unknown' CHECK(gender IN ('male','female','other','unknown')),
  description TEXT,
  epithet     TEXT,
  is_deity    INTEGER DEFAULT 0,
  is_dead     INTEGER DEFAULT 0,
  source_id   INTEGER REFERENCES sources(id),
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS character_groups (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  group_id     INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  source_id    INTEGER REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS character_properties (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK(type IN ('color','animal','weapon','clothing','place','epithet','attribute','skill','other')),
  value        TEXT NOT NULL,
  notes        TEXT,
  source_id    INTEGER REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS family_relations (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  from_character_id   INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  to_character_id     INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relation_type       TEXT NOT NULL CHECK(relation_type IN ('father','mother','child','sibling','spouse','foster_parent','foster_child','other')),
  notes               TEXT,
  source_id           INTEGER REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS places (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  alt_names        TEXT,
  type             TEXT DEFAULT 'other' CHECK(type IN ('otherworld','hill','island','plain','forest','river','sea','fortress','other')),
  modern_equivalent TEXT,
  description      TEXT,
  source_id        INTEGER REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS events (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  description      TEXT,
  cycle            TEXT DEFAULT 'other' CHECK(cycle IN ('mythological','ulster','fenian','kings','other')),
  approximate_era  TEXT,
  source_id        INTEGER REFERENCES sources(id),
  created_at       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS event_characters (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id     INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  role         TEXT DEFAULT 'other' CHECK(role IN ('protagonist','antagonist','ally','mentioned','victim','other')),
  notes        TEXT,
  source_id    INTEGER REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS event_places (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id  INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  place_id  INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  source_id INTEGER REFERENCES sources(id)
);

CREATE TABLE IF NOT EXISTS event_dependencies (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  before_event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  after_event_id  INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL,
  confidence      TEXT DEFAULT 'probable' CHECK(confidence IN ('certain','probable','speculative')),
  source_id       INTEGER REFERENCES sources(id)
);

`;

// Run all CREATE TABLE statements
for (const statement of schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean)) {
  try {
    sqlite.exec(statement + ";");
  } catch (e) {
    console.error("Error:", statement.slice(0, 80));
    throw e;
  }
}

console.log("✓ Database schema created/updated at", DB_PATH);
sqlite.close();
