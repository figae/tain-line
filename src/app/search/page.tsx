"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

interface SearchResults {
  query: string;
  characters: Array<{ id: number; name: string; epithet: string | null; gender: string | null; isDeity: boolean | null; description: string | null }>;
  events: Array<{ id: number; name: string; eventType: string | null; cycle: string | null; description: string | null }>;
  places: Array<{ id: number; name: string; type: string | null; description: string | null }>;
  groups: Array<{ id: number; name: string; description: string | null }>;
}

const EVENT_TYPE_ICON: Record<string, string> = {
  birth: "✦", death: "✝", meeting: "☍", battle: "⚔", reign: "♛",
  transformation: "⟳", prophecy: "◎", journey: "➢", other: "◆",
};

const CYCLE_LABEL: Record<string, string> = {
  mythological: "Mythologisch", ulster: "Ulster", fenian: "Fenian", kings: "Königs", other: "Sonstig",
};

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialQ) {
      doSearch(initialQ);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doSearch = async (q: string) => {
    if (q.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
    const data = await res.json() as SearchResults;
    setResults(data);
    setLoading(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.replace(`/search${val.trim() ? `?q=${encodeURIComponent(val.trim())}` : ""}`);
      doSearch(val);
    }, 300);
  };

  const total = results
    ? results.characters.length + results.events.length + results.places.length + results.groups.length
    : 0;

  const sectionStyle: React.CSSProperties = { marginBottom: "2rem" };
  const headingStyle: React.CSSProperties = {
    fontFamily: "Cinzel, serif",
    fontSize: "0.7rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase" as const,
    color: "var(--amber)",
    marginBottom: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "1.5rem", color: "var(--cream)", marginBottom: "1.5rem" }}>
        Suche
      </h1>

      {/* Search input */}
      <div style={{ position: "relative", marginBottom: "2rem" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--amber)", fontSize: "1rem" }}>◎</span>
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="Charaktere, Events, Orte, Gruppen…"
          autoFocus
          style={{
            width: "100%",
            padding: "12px 16px 12px 40px",
            background: "var(--bark)",
            border: "1px solid var(--border-bright)",
            borderRadius: 4,
            color: "var(--cream)",
            fontSize: "1rem",
            fontFamily: "Crimson Text, serif",
            boxSizing: "border-box",
          }}
        />
        {loading && (
          <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          </div>
        )}
      </div>

      {/* Results summary */}
      {results && query.trim().length >= 2 && (
        <div style={{ color: "var(--slate)", fontSize: "0.8rem", marginBottom: "1.5rem", fontFamily: "Cinzel, serif", letterSpacing: "0.05em" }}>
          {total === 0 ? `Keine Ergebnisse für „${results.query}"` : `${total} Ergebnis${total !== 1 ? "se" : ""} für „${results.query}"`}
        </div>
      )}

      {results && total > 0 && (
        <div>
          {/* Characters */}
          {results.characters.length > 0 && (
            <div style={sectionStyle}>
              <div style={headingStyle}>
                <span>✦</span> Charaktere <span style={{ color: "var(--slate)" }}>({results.characters.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {results.characters.map((c) => (
                  <Link key={c.id} href={`/characters/${c.id}`} style={{ textDecoration: "none" }}>
                    <div className="card" style={{ padding: "0.85rem 1rem", display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                      <span style={{ fontFamily: "Cinzel, serif", color: "var(--cream)", fontSize: "0.95rem" }}>{c.name}</span>
                      {c.epithet && <span style={{ color: "var(--amber)", fontSize: "0.8rem", fontStyle: "italic" }}>{c.epithet}</span>}
                      {c.isDeity && <span style={{ fontSize: "0.6rem", color: "var(--gold)", background: "rgba(200,145,58,0.1)", padding: "1px 6px", borderRadius: 10, fontFamily: "Cinzel, serif" }}>Gottheit</span>}
                      {c.description && (
                        <span style={{ color: "var(--slate)", fontSize: "0.8rem", marginLeft: "auto", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "40%" }}>
                          {c.description.slice(0, 80)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {results.events.length > 0 && (
            <div style={sectionStyle}>
              <div style={headingStyle}>
                <span>⚔</span> Events <span style={{ color: "var(--slate)" }}>({results.events.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {results.events.map((e) => (
                  <Link key={e.id} href={`/events/${e.id}`} style={{ textDecoration: "none" }}>
                    <div className="card" style={{ padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ color: "var(--amber)", fontSize: "0.9rem", flexShrink: 0 }}>
                        {EVENT_TYPE_ICON[e.eventType ?? "other"] ?? "◆"}
                      </span>
                      <span style={{ fontFamily: "Cinzel, serif", color: "var(--cream)", fontSize: "0.9rem", flex: 1 }}>{e.name}</span>
                      {e.cycle && (
                        <span className={`badge cycle-${e.cycle}`} style={{ fontSize: "0.6rem", flexShrink: 0 }}>
                          {CYCLE_LABEL[e.cycle] ?? e.cycle}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Places */}
          {results.places.length > 0 && (
            <div style={sectionStyle}>
              <div style={headingStyle}>
                <span>◎</span> Orte <span style={{ color: "var(--slate)" }}>({results.places.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {results.places.map((p) => (
                  <div key={p.id} className="card" style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                      <span style={{ fontFamily: "Cinzel, serif", color: "var(--cream)", fontSize: "0.95rem" }}>{p.name}</span>
                      {p.type && <span style={{ color: "var(--slate)", fontSize: "0.75rem" }}>{p.type}</span>}
                    </div>
                    {p.description && (
                      <p style={{ color: "var(--mist)", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
                        {p.description.slice(0, 100)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groups */}
          {results.groups.length > 0 && (
            <div style={sectionStyle}>
              <div style={headingStyle}>
                <span>◈</span> Gruppen <span style={{ color: "var(--slate)" }}>({results.groups.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {results.groups.map((g) => (
                  <div key={g.id} className="card" style={{ padding: "0.85rem 1rem" }}>
                    <span style={{ fontFamily: "Cinzel, serif", color: "var(--cream)", fontSize: "0.95rem" }}>{g.name}</span>
                    {g.description && (
                      <p style={{ color: "var(--mist)", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
                        {g.description.slice(0, 100)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!query.trim() && !results && (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <div style={{ fontSize: "2.5rem", color: "var(--border-bright)", marginBottom: "1rem" }}>◎</div>
          <p style={{ fontFamily: "Cinzel, serif", color: "var(--slate)", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
            Suche nach Charakteren, Events, Orten und Gruppen
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
