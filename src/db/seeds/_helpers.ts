/**
 * Shared helpers for seed files.
 * These wrap raw SQLite statements to avoid repetition across seed files.
 */
import type Database from "better-sqlite3";

export interface Statements {
  insEvent: Database.Statement;
  insEC: Database.Statement;
  insRel: Database.Statement;
}

export function makeStatements(db: Database.Database): Statements {
  return {
    insEvent: db.prepare(
      `INSERT INTO events (name, description, event_type, parent_event_id, character_id, cycle, approximate_era, source_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ),
    insEC: db.prepare(
      `INSERT INTO event_characters (event_id, character_id, role, notes, source_id) VALUES (?, ?, ?, ?, ?)`
    ),
    insRel: db.prepare(
      `INSERT INTO event_relations (from_event_id, to_event_id, relation_type, confidence, reason, source_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ),
  };
}

export interface LifecycleIds {
  birthId: number;
  deathId: number;
}

/**
 * Creates a birth + death event pair for a character and links them
 * with a certain 'before' constraint.
 *
 * Returns the two event IDs. Use these to:
 *   - Place narrative events between birthId and deathId via 'before' rels
 *   - Set deathId as a known death when the death is described elsewhere
 *     (link: narrative_event causes deathId)
 */
export function mkLifecycle(
  stmts: Statements,
  opts: {
    characterId: number;
    name: string;
    cycle: string;
    sourceId: number | null;
  }
): LifecycleIds {
  const birthId = stmts.insEvent.run(
    `Birth of ${opts.name}`, null, "birth",
    null, opts.characterId, opts.cycle, null, opts.sourceId
  ).lastInsertRowid as number;

  stmts.insEC.run(birthId, opts.characterId, "protagonist", null, opts.sourceId);

  const deathId = stmts.insEvent.run(
    `Death of ${opts.name}`, null, "death",
    null, opts.characterId, opts.cycle, null, opts.sourceId
  ).lastInsertRowid as number;

  stmts.insEC.run(deathId, opts.characterId, "victim", null, opts.sourceId);

  // The only constraint we know for certain for every being: birth before death
  stmts.insRel.run(
    birthId, deathId, "before", "certain",
    `${opts.name} is born before dying`, opts.sourceId
  );

  return { birthId, deathId };
}

/**
 * Adds lifecycle constraints linking a character's birth and death events
 * to a list of narrative events they participate in.
 *
 * birth(C) --before--> event --before--> death(C)
 */
export function addLifecycleBrackets(
  stmts: Statements,
  opts: {
    name: string;
    birthId: number;
    deathId: number;
    eventIds: number[];
    sourceId: number | null;
  }
): void {
  for (const eventId of opts.eventIds) {
    stmts.insRel.run(
      opts.birthId, eventId, "before", "certain",
      `${opts.name} must exist before this event`, opts.sourceId
    );
    stmts.insRel.run(
      eventId, opts.deathId, "before", "certain",
      `This event occurs before ${opts.name}'s death`, opts.sourceId
    );
  }
}
