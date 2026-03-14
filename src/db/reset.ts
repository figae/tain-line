/**
 * Reset the database: drop all tables, re-run migration, optionally seed.
 *
 * Usage:
 *   npm run db:reset                # empty DB (schema only)
 *   npm run db:reset -- core        # reset + seed core data
 *   npm run db:reset -- core cmt-deep  # reset + multiple seeds
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const DB_PATH = path.join(process.cwd(), "data", "tain-line.db");

// Delete the DB file entirely for a clean start
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  // Also remove WAL/SHM files if present
  for (const suffix of ["-wal", "-shm"]) {
    const f = DB_PATH + suffix;
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  console.log("  Deleted existing database");
}

// Re-run migration to create fresh schema
console.log("  Running migration ...");
execSync("npm run db:migrate", { stdio: "inherit" });

// If seed names were passed, forward them to the seed runner
const seedArgs = process.argv.slice(2);
if (seedArgs.length > 0) {
  console.log(`  Seeding: ${seedArgs.join(", ")} ...`);
  execSync(`npm run db:seed -- ${seedArgs.join(" ")}`, { stdio: "inherit" });
}

console.log("\n  Reset complete.\n");
