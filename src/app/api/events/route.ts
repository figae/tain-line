import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { eventTypes, mythologicalCycles } from "@/db/schema";
import {
  requireRole,
  isGuardError,
  asTrimmedString,
  asOptionalString,
  asEnum,
  asOptionalId,
} from "@/lib/api-guard";

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
  const session = await requireRole("editor");
  if (isGuardError(session)) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const name = asTrimmedString(body.name, 300);
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const result = await db
    .insert(schema.events)
    .values({
      name,
      description: asOptionalString(body.description),
      eventType: asEnum(body.eventType, eventTypes, "other"),
      parentEventId: asOptionalId(body.parentEventId),
      characterId: asOptionalId(body.characterId),
      cycle: asEnum(body.cycle, mythologicalCycles, "other"),
      approximateEra: asOptionalString(body.approximateEra, 200),
      sourceId: asOptionalId(body.sourceId),
      sourceQuote: asOptionalString(body.sourceQuote),
      status: session.role === "admin" ? "approved" : "pending_review",
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
