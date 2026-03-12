"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

interface Event {
  id: number;
  name: string;
  description: string | null;
  eventType: string | null;
  cycle: string;
  approximateEra: string | null;
}

const EVENT_TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  birth:          { icon: "✦", label: "Geburt",       color: "var(--sage)" },
  death:          { icon: "✝", label: "Tod",          color: "#c87878" },
  meeting:        { icon: "☍", label: "Begegnung",    color: "#78b4e8" },
  battle:         { icon: "⚔", label: "Schlacht",     color: "#e87878" },
  reign:          { icon: "♛", label: "Herrschaft",   color: "var(--gold)" },
  transformation: { icon: "⟳", label: "Verwandlung",  color: "#a87ed8" },
  prophecy:       { icon: "◎", label: "Prophezeiung", color: "#e8c878" },
  journey:        { icon: "➢", label: "Reise",        color: "var(--moss)" },
  other:          { icon: "◆", label: "Ereignis",     color: "var(--slate)" },
};

const CYCLES = [
  { key: "", label: "Alle Zyklen" },
  { key: "mythological", label: "Mythologisch", color: "#e87878" },
  { key: "ulster",       label: "Ulster",        color: "#78b4e8" },
  { key: "fenian",       label: "Fenian",         color: "#a0c878" },
  { key: "kings",        label: "Könige",         color: "#e0a84a" },
  { key: "other",        label: "Sonstig",        color: "#7a8a7a" },
];

function EventsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cycle = searchParams.get("cycle") ?? "";
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    const url = cycle ? `/api/events?cycle=${cycle}` : "/api/events";
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setEvents(d); setLoading(false); });
  }, [cycle]);

  const filtered = typeFilter
    ? events.filter((e) => (e.eventType ?? "other") === typeFilter)
    : events;

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Events</h1>
        <p style={{ color: "var(--mist)", margin: "0 0 1.5rem" }}>
          Mythen, Schlachten und Ereignisse — die Bausteine der Timeline
        </p>

        {/* Cycle filter */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {CYCLES.map((c) => (
            <button
              key={c.key}
              onClick={() => router.push(c.key ? `/events?cycle=${c.key}` : "/events")}
              style={{
                padding: "5px 14px",
                background: cycle === c.key ? (c.color ?? "var(--gold)") : "var(--peat)",
                color: cycle === c.key ? "var(--stone)" : "var(--mist)",
                border: `1px solid ${c.color ?? "var(--border)"}`,
                borderRadius: "2px",
                cursor: "pointer",
                fontFamily: "Cinzel, serif",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Event type filter */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setTypeFilter("")}
            style={{
              padding: "4px 12px",
              background: typeFilter === "" ? "var(--gold)" : "var(--peat)",
              color: typeFilter === "" ? "var(--stone)" : "var(--slate)",
              border: "1px solid var(--border)",
              borderRadius: "2px",
              cursor: "pointer",
              fontFamily: "Cinzel, serif",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Alle Typen
          </button>
          {Object.entries(EVENT_TYPE_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(typeFilter === key ? "" : key)}
              style={{
                padding: "4px 10px",
                background: typeFilter === key ? `${meta.color}33` : "var(--peat)",
                color: typeFilter === key ? meta.color : "var(--slate)",
                border: `1px solid ${typeFilter === key ? meta.color : "var(--border)"}`,
                borderRadius: "2px",
                cursor: "pointer",
                fontSize: "0.65rem",
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.08em",
              }}
            >
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 90 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((e) => {
            const typeMeta = EVENT_TYPE_META[e.eventType ?? "other"] ?? EVENT_TYPE_META.other;
            return (
            <Link key={e.id} href={`/events/${e.id}`} style={{ textDecoration: "none" }}>
              <div
                className="card"
                style={{
                  padding: "1.25rem",
                  borderLeft: `3px solid ${
                    CYCLES.find((c) => c.key === e.cycle)?.color ?? "var(--border)"
                  }`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                    <span style={{ color: typeMeta.color, fontSize: "0.85rem" }} title={typeMeta.label}>
                      {typeMeta.icon}
                    </span>
                    <h2
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "1rem",
                        color: "var(--cream)",
                        margin: 0,
                      }}
                    >
                      {e.name}
                    </h2>
                  </div>
                  {e.description && (
                    <p
                      style={{
                        color: "var(--mist)",
                        fontSize: "0.9rem",
                        margin: 0,
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {e.description}
                    </p>
                  )}
                  {e.approximateEra && (
                    <div style={{ color: "var(--slate)", fontSize: "0.8rem", marginTop: "0.4rem", fontStyle: "italic" }}>
                      {e.approximateEra}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end", flexShrink: 0 }}>
                  <span className={`badge cycle-${e.cycle}`} style={{ fontSize: "0.65rem" }}>
                    {CYCLES.find((c) => c.key === e.cycle)?.label ?? e.cycle}
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: typeMeta.color,
                      fontFamily: "Cinzel, serif",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {typeMeta.label}
                  </span>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--slate)", padding: "4rem 0" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>᚜</div>
          Keine Events gefunden.
        </div>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="spinner" style={{ margin: "4rem auto" }} />}>
      <EventsContent />
    </Suspense>
  );
}
