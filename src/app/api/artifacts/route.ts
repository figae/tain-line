import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { safeParseJson } from "@/lib/json";
import { artifactTypes } from "@/db/schema";
import {
  requireRole,
  isGuardError,
  asTrimmedString,
  asOptionalString,
  asEnum,
  asOptionalId,
  asStringArray,
} from "@/lib/api-guard";

// GET /api/artifacts — all approved artifacts with their bound characters
export async function GET() {
  const [artifacts, links] = await Promise.all([
    db.select().from(schema.artifacts).where(eq(schema.artifacts.status, "approved")),
    db
      .select({
        artifactId: schema.artifactCharacters.artifactId,
        characterId: schema.characters.id,
        characterName: schema.characters.name,
        relationship: schema.artifactCharacters.relationship,
        notes: schema.artifactCharacters.notes,
      })
      .from(schema.artifactCharacters)
      .innerJoin(schema.characters, eq(schema.artifactCharacters.characterId, schema.characters.id)),
  ]);

  const linksByArtifact = new Map<number, typeof links>();
  for (const l of links) {
    if (!linksByArtifact.has(l.artifactId)) linksByArtifact.set(l.artifactId, []);
    linksByArtifact.get(l.artifactId)!.push(l);
  }

  return NextResponse.json(
    artifacts.map((a) => ({
      ...a,
      altNames: safeParseJson<string[]>(a.altNames, []),
      characters: linksByArtifact.get(a.id) ?? [],
    }))
  );
}

// POST /api/artifacts — propose/create an artifact (editor+)
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
    .insert(schema.artifacts)
    .values({
      name,
      altNames: altNames.length > 0 ? JSON.stringify(altNames) : null,
      type: asEnum(body.type, artifactTypes, "other"),
      description: asOptionalString(body.description),
      powers: asOptionalString(body.powers),
      sourceId: asOptionalId(body.sourceId),
      sourceQuote: asOptionalString(body.sourceQuote),
      status: session.role === "admin" ? "approved" : "pending_review",
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
