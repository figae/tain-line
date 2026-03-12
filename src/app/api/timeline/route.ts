import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Kahn's algorithm — topological sort on the event relation DAG.
 *
 * Only 'before', 'causes', and 'meets' create strict ordering edges.
 * 'contains' and 'parallel' are structural/concurrent — they don't
 * constrain topological position relative to each other.
 */
function topologicalSort(
  eventIds: number[],
  relations: { fromEventId: number; toEventId: number; relationType: string | null }[]
): number[] {
  const ORDERING_TYPES = new Set(["before", "causes", "meets"]);

  const inDegree = new Map<number, number>();
  const adj = new Map<number, number[]>();

  for (const id of eventIds) {
    inDegree.set(id, 0);
    adj.set(id, []);
  }

  for (const rel of relations) {
    if (!ORDERING_TYPES.has(rel.relationType ?? "")) continue;
    if (!inDegree.has(rel.toEventId) || !adj.has(rel.fromEventId)) continue;
    adj.get(rel.fromEventId)!.push(rel.toEventId);
    inDegree.set(rel.toEventId, (inDegree.get(rel.toEventId) ?? 0) + 1);
  }

  const queue: number[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const result: number[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    for (const neighbor of adj.get(node) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  return result;
}

const CYCLE_ORDER: Record<string, number> = {
  mythological: 0,
  ulster: 1,
  fenian: 2,
  kings: 3,
  other: 4,
};

export async function GET() {
  const [events, relations, allEventChars] = await Promise.all([
    db.select().from(schema.events),
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
  ]);

  // Pre-sort by cycle so events with no ordering constraints appear in
  // mythological → ulster → fenian order
  const sorted = [...events].sort(
    (a, b) =>
      (CYCLE_ORDER[a.cycle ?? "other"] ?? 4) -
      (CYCLE_ORDER[b.cycle ?? "other"] ?? 4)
  );

  const topoOrder = topologicalSort(sorted.map((e) => e.id), relations);

  const eventById = new Map(events.map((e) => [e.id, e]));

  const charsByEvent = new Map<number, typeof allEventChars>();
  for (const ec of allEventChars) {
    if (!charsByEvent.has(ec.eventId)) charsByEvent.set(ec.eventId, []);
    charsByEvent.get(ec.eventId)!.push(ec);
  }

  // Build relation index: for each event, what does it connect to?
  type RelEntry = { eventId: number; relationType: string; direction: "from" | "to" };
  const relsByEvent = new Map<number, RelEntry[]>();
  for (const rel of relations) {
    if (!relsByEvent.has(rel.fromEventId)) relsByEvent.set(rel.fromEventId, []);
    if (!relsByEvent.has(rel.toEventId))   relsByEvent.set(rel.toEventId, []);
    relsByEvent.get(rel.fromEventId)!.push({ eventId: rel.toEventId,   relationType: rel.relationType ?? "before", direction: "from" });
    relsByEvent.get(rel.toEventId)!.push(  { eventId: rel.fromEventId, relationType: rel.relationType ?? "before", direction: "to"   });
  }

  const timeline = topoOrder
    .map((id) => {
      const event = eventById.get(id);
      if (!event) return null;
      return {
        ...event,
        position: topoOrder.indexOf(id),
        characters: charsByEvent.get(id) ?? [],
        relations: relsByEvent.get(id) ?? [],
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    timeline,
    totalEvents: events.length,
    // Expose the full relation set for graph rendering
    relations: relations.map((r) => ({
      fromEventId: r.fromEventId,
      toEventId: r.toEventId,
      relationType: r.relationType,
      confidence: r.confidence,
    })),
  });
}
