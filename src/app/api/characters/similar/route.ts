import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const la = a.toLowerCase(), lb = b.toLowerCase();
  if (la === lb) return 1;
  if (la.includes(lb) || lb.includes(la)) return 0.85;
  const dist = levenshtein(la, lb);
  const maxLen = Math.max(la.length, lb.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

// GET /api/characters/similar?name=X — returns characters with similar names
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");

  if (!name || name.trim().length < 2) {
    return NextResponse.json([]);
  }

  const all = await db
    .select({ id: schema.characters.id, name: schema.characters.name, altNames: schema.characters.altNames, status: schema.characters.status })
    .from(schema.characters);

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
