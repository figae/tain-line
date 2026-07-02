import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import type { NewCharacter } from "@/db/schema";
import { safeParseJson } from "@/lib/json";
import { auth } from "@/auth";
import { requireRole, isGuardError } from "@/lib/api-guard";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const charId = parseInt(id, 10);
  if (isNaN(charId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const [character] = await db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, charId));

  if (!character) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Unapproved entries are only visible to admins (review queue)
  if (character.status !== "approved") {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
  }

  const [properties, groups, familyFrom, familyTo, events, source, artifactRows] =
    await Promise.all([
      db
        .select({
          id: schema.characterProperties.id,
          type: schema.characterProperties.type,
          value: schema.characterProperties.value,
          notes: schema.characterProperties.notes,
          sourceTitle: schema.sources.title,
          sourceUrl: schema.sources.url,
        })
        .from(schema.characterProperties)
        .leftJoin(
          schema.sources,
          eq(schema.characterProperties.sourceId, schema.sources.id)
        )
        .where(eq(schema.characterProperties.characterId, charId)),

      db
        .select({ id: schema.groups.id, name: schema.groups.name })
        .from(schema.characterGroups)
        .innerJoin(
          schema.groups,
          eq(schema.characterGroups.groupId, schema.groups.id)
        )
        .where(eq(schema.characterGroups.characterId, charId)),

      db
        .select({
          id: schema.familyRelations.id,
          toCharacterId: schema.familyRelations.toCharacterId,
          toName: schema.characters.name,
          relationType: schema.familyRelations.relationType,
          notes: schema.familyRelations.notes,
        })
        .from(schema.familyRelations)
        .innerJoin(
          schema.characters,
          eq(schema.familyRelations.toCharacterId, schema.characters.id)
        )
        .where(eq(schema.familyRelations.fromCharacterId, charId)),

      db
        .select({
          id: schema.familyRelations.id,
          fromCharacterId: schema.familyRelations.fromCharacterId,
          fromName: schema.characters.name,
          relationType: schema.familyRelations.relationType,
          notes: schema.familyRelations.notes,
        })
        .from(schema.familyRelations)
        .innerJoin(
          schema.characters,
          eq(schema.familyRelations.fromCharacterId, schema.characters.id)
        )
        .where(eq(schema.familyRelations.toCharacterId, charId)),

      db
        .select({
          eventId: schema.events.id,
          eventName: schema.events.name,
          eventType: schema.events.eventType,
          cycle: schema.events.cycle,
          parentEventId: schema.events.parentEventId,
          role: schema.eventCharacters.role,
        })
        .from(schema.eventCharacters)
        .innerJoin(
          schema.events,
          eq(schema.eventCharacters.eventId, schema.events.id)
        )
        .where(eq(schema.eventCharacters.characterId, charId)),

      character.sourceId
        ? db
            .select()
            .from(schema.sources)
            .where(eq(schema.sources.id, character.sourceId))
        : Promise.resolve([]),

      db
        .select({
          id: schema.artifacts.id,
          name: schema.artifacts.name,
          type: schema.artifacts.type,
          relationship: schema.artifactCharacters.relationship,
          notes: schema.artifactCharacters.notes,
        })
        .from(schema.artifactCharacters)
        .innerJoin(
          schema.artifacts,
          eq(schema.artifactCharacters.artifactId, schema.artifacts.id)
        )
        .where(eq(schema.artifactCharacters.characterId, charId)),
    ]);

  return NextResponse.json({
    ...character,
    altNames: safeParseJson<string[]>(character.altNames, []),
    source: source[0] ?? null,
    properties,
    groups,
    family: { from: familyFrom, to: familyTo },
    events,
    artifacts: artifactRows,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("editor");
  if (isGuardError(session)) return session;

  const { id } = await params;
  const charId = parseInt(id, 10);
  if (isNaN(charId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }
  const updates: Partial<NewCharacter> = {};

  const GENDERS = ["male", "female", "other", "unknown"] as const;
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim().slice(0, 200);
  if (Array.isArray(body.altNames))
    updates.altNames = JSON.stringify(
      body.altNames.filter((a): a is string => typeof a === "string").slice(0, 20)
    );
  if (typeof body.gender === "string" && (GENDERS as readonly string[]).includes(body.gender))
    updates.gender = body.gender as (typeof GENDERS)[number];
  if (typeof body.description === "string") updates.description = body.description.slice(0, 5000);
  if (typeof body.epithet === "string")     updates.epithet     = body.epithet.slice(0, 300);
  if (typeof body.isDeity === "boolean")    updates.isDeity     = body.isDeity;
  if (typeof body.isDead === "boolean")     updates.isDead      = body.isDead;
  if (typeof body.sourceId === "number" && Number.isInteger(body.sourceId)) updates.sourceId = body.sourceId;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no valid fields" }, { status: 400 });
  }

  // Editor edits go back through the review queue
  if (session.role !== "admin") updates.status = "pending_review";
  updates.updatedAt = new Date().toISOString();

  const result = await db
    .update(schema.characters)
    .set(updates)
    .where(eq(schema.characters.id, charId))
    .returning();

  if (!result[0]) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}
