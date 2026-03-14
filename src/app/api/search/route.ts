import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, like, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ characters: [], events: [], places: [], groups: [] });
  }

  const pattern = `%${q}%`;

  const [characters, events, places, groups] = await Promise.all([
    db
      .select({ id: schema.characters.id, name: schema.characters.name, epithet: schema.characters.epithet, gender: schema.characters.gender, isDeity: schema.characters.isDeity, description: schema.characters.description })
      .from(schema.characters)
      .where(
        eq(schema.characters.status, "approved") &&
        or(
          like(schema.characters.name, pattern),
          like(schema.characters.altNames, pattern),
          like(schema.characters.epithet, pattern),
          like(schema.characters.description, pattern),
        ),
      )
      .limit(10),

    db
      .select({ id: schema.events.id, name: schema.events.name, eventType: schema.events.eventType, cycle: schema.events.cycle, description: schema.events.description })
      .from(schema.events)
      .where(
        eq(schema.events.status, "approved") &&
        or(
          like(schema.events.name, pattern),
          like(schema.events.description, pattern),
        ),
      )
      .limit(10),

    db
      .select({ id: schema.places.id, name: schema.places.name, type: schema.places.type, description: schema.places.description })
      .from(schema.places)
      .where(
        eq(schema.places.status, "approved") &&
        or(
          like(schema.places.name, pattern),
          like(schema.places.altNames, pattern),
          like(schema.places.description, pattern),
        ),
      )
      .limit(8),

    db
      .select({ id: schema.groups.id, name: schema.groups.name, description: schema.groups.description })
      .from(schema.groups)
      .where(
        eq(schema.groups.status, "approved") &&
        or(
          like(schema.groups.name, pattern),
          like(schema.groups.altNames, pattern),
          like(schema.groups.description, pattern),
        ),
      )
      .limit(8),
  ]);

  return NextResponse.json({ characters, events, places, groups, query: q });
}
