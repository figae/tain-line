import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { safeParseJson } from "@/lib/json";
import {
  requireRole,
  isGuardError,
  asTrimmedString,
  asOptionalString,
  asEnum,
  asOptionalId,
  asStringArray,
} from "@/lib/api-guard";

const PLACE_TYPES = [
  "otherworld", "hill", "island", "plain", "forest", "river", "sea", "fortress", "other",
] as const;

// GET /api/places — all approved places incl. events located there
export async function GET() {
  const [places, eventLinks] = await Promise.all([
    db.select().from(schema.places).where(eq(schema.places.status, "approved")),
    db
      .select({
        placeId: schema.eventPlaces.placeId,
        eventId: schema.events.id,
        eventName: schema.events.name,
        eventType: schema.events.eventType,
        cycle: schema.events.cycle,
      })
      .from(schema.eventPlaces)
      .innerJoin(schema.events, eq(schema.eventPlaces.eventId, schema.events.id))
      .where(eq(schema.events.status, "approved")),
  ]);

  const eventsByPlace = new Map<number, typeof eventLinks>();
  for (const l of eventLinks) {
    if (!eventsByPlace.has(l.placeId)) eventsByPlace.set(l.placeId, []);
    eventsByPlace.get(l.placeId)!.push(l);
  }

  return NextResponse.json(
    places.map((p) => ({
      ...p,
      altNames: safeParseJson<string[]>(p.altNames, []),
      events: eventsByPlace.get(p.id) ?? [],
    }))
  );
}

// POST /api/places — propose/create a place (editor+)
export async function POST(req: NextRequest) {
  const session = await requireRole("editor");
  if (isGuardError(session)) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const name = asTrimmedString(body.name, 200);
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const altNames = asStringArray(body.altNames);

  const result = await db
    .insert(schema.places)
    .values({
      name,
      altNames: altNames.length > 0 ? JSON.stringify(altNames) : null,
      type: asEnum(body.type, PLACE_TYPES, "other"),
      modernEquivalent: asOptionalString(body.modernEquivalent, 300),
      description: asOptionalString(body.description),
      sourceId: asOptionalId(body.sourceId),
      sourceQuote: asOptionalString(body.sourceQuote),
      status: session.role === "admin" ? "approved" : "pending_review",
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
