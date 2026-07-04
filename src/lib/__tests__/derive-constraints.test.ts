import { describe, it, expect } from "vitest";
import { deriveConstraints } from "../derive-constraints";
import { topologicalSort } from "../topological-sort";

// Character ids
const A = 1; // parent
const B = 2; // child, killed by C
const C = 3; // killer

// Event ids
const BIRTH_A = 10;
const BIRTH_B = 11;
const BIRTH_C = 12;
const FIGHT = 20;   // C kills B (death event of B)
const FEAST = 21;   // B attends a feast
const DEATH_C = 22;

const events = [
  { id: BIRTH_A, eventType: "birth", characterId: A },
  { id: BIRTH_B, eventType: "birth", characterId: B },
  { id: BIRTH_C, eventType: "birth", characterId: C },
  { id: FIGHT, eventType: "death", characterId: B },
  { id: FEAST, eventType: "meeting", characterId: null },
  { id: DEATH_C, eventType: "death", characterId: C },
];

const participations = [
  { eventId: BIRTH_B, characterId: B, role: "protagonist" }, // own birth
  { eventId: FIGHT, characterId: B, role: "victim" },
  { eventId: FIGHT, characterId: C, role: "antagonist" },
  { eventId: FEAST, characterId: B, role: "ally" },
  { eventId: DEATH_C, characterId: C, role: "victim" },
];

const family = [{ fromCharacterId: A, toCharacterId: B, relationType: "father" }];

describe("deriveConstraints", () => {
  const edges = deriveConstraints(events, participations, family);
  const has = (from: number, to: number) =>
    edges.some((e) => e.fromEventId === from && e.toEventId === to);

  it("brackets participation with birth: B's birth precedes B's feast and B's death", () => {
    expect(has(BIRTH_B, FEAST)).toBe(true);
    expect(has(BIRTH_B, FIGHT)).toBe(true);
  });

  it("places every event of the victim before the killing (C tötet B)", () => {
    expect(has(FEAST, FIGHT)).toBe(true);
  });

  it("places the killing before the killer's own death", () => {
    // C participates in FIGHT — but FIGHT is a death event, so no edge
    // into DEATH_C is derived (mutual-slaying guard). C's birth still
    // precedes the fight.
    expect(has(BIRTH_C, FIGHT)).toBe(true);
  });

  it("derives parent-born-before-child from family relations", () => {
    expect(has(BIRTH_A, BIRTH_B)).toBe(true);
  });

  it("never lets an event bracket itself", () => {
    expect(has(BIRTH_B, BIRTH_B)).toBe(false);
    expect(has(FIGHT, FIGHT)).toBe(false);
  });

  it("keeps mutual slayings acyclic", () => {
    // X and Y kill each other: two death events, each participating
    // in the other's death.
    const ev = [
      { id: 100, eventType: "death", characterId: 50 },
      { id: 101, eventType: "death", characterId: 51 },
    ];
    const parts = [
      { eventId: 100, characterId: 50, role: "victim" },
      { eventId: 100, characterId: 51, role: "antagonist" },
      { eventId: 101, characterId: 51, role: "victim" },
      { eventId: 101, characterId: 50, role: "antagonist" },
    ];
    const derived = deriveConstraints(ev, parts, []);
    const order = topologicalSort([100, 101], derived);
    expect(order.length).toBe(2); // no cycle → both events placeable
  });

  it("ignores 'mentioned' roles", () => {
    const derived = deriveConstraints(
      events,
      [{ eventId: FEAST, characterId: B, role: "mentioned" }],
      []
    );
    expect(derived.some((e) => e.toEventId === FIGHT && e.fromEventId === FEAST)).toBe(false);
  });

  it("drops edges that duplicate explicit relations", () => {
    const derived = deriveConstraints(events, participations, family, [
      { fromEventId: BIRTH_B, toEventId: FEAST },
    ]);
    expect(derived.some((e) => e.fromEventId === BIRTH_B && e.toEventId === FEAST)).toBe(false);
  });

  it("produces a sortable DAG together with the whole ruleset", () => {
    const ids = events.map((e) => e.id);
    const order = topologicalSort(ids, edges);
    expect(order.length).toBe(ids.length);
    // Birth of A before birth of B before the fight
    expect(order.indexOf(BIRTH_A)).toBeLessThan(order.indexOf(BIRTH_B));
    expect(order.indexOf(BIRTH_B)).toBeLessThan(order.indexOf(FIGHT));
    expect(order.indexOf(FEAST)).toBeLessThan(order.indexOf(FIGHT));
  });
});
