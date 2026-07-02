import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import {
  requireRole,
  isGuardError,
  asTrimmedString,
  asOptionalString,
  asEnum,
} from "@/lib/api-guard";

export async function GET() {
  const sources = await db.select().from(schema.sources);
  return NextResponse.json(sources);
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

  const title = asTrimmedString(body.title, 400);
  const type = typeof body.type === "string" ? body.type : "";
  if (!title || !["manuscript", "scholarly", "online", "folklore"].includes(type)) {
    return NextResponse.json({ error: "title and type required" }, { status: 400 });
  }

  const year =
    typeof body.year === "number" && Number.isInteger(body.year) && Math.abs(body.year) < 10000
      ? body.year
      : null;

  const result = await db
    .insert(schema.sources)
    .values({
      title,
      type: asEnum(body.type, ["manuscript", "scholarly", "online", "folklore"] as const, "online"),
      author: asOptionalString(body.author, 200),
      year,
      url: asOptionalString(body.url, 1000),
      notes: asOptionalString(body.notes),
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
