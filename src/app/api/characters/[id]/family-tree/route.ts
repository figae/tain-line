import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";

// Generations delta: how many levels does the OTHER character differ from ME,
// when I am the `from` side of the relation.
// If I am the `to` side, negate the delta.
const GEN_DELTA_FROM: Record<string, number> = {
  father:        -1,
  mother:        -1,
  foster_parent: -1,
  grandparent:   -2,
  uncle:         -1,
  aunt:          -1,
  child:         +1,
  foster_child:  +1,
  grandchild:    +2,
  nephew:        +1,
  niece:         +1,
  sibling:        0,
  half_sibling:   0,
  spouse:         0,
  lover:          0,
  aspect:         0,
  other:          0,
};

const BLOODLINE_MAX_DEPTH = 4;
const LATERAL_MAX_DEPTH   = 2;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const focalId = parseInt(id, 10);
  if (isNaN(focalId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [allRelations, allChars] = await Promise.all([
    db.select().from(schema.familyRelations),
    db.select({
      id:      schema.characters.id,
      name:    schema.characters.name,
      gender:  schema.characters.gender,
      isDeity: schema.characters.isDeity,
    }).from(schema.characters),
  ]);

  const charById = new Map(allChars.map((c) => [c.id, c]));

  if (!charById.has(focalId)) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  // Build adjacency: charId → list of {otherId, relationType, genDelta}
  type Adj = { otherId: number; relationType: string; genDelta: number };
  const adj = new Map<number, Adj[]>();

  for (const rel of allRelations) {
    const delta = GEN_DELTA_FROM[rel.relationType] ?? 0;

    if (!adj.has(rel.fromCharacterId)) adj.set(rel.fromCharacterId, []);
    if (!adj.has(rel.toCharacterId))   adj.set(rel.toCharacterId,   []);

    adj.get(rel.fromCharacterId)!.push({ otherId: rel.toCharacterId, relationType: rel.relationType, genDelta: delta });
    adj.get(rel.toCharacterId)!.push({  otherId: rel.fromCharacterId, relationType: rel.relationType, genDelta: -delta });
  }

  // BFS
  type NodeMeta = { generation: number; role: "focus" | "bloodline" | "lateral"; depth: number; isBloodline: boolean };
  const visited = new Map<number, NodeMeta>();
  visited.set(focalId, { generation: 0, role: "focus", depth: 0, isBloodline: true });

  const queue: { charId: number; depth: number; isBloodline: boolean }[] = [
    { charId: focalId, depth: 0, isBloodline: true },
  ];

  while (queue.length > 0) {
    const { charId, depth, isBloodline } = queue.shift()!;
    const maxDepth = isBloodline ? BLOODLINE_MAX_DEPTH : LATERAL_MAX_DEPTH;
    if (depth >= maxDepth) continue;

    const myGen = visited.get(charId)!.generation;

    for (const { otherId, relationType, genDelta } of adj.get(charId) ?? []) {
      if (visited.has(otherId)) continue;
      if (!charById.has(otherId)) continue;

      const otherGen = myGen + genDelta;
      const otherIsBloodline = isBloodline && genDelta !== 0;
      const role: NodeMeta["role"] = otherIsBloodline ? "bloodline" : "lateral";

      visited.set(otherId, { generation: otherGen, role, depth: depth + 1, isBloodline: otherIsBloodline });
      queue.push({ charId: otherId, depth: depth + 1, isBloodline: otherIsBloodline });
    }
  }

  // Build response nodes
  const nodes = Array.from(visited.entries()).map(([charId, meta]) => {
    const c = charById.get(charId)!;
    return {
      id:         c.id,
      name:       c.name,
      gender:     c.gender,
      isDeity:    c.isDeity,
      generation: meta.generation,
      role:       meta.role,
    };
  });

  // Only include edges where both endpoints are in the visible set
  const visibleIds = new Set(visited.keys());
  const edges = allRelations
    .filter((r) => visibleIds.has(r.fromCharacterId) && visibleIds.has(r.toCharacterId))
    .map((r) => ({
      fromId:       r.fromCharacterId,
      toId:         r.toCharacterId,
      relationType: r.relationType,
    }));

  const focal = charById.get(focalId)!;

  return NextResponse.json({ focal, nodes, edges });
}
