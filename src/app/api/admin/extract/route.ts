import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db, schema } from "@/db";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert in Celtic mythology, specialising in Irish myths and sagas (Cath Maige Tuired, Táin Bó Cúailnge, Lebor Gabála Érenn, and related texts).

Your task is to extract structured data from a provided source text. For each piece of information you extract, you MUST include the exact original quote from the text that supports it.

Return a JSON object with these arrays (omit any array if nothing was found):

{
  "characters": [
    {
      "name": "string",
      "altNames": ["string"],
      "gender": "male|female|other|unknown",
      "isDeity": true|false,
      "epithet": "string or null",
      "description": "string or null",
      "sourceQuote": "exact sentence or phrase from the source text"
    }
  ],
  "events": [
    {
      "name": "string",
      "description": "string",
      "eventType": "birth|death|meeting|battle|reign|transformation|prophecy|journey|other",
      "cycle": "mythological|ulster|fenian|kings|other",
      "sourceQuote": "exact sentence or phrase from the source text"
    }
  ],
  "places": [
    {
      "name": "string",
      "type": "otherworld|hill|island|plain|forest|river|sea|fortress|other",
      "description": "string or null",
      "sourceQuote": "exact sentence or phrase from the source text"
    }
  ],
  "groups": [
    {
      "name": "string",
      "description": "string or null",
      "sourceQuote": "exact sentence or phrase from the source text"
    }
  ],
  "relations": [
    {
      "fromName": "character name",
      "toName": "character name",
      "relationType": "father|mother|child|sibling|half_sibling|spouse|lover|foster_parent|foster_child|uncle|aunt|nephew|niece|grandparent|grandchild|aspect|other",
      "sourceQuote": "exact sentence or phrase from the source text"
    }
  ]
}

Important rules:
- Only extract information that is explicitly stated in the text
- Every entry must have a sourceQuote that is copied verbatim from the text
- Do not infer or speculate — only extract what is clearly stated
- Prefer concise, descriptive names
- Return valid JSON only, no commentary outside the JSON`;

type ExtractedData = {
  characters?: Array<{
    name: string;
    altNames?: string[];
    gender?: string;
    isDeity?: boolean;
    epithet?: string;
    description?: string;
    sourceQuote: string;
  }>;
  events?: Array<{
    name: string;
    description?: string;
    eventType?: string;
    cycle?: string;
    sourceQuote: string;
  }>;
  places?: Array<{
    name: string;
    type?: string;
    description?: string;
    sourceQuote: string;
  }>;
  groups?: Array<{
    name: string;
    description?: string;
    sourceQuote: string;
  }>;
  relations?: Array<{
    fromName: string;
    toName: string;
    relationType: string;
    sourceQuote: string;
  }>;
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, sourceId } = body as { text: string; sourceId?: number };

  if (!text || typeof text !== "string" || text.trim().length < 20) {
    return NextResponse.json({ error: "text is required (min 20 chars)" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please extract all structured information from this source text:\n\n${text}`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No text response from AI" }, { status: 500 });
  }

  // Parse the JSON — strip markdown fences if present
  let extracted: ExtractedData;
  try {
    const raw = textBlock.text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    extracted = JSON.parse(raw) as ExtractedData;
  } catch {
    return NextResponse.json(
      { error: "AI returned invalid JSON", raw: textBlock.text.slice(0, 500) },
      { status: 500 },
    );
  }

  const results: Record<string, number[]> = { characters: [], events: [], places: [], groups: [], relations: [] };

  // Characters — batch insert
  const chars = extracted.characters ?? [];
  if (chars.length > 0) {
    const rows = await db.insert(schema.characters).values(
      chars.map((c) => ({
        name: c.name,
        altNames: c.altNames ? JSON.stringify(c.altNames) : null,
        gender: (c.gender as "male" | "female" | "other" | "unknown") ?? "unknown",
        isDeity: c.isDeity ?? false,
        epithet: c.epithet ?? null,
        description: c.description ?? null,
        sourceId: sourceId ?? null,
        status: "pending_review" as const,
        sourceQuote: c.sourceQuote,
        proposedBy: "ai" as const,
      })),
    ).returning({ id: schema.characters.id });
    results.characters = rows.map((r) => r.id);
  }

  // Events — batch insert
  const evts = extracted.events ?? [];
  if (evts.length > 0) {
    const rows = await db.insert(schema.events).values(
      evts.map((e) => ({
        name: e.name,
        description: e.description ?? null,
        eventType: (e.eventType as typeof schema.events.$inferInsert["eventType"]) ?? "other",
        cycle: (e.cycle as typeof schema.events.$inferInsert["cycle"]) ?? "other",
        sourceId: sourceId ?? null,
        status: "pending_review" as const,
        sourceQuote: e.sourceQuote,
        proposedBy: "ai" as const,
      })),
    ).returning({ id: schema.events.id });
    results.events = rows.map((r) => r.id);
  }

  // Places — batch insert
  const plcs = extracted.places ?? [];
  if (plcs.length > 0) {
    const rows = await db.insert(schema.places).values(
      plcs.map((p) => ({
        name: p.name,
        type: (p.type as typeof schema.places.$inferInsert["type"]) ?? "other",
        description: p.description ?? null,
        sourceId: sourceId ?? null,
        status: "pending_review" as const,
        sourceQuote: p.sourceQuote,
        proposedBy: "ai" as const,
      })),
    ).returning({ id: schema.places.id });
    results.places = rows.map((r) => r.id);
  }

  // Groups — onConflictDoNothing because name is UNIQUE; must insert one-by-one to collect ids
  for (const g of extracted.groups ?? []) {
    const rows = await db.insert(schema.groups).values({
      name: g.name,
      description: g.description ?? null,
      sourceId: sourceId ?? null,
      status: "pending_review",
      sourceQuote: g.sourceQuote,
      proposedBy: "ai",
    }).onConflictDoNothing().returning({ id: schema.groups.id });
    if (rows[0]) results.groups.push(rows[0].id);
  }

  return NextResponse.json({ ok: true, extracted, saved: results });
}
