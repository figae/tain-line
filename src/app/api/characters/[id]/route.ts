import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const charId = parseInt(id);

  const [character] = await db
    .select()
    .from(schema.characters)
    .where(eq(schema.characters.id, charId));

  if (!character) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Fetch related data in parallel
  const [properties, groups, familyFrom, familyTo, events, source] =
    await Promise.all([
      // Properties (weapons, colors, animals …)
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

      // Groups
      db
        .select({ id: schema.groups.id, name: schema.groups.name })
        .from(schema.characterGroups)
        .innerJoin(
          schema.groups,
          eq(schema.characterGroups.groupId, schema.groups.id)
        )
        .where(eq(schema.characterGroups.characterId, charId)),

      // Family: this character IS the parent/source
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

      // Family: this character IS the child/target
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

      // Events this character participated in
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

      // Source
      character.sourceId
        ? db
            .select()
            .from(schema.sources)
            .where(eq(schema.sources.id, character.sourceId))
        : Promise.resolve([]),
    ]);

  return NextResponse.json({
    ...character,
    altNames: character.altNames ? JSON.parse(character.altNames) : [],
    source: source[0] ?? null,
    properties,
    groups,
    family: {
      from: familyFrom,
      to: familyTo,
    },
    events,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const charId = parseInt(id);
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  const allowed = [
    "name",
    "altNames",
    "gender",
    "description",
    "epithet",
    "isDeity",
    "isDead",
    "sourceId",
  ];
  for (const key of allowed) {
    if (key in body) {
      if (key === "altNames") {
        updates[key] = JSON.stringify(body[key]);
      } else {
        updates[key] = body[key];
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no valid fields" }, { status: 400 });
  }

  const result = await db
    .update(schema.characters)
    .set(updates)
    .where(eq(schema.characters.id, charId))
    .returning();

  return NextResponse.json(result[0]);
}
