import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";

export async function GET() {
  const sources = await db.select().from(schema.sources);
  return NextResponse.json(sources);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, type, author, year, url, notes } = body;

  if (!title || !type) {
    return NextResponse.json({ error: "title and type required" }, { status: 400 });
  }

  const result = await db
    .insert(schema.sources)
    .values({ title, type, author, year, url, notes })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
