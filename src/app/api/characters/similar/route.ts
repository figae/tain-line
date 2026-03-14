import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { similarity } from "@/lib/similarity";

// GET /api/characters/similar?name=X — returns characters with similar names
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name || name.trim().length < 2) {
    return NextResponse.json([]);
  }

  const all = await db
    .select({ id: schema.characters.id, name: schema.characters.name, altNames: schema.characters.altNames, status: schema.characters.status })
    .from(schema.characters)
    .where(eq(schema.characters.status, "approved"));

  const results = all
    .map((c) => {
      const nameSim = similarity(name, c.name);
      let altSim = 0;
      if (c.altNames) {
        try {
          const alts = JSON.parse(c.altNames) as string[];
          altSim = Math.max(...alts.map((a) => similarity(name, a)));
        } catch { /* ignore */ }
      }
      return { ...c, score: Math.max(nameSim, altSim) };
    })
    .filter((c) => c.score >= 0.6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return NextResponse.json(results);
}
