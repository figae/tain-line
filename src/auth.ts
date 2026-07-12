import NextAuth, { type DefaultSession } from "next-auth";
// Imported for the module augmentation below — TS only augments modules
// that are part of the compilation.
import type {} from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import type { Provider } from "next-auth/providers";
import { authConfig, type Role } from "@/auth.config";

export type { Role };

// ── Module augmentation: expose role + id on the session ────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    uid?: string;
  }
}

const providers: Provider[] = [
  Credentials({
    name: "E-Mail & Passwort",
    credentials: {
      email: { label: "E-Mail", type: "email" },
      password: { label: "Passwort", type: "password" },
    },
    async authorize(credentials) {
      const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";
      if (!email || !password) return null;

      const rows = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      const user = rows[0];

      // Always run a bcrypt compare, even for unknown users, so the
      // response time doesn't leak whether an account exists.
      const hash = user?.passwordHash ?? "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7ZBpDLhAuBAvpDkXpgZuGWfnV1Qa72W";
      const valid = await bcrypt.compare(password, hash);
      if (!user || !valid) return null;

      return {
        id: String(user.id),
        email: user.email,
        name: user.name,
        role: user.role,
      };
    },
  }),
];

// GitHub OAuth stays available as an optional second login path.
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers,
});
