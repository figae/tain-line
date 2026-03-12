"use client";

import { useEffect, useState } from "react";

interface Source {
  id: number;
  title: string;
  type: string;
  author: string | null;
  year: number | null;
  url: string | null;
  notes: string | null;
}

const TYPE_ICON: Record<string, string> = {
  manuscript: "📜",
  scholarly:  "📚",
  online:     "🌐",
  folklore:   "🗣",
};

const TYPE_COLOR: Record<string, string> = {
  manuscript: "#e87878",
  scholarly:  "#78b4e8",
  online:     "#a0c878",
  folklore:   "#e0a84a",
};

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.json())
      .then((d) => { setSources(d); setLoading(false); });
  }, []);

  const byType = sources.reduce<Record<string, Source[]>>((acc, s) => {
    if (!acc[s.type]) acc[s.type] = [];
    acc[s.type].push(s);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Quellen</h1>
        <p style={{ color: "var(--mist)", margin: 0 }}>
          Jeder Datenpunkt in Tain Line ist mit einer Quelle belegt.
        </p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 80 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {Object.entries(byType).map(([type, srcs]) => (
            <section key={type}>
              <h2
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: "0.85rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: TYPE_COLOR[type] ?? "var(--mist)",
                  marginBottom: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {TYPE_ICON[type]} {type}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {srcs.map((s) => (
                  <div
                    key={s.id}
                    className="card"
                    style={{
                      padding: "1rem 1.25rem",
                      borderLeft: `3px solid ${TYPE_COLOR[type] ?? "var(--border)"}`,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                      <div>
                        {s.url ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "var(--cream)",
                              textDecoration: "none",
                              fontFamily: "Cinzel, serif",
                              fontSize: "0.95rem",
                            }}
                          >
                            {s.title} ↗
                          </a>
                        ) : (
                          <span
                            style={{
                              color: "var(--cream)",
                              fontFamily: "Cinzel, serif",
                              fontSize: "0.95rem",
                            }}
                          >
                            {s.title}
                          </span>
                        )}
                        {s.author && (
                          <div style={{ color: "var(--slate)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                            {s.author}
                          </div>
                        )}
                        {s.notes && (
                          <p style={{ color: "var(--mist)", fontSize: "0.88rem", margin: "0.5rem 0 0", lineHeight: 1.5 }}>
                            {s.notes}
                          </p>
                        )}
                      </div>
                      {s.year && (
                        <span
                          style={{
                            fontFamily: "Cinzel, serif",
                            fontSize: "0.8rem",
                            color: "var(--slate)",
                            flexShrink: 0,
                          }}
                        >
                          {s.year < 0 ? `${Math.abs(s.year)} v.Chr.` : `ca. ${s.year}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
