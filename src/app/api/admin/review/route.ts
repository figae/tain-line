import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, or } from "drizzle-orm";

// GET /api/admin/review — list all pending_review entries across entity types
export async function GET() {
  const [characters, events, places, groups, relations] = await Promise.all([
    db
      .select()
      .from(schema.characters)
      .where(or(
        eq(schema.characters.status, "pending_review"),
        eq(schema.characters.status, "draft"),
      )),
    db
      .select()
      .from(schema.events)
      .where(or(
        eq(schema.events.status, "pending_review"),
        eq(schema.events.status, "draft"),
      )),
    db
      .select()
      .from(schema.places)
      .where(or(
        eq(schema.places.status, "pending_review"),
        eq(schema.places.status, "draft"),
      )),
    db
      .select()
      .from(schema.groups)
      .where(or(
        eq(schema.groups.status, "pending_review"),
        eq(schema.groups.status, "draft"),
      )),
    db
      .select()
      .from(schema.familyRelations)
      .where(or(
        eq(schema.familyRelations.status, "pending_review"),
        eq(schema.familyRelations.status, "draft"),
      )),
  ]);

  return NextResponse.json({ characters, events, places, groups, relations });
}

// POST /api/admin/review — approve or reject an entity
// Body: { entityType, id, action: "approve"|"reject", reviewNotes? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { entityType, id, action, reviewNotes } = body as {
    entityType: "character" | "event" | "place" | "group" | "relation";
    id: number;
    action: "approve" | "reject";
    reviewNotes?: string;
  };

  if (!entityType || !id || !action) {
    return NextResponse.json({ error: "entityType, id, and action are required" }, { status: 400 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";
  const reviewedAt = new Date().toISOString();
  const updateData = { status: newStatus as "approved" | "rejected", reviewedAt, reviewNotes: reviewNotes ?? null };

  switch (entityType) {
    case "character":
      await db.update(schema.characters).set(updateData).where(eq(schema.characters.id, id));
      break;
    case "event":
      await db.update(schema.events).set(updateData).where(eq(schema.events.id, id));
      break;
    case "place":
      await db.update(schema.places).set(updateData).where(eq(schema.places.id, id));
      break;
    case "group":
      await db.update(schema.groups).set(updateData).where(eq(schema.groups.id, id));
      break;
    case "relation":
      await db.update(schema.familyRelations).set(updateData).where(eq(schema.familyRelations.id, id));
      break;
    default:
      return NextResponse.json({ error: "unknown entityType" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
