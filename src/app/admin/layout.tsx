import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
      </div>

      <div style={{ flex: 1, padding: "2rem 1.5rem", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        {children}
      </div>
    </div>
  );
}
