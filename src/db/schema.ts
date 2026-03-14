import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";

// ─────────────────────────────────────────────
// SOURCES — every data point must have a source
// ─────────────────────────────────────────────
export const sources = sqliteTable("sources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  type: text("type", {
    enum: ["manuscript", "scholarly", "online", "folklore"],
  }).notNull(),
  author: text("author"),
  year: integer("year"),
  url: text("url"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────────
// APPROVAL WORKFLOW
// ─────────────────────────────────────────────
// Added to characters, events, places, groups, familyRelations.
// status defaults to 'approved' so existing seed data stays visible.
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// GROUPS / TRIBES
// ─────────────────────────────────────────────
export const groups = sqliteTable("groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  altNames: text("alt_names"),
  description: text("description"),
  sourceId: integer("source_id").references(() => sources.id),
  status: text("status", { enum: ["draft", "pending_review", "approved", "rejected"] }).default("approved"),
  sourceQuote: text("source_quote"),
  proposedBy: text("proposed_by", { enum: ["human", "ai"] }).default("human"),
  reviewedAt: text("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────────
// CHARACTERS
// ─────────────────────────────────────────────
export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  altNames: text("alt_names"),
  gender: text("gender", { enum: ["male", "female", "other", "unknown"] }).default("unknown"),
  description: text("description"),
  epithet: text("epithet"),
  isDeity: integer("is_deity", { mode: "boolean" }).default(false),
  isDead: integer("is_dead", { mode: "boolean" }).default(false),
  sourceId: integer("source_id").references(() => sources.id),
  status: text("status", { enum: ["draft", "pending_review", "approved", "rejected"] }).default("approved"),
  sourceQuote: text("source_quote"),
  proposedBy: text("proposed_by", { enum: ["human", "ai"] }).default("human"),
  reviewedAt: text("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

export const characterGroups = sqliteTable("character_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  sourceId: integer("source_id").references(() => sources.id),
});

// ─────────────────────────────────────────────
// CHARACTER PROPERTIES
// ─────────────────────────────────────────────
export const characterProperties = sqliteTable("character_properties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["color", "animal", "weapon", "clothing", "place", "epithet", "attribute", "skill", "other"],
  }).notNull(),
  value: text("value").notNull(),
  notes: text("notes"),
  sourceId: integer("source_id").references(() => sources.id),
});

// ─────────────────────────────────────────────
// FAMILY RELATIONS
// ─────────────────────────────────────────────
export const familyRelations = sqliteTable("family_relations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromCharacterId: integer("from_character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  toCharacterId: integer("to_character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  relationType: text("relation_type", {
    enum: [
      "father", "mother", "child",
      "sibling", "half_sibling",
      "spouse", "lover",
      "foster_parent", "foster_child",
      "uncle", "aunt", "nephew", "niece",
      "grandparent", "grandchild",
      "aspect",   // divine being in multiple simultaneous incarnations
      "other",
    ],
  }).notNull(),
  notes: text("notes"),
  sourceId: integer("source_id").references(() => sources.id),
  status: text("status", { enum: ["draft", "pending_review", "approved", "rejected"] }).default("approved"),
  sourceQuote: text("source_quote"),
  proposedBy: text("proposed_by", { enum: ["human", "ai"] }).default("human"),
  reviewedAt: text("reviewed_at"),
  reviewNotes: text("review_notes"),
});

// ─────────────────────────────────────────────
// PLACES
// ─────────────────────────────────────────────
export const places = sqliteTable("places", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  altNames: text("alt_names"),
  type: text("type", {
    enum: ["otherworld", "hill", "island", "plain", "forest", "river", "sea", "fortress", "other"],
  }).default("other"),
  modernEquivalent: text("modern_equivalent"),
  description: text("description"),
  sourceId: integer("source_id").references(() => sources.id),
  status: text("status", { enum: ["draft", "pending_review", "approved", "rejected"] }).default("approved"),
  sourceQuote: text("source_quote"),
  proposedBy: text("proposed_by", { enum: ["human", "ai"] }).default("human"),
  reviewedAt: text("reviewed_at"),
  reviewNotes: text("review_notes"),
});

