/**
 * GET /api/export?format=json-ld|json
 *
 * Exports the full approved dataset as:
 *   json-ld  — JSON-LD graph (schema.org + custom terms)
 *   json     — Plain JSON array (default)
 */
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { safeParseJson } from "@/lib/json";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";

  const [characters, events, places, groups, relations] = await Promise.all([
    db.select().from(schema.characters).where(eq(schema.characters.status, "approved")),
    db.select().from(schema.events).where(eq(schema.events.status, "approved")),
    db.select().from(schema.places).where(eq(schema.places.status, "approved")),
    db.select().from(schema.groups).where(eq(schema.groups.status, "approved")),
    db.select().from(schema.familyRelations).where(eq(schema.familyRelations.status, "approved")),
  ]);

  if (format === "json-ld") {
    const graph = buildJsonLd(characters, events, places, groups, relations);
    return new NextResponse(JSON.stringify(graph, null, 2), {
      headers: {
        "Content-Type": "application/ld+json",
        "Content-Disposition": `attachment; filename="tain-line-export.jsonld"`,
      },
    });
  }

  // Plain JSON
  const data = { characters, events, places, groups, relations, exportedAt: new Date().toISOString() };
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="tain-line-export.json"`,
    },
  });
}

type Character = typeof schema.characters.$inferSelect;
type Event = typeof schema.events.$inferSelect;
type Place = typeof schema.places.$inferSelect;
type Group = typeof schema.groups.$inferSelect;
type Relation = typeof schema.familyRelations.$inferSelect;

function buildJsonLd(
  characters: Character[],
  events: Event[],
  places: Place[],
  groups: Group[],
  relations: Relation[],
) {
  const context = {
    "@vocab": "https://schema.org/",
    "tain": "https://tain-line.local/ontology#",
    "cycle": "tain:cycle",
    "epithet": "tain:epithet",
    "isDeity": "tain:isDeity",
    "relationType": "tain:relationType",
    "eventType": "tain:eventType",
    "confidence": "tain:confidence",
    "sourceQuote": "tain:sourceQuote",
  };

  const charNodes = characters.map((c) => ({
    "@type": c.isDeity ? ["Person", "tain:Deity"] : "Person",
    "@id": `tain:character/${c.id}`,
    "name": c.name,
    "alternateName": c.altNames ? safeParseJson<string[]>(c.altNames, []) : [],
    "description": c.description,
    "gender": c.gender,
    "epithet": c.epithet,
    "isDeity": c.isDeity,
    "sourceQuote": c.sourceQuote,
    "confidence": c.confidence,
  }));

  const eventNodes = events.map((e) => ({
    "@type": "Event",
    "@id": `tain:event/${e.id}`,
    "name": e.name,
    "description": e.description,
    "eventType": e.eventType,
    "cycle": e.cycle,
    "sourceQuote": e.sourceQuote,
  }));

  const placeNodes = places.map((p) => ({
    "@type": "Place",
    "@id": `tain:place/${p.id}`,
    "name": p.name,
    "alternateName": p.altNames ? safeParseJson<string[]>(p.altNames, []) : [],
    "description": p.description,
    "additionalType": p.type,
  }));

  const groupNodes = groups.map((g) => ({
    "@type": "Organization",
    "@id": `tain:group/${g.id}`,
    "name": g.name,
    "alternateName": g.altNames ? safeParseJson<string[]>(g.altNames, []) : [],
    "description": g.description,
  }));

  const relationNodes = relations.map((r) => ({
    "@type": "tain:FamilyRelation",
    "@id": `tain:relation/${r.id}`,
    "tain:from": { "@id": `tain:character/${r.fromCharacterId}` },
    "tain:to":   { "@id": `tain:character/${r.toCharacterId}` },
    "relationType": r.relationType,
    "sourceQuote": r.sourceQuote,
  }));

  return {
    "@context": context,
    "@graph": [
      ...charNodes,
      ...eventNodes,
      ...placeNodes,
      ...groupNodes,
      ...relationNodes,
    ],
  };
}

