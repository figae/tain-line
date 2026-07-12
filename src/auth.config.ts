import type { NextAuthConfig } from "next-auth";

export type Role = "admin" | "editor" | "viewer";

// GitHub users on this list get the admin role; other GitHub users are viewers.
const adminGithubLogins = (process.env.ADMIN_GITHUB_LOGINS ?? "")
  .split(",")
  .map((l) => l.trim().toLowerCase())
  .filter(Boolean);

/**
 * Edge-safe part of the auth config: no database imports.
 * The middleware builds its own NextAuth instance from this object,
 * while src/auth.ts adds the Credentials provider (which needs the DB).
 */
export const authConfig = {
  providers: [],
  // Self-hosted deployment: trust the Host header of the serving
  // process (equivalent to AUTH_TRUST_HOST=true).
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user, account, profile }) {
      if (user) {
        if ("role" in user && user.role) {
          token.role = user.role;
          token.uid = user.id;
        }
        if (account?.provider === "github") {
          const login = (profile?.login as string | undefined)?.toLowerCase();
          token.role = login && adminGithubLogins.includes(login) ? "admin" : "viewer";
          token.uid = `github:${login ?? "unknown"}`;
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = (token.role as Role) ?? "viewer";
      session.user.id = (token.uid as string) ?? "";
      return session;
    },
  },
} satisfies NextAuthConfig;
