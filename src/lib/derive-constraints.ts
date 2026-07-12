/**
 * Automatic constraint derivation for the timeline DAG.
 *
 * The hand-authored event_relations only capture what the tales state
 * explicitly. Many orderings follow logically from the data itself:
 *
 *   1. Lifecycle brackets from participation:
 *      birth(C)  →  every event C takes part in
 *      every event C takes part in  →  death(C)
 *      ("C tötet B" thus automatically places every event of B before
 *       that fight — B must have been alive.)
 *
 *   2. Generational order from family relations:
 *      birth(parent)  →  birth(child)
 *
 * Rules that keep the graph a DAG:
 *   - 'mentioned' roles create no constraint (mentions can be
 *     retrospective or prophetic).
 *   - An event never brackets itself (a character "participates" in
 *     their own birth/death event).
 *   - Death events never derive edges INTO other death events:
 *     mutual slayings (Oscar ⚔ Cairbre) would otherwise form a cycle;
 *     the order of simultaneous deaths is left to explicit relations.
 *   - Derived edges that duplicate an explicit ordering are dropped.
 */

export interface DeriveEvent {
  id: number;
  eventType: string | null;
  characterId: number | null; // set on birth/death events
}

export interface DeriveParticipation {
  eventId: number;
  characterId: number;
  role: string | null;
}

export interface DeriveFamilyRelation {
  fromCharacterId: number;
  toCharacterId: number;
  relationType: string;
}

export interface DerivedEdge {
  fromEventId: number;
  toEventId: number;
  relationType: "before";
  confidence: "certain";
  derived: true;
  reason: string;
}

// Roles that assert the character was alive and present
const LIVE_ROLES = new Set(["protagonist", "antagonist", "ally", "victim", "other"]);

// Relations where `from` is the parent of `to`
const PARENT_RELS = new Set(["father", "mother"]);

export function deriveConstraints(
  events: DeriveEvent[],
  participations: DeriveParticipation[],
  familyRelations: DeriveFamilyRelation[],
  explicit: { fromEventId: number; toEventId: number }[] = [],
  characterNames?: Map<number, string>
): DerivedEdge[] {
  const birthOf = new Map<number, number>(); // characterId → birth event id
  const deathOf = new Map<number, number>();
  const typeOf = new Map<number, string>();

  for (const e of events) {
    typeOf.set(e.id, e.eventType ?? "other");
    if (e.characterId === null) continue;
    if (e.eventType === "birth" && !birthOf.has(e.characterId)) {
      birthOf.set(e.characterId, e.id);
    }
    if (e.eventType === "death" && !deathOf.has(e.characterId)) {
      deathOf.set(e.characterId, e.id);
    }
  }

  const explicitSet = new Set(explicit.map((r) => `${r.fromEventId}>${r.toEventId}`));
  const seen = new Set<string>();
  const edges: DerivedEdge[] = [];

  const nameOf = (charId: number) =>
    characterNames?.get(charId) ?? `Charakter #${charId}`;

  function push(from: number, to: number, reason: string) {
    if (from === to) return;
    const key = `${from}>${to}`;
    if (seen.has(key) || explicitSet.has(key)) return;
    seen.add(key);
    edges.push({
      fromEventId: from,
      toEventId: to,
      relationType: "before",
      confidence: "certain",
      derived: true,
      reason,
    });
  }

  // 1. Lifecycle brackets from participation
  for (const p of participations) {
    if (!LIVE_ROLES.has(p.role ?? "other")) continue;

    const b = birthOf.get(p.characterId);
    if (b !== undefined && p.eventId !== b) {
      push(b, p.eventId, `${nameOf(p.characterId)} muss vor diesem Ereignis geboren sein`);
    }

    const d = deathOf.get(p.characterId);
    if (d !== undefined && p.eventId !== d) {
      // Mutual slayings: don't order one death event against another
      if (typeOf.get(p.eventId) !== "death") {
        push(p.eventId, d, `Dieses Ereignis liegt vor dem Tod von ${nameOf(p.characterId)}`);
      }
    }
  }

  // 2. Parents are born before their children
  for (const rel of familyRelations) {
    if (!PARENT_RELS.has(rel.relationType)) continue;
    const bParent = birthOf.get(rel.fromCharacterId);
    const bChild = birthOf.get(rel.toCharacterId);
    if (bParent !== undefined && bChild !== undefined) {
      push(
        bParent,
        bChild,
        `${nameOf(rel.fromCharacterId)} ist Elternteil von ${nameOf(rel.toCharacterId)} und wurde früher geboren`
      );
    }
  }

  return edges;
}
