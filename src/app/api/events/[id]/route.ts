import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eventId = parseInt(id);

  const [event] = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.id, eventId));

  if (!event) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const [characters, places, mustBeBefore, mustBeAfter, source] =
    await Promise.all([
      // Characters in this event
      db
        .select({
          characterId: schema.characters.id,
          name: schema.characters.name,
          role: schema.eventCharacters.role,
          notes: schema.eventCharacters.notes,
        })
        .from(schema.eventCharacters)
        .innerJoin(
          schema.characters,
          eq(schema.eventCharacters.characterId, schema.characters.id)
        )
        .where(eq(schema.eventCharacters.eventId, eventId)),

      // Places
      db
        .select({
          placeId: schema.places.id,
          name: schema.places.name,
          type: schema.places.type,
        })
        .from(schema.eventPlaces)
        .innerJoin(
          schema.places,
          eq(schema.eventPlaces.placeId, schema.places.id)
        )
        .where(eq(schema.eventPlaces.eventId, eventId)),

      // Events that MUST come before this one
      db
        .select({
          id: schema.eventDependencies.id,
          beforeEventId: schema.eventDependencies.beforeEventId,
          beforeEventName: schema.events.name,
          reason: schema.eventDependencies.reason,
          confidence: schema.eventDependencies.confidence,
        })
        .from(schema.eventDependencies)
        .innerJoin(
          schema.events,
          eq(schema.eventDependencies.beforeEventId, schema.events.id)
        )
        .where(eq(schema.eventDependencies.afterEventId, eventId)),

      // Events that MUST come after this one
      db
        .select({
          id: schema.eventDependencies.id,
          afterEventId: schema.eventDependencies.afterEventId,
          afterEventName: schema.events.name,
          reason: schema.eventDependencies.reason,
          confidence: schema.eventDependencies.confidence,
        })
        .from(schema.eventDependencies)
        .innerJoin(
          schema.events,
          eq(schema.eventDependencies.afterEventId, schema.events.id)
        )
        .where(eq(schema.eventDependencies.beforeEventId, eventId)),

      // Source
      event.sourceId
        ? db.select().from(schema.sources).where(eq(schema.sources.id, event.sourceId))
        : Promise.resolve([]),
    ]);

  return NextResponse.json({
    ...event,
    source: source[0] ?? null,
    characters,
    places,
    mustBeBefore,
    mustBeAfter,
  });
}
