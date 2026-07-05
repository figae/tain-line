"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ConflictEdge {
  from: { id: number; name: string };
  to: { id: number; name: string };
  relationType: string;
  derived: boolean;
  reason: string | null;
}

interface ConflictItem {
  explicitOnly: boolean;
  events: { id: number; name: string }[];
  edges: ConflictEdge[];
}

interface ConsistencyReport {
  totalEvents: number;
  explicitConstraints: number;
  derivedConstraints: number;
  conflictCount: number;
  droppedDerived: number;
  conflicts: ConflictItem[];
}

export default function ConsistencyPage() {
  const [report, setReport] = useState<ConsistencyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/consistency")
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Fehler");
        return r.json();
      })
      .then((d) => { setReport(d); setLoading(false); })
      .catch((e) => { setError(String(e.message ?? e)); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
        <div style={{ color: "var(--slate)", marginTop: "1rem", fontFamily: "Cinzel, serif", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
          PRÜFE KONSISTENZ …
        </div>
      </div>
    );
  }

  if (error || !report) {
    return <div className="auth-error">{error ?? "Bericht konnte nicht geladen werden."}</div>;
  }

  return (
    <div className="page-enter">
      <h1 style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>Konsistenz-Prüfung</h1>
      <p style={{ color: "var(--mist)", margin: "0 0 1.5rem" }}>
        Widersprüche zwischen den explizit überlieferten Relationen und den automatisch
        abgeleiteten Zwängen (Geburt → Beteiligung → Tod, Eltern vor Kindern) erscheinen
        als Zyklen im Ereignisgraphen. Explizite Aussagen gewinnen — abgeleitete Kanten
        im Konflikt werden aus der Ordnung genommen und hier zur Prüfung gemeldet.
      </p>

      {/* Summary tiles */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {[
          { label: "Events", value: report.totalEvents, color: "var(--amber)" },
          { label: "Explizite Relationen", value: report.explicitConstraints, color: "var(--amber)" },
          { label: "Abgeleitete Constraints", value: report.derivedConstraints, color: "var(--sage)" },
          { label: "Konflikte", value: report.conflictCount, color: report.conflictCount === 0 ? "#78c878" : "#e87878" },
        ].map((t) => (
          <div key={t.label} className="stat-tile card">
            <div className="stat-value" style={{ color: t.color }}>{t.value}</div>
            <div className="stat-label">{t.label}</div>
          </div>
        ))}
      </div>

      {report.conflictCount === 0 ? (
        <div className="card celtic-border" style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", color: "#78c878", marginBottom: "0.5rem" }}>✓</div>
          <div style={{ fontFamily: "Cinzel, serif", color: "var(--cream)", letterSpacing: "0.08em" }}>
            Keine Widersprüche gefunden
          </div>
          <p style={{ color: "var(--slate)", fontSize: "0.9rem", margin: "0.5rem 0 0" }}>
            Alle {report.explicitConstraints} überlieferten Relationen sind mit allen{" "}
            {report.derivedConstraints} abgeleiteten Zwängen vereinbar — der Ereignisgraph ist zyklenfrei.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {report.conflicts.map((c, i) => (
            <div key={i} className="card" style={{ padding: "1.25rem", borderLeft: "3px solid #e87878" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "Cinzel, serif", color: "#e87878", letterSpacing: "0.1em", fontSize: "0.8rem" }}>
                  ⚠ KONFLIKT {i + 1}
                </span>
                <span className="badge" style={{
                  background: c.explicitOnly ? "rgba(232,120,120,0.15)" : "rgba(107,138,85,0.15)",
                  color: c.explicitOnly ? "#e87878" : "var(--sage)",
                  border: `1px solid ${c.explicitOnly ? "#e8787855" : "#6b8a5555"}`,
                  fontSize: "0.6rem",
                }}>
                  {c.explicitOnly
                    ? "Widerspruch in den Quellen-Relationen selbst"
                    : "Quellen-Relation vs. abgeleiteter Zwang"}
                </span>
              </div>

              <div style={{ color: "var(--mist)", fontSize: "0.85rem", marginBottom: "0.6rem" }}>
                Beteiligte Ereignisse:{" "}
                {c.events.map((e, j) => (
                  <span key={e.id}>
                    {j > 0 && " · "}
                    <Link href={`/events/${e.id}`} style={{ color: "var(--gold)" }}>{e.name}</Link>
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {c.edges.map((e, j) => (
                  <div key={j} style={{ fontSize: "0.82rem", color: e.derived ? "var(--sage)" : "var(--cream)" }}>
                    {e.derived ? "⚙ " : "📜 "}
                    <strong>{e.from.name}</strong> —{e.relationType}→ <strong>{e.to.name}</strong>
                    {e.reason && (
                      <span style={{ color: "var(--slate)", fontStyle: "italic" }}> — {e.reason}</span>
                    )}
                    {e.derived && (
                      <span style={{ color: "var(--slate)", fontSize: "0.72rem" }}> (aus der Ordnung genommen)</span>
                    )}
                  </div>
                ))}
              </div>

              <p style={{ color: "var(--slate)", fontSize: "0.78rem", margin: "0.75rem 0 0", fontStyle: "italic" }}>
                Zur Auflösung: Entweder ist eine der 📜-Relationen falsch erfasst, oder eine
                Rolle/Lebenszeit-Zuordnung stimmt nicht (z.&nbsp;B. gehört ein Beteiligter auf
                &bdquo;mentioned&ldquo;, oder ein Geburts-/Todes-Event ist der falschen Figur zugeordnet).
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
