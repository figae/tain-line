import type Database from "better-sqlite3";

export interface Seed {
  name: string;
  description: string;
  seed: (db: Database.Database) => void;
}
