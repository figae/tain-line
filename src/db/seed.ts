/**
 * Seed runner — loads and executes seed files from src/db/seeds/.
 *
 * Usage:
 *   npm run db:seed                     # list available seeds
 *   npm run db:seed -- core             # run one seed
 *   npm run db:seed -- core cmt-deep    # run multiple seeds in order
 *   npm run db:reset                    # wipe DB, re-migrate (empty start)
 *   npm run db:reset -- core            # wipe + seed in one step
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "tain-line.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Discover all seed files
const SEEDS_DIR = path.join(__dirname, "seeds");
function discoverSeeds(): Map<string, { name: string; description: string; file: string }> {
  const map = new Map<string, { name: string; description: string; file: string }>();
  for (const file of fs.readdirSync(SEEDS_DIR)) {
    if (file === "types.ts" || !file.endsWith(".ts")) continue;
    const slug = file.replace(/\.ts$/, "");
    const mod = require(path.join(SEEDS_DIR, file));
    map.set(slug, {
      name: mod.name ?? slug,
      description: mod.description ?? "",
      file,
    });
  }
  return map;
}

const args = process.argv.slice(2);
const seeds = discoverSeeds();

// No args → list available seeds
if (args.length === 0) {
  console.log("\nAvailable seeds:\n");
  for (const [slug, info] of seeds) {
    console.log(`  ${slug.padEnd(22)} ${info.name}`);
    if (info.description) console.log(`  ${"".padEnd(22)} ${info.description}`);
    console.log();
  }
  console.log("Usage:  npm run db:seed -- <seed> [<seed> ...]");
  console.log("        npm run db:reset -- <seed>   (wipe + seed)\n");
  process.exit(0);
}

// Validate requested seeds exist
for (const slug of args) {
  if (!seeds.has(slug)) {
    console.error(`Unknown seed: "${slug}". Run \`npm run db:seed\` to list available seeds.`);
    process.exit(1);
  }
}

// Open DB and run seeds in a transaction
const sqlite = new Database(DB_PATH);
sqlite.pragma("foreign_keys = ON");

const runAll = sqlite.transaction(() => {
  for (const slug of args) {
    const mod = require(path.join(SEEDS_DIR, seeds.get(slug)!.file));
    console.log(`  Seeding: ${mod.name ?? slug} ...`);
    mod.seed(sqlite);
  }
});

try {
  runAll();
  console.log(`\n  Done. ${args.length} seed(s) applied to ${DB_PATH}\n`);
} catch (err) {
  console.error("\nSeed failed:", err);
  process.exit(1);
} finally {
  sqlite.close();
}
