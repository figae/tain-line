import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "admin") redirect("/?forbidden=1");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Admin sub-nav */}
      <div
        style={{
          background: "var(--peat)",
          borderBottom: "1px solid var(--border)",
          padding: "0.5rem 1.5rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Cinzel, serif",
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--amber)",
          }}
        >
          Admin
        </span>
        <div style={{ width: 1, height: 12, background: "var(--border)" }} />
        {[
          { href: "/admin", label: "Übersicht" },
          { href: "/admin/extract", label: "KI-Extraktion" },
          { href: "/admin/review", label: "Review-Queue" },
          { href: "/admin/consistency", label: "Konsistenz" },
          { href: "/admin/users", label: "Benutzer" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--mist)",
              textDecoration: "none",
            }}
          >
            {l.label}
          </Link>
        ))}

        {/* User info + logout — pushed to the right */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {session.user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? "User"}
              width={22}
              height={22}
              style={{ borderRadius: "50%", border: "1px solid var(--border)" }}
            />
          )}
          <span style={{ fontSize: "0.7rem", color: "var(--slate)", fontFamily: "Cinzel, serif" }}>
            {session.user?.name ?? session.user?.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              style={{
                fontFamily: "Cinzel, serif",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--slate)",
                background: "none",
                border: "1px solid var(--border)",
                borderRadius: 2,
                padding: "2px 8px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      <div style={{ flex: 1, padding: "2rem 1.5rem", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {children}
      </div>
    </div>
  );
}
