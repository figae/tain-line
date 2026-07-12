"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PlaceItem {
  id: number;
  name: string;
  altNames: string[];
  type: string;
  modernEquivalent: string | null;
  description: string | null;
  events: {
    eventId: number;
    eventName: string;
    eventType: string | null;
    cycle: string;
  }[];
}

const TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  otherworld: { icon: "✦", label: "Anderswelt", color: "#a87ed8" },
  hill:       { icon: "▲", label: "Hügel",      color: "var(--sage)" },
  island:     { icon: "◉", label: "Insel",      color: "#78b4e8" },
  plain:      { icon: "▭", label: "Ebene",      color: "var(--amber)" },
  forest:     { icon: "♣", label: "Wald",       color: "var(--fern)" },
  river:      { icon: "≈", label: "Fluss/See",  color: "#78c8e8" },
  sea:        { icon: "≋", label: "Meer",       color: "#5888a8" },
  fortress:   { icon: "◧", label: "Festung",    color: "#e87878" },
  other:      { icon: "◆", label: "Ort",        color: "var(--slate)" },
};

const CYCLE_LABEL: Record<string, string> = {
  mythological: "Mythologisch",
  ulster: "Ulster",
  fenian: "Fenian",
  kings: "Könige",
  other: "Sonstig",
};

export default function PlacesPage() {
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/places")
      .then((r) => r.json())
      .then((d) => { setPlaces(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
      </div>
    );
  }

  const types = Array.from(new Set(places.map((p) => p.type)));
  const visible = typeFilter ? places.filter((p) => p.type === typeFilter) : places;

  return (
    <div className="page-enter">
      <h1 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>Orte</h1>
      <p style={{ color: "var(--mist)", margin: "0 0 1.5rem" }}>
        Die mythische Landkarte Irlands — von Tara und Emain Macha bis zur Anderswelt von Tír na nÓg.
        {" "}
        <span style={{ color: "var(--slate)", fontSize: "0.9rem" }}>({visible.length} Orte)</span>
      </p>

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
        {visible.map((p) => {
          const meta = TYPE_META[p.type] ?? TYPE_META.other;
          return (
            <div key={p.id} className="card" style={{ padding: "1.1rem 1.25rem", borderLeft: `3px solid ${meta.color}66` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.05rem", margin: 0, color: "var(--cream)" }}>
                  <span style={{ color: meta.color, marginRight: "0.4rem" }}>{meta.icon}</span>
                  {p.name}
                </h2>
                <span className="badge" style={{ flexShrink: 0, background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}44`, fontSize: "0.6rem" }}>
                  {meta.label}
                </span>
              </div>

              {p.altNames.length > 0 && (
                <div style={{ color: "var(--slate)", fontSize: "0.8rem", marginTop: "0.2rem", fontStyle: "italic" }}>
                  {p.altNames.join(" · ")}
                </div>
              )}

              {p.modernEquivalent && (
                <div style={{ color: "var(--sage)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
                  ◎ Heute: {p.modernEquivalent}
                </div>
              )}

              {p.description && (
                <p style={{ color: "var(--mist)", fontSize: "0.9rem", margin: "0.6rem 0 0" }}>{p.description}</p>
              )}

              {p.events.length > 0 && (
                <div style={{ marginTop: "0.75rem", borderTop: "1px solid var(--border)", paddingTop: "0.6rem" }}>
                  <div style={{ fontFamily: "Cinzel, serif", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--slate)", marginBottom: "0.35rem" }}>
                    Ereignisse hier
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    {p.events.slice(0, 5).map((e) => (
                      <Link key={e.eventId} href={`/events/${e.eventId}`} style={{ color: "var(--gold)", textDecoration: "none", fontSize: "0.85rem" }}>
                        → {e.eventName}
                        <span style={{ color: "var(--slate)", fontSize: "0.72rem", marginLeft: "0.4rem" }}>
                          ({CYCLE_LABEL[e.cycle] ?? e.cycle})
                        </span>
                      </Link>
                    ))}
                    {p.events.length > 5 && (
                      <span style={{ color: "var(--slate)", fontSize: "0.75rem" }}>… und {p.events.length - 5} weitere</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
