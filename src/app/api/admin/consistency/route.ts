import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireRole, isGuardError } from "@/lib/api-guard";
import { deriveConstraints } from "@/lib/derive-constraints";
import { checkConsistency } from "@/lib/consistency";

/**
 * GET /api/admin/consistency — run the full consistency check and
 * return every conflict with event names, the clashing edges and
 * their reasons, so a reviewer can fix the data.
 */
export async function GET() {
  const session = await requireRole("admin");
  if (isGuardError(session)) return session;

  const [events, relations, allEventChars, familyRels, charRows] = await Promise.all([
    db.select().from(schema.events).where(eq(schema.events.status, "approved")),
    db.select().from(schema.eventRelations),
    db
      .select({
        eventId: schema.eventCharacters.eventId,
        characterId: schema.eventCharacters.characterId,
        role: schema.eventCharacters.role,
      })
      .from(schema.eventCharacters),
    db
      .select({
        fromCharacterId: schema.familyRelations.fromCharacterId,
        toCharacterId: schema.familyRelations.toCharacterId,
        relationType: schema.familyRelations.relationType,
      })
      .from(schema.familyRelations),
    db.select({ id: schema.characters.id, name: schema.characters.name }).from(schema.characters),
  ]);

  const characterNames = new Map(charRows.map((c) => [c.id, c.name]));
  const derived = deriveConstraints(
    events.map((e) => ({ id: e.id, eventType: e.eventType, characterId: e.characterId })),
    allEventChars,
    familyRels,
    relations.map((r) => ({ fromEventId: r.fromEventId, toEventId: r.toEventId })),
    characterNames
  );

  const result = checkConsistency(
    events.map((e) => e.id),
    relations.map((r) => ({
      fromEventId: r.fromEventId,
      toEventId: r.toEventId,
      relationType: r.relationType,
      reason: r.reason,
    })),
    derived
  );

  const eventName = new Map(events.map((e) => [e.id, e.name]));

  return NextResponse.json({
    totalEvents: events.length,
    explicitConstraints: relations.length,
    derivedConstraints: derived.length,
    conflictCount: result.conflicts.length,
    droppedDerived: result.droppedDerived.length,
    conflicts: result.conflicts.map((c) => ({
      explicitOnly: c.explicitOnly,
      events: c.eventIds.map((id) => ({ id, name: eventName.get(id) ?? `#${id}` })),
      edges: c.edges.map((e) => ({
        from: { id: e.fromEventId, name: eventName.get(e.fromEventId) ?? `#${e.fromEventId}` },
        to: { id: e.toEventId, name: eventName.get(e.toEventId) ?? `#${e.toEventId}` },
        relationType: e.relationType,
        derived: e.derived ?? false,
        reason: e.reason ?? null,
      })),
    })),
  });
}
