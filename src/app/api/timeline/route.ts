import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { topologicalSort } from "@/lib/topological-sort";
import { deriveConstraints } from "@/lib/derive-constraints";
import { checkConsistency } from "@/lib/consistency";

const CYCLE_ORDER: Record<string, number> = {
  mythological: 0,
  ulster: 1,
  fenian: 2,
  kings: 3,
  other: 4,
};

export async function GET() {
  const [events, relations, allEventChars, familyRels, charRows] = await Promise.all([
    db.select().from(schema.events).where(eq(schema.events.status, "approved")),
    db.select().from(schema.eventRelations),
    db
      .select({
        eventId: schema.eventCharacters.eventId,
        characterId: schema.characters.id,
        name: schema.characters.name,
        role: schema.eventCharacters.role,
      })
      .from(schema.eventCharacters)
      .innerJoin(schema.characters, eq(schema.eventCharacters.characterId, schema.characters.id)),
    db
      .select({
        fromCharacterId: schema.familyRelations.fromCharacterId,
        toCharacterId: schema.familyRelations.toCharacterId,
        relationType: schema.familyRelations.relationType,
      })
      .from(schema.familyRelations),
    db
      .select({ id: schema.characters.id, name: schema.characters.name })
      .from(schema.characters),
  ]);

  // ── Automatic constraint derivation ────────────────────────────────────
  // The hand-authored relations only capture explicit statements; the
  // rest follows from the data: birth(C) < every event with C < death(C),
  // and parents are born before their children. See lib/derive-constraints.
  const characterNames = new Map(charRows.map((c) => [c.id, c.name]));
  const derived = deriveConstraints(
    events.map((e) => ({ id: e.id, eventType: e.eventType, characterId: e.characterId })),
    allEventChars.map((ec) => ({ eventId: ec.eventId, characterId: ec.characterId, role: ec.role })),
    familyRels,
    relations.map((r) => ({ fromEventId: r.fromEventId, toEventId: r.toEventId })),
    characterNames
  );

  // Pre-sort by cycle so events with no ordering constraints appear in
  // mythological → ulster → fenian order
  const sorted = [...events].sort(
    (a, b) =>
      (CYCLE_ORDER[a.cycle ?? "other"] ?? 4) -
      (CYCLE_ORDER[b.cycle ?? "other"] ?? 4)
  );

  // Consistency check: contradictions between explicit and derived
  // edges form cycles. Explicit wins — conflicted derived edges are
  // dropped from the ordering; the conflicts surface in /admin/consistency.
  const consistency = checkConsistency(
    events.map((e) => e.id),
    relations.map((r) => ({
      fromEventId: r.fromEventId,
      toEventId: r.toEventId,
      relationType: r.relationType,
      reason: r.reason,
    })),
    derived
  );

  const topoOrder = topologicalSort(sorted.map((e) => e.id), consistency.orderingEdges);

  const eventById = new Map(events.map((e) => [e.id, e]));

  const charsByEvent = new Map<number, typeof allEventChars>();
  for (const ec of allEventChars) {
    if (!charsByEvent.has(ec.eventId)) charsByEvent.set(ec.eventId, []);
    charsByEvent.get(ec.eventId)!.push(ec);
  }

  // Build relation index: for each event, what does it connect to?
  type RelEntry = {
    eventId: number;
    relationType: string;
    direction: "from" | "to";
    derived?: boolean;
    reason?: string | null;
  };
  const relsByEvent = new Map<number, RelEntry[]>();
  const addRel = (
    fromId: number,
    toId: number,
    relationType: string,
    derived: boolean,
    reason: string | null
  ) => {
    if (!relsByEvent.has(fromId)) relsByEvent.set(fromId, []);
    if (!relsByEvent.has(toId)) relsByEvent.set(toId, []);
    relsByEvent.get(fromId)!.push({ eventId: toId, relationType, direction: "from", derived, reason });
    relsByEvent.get(toId)!.push({ eventId: fromId, relationType, direction: "to", derived, reason });
  };
  for (const rel of relations) {
    addRel(rel.fromEventId, rel.toEventId, rel.relationType ?? "before", false, rel.reason);
  }
  for (const rel of derived) {
    addRel(rel.fromEventId, rel.toEventId, rel.relationType, true, rel.reason);
  }

  const positionOf = new Map(topoOrder.map((id, idx) => [id, idx]));

  const timeline = topoOrder
    .map((id) => {
      const event = eventById.get(id);
      if (!event) return null;
      return {
        ...event,
        position: positionOf.get(id) ?? 0,
        characters: charsByEvent.get(id) ?? [],
        relations: relsByEvent.get(id) ?? [],
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    timeline,
    totalEvents: events.length,
    derivedConstraints: derived.length,
    explicitConstraints: relations.length,
    conflicts: consistency.conflicts.length,
    // Expose the full relation set for graph rendering
    relations: [
      ...relations.map((r) => ({
        fromEventId: r.fromEventId,
        toEventId: r.toEventId,
        relationType: r.relationType,
        confidence: r.confidence,
        derived: false,
      })),
      ...derived.map((r) => ({
        fromEventId: r.fromEventId,
        toEventId: r.toEventId,
        relationType: r.relationType,
        confidence: r.confidence,
        derived: true,
      })),
    ],
  });
}
