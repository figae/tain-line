import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cycle = searchParams.get("cycle");
  const eventType = searchParams.get("eventType");
  const parentId = searchParams.get("parentId");

  let events = await db.select().from(schema.events).where(eq(schema.events.status, "approved"));

  if (cycle)      events = events.filter((e) => e.cycle === cycle);
  if (eventType)  events = events.filter((e) => e.eventType === eventType);
  if (parentId) {
    const pid = parseInt(parentId, 10);
    events = events.filter((e) => e.parentEventId === pid);
  }

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name, description, eventType, parentEventId,
    characterId, cycle, approximateEra, sourceId,
  } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const result = await db
    .insert(schema.events)
    .values({ name, description, eventType, parentEventId, characterId, cycle, approximateEra, sourceId })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
