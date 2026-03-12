import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const groups = await db.select().from(schema.groups);

  // Enrich with member count
  const withCounts = await Promise.all(
    groups.map(async (g) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.characterGroups)
        .where(eq(schema.characterGroups.groupId, g.id));
      return {
        ...g,
        altNames: g.altNames ? JSON.parse(g.altNames) : [],
        memberCount: count,
      };
    })
  );

  return NextResponse.json(withCounts);
}
