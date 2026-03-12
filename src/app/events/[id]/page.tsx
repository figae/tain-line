"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface EventDetail {
  id: number;
  name: string;
  description: string | null;
  cycle: string;
  approximateEra: string | null;
  source: { title: string; url: string | null; year: number | null } | null;
  characters: { characterId: number; name: string; role: string; notes: string | null }[];
  places: { placeId: number; name: string; type: string }[];
  mustBeBefore: { id: number; beforeEventId: number; beforeEventName: string; reason: string; confidence: string }[];
  mustBeAfter:  { id: number; afterEventId: number;  afterEventName: string;  reason: string; confidence: string }[];
}

const CYCLE_LABELS: Record<string, string> = {
  mythological: "Mythologisch",
  ulster: "Ulster",
  fenian: "Fenian",
  kings: "Könige",
  other: "Sonstig",
};

const CONFIDENCE_STYLE: Record<string, { color: string; label: string }> = {
  certain:     { color: "#a0c878", label: "Sicher" },
  probable:    { color: "#e0a84a", label: "Wahrscheinlich" },
  speculative: { color: "#e87878", label: "Spekulativ" },
};

export default function EventDetail() {
  const params = useParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setEvent(d); setLoading(false); });
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
      </div>
    );
  }

  if (!event) {
    return <div style={{ color: "var(--mist)", padding: "2rem" }}>Event nicht gefunden.</div>;
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <Link
        href="/events"
        style={{ color: "var(--slate)", textDecoration: "none", fontSize: "0.85rem", fontFamily: "Cinzel, serif", letterSpacing: "0.1em" }}
      >
        ← Events
      </Link>

      {/* Header */}
      <div
        className="celtic-border"
        style={{
          marginTop: "1.5rem",
          marginBottom: "2rem",
          padding: "2rem",
          background: "var(--bark)",
          borderLeft: `4px solid ${
            event.cycle === "mythological" ? "#e87878"
            : event.cycle === "ulster" ? "#78b4e8"
            : event.cycle === "fenian" ? "#a0c878"
            : "var(--gold)"
          }`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <h1 style={{ fontSize: "1.6rem", margin: 0 }}>{event.name}</h1>
          <span className={`badge cycle-${event.cycle}`} style={{ flexShrink: 0 }}>
            {CYCLE_LABELS[event.cycle] ?? event.cycle}
          </span>
        </div>

        {event.approximateEra && (
          <div style={{ color: "var(--slate)", fontSize: "0.9rem", marginTop: "0.5rem", fontStyle: "italic" }}>
            {event.approximateEra}
          </div>
        )}

        {event.description && (
          <p style={{ color: "var(--mist)", marginTop: "1rem", marginBottom: 0 }}>
            {event.description}
          </p>
        )}

        {event.source && (
          <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--slate)", fontStyle: "italic" }}>
            Quelle:{" "}
            {event.source.url ? (
              <a href={event.source.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>
                {event.source.title}
              </a>
            ) : event.source.title}
            {event.source.year && ` (${event.source.year})`}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Characters */}
        {event.characters.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--amber)" }}>
              Beteiligte Charaktere
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {event.characters.map((c) => (
                <Link key={c.characterId} href={`/characters/${c.characterId}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--cream)" }}>{c.name}</span>
                      <span style={{ color: "var(--slate)", fontSize: "0.8rem", fontStyle: "italic", textTransform: "capitalize" }}>
                        {c.role}
                      </span>
                    </div>
                    {c.notes && (
                      <div style={{ color: "var(--mist)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                        {c.notes}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Places */}
        {event.places.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--amber)" }}>
              Orte
            </h2>
            {event.places.map((p) => (
              <div key={p.placeId} className="card" style={{ padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--cream)" }}>📍 {p.name}</span>
                <span style={{ color: "var(--slate)", fontSize: "0.8rem", marginLeft: "0.5rem", textTransform: "capitalize" }}>
                  {p.type}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Timeline: must come before */}
        {event.mustBeBefore.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--amber)" }}>
              Muss vorher kommen
            </h2>
            {event.mustBeBefore.map((d) => {
              const conf = CONFIDENCE_STYLE[d.confidence] ?? CONFIDENCE_STYLE.probable;
              return (
                <Link key={d.id} href={`/events/${d.beforeEventId}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "0.75rem 1rem", marginBottom: "0.5rem", borderLeft: `2px solid ${conf.color}` }}>
                    <div style={{ color: "var(--cream)", fontSize: "0.9rem" }}>← {d.beforeEventName}</div>
                    <div style={{ color: "var(--slate)", fontSize: "0.8rem", marginTop: "0.25rem", fontStyle: "italic" }}>
                      {d.reason}
                    </div>
                    <div style={{ color: conf.color, fontSize: "0.7rem", marginTop: "0.2rem" }}>
                      {conf.label}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Timeline: must come after */}
        {event.mustBeAfter.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--amber)" }}>
              Muss nachher kommen
            </h2>
            {event.mustBeAfter.map((d) => {
              const conf = CONFIDENCE_STYLE[d.confidence] ?? CONFIDENCE_STYLE.probable;
              return (
                <Link key={d.id} href={`/events/${d.afterEventId}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "0.75rem 1rem", marginBottom: "0.5rem", borderLeft: `2px solid ${conf.color}` }}>
                    <div style={{ color: "var(--cream)", fontSize: "0.9rem" }}>→ {d.afterEventName}</div>
                    <div style={{ color: "var(--slate)", fontSize: "0.8rem", marginTop: "0.25rem", fontStyle: "italic" }}>
                      {d.reason}
                    </div>
                    <div style={{ color: conf.color, fontSize: "0.7rem", marginTop: "0.2rem" }}>
                      {conf.label}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
