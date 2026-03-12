"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CharDetail {
  id: number;
  name: string;
  altNames: string[];
  gender: string;
  epithet: string | null;
  isDeity: boolean;
  isDead: boolean;
  description: string | null;
  source: { title: string; url: string | null; year: number | null } | null;
  properties: {
    id: number;
    type: string;
    value: string;
    notes: string | null;
    sourceTitle: string | null;
    sourceUrl: string | null;
  }[];
  groups: { id: number; name: string }[];
  family: {
    from: { toCharacterId: number; toName: string; relationType: string; notes: string | null }[];
    to:   { fromCharacterId: number; fromName: string; relationType: string; notes: string | null }[];
  };
  events: {
    eventId: number;
    eventName: string;
    cycle: string;
    role: string;
  }[];
}

const PROP_ICONS: Record<string, string> = {
  color:     "🎨",
  animal:    "🐾",
  weapon:    "⚔",
  clothing:  "🧣",
  place:     "📍",
  epithet:   "📛",
  attribute: "✨",
  skill:     "⚡",
  other:     "◆",
};

const CYCLE_LABELS: Record<string, string> = {
  mythological: "Mythologisch",
  ulster:       "Ulster",
  fenian:       "Fenian",
  kings:        "Königs",
  other:        "Sonstig",
};

export default function CharacterDetail() {
  const params = useParams();
  const [char, setChar] = useState<CharDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/characters/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setChar(d); setLoading(false); });
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
      </div>
    );
  }

  if (!char) {
    return <div style={{ color: "var(--mist)", padding: "2rem" }}>Charakter nicht gefunden.</div>;
  }

  const propGroups = char.properties.reduce<Record<string, typeof char.properties>>(
    (acc, p) => {
      if (!acc[p.type]) acc[p.type] = [];
      acc[p.type].push(p);
      return acc;
    },
    {}
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <Link
        href="/characters"
        style={{ color: "var(--slate)", textDecoration: "none", fontSize: "0.85rem", fontFamily: "Cinzel, serif", letterSpacing: "0.1em" }}
      >
        ← Charaktere
      </Link>

      {/* Header */}
      <div
        className="celtic-border"
        style={{
          marginTop: "1.5rem",
          marginBottom: "2rem",
          padding: "2rem",
          background: "var(--bark)",
          borderLeft: char.isDeity ? "4px solid var(--gold)" : "4px solid var(--moss)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", margin: "0 0 0.25rem" }}>{char.name}</h1>
            {char.epithet && (
              <div style={{ color: "var(--amber)", fontStyle: "italic", fontSize: "1.1rem" }}>
                {char.epithet}
              </div>
            )}
            {char.altNames.length > 0 && (
              <div style={{ color: "var(--slate)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                Auch bekannt als: {char.altNames.join(", ")}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
            {char.groups.map((g) => (
              <span key={g.id} className="badge cycle-mythological" style={{ background: "rgba(61,74,46,0.3)", color: "var(--sage)", border: "1px solid rgba(61,74,46,0.6)" }}>
                {g.name}
              </span>
            ))}
            {char.isDeity && (
              <span className="badge" style={{ background: "rgba(200,145,58,0.15)", color: "var(--amber)", border: "1px solid rgba(200,145,58,0.4)" }}>
                Gottheit
              </span>
            )}
            {char.isDead && (
              <span className="badge" style={{ background: "rgba(122,32,32,0.2)", color: "#e87878", border: "1px solid rgba(122,32,32,0.4)" }}>
                Verstorben
              </span>
            )}
          </div>
        </div>

        {char.description && (
          <p style={{ color: "var(--mist)", marginTop: "1rem", marginBottom: 0, fontSize: "1rem" }}>
            {char.description}
          </p>
        )}

        {char.source && (
          <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--slate)", fontStyle: "italic" }}>
            Quelle:{" "}
            {char.source.url ? (
              <a href={char.source.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>
                {char.source.title}
              </a>
            ) : (
              char.source.title
            )}
            {char.source.year && ` (${char.source.year})`}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Properties */}
        {Object.keys(propGroups).length > 0 && (
          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--amber)" }}>
              Eigenschaften
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {Object.entries(propGroups).map(([type, props]) => (
                <div key={type} className="card" style={{ padding: "0.75rem 1rem" }}>
                  <div
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: "0.7rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--slate)",
                      marginBottom: "0.4rem",
                    }}
                  >
                    {PROP_ICONS[type]} {type}
                  </div>
                  {props.map((p) => (
                    <div key={p.id} style={{ marginBottom: "0.35rem" }}>
                      <span style={{ color: "var(--cream)" }}>{p.value}</span>
                      {p.notes && (
                        <span style={{ color: "var(--slate)", fontSize: "0.85rem", marginLeft: "0.5rem", fontStyle: "italic" }}>
                          — {p.notes}
                        </span>
                      )}
                      {p.sourceTitle && (
                        <div style={{ fontSize: "0.75rem", color: "var(--slate)" }}>
                          📜{" "}
                          {p.sourceUrl ? (
                            <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>
                              {p.sourceTitle}
                            </a>
                          ) : (
                            p.sourceTitle
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Family */}
        <div>
          {(char.family.from.length > 0 || char.family.to.length > 0) && (
            <>
              <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--amber)" }}>
                Familie
              </h2>
              <div className="card" style={{ padding: "1rem" }}>
                {char.family.to.map((r) => (
                  <div key={r.fromCharacterId} style={{ marginBottom: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ color: "var(--slate)", fontSize: "0.8rem", fontFamily: "Cinzel, serif", textTransform: "capitalize" }}>
                      {r.relationType}:
                    </span>
                    <Link href={`/characters/${r.fromCharacterId}`} style={{ color: "var(--cream)", textDecoration: "none" }}>
                      {r.fromName}
                    </Link>
                  </div>
                ))}
                {char.family.from.map((r) => (
                  <div key={r.toCharacterId} style={{ marginBottom: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ color: "var(--slate)", fontSize: "0.8rem", fontFamily: "Cinzel, serif", textTransform: "capitalize" }}>
                      {r.relationType === "father" ? "Kind" : r.relationType === "mother" ? "Kind" : r.relationType}:
                    </span>
                    <Link href={`/characters/${r.toCharacterId}`} style={{ color: "var(--cream)", textDecoration: "none" }}>
                      {r.toName}
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Events */}
          {char.events.length > 0 && (
            <>
              <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", marginTop: "1.5rem", color: "var(--amber)" }}>
                Beteiligte Events
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {char.events.map((e) => (
                  <Link key={e.eventId} href={`/events/${e.eventId}`} style={{ textDecoration: "none" }}>
                    <div className="card" style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ color: "var(--cream)", fontSize: "0.9rem" }}>{e.eventName}</span>
                        <span className={`badge cycle-${e.cycle}`} style={{ flexShrink: 0, fontSize: "0.6rem" }}>
                          {CYCLE_LABELS[e.cycle] ?? e.cycle}
                        </span>
                      </div>
                      <div style={{ color: "var(--slate)", fontSize: "0.8rem", marginTop: "0.2rem", fontStyle: "italic", textTransform: "capitalize" }}>
                        Rolle: {e.role}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
