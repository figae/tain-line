import { describe, it, expect } from "vitest";
import { checkConsistency } from "../consistency";
import { topologicalSort } from "../topological-sort";

describe("checkConsistency", () => {
  it("reports no conflicts on a clean DAG", () => {
    const result = checkConsistency(
      [1, 2, 3],
      [{ fromEventId: 1, toEventId: 2, relationType: "before" }],
      [{ fromEventId: 2, toEventId: 3, relationType: "before", derived: true }]
    );
    expect(result.conflicts).toHaveLength(0);
    expect(result.droppedDerived).toHaveLength(0);
    expect(topologicalSort([1, 2, 3], result.orderingEdges)).toHaveLength(3);
  });

  it("detects an explicit-vs-derived contradiction and drops the derived edge", () => {
    // Editor says 1 before 2; the data implies 2 before 1
    const result = checkConsistency(
      [1, 2],
      [{ fromEventId: 1, toEventId: 2, relationType: "before", reason: "laut Quelle" }],
      [{ fromEventId: 2, toEventId: 1, relationType: "before", derived: true, reason: "Lebenszeit-Zwang" }]
    );
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].eventIds.sort()).toEqual([1, 2]);
    expect(result.conflicts[0].explicitOnly).toBe(false);
    // Explicit wins: derived edge dropped, ordering stays total
    expect(result.droppedDerived).toHaveLength(1);
    const order = topologicalSort([1, 2], result.orderingEdges);
    expect(order).toHaveLength(2);
    expect(order.indexOf(1)).toBeLessThan(order.indexOf(2));
  });

  it("flags explicit-only cycles as explicitOnly", () => {
    const result = checkConsistency(
      [1, 2, 3],
      [
        { fromEventId: 1, toEventId: 2, relationType: "before" },
        { fromEventId: 2, toEventId: 3, relationType: "before" },
        { fromEventId: 3, toEventId: 1, relationType: "before" },
      ],
      []
    );
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].explicitOnly).toBe(true);
    expect(result.conflicts[0].eventIds).toHaveLength(3);
  });

  it("ignores non-ordering relation types (parallel, contains)", () => {
    const result = checkConsistency(
      [1, 2],
      [
        { fromEventId: 1, toEventId: 2, relationType: "parallel" },
        { fromEventId: 2, toEventId: 1, relationType: "contains" },
      ],
      []
    );
    expect(result.conflicts).toHaveLength(0);
  });

  it("keeps unrelated parts of the graph ordered when one component conflicts", () => {
    const result = checkConsistency(
      [1, 2, 10, 11],
      [
        { fromEventId: 1, toEventId: 2, relationType: "before" },
        { fromEventId: 10, toEventId: 11, relationType: "before" },
      ],
      [{ fromEventId: 2, toEventId: 1, relationType: "before", derived: true }]
    );
    expect(result.conflicts).toHaveLength(1);
    const order = topologicalSort([1, 2, 10, 11], result.orderingEdges);
    expect(order).toHaveLength(4);
    expect(order.indexOf(10)).toBeLessThan(order.indexOf(11));
  });

  it("lists the clashing edges of a conflict with their reasons", () => {
    const result = checkConsistency(
      [1, 2],
      [{ fromEventId: 1, toEventId: 2, relationType: "before", reason: "Quelle §12" }],
      [{ fromEventId: 2, toEventId: 1, relationType: "before", derived: true, reason: "X muss vorher geboren sein" }]
    );
    const edges = result.conflicts[0].edges;
    expect(edges).toHaveLength(2);
    expect(edges.find((e) => !e.derived)?.reason).toBe("Quelle §12");
    expect(edges.find((e) => e.derived)?.reason).toBe("X muss vorher geboren sein");
  });
});
