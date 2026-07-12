/**
 * Consistency check for the timeline DAG.
 *
 * Explicit relations (hand-authored, source-backed) and derived
 * constraints (computed from lifecycle brackets and family relations)
 * can contradict each other — e.g. an editor states "A before B" while
 * the data implies B's participant died before A. Such contradictions
 * show up as cycles in the combined ordering graph.
 *
 * This module finds every strongly connected component (Tarjan) with
 * more than one event and reports it as a conflict, listing the edges
 * inside the component so a reviewer can see exactly which statements
 * clash and why.
 *
 * Resolution policy used by the timeline: explicit relations win —
 * derived edges inside a conflicted component are dropped from the
 * ordering, and the conflict is surfaced for human review.
 */

const ORDERING_TYPES = new Set(["before", "causes", "meets"]);

export interface ConsistencyEdge {
  fromEventId: number;
  toEventId: number;
  relationType: string | null;
  derived?: boolean;
  reason?: string | null;
}

export interface Conflict {
  /** Event ids forming the cycle (strongly connected component) */
  eventIds: number[];
  /** All ordering edges between events of this component */
  edges: ConsistencyEdge[];
  /** True if the cycle exists among explicit relations alone */
  explicitOnly: boolean;
}

export interface ConsistencyResult {
  conflicts: Conflict[];
  /** Derived edges inside conflicted components — dropped from ordering */
  droppedDerived: ConsistencyEdge[];
  /** Edges safe to use for topological ordering */
  orderingEdges: ConsistencyEdge[];
}

/** Tarjan's strongly connected components on the ordering graph. */
function stronglyConnectedComponents(
  nodeIds: number[],
  edges: ConsistencyEdge[]
): number[][] {
  const adj = new Map<number, number[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const e of edges) {
    if (!ORDERING_TYPES.has(e.relationType ?? "")) continue;
    if (!adj.has(e.fromEventId) || !adj.has(e.toEventId)) continue;
    adj.get(e.fromEventId)!.push(e.toEventId);
  }

  const index = new Map<number, number>();
  const low = new Map<number, number>();
  const onStack = new Set<number>();
  const stack: number[] = [];
  const components: number[][] = [];
  let counter = 0;

  // Iterative Tarjan (explicit stack) — the graph can be deep
  for (const start of nodeIds) {
    if (index.has(start)) continue;

    interface Frame { node: number; childIdx: number }
    const frames: Frame[] = [{ node: start, childIdx: 0 }];
    index.set(start, counter);
    low.set(start, counter);
    counter++;
    stack.push(start);
    onStack.add(start);

    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      const children = adj.get(frame.node) ?? [];

      if (frame.childIdx < children.length) {
        const child = children[frame.childIdx++];
        if (!index.has(child)) {
          index.set(child, counter);
          low.set(child, counter);
          counter++;
          stack.push(child);
          onStack.add(child);
          frames.push({ node: child, childIdx: 0 });
        } else if (onStack.has(child)) {
          low.set(frame.node, Math.min(low.get(frame.node)!, index.get(child)!));
        }
      } else {
        frames.pop();
        if (frames.length > 0) {
          const parent = frames[frames.length - 1].node;
          low.set(parent, Math.min(low.get(parent)!, low.get(frame.node)!));
        }
        if (low.get(frame.node) === index.get(frame.node)) {
          const component: number[] = [];
          let popped: number;
          do {
            popped = stack.pop()!;
            onStack.delete(popped);
            component.push(popped);
          } while (popped !== frame.node);
          components.push(component);
        }
      }
    }
  }

  return components;
}

export function checkConsistency(
  eventIds: number[],
  explicit: ConsistencyEdge[],
  derived: ConsistencyEdge[]
): ConsistencyResult {
  const all = [
    ...explicit.map((e) => ({ ...e, derived: false })),
    ...derived.map((e) => ({ ...e, derived: true })),
  ];

  const components = stronglyConnectedComponents(eventIds, all).filter(
    (c) => c.length > 1
  );

  const conflicts: Conflict[] = [];
  const droppedDerived: ConsistencyEdge[] = [];
  const droppedKeys = new Set<string>();

  for (const component of components) {
    const inComponent = new Set(component);
    const edges = all.filter(
      (e) =>
        inComponent.has(e.fromEventId) &&
        inComponent.has(e.toEventId) &&
        ORDERING_TYPES.has(e.relationType ?? "")
    );

    // Does the cycle survive on explicit edges alone?
    const explicitEdges = edges.filter((e) => !e.derived);
    const explicitComponents = stronglyConnectedComponents(component, explicitEdges);
    const explicitOnly = explicitComponents.some((c) => c.length > 1);

    conflicts.push({ eventIds: component, edges, explicitOnly });

    // Resolution: drop the derived edges of the component from ordering
    for (const e of edges) {
      if (e.derived) {
        droppedKeys.add(`${e.fromEventId}>${e.toEventId}`);
        droppedDerived.push(e);
      }
    }
  }

  const orderingEdges = all.filter(
    (e) => !(e.derived && droppedKeys.has(`${e.fromEventId}>${e.toEventId}`))
  );

  return { conflicts, droppedDerived, orderingEdges };
}
