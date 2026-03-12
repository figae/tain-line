"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

interface Event {
  id: number;
  name: string;
  description: string | null;
  cycle: string;
  approximateEra: string | null;
}

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

  useEffect(() => {
    setLoading(true);
    const url = cycle ? `/api/events?cycle=${cycle}` : "/api/events";
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setEvents(d); setLoading(false); });
  }, [cycle]);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Events</h1>
        <p style={{ color: "var(--mist)", margin: "0 0 1.5rem" }}>
          Mythen, Schlachten und Ereignisse — die Bausteine der Timeline
        </p>

        {/* Cycle filter */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="shimmer" style={{ height: 90 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {events.map((e) => (
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
                  <h2
                    style={{
                      fontFamily: "Cinzel, serif",
                      fontSize: "1rem",
                      color: "var(--cream)",
                      margin: "0 0 0.4rem",
                    }}
                  >
                    {e.name}
                  </h2>
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
                <span className={`badge cycle-${e.cycle}`} style={{ flexShrink: 0, fontSize: "0.65rem" }}>
                  {CYCLES.find((c) => c.key === e.cycle)?.label ?? e.cycle}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && events.length === 0 && (
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
