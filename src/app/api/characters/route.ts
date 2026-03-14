import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  const chars = await db
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
    .from(schema.characters)
    .where(eq(schema.characters.status, "approved"));

  let filtered = chars;
  if (q) {
    const lower = q.toLowerCase();
    filtered = chars.filter((c) => {
      if (c.name.toLowerCase().includes(lower)) return true;
      if (c.epithet?.toLowerCase().includes(lower)) return true;
      const altNames = safeParseJson<string[]>(c.altNames, []);
      return altNames.some((a) => a.toLowerCase().includes(lower));
    });
  }

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, altNames, gender, description, epithet, isDeity, sourceId } = body;

  if (!name || typeof name !== "string") {
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
