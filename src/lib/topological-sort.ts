/**
 * Kahn's algorithm — topological sort on the event relation DAG.
 *
 * Only 'before', 'causes', and 'meets' create strict ordering edges.
 * 'contains' and 'parallel' are structural/concurrent — they don't
 * constrain topological position relative to each other.
 */

export type OrderingRelation = {
  fromEventId: number;
  toEventId: number;
  relationType: string | null;
};

const ORDERING_TYPES = new Set(["before", "causes", "meets"]);

export function topologicalSort(
  eventIds: number[],
  relations: OrderingRelation[]
): number[] {
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
