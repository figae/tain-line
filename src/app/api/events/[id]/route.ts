import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, or } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eventId = parseInt(id, 10);
  if (isNaN(eventId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const [event] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, eventId));

  if (!event) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const [characters, places, relations, children, source] = await Promise.all([
    db
      .select({
        characterId: schema.characters.id,
        name: schema.characters.name,
        role: schema.eventCharacters.role,
        notes: schema.eventCharacters.notes,
      })
      .from(schema.eventCharacters)
      .innerJoin(schema.characters, eq(schema.eventCharacters.characterId, schema.characters.id))
      .where(eq(schema.eventCharacters.eventId, eventId)),

    db
      .select({
        placeId: schema.places.id,
        name: schema.places.name,
        type: schema.places.type,
      })
      .from(schema.eventPlaces)
      .innerJoin(schema.places, eq(schema.eventPlaces.placeId, schema.places.id))
      .where(eq(schema.eventPlaces.eventId, eventId)),

    // All relations where this event is either from or to
    db
      .select({
        id: schema.eventRelations.id,
        fromEventId: schema.eventRelations.fromEventId,
        toEventId: schema.eventRelations.toEventId,
        relationType: schema.eventRelations.relationType,
        confidence: schema.eventRelations.confidence,
        reason: schema.eventRelations.reason,
      })
      .from(schema.eventRelations)
      .where(
        or(
          eq(schema.eventRelations.fromEventId, eventId),
          eq(schema.eventRelations.toEventId, eventId)
        )
      ),

    // Child events (events whose parent is this event)
    db
      .select({
        id: schema.events.id,
        name: schema.events.name,
        eventType: schema.events.eventType,
      })
      .from(schema.events)
      .where(eq(schema.events.parentEventId, eventId)),

    event.sourceId
      ? db.select().from(schema.sources).where(eq(schema.sources.id, event.sourceId))
      : Promise.resolve([]),
  ]);

  // Split relations into "before this" / "after this" / "other" for convenience
  const before = relations.filter(
    (r) => r.toEventId === eventId && ["before", "causes", "meets"].includes(r.relationType ?? "")
  );
  const after = relations.filter(
    (r) => r.fromEventId === eventId && ["before", "causes", "meets"].includes(r.relationType ?? "")
  );
  const other = relations.filter(
    (r) => ["contains", "parallel"].includes(r.relationType ?? "")
  );

  return NextResponse.json({
    ...event,
    source: source[0] ?? null,
    characters,
    places,
    children,
    relations: { before, after, other, all: relations },
  });
}
