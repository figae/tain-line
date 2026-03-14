import Link from "next/link";
import { db, schema } from "@/db";
import { eq, or } from "drizzle-orm";

async function getPendingCounts() {
  const pending = (t: { status: ReturnType<typeof eq> }) => t;
  void pending;

  const [chars, evts, plcs, grps, rels] = await Promise.all([
    db.select({ id: schema.characters.id }).from(schema.characters).where(eq(schema.characters.status, "pending_review")),
    db.select({ id: schema.events.id }).from(schema.events).where(eq(schema.events.status, "pending_review")),
    db.select({ id: schema.places.id }).from(schema.places).where(eq(schema.places.status, "pending_review")),
    db.select({ id: schema.groups.id }).from(schema.groups).where(eq(schema.groups.status, "pending_review")),
    db.select({ id: schema.familyRelations.id }).from(schema.familyRelations).where(eq(schema.familyRelations.status, "pending_review")),
  ]);
  return {
    characters: chars.length,
    events: evts.length,
    places: plcs.length,
    groups: grps.length,
    relations: rels.length,
    total: chars.length + evts.length + plcs.length + grps.length + rels.length,
  };
}

async function getTotalCounts() {
  const [chars, evts, plcs, grps] = await Promise.all([
    db.select({ id: schema.characters.id }).from(schema.characters).where(eq(schema.characters.status, "approved")),
    db.select({ id: schema.events.id }).from(schema.events).where(eq(schema.events.status, "approved")),
    db.select({ id: schema.places.id }).from(schema.places).where(eq(schema.places.status, "approved")),
    db.select({ id: schema.groups.id }).from(schema.groups).where(eq(schema.groups.status, "approved")),
  ]);
  return { characters: chars.length, events: evts.length, places: plcs.length, groups: grps.length };
}

export default async function AdminPage() {
  const [pending, approved] = await Promise.all([getPendingCounts(), getTotalCounts()]);

  const cardStyle: React.CSSProperties = {
    background: "var(--bark)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "1.5rem",
  };

  const actions = [
    { href: "/admin/extract", label: "KI-Extraktion", description: "Sagentext einfügen → Claude extrahiert Charaktere, Events, Orte", icon: "◎" },
    { href: "/admin/review", label: "Review-Queue", description: `${pending.total} Einträge warten auf Freigabe`, icon: "✦", badge: pending.total },
  ];

  return (
    <div>
      <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "1.5rem", color: "var(--cream)", marginBottom: "0.25rem" }}>
        Admin-Bereich
      </h1>
      <p style={{ color: "var(--slate)", fontSize: "0.85rem", marginBottom: "2rem" }}>
        Datenerfassung, KI-Extraktion und Freigabe-Workflow
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Charaktere", count: approved.characters },
          { label: "Events", count: approved.events },
          { label: "Orte", count: approved.places },
          { label: "Gruppen", count: approved.groups },
        ].map(({ label, count }) => (
          <div key={label} style={cardStyle}>
            <div style={{ fontFamily: "Cinzel, serif", fontSize: "1.5rem", color: "var(--gold)", marginBottom: "0.25rem" }}>
              {count}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--slate)", fontFamily: "Cinzel, serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {actions.map((a) => (
          <Link key={a.href} href={a.href} style={{ textDecoration: "none" }}>
            <div
              style={{
                ...cardStyle,
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                cursor: "pointer",
                transition: "border-color 0.15s",
                borderColor: a.badge ? "var(--amber)" : "var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ color: "var(--amber)", fontSize: "1.25rem" }}>{a.icon}</span>
                <span style={{ fontFamily: "Cinzel, serif", color: "var(--cream)", fontSize: "0.95rem" }}>
                  {a.label}
                </span>
                {a.badge ? (
                  <span style={{
                    marginLeft: "auto",
                    background: "var(--amber)",
                    color: "var(--stone)",
                    fontSize: "0.7rem",
                    fontFamily: "Cinzel, serif",
                    padding: "2px 8px",
                    borderRadius: 10,
                  }}>
                    {a.badge}
                  </span>
                ) : null}
              </div>
              <p style={{ color: "var(--slate)", fontSize: "0.8rem", margin: 0 }}>
                {a.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pending breakdown */}
      {pending.total > 0 && (
        <div style={{ ...cardStyle, marginTop: "1.5rem" }}>
          <h2 style={{ fontFamily: "Cinzel, serif", fontSize: "0.85rem", color: "var(--amber)", marginBottom: "1rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Ausstehend nach Typ
          </h2>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            {Object.entries({ Charaktere: pending.characters, Events: pending.events, Orte: pending.places, Gruppen: pending.groups, Relationen: pending.relations })
              .filter(([, count]) => count > 0)
              .map(([label, count]) => (
                <div key={label}>
                  <span style={{ color: "var(--gold)", fontFamily: "Cinzel, serif", fontSize: "1.25rem" }}>{count}</span>
                  {" "}
                  <span style={{ color: "var(--slate)", fontSize: "0.8rem" }}>{label}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