// ─────────────────────────────────────────────
// EVENTS
//
// event_type distinguishes atomic lifecycle events (birth, death)
// from composite narrative events (battle, reign) and interaction
// events (meeting, transformation). parent_event_id creates hierarchy:
// a battle event contains individual combat events as children.
// character_id on birth/death events enables automatic constraint
// derivation: birth(C) < every event with C < death(C).
// ─────────────────────────────────────────────
export const eventTypes = [
  "birth",           // lifecycle boundary — character enters the story
  "death",           // lifecycle boundary — character leaves the story
  "meeting",         // two or more characters interact
  "battle",          // armed conflict; usually a parent event with children
  "reign",           // period of rule; interval event with children
  "transformation",  // shapeshifting, curses, physical change
  "prophecy",        // prediction, geis, omen
  "journey",         // significant travel
  "other",
] as const;

export const mythologicalCycles = [
  "mythological",  // Lebor Gabála Érenn — invasions
  "ulster",        // Táin Bó Cúailnge etc.
  "fenian",        // Fionn mac Cumhaill
  "kings",         // Historical cycles
  "other",
] as const;

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  eventType: text("event_type", { enum: eventTypes }).default("other"),
  // For hierarchy: a battle event is the parent of individual combat events
  parentEventId: integer("parent_event_id").references((): AnySQLiteColumn => events.id),
  // For birth/death events: which character does this lifecycle event belong to?
  characterId: integer("character_id").references(() => characters.id),
  cycle: text("cycle", { enum: mythologicalCycles }).default("other"),
  approximateEra: text("approximate_era"),
  sourceId: integer("source_id").references(() => sources.id),
  status: text("status", { enum: ["draft", "pending_review", "approved", "rejected"] }).default("approved"),
  sourceQuote: text("source_quote"),
  proposedBy: text("proposed_by", { enum: ["human", "ai"] }).default("human"),
  reviewedAt: text("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// Characters participating in an event
export const eventCharacters = sqliteTable("event_characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  characterId: integer("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  role: text("role", {
    enum: ["protagonist", "antagonist", "ally", "mentioned", "victim", "other"],
  }).default("other"),
  notes: text("notes"),
  sourceId: integer("source_id").references(() => sources.id),
});

// Places where an event occurs
export const eventPlaces = sqliteTable("event_places", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  placeId: integer("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  sourceId: integer("source_id").references(() => sources.id),
});

// ─────────────────────────────────────────────
// EVENT RELATIONS — the heart of the timeline DAG
//
// relation_type semantics:
//   before   — from ends before to begins (strict ordering)
//   causes   — from before to, plus causal link (implies before)
//   contains — from is a time interval that contains to (hierarchy)
//   parallel — from and to overlap in time (simultaneous)
//   meets    — from ends exactly when to begins (adjacent, no gap)
//
// For topological sort, only before/causes/meets create ordering edges.
// contains is structural (handled by parent_event_id).
// parallel means no ordering constraint between the two events.
//
// reason is nullable to allow auto-generated lifecycle constraints.
// ─────────────────────────────────────────────
export const eventRelationTypes = [
  "before",    // from comes before to
  "causes",    // from before to, with causal link
  "contains",  // from is interval containing to (softer than parent_event_id)
  "parallel",  // from and to overlap — no ordering between them
  "meets",     // from ends exactly when to begins
] as const;

export const eventRelations = sqliteTable("event_relations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromEventId: integer("from_event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  toEventId: integer("to_event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  relationType: text("relation_type", { enum: eventRelationTypes }).notNull().default("before"),
  confidence: text("confidence", {
    enum: ["certain", "probable", "speculative"],
  }).default("probable"),
  reason: text("reason"),
  sourceId: integer("source_id").references(() => sources.id),
});

// ─────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type CharacterProperty = typeof characterProperties.$inferSelect;
export type FamilyRelation = typeof familyRelations.$inferSelect;
export type Place = typeof places.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventRelation = typeof eventRelations.$inferSelect;
