import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireRole, isGuardError } from "@/lib/api-guard";
import { userRoles } from "@/db/schema";

// GET /api/admin/users — list all accounts (admin only)
export async function GET() {
  const session = await requireRole("admin");
  if (isGuardError(session)) return session;

  const users = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users);

  return NextResponse.json(users);
}

// POST /api/admin/users — change a user's role
// Body: { userId: number, role: "admin" | "editor" | "viewer" }
export async function POST(req: NextRequest) {
  const session = await requireRole("admin");
  if (isGuardError(session)) return session;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const userId = typeof body.userId === "number" ? body.userId : NaN;
  const role = typeof body.role === "string" ? body.role : "";

  if (!Number.isInteger(userId) || !(userRoles as readonly string[]).includes(role)) {
    return NextResponse.json({ error: "userId und gültige role erforderlich." }, { status: 400 });
  }

  // An admin cannot demote themselves — prevents locking everyone out
  if (String(userId) === session.userId && role !== "admin") {
    return NextResponse.json(
      { error: "Du kannst deine eigene Admin-Rolle nicht entfernen." },
      { status: 400 }
    );
  }

  const result = await db
    .update(schema.users)
    .set({ role: role as (typeof userRoles)[number] })
    .where(eq(schema.users.id, userId))
    .returning({ id: schema.users.id, email: schema.users.email, role: schema.users.role });

  if (!result[0]) {
    return NextResponse.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}
