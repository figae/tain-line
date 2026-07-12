import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register — create an account.
 *
 * The very first account becomes admin (bootstrap), every further
 * account starts as viewer (read-only) until an admin promotes it.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(clientKey(req, "register"), { limit: 5, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json(
      { error: "Zu viele Registrierungsversuche. Bitte später erneut versuchen." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const { email, name, password } = (body ?? {}) as Record<string, unknown>;

  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanName = typeof name === "string" ? name.trim() : "";

  if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 254) {
    return NextResponse.json({ error: "Bitte eine gültige E-Mail-Adresse angeben." }, { status: 400 });
  }
  if (cleanName.length < 2 || cleanName.length > 80) {
    return NextResponse.json({ error: "Der Name muss 2–80 Zeichen lang sein." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 10 || password.length > 200) {
    return NextResponse.json(
      { error: "Das Passwort muss mindestens 10 Zeichen lang sein." },
      { status: 400 }
    );
  }

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, cleanEmail))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "Für diese E-Mail-Adresse existiert bereits ein Konto." },
      { status: 409 }
    );
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users);
  const role = Number(count) === 0 ? "admin" : "viewer";

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(schema.users)
    .values({ email: cleanEmail, name: cleanName, passwordHash, role })
    .returning({ id: schema.users.id, email: schema.users.email, role: schema.users.role });

  return NextResponse.json(
    {
      user,
      message:
        role === "admin"
          ? "Konto erstellt — als erstes Konto hast du Admin-Rechte."
          : "Konto erstellt. Ein Admin kann dir Schreibrechte (Editor) geben.",
    },
    { status: 201 }
  );
}
