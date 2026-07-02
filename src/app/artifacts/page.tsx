"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ArtifactItem {
  id: number;
  name: string;
  altNames: string[];
  type: string;
  description: string | null;
  powers: string | null;
  sourceQuote: string | null;
  characters: {
    characterId: number;
    characterName: string;
    relationship: string;
    notes: string | null;
  }[];
}

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  weapon:     { icon: "⚔", label: "Waffe",      color: "#e87878" },
  treasure:   { icon: "◆", label: "Schatz",     color: "var(--amber)" },
  vessel:     { icon: "◡", label: "Gefäß",      color: "#78b4e8" },
  instrument: { icon: "♪", label: "Instrument", color: "#a87ed8" },
  garment:    { icon: "◇", label: "Gewand",     color: "var(--sage)" },
  jewel:      { icon: "✦", label: "Kleinod",    color: "#e8c878" },
  animal:     { icon: "◉", label: "Wundertier", color: "#78c8a0" },
  other:      { icon: "❖", label: "Sonstiges",  color: "var(--slate)" },
};

const REL_LABEL: Record<string, string> = {
  owner:   "Besitzer·in",
  wielder: "Träger·in",
  creator: "Schöpfer·in",
  keeper:  "Hüter·in",
  seeker:  "Suchende·r",
  victim:  "Opfer",
  other:   "Verbunden",
};

export default function ArtifactsPage() {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/artifacts")
      .then((r) => r.json())
      .then((d) => { setArtifacts(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
      </div>
    );
  }

  const types = Array.from(new Set(artifacts.map((a) => a.type)));
  const visible = typeFilter ? artifacts.filter((a) => a.type === typeFilter) : artifacts;

  return (
    <div className="page-enter">
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Artefakte</h1>
      <p style={{ color: "var(--mist)", margin: "0 0 1.5rem" }}>
        Die legendären Waffen, Schätze und Wunderdinge der irischen Mythologie — von den vier
        Schätzen der Tuatha Dé Danann bis zum Gáe Bulg.
        {" "}
        <span style={{ color: "var(--slate)", fontSize: "0.9rem" }}>({visible.length} Einträge)</span>
      </p>

      {/* Type filter */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setTypeFilter(null)}
          className={`zoom-step${typeFilter === null ? " zoom-step-active" : ""}`}
          style={{ border: "1px solid var(--border)", borderRadius: 3 }}
        >
          Alle
        </button>
        {types.map((t) => {
          const meta = TYPE_META[t] ?? TYPE_META.other;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={`zoom-step${typeFilter === t ? " zoom-step-active" : ""}`}
              style={{ border: "1px solid var(--border)", borderRadius: 3, color: typeFilter === t ? undefined : meta.color }}
            >
              {meta.icon} {meta.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
        {visible.map((a) => {
          const meta = TYPE_META[a.type] ?? TYPE_META.other;
          return (
            <div key={a.id} className="card" style={{ padding: "1.1rem 1.25rem", borderLeft: `3px solid ${meta.color}66` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.05rem", margin: 0, color: "var(--cream)" }}>
                  <span style={{ color: meta.color, marginRight: "0.4rem" }}>{meta.icon}</span>
                  {a.name}
                </h2>
                <span className="badge" style={{ flexShrink: 0, background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}44`, fontSize: "0.6rem" }}>
                  {meta.label}
                </span>
              </div>

              {a.altNames.length > 0 && (
                <div style={{ color: "var(--slate)", fontSize: "0.8rem", marginTop: "0.2rem", fontStyle: "italic" }}>
                  {a.altNames.join(" · ")}
                </div>
              )}

              {a.description && (
                <p style={{ color: "var(--mist)", fontSize: "0.9rem", margin: "0.6rem 0 0" }}>{a.description}</p>
              )}

              {a.powers && (
                <div style={{ marginTop: "0.6rem", padding: "0.5rem 0.75rem", background: "rgba(200,145,58,0.07)", borderLeft: "2px solid var(--gold)", fontSize: "0.85rem", color: "var(--parchment)", fontStyle: "italic" }}>
                  ✦ {a.powers}
                </div>
              )}

              {a.characters.length > 0 && (
                <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {a.characters.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--slate)", fontSize: "0.72rem", fontFamily: "Cinzel, serif", letterSpacing: "0.05em", minWidth: "6.5rem" }}>
                        {REL_LABEL[c.relationship] ?? c.relationship}:
                      </span>
                      <Link href={`/characters/${c.characterId}`} style={{ color: "var(--gold)", textDecoration: "none" }}>
                        {c.characterName}
                      </Link>
                      {c.notes && <span style={{ color: "var(--slate)", fontSize: "0.75rem", fontStyle: "italic" }}>({c.notes})</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
