import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";

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
// GROUPS / TRIBES (Tuatha Dé Danann, Fomorians, Fianna …)
// ─────────────────────────────────────────────
export const groups = sqliteTable("groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  altNames: text("alt_names"), // JSON array
  description: text("description"),
  sourceId: integer("source_id").references(() => sources.id),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// ─────────────────────────────────────────────
// CHARACTERS
// ─────────────────────────────────────────────
export const characters = sqliteTable("characters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  altNames: text("alt_names"), // JSON array of strings
  gender: text("gender", { enum: ["male", "female", "other", "unknown"] }).default("unknown"),
  description: text("description"),
  epithet: text("epithet"), // e.g. "of the Long Arm"
  isDeity: integer("is_deity", { mode: "boolean" }).default(false),
  isDead: integer("is_dead", { mode: "boolean" }).default(false),
  sourceId: integer("source_id").references(() => sources.id),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`),
});

// Character ↔ Group membership (many-to-many)
export const characterGroups = sqliteTable("character_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  sourceId: integer("source_id").references(() => sources.id),
});

// ─────────────────────────────────────────────
// CHARACTER PROPERTIES
// colors, animals, weapons, clothing, places, epithets …
// ─────────────────────────────────────────────
export const characterProperties = sqliteTable("character_properties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  characterId: integer("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: [
      "color",
      "animal",
      "weapon",
      "clothing",
      "place",
      "epithet",
      "attribute",
      "skill",
      "other",
    ],
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
    enum: ["father", "mother", "child", "sibling", "spouse", "foster_parent", "foster_child", "other"],
  }).notNull(),
  notes: text("notes"),
  sourceId: integer("source_id").references(() => sources.id),
});

// ─────────────────────────────────────────────
// PLACES
// ─────────────────────────────────────────────
export const places = sqliteTable("places", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  altNames: text("alt_names"), // JSON array
  type: text("type", {
    enum: ["otherworld", "hill", "island", "plain", "forest", "river", "sea", "fortress", "other"],
  }).default("other"),
  modernEquivalent: text("modern_equivalent"),
  description: text("description"),
  sourceId: integer("source_id").references(() => sources.id),
});

// ─────────────────────────────────────────────
// EVENTS — the building blocks of the timeline
// ─────────────────────────────────────────────
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
  cycle: text("cycle", { enum: mythologicalCycles }).default("other"),
  // Optional absolute date hints (very rough, many are unknown)
  approximateEra: text("approximate_era"), // e.g. "Before Fomorian War"
  sourceId: integer("source_id").references(() => sources.id),
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
// EVENT DEPENDENCIES — the heart of the timeline
//
// beforeEventId MUST come before afterEventId
// reason explains WHY we know this (e.g. "B dies in afterEvent,
// so interaction with B in beforeEvent must come first")
// ─────────────────────────────────────────────
export const eventDependencies = sqliteTable("event_dependencies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  beforeEventId: integer("before_event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  afterEventId: integer("after_event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(), // always document why
  confidence: text("confidence", {
    enum: ["certain", "probable", "speculative"],
  }).default("probable"),
  sourceId: integer("source_id").references(() => sources.id),
});

// ─────────────────────────────────────────────
// TYPE EXPORTS for convenience
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
export type EventDependency = typeof eventDependencies.$inferSelect;
