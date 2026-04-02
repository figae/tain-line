import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

// Optional: Restrict admin access to specific GitHub usernames (comma-separated).
// If ADMIN_GITHUB_LOGINS is empty or not set, any authenticated GitHub user gets access.
// Example in .env.local: ADMIN_GITHUB_LOGINS=yourhandle,otherhandle
const allowedLogins = process.env.ADMIN_GITHUB_LOGINS
  ? process.env.ADMIN_GITHUB_LOGINS.split(",").map((l) => l.trim().toLowerCase())
  : [];

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [GitHub],
  callbacks: {
    signIn({ profile }) {
      if (allowedLogins.length === 0) return true;
      const login = (profile?.login as string | undefined)?.toLowerCase();
      return !!login && allowedLogins.includes(login);
    },
  },
});
