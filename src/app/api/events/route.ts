import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cycle = searchParams.get("cycle");

  const events = await db.select().from(schema.events);

  if (cycle) {
    return NextResponse.json(events.filter((e) => e.cycle === cycle));
  }
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, cycle, approximateEra, sourceId } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const result = await db
    .insert(schema.events)
    .values({ name, description, cycle, approximateEra, sourceId })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
