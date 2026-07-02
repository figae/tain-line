import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Edge-safe NextAuth instance (no DB imports) — only decodes the JWT.
const { auth } = NextAuth(authConfig);

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  // An anonymous request can still carry a session object with empty
  // fields — a real login always has a non-empty user id.
  const isAuthed = !!req.auth?.user?.id;
  const role = isAuthed ? req.auth?.user?.role ?? "viewer" : null;

  // ── Admin area (pages + API): admin role required ──────────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!isAuthed) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
      }
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Admin-Rolle erforderlich." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/?forbidden=1", req.url));
    }
    return;
  }

  // ── All other API routes: reads are public, writes need editor+ ────────
  // (Handlers additionally enforce this via requireRole — defense in depth.)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    if (WRITE_METHODS.has(req.method)) {
      if (!isAuthed) {
        return NextResponse.json(
          { error: "Nicht angemeldet. Schreibzugriff erfordert ein Benutzerkonto." },
          { status: 401 }
        );
      }
      if (role !== "admin" && role !== "editor") {
        return NextResponse.json(
          { error: "Keine Schreibrechte. Ein Admin kann dir die Editor-Rolle geben." },
          { status: 403 }
        );
      }
    }
  }
});

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
