"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Character {
  id: number;
  name: string;
  altNames: string | null;
  gender: string;
  epithet: string | null;
  isDeity: boolean;
  isDead: boolean;
  description: string | null;
}

const GENDER_SYMBOL: Record<string, string> = {
  male: "♂",
  female: "♀",
  other: "✦",
  unknown: "?",
};

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = query ? `?q=${encodeURIComponent(query)}` : "";
    fetch(`/api/characters${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCharacters(data);
        setLoading(false);
      });
  }, [query]);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Charaktere</h1>
        <p style={{ color: "var(--mist)", margin: "0 0 1.5rem" }}>
          Götter, Helden und Wesen der irisch-keltischen Mythologie
        </p>

        <input
          type="text"
          placeholder="Suchen — Name, Beiname …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 400,
            padding: "0.6rem 1rem",
            background: "var(--peat)",
            border: "1px solid var(--border)",
            borderRadius: "2px",
            color: "var(--cream)",
            fontFamily: "Crimson Text, serif",
            fontSize: "1rem",
          }}
        />
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 120 }} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {characters.map((c) => {
            const altNames = c.altNames ? JSON.parse(c.altNames) : [];
            return (
              <Link key={c.id} href={`/characters/${c.id}`} style={{ textDecoration: "none" }}>
                <div
                  className="card"
                  style={{
                    padding: "1.25rem",
                    height: "100%",
                    borderLeft: c.isDeity
                      ? "3px solid var(--gold)"
                      : "3px solid var(--moss)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h2
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "1rem",
                        color: "var(--cream)",
                        margin: 0,
                      }}
                    >
                      {c.name}
                    </h2>
                    <span
                      style={{
                        color: c.gender === "male" ? "#78b4e8" : c.gender === "female" ? "#e878b4" : "var(--amber)",
                        fontSize: "1.1rem",
                        marginLeft: "0.5rem",
                        flexShrink: 0,
                      }}
                    >
                      {GENDER_SYMBOL[c.gender] ?? "?"}
                    </span>
                  </div>

                  {c.epithet && (
                    <div
                      style={{
                        color: "var(--amber)",
                        fontSize: "0.85rem",
                        fontStyle: "italic",
                        marginTop: "0.2rem",
                      }}
                    >
                      {c.epithet}
                    </div>
                  )}

                  {altNames.length > 0 && (
                    <div style={{ color: "var(--slate)", fontSize: "0.8rem", marginTop: "0.35rem" }}>
                      {altNames.slice(0, 2).join(" · ")}
                    </div>
                  )}

                  {c.description && (
                    <p
                      style={{
                        color: "var(--mist)",
                        fontSize: "0.88rem",
                        marginTop: "0.6rem",
                        marginBottom: 0,
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {c.description}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.75rem" }}>
                    {c.isDeity && (
                      <span className="badge" style={{ background: "rgba(200,145,58,0.15)", color: "var(--amber)", border: "1px solid rgba(200,145,58,0.4)", fontSize: "0.65rem" }}>
                        Gottheit
                      </span>
                    )}
                    {c.isDead && (
                      <span className="badge" style={{ background: "rgba(122,32,32,0.2)", color: "#e87878", border: "1px solid rgba(122,32,32,0.4)", fontSize: "0.65rem" }}>
                        Verstorben
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && characters.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--slate)", padding: "4rem 0" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>᚜</div>
          Keine Charaktere gefunden.
        </div>
      )}
    </div>
  );
}
