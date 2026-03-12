import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import type { NewCharacter } from "@/db/schema";

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

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

  const [properties, groups, familyFrom, familyTo, events, source] =
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
          cycle: schema.events.cycle,
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
    ]);

  return NextResponse.json({
    ...character,
    altNames: safeParseJson<string[]>(character.altNames, []),
    source: source[0] ?? null,
    properties,
    groups,
    family: { from: familyFrom, to: familyTo },
    events,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const charId = parseInt(id, 10);
  if (isNaN(charId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const body = await req.json();
  const updates: Partial<NewCharacter> = {};

  if (typeof body.name === "string")        updates.name        = body.name;
  if (Array.isArray(body.altNames))         updates.altNames    = JSON.stringify(body.altNames);
  if (typeof body.gender === "string")      updates.gender      = body.gender;
  if (typeof body.description === "string") updates.description = body.description;
  if (typeof body.epithet === "string")     updates.epithet     = body.epithet;
  if (typeof body.isDeity === "boolean")    updates.isDeity     = body.isDeity;
  if (typeof body.isDead === "boolean")     updates.isDead      = body.isDead;
  if (typeof body.sourceId === "number")    updates.sourceId    = body.sourceId;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no valid fields" }, { status: 400 });
  }

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
