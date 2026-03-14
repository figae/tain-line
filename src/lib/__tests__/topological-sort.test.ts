import { describe, it, expect } from "vitest";
import { topologicalSort } from "../topological-sort";

describe("topologicalSort", () => {
  it("returns empty array for empty input", () => {
    expect(topologicalSort([], [])).toEqual([]);
  });

  it("returns single event unchanged", () => {
    expect(topologicalSort([1], [])).toEqual([1]);
  });

  it("orders A before B when relation type is 'before'", () => {
    const result = topologicalSort([1, 2], [
      { fromEventId: 1, toEventId: 2, relationType: "before" },
    ]);
    expect(result.indexOf(1)).toBeLessThan(result.indexOf(2));
  });

  it("orders A before B when relation type is 'causes'", () => {
    const result = topologicalSort([1, 2], [
      { fromEventId: 1, toEventId: 2, relationType: "causes" },
    ]);
    expect(result.indexOf(1)).toBeLessThan(result.indexOf(2));
  });

  it("orders A before B when relation type is 'meets'", () => {
    const result = topologicalSort([1, 2], [
      { fromEventId: 1, toEventId: 2, relationType: "meets" },
    ]);
    expect(result.indexOf(1)).toBeLessThan(result.indexOf(2));
  });

  it("ignores 'parallel' relations for ordering", () => {
    const result = topologicalSort([1, 2], [
      { fromEventId: 1, toEventId: 2, relationType: "parallel" },
    ]);
    // both events must still appear, just no ordering constraint
    expect(result).toHaveLength(2);
    expect(result).toContain(1);
    expect(result).toContain(2);
  });

  it("ignores 'contains' relations for ordering", () => {
    const result = topologicalSort([1, 2], [
      { fromEventId: 1, toEventId: 2, relationType: "contains" },
    ]);
    expect(result).toHaveLength(2);
    expect(result).toContain(1);
    expect(result).toContain(2);
  });

  it("handles a chain A → B → C", () => {
    const result = topologicalSort([1, 2, 3], [
      { fromEventId: 1, toEventId: 2, relationType: "before" },
      { fromEventId: 2, toEventId: 3, relationType: "before" },
    ]);
    expect(result.indexOf(1)).toBeLessThan(result.indexOf(2));
    expect(result.indexOf(2)).toBeLessThan(result.indexOf(3));
  });

  it("includes all events even when some have no relations", () => {
    const result = topologicalSort([1, 2, 3], [
      { fromEventId: 1, toEventId: 2, relationType: "before" },
    ]);
    expect(result).toHaveLength(3);
    expect(result).toContain(3);
  });

  it("ignores relations referencing unknown event ids", () => {
    const result = topologicalSort([1, 2], [
      { fromEventId: 1, toEventId: 99, relationType: "before" }, // 99 not in list
    ]);
    expect(result).toHaveLength(2);
  });

  it("handles null relationType gracefully", () => {
    const result = topologicalSort([1, 2], [
      { fromEventId: 1, toEventId: 2, relationType: null },
    ]);
    expect(result).toHaveLength(2);
  });
});
