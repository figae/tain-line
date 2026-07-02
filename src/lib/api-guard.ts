import { NextResponse } from "next/server";
import { auth, type Role } from "@/auth";

const ROLE_RANK: Record<Role, number> = { viewer: 0, editor: 1, admin: 2 };

export interface GuardedSession {
  userId: string;
  role: Role;
  name: string;
  email: string;
}

/**
 * Central write-access guard for API routes.
 *
 * Reading is public; every mutating handler must call this first.
 * Returns the session info on success, or a ready-to-return
 * NextResponse (401 not logged in / 403 insufficient role).
 */
export async function requireRole(
  minRole: Exclude<Role, "viewer">
): Promise<GuardedSession | NextResponse> {
  const session = await auth();
  // A real login always carries a non-empty user id; anonymous requests
  // may still yield a session object with empty fields.
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Nicht angemeldet. Schreibzugriff erfordert ein Benutzerkonto." },
      { status: 401 }
    );
  }
  const role = session.user.role ?? "viewer";
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    return NextResponse.json(
      { error: `Keine Berechtigung. Erforderliche Rolle: ${minRole}.` },
      { status: 403 }
    );
  }
  return {
    userId: session.user.id,
    role,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };
}

export function isGuardError(
  result: GuardedSession | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

// ── Input validation helpers (dependency-free) ──────────────────────────────

export function asTrimmedString(v: unknown, maxLen = 500): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s || s.length > maxLen) return null;
  return s;
}

export function asOptionalString(v: unknown, maxLen = 5000): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s.slice(0, maxLen) : null;
}

export function asEnum<T extends string>(
  v: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v)
    ? (v as T)
    : fallback;
}

export function asOptionalId(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function asStringArray(v: unknown, maxItems = 20, maxLen = 200): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}
