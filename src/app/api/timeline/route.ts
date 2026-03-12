import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Kahn's algorithm — topological sort on the event dependency DAG.
 * Returns events ordered so that if A must precede B, A appears first.
 * Events with no dependencies are ordered by cycle (mythological first).
 */
function topologicalSort(
  eventIds: number[],
  deps: { beforeEventId: number; afterEventId: number; confidence: string | null }[]
): number[] {
  const inDegree = new Map<number, number>();
  const adj = new Map<number, number[]>();

  for (const id of eventIds) {
    inDegree.set(id, 0);
    adj.set(id, []);
  }

  for (const dep of deps) {
    if (!inDegree.has(dep.afterEventId) || !adj.has(dep.beforeEventId)) continue;
    adj.get(dep.beforeEventId)!.push(dep.afterEventId);
    inDegree.set(dep.afterEventId, (inDegree.get(dep.afterEventId) ?? 0) + 1);
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
  const [events, deps, allEventChars] = await Promise.all([
    db.select().from(schema.events),
    db.select().from(schema.eventDependencies),
    db
      .select({
        eventId: schema.eventCharacters.eventId,
        characterId: schema.characters.id,
        name: schema.characters.name,
        role: schema.eventCharacters.role,
      })
      .from(schema.eventCharacters)
      .innerJoin(
        schema.characters,
        eq(schema.eventCharacters.characterId, schema.characters.id)
      ),
  ]);

  // Sort events by cycle first, then topological
  const sorted = [...events].sort(
    (a, b) =>
      (CYCLE_ORDER[a.cycle ?? "other"] ?? 4) -
      (CYCLE_ORDER[b.cycle ?? "other"] ?? 4)
  );

  const topoOrder = topologicalSort(
    sorted.map((e) => e.id),
    deps
  );

  // Build a lookup
  const eventById = new Map(events.map((e) => [e.id, e]));
  const charsByEvent = new Map<number, typeof allEventChars>();
  for (const ec of allEventChars) {
    if (!charsByEvent.has(ec.eventId)) charsByEvent.set(ec.eventId, []);
    charsByEvent.get(ec.eventId)!.push(ec);
  }

  const dependenciesByEvent = new Map<
    number,
    { before: number[]; after: number[] }
  >();
  for (const dep of deps) {
    if (!dependenciesByEvent.has(dep.beforeEventId)) {
      dependenciesByEvent.set(dep.beforeEventId, { before: [], after: [] });
    }
    if (!dependenciesByEvent.has(dep.afterEventId)) {
      dependenciesByEvent.set(dep.afterEventId, { before: [], after: [] });
    }
    dependenciesByEvent.get(dep.beforeEventId)!.after.push(dep.afterEventId);
    dependenciesByEvent.get(dep.afterEventId)!.before.push(dep.beforeEventId);
  }

  const timeline = topoOrder
    .map((id) => {
      const event = eventById.get(id);
      if (!event) return null;
      return {
        ...event,
        position: topoOrder.indexOf(id),
        characters: charsByEvent.get(id) ?? [],
        dependencies: dependenciesByEvent.get(id) ?? { before: [], after: [] },
      };
    })
    .filter(Boolean);

  return NextResponse.json({ timeline, totalEvents: events.length });
}
