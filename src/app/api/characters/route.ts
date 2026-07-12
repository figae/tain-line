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
    .insert(schema.characters)
    .values({
      name,
      altNames: altNames.length > 0 ? JSON.stringify(altNames) : null,
      gender: asEnum(body.gender, ["male", "female", "other", "unknown"] as const, "unknown"),
      description: asOptionalString(body.description),
      epithet: asOptionalString(body.epithet, 300),
      isDeity: body.isDeity === true,
      sourceId: asOptionalId(body.sourceId),
      sourceQuote: asOptionalString(body.sourceQuote),
      // Editors propose — only admins write directly into the approved dataset
      status: session.role === "admin" ? "approved" : "pending_review",
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
