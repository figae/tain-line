import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { like, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const groupId = searchParams.get("group");

  let query = db
    .select({
      id: schema.characters.id,
      name: schema.characters.name,
      altNames: schema.characters.altNames,
      gender: schema.characters.gender,
      epithet: schema.characters.epithet,
      isDeity: schema.characters.isDeity,
      isDead: schema.characters.isDead,
      description: schema.characters.description,
    })
    .from(schema.characters);

  const chars = await query;

  // Filter by search query
  let filtered = chars;
  if (q) {
    const lower = q.toLowerCase();
    filtered = chars.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        (c.epithet?.toLowerCase().includes(lower) ?? false) ||
        (c.altNames
          ? JSON.parse(c.altNames).some((a: string) =>
              a.toLowerCase().includes(lower)
            )
          : false)
    );
  }

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, altNames, gender, description, epithet, isDeity, sourceId } =
    body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const result = await db
    .insert(schema.characters)
    .values({
      name,
      altNames: altNames ? JSON.stringify(altNames) : null,
      gender: gender ?? "unknown",
      description,
      epithet,
      isDeity: isDeity ?? false,
      sourceId,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
