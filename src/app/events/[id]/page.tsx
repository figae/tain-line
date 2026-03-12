"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface RelationEntry {
  id: number;
  fromEventId: number;
  toEventId: number;
  relationType: string;
  confidence: string;
  reason: string | null;
}

interface EventDetail {
  id: number;
  name: string;
  description: string | null;
  eventType: string | null;
  parentEventId: number | null;
  characterId: number | null;
  cycle: string;
  approximateEra: string | null;
  source: { title: string; url: string | null; year: number | null } | null;
  characters: { characterId: number; name: string; role: string; notes: string | null }[];
  places: { placeId: number; name: string; type: string }[];
  children: { id: number; name: string; eventType: string | null }[];
  relations: {
    before: RelationEntry[];
    after:  RelationEntry[];
    other:  RelationEntry[];
  };
}

const CYCLE_LABELS: Record<string, string> = {
  mythological: "Mythologisch", ulster: "Ulster",
  fenian: "Fenian", kings: "Könige", other: "Sonstig",
};
const CYCLE_COLOR: Record<string, string> = {
  mythological: "#e87878", ulster: "#78b4e8",
  fenian: "#a0c878", kings: "#e0a84a", other: "#7a8a7a",
};
const CONFIDENCE_STYLE: Record<string, { color: string; label: string }> = {
  certain:     { color: "#a0c878", label: "Sicher" },
  probable:    { color: "#e0a84a", label: "Wahrscheinlich" },
  speculative: { color: "#e87878", label: "Spekulativ" },
};
const EVENT_TYPE_META: Record<string, { icon: string; label: string; color: string }> = {
  birth:          { icon: "✦",  label: "Geburt",         color: "var(--sage)" },
  death:          { icon: "✝",  label: "Tod",            color: "#c87878" },
  meeting:        { icon: "⚯",  label: "Begegnung",      color: "var(--sky)" },
  battle:         { icon: "⚔",  label: "Kampf / Krieg",  color: "var(--rust)" },
  reign:          { icon: "♛",  label: "Herrschaft",     color: "var(--amber)" },
  transformation: { icon: "◈",  label: "Verwandlung",    color: "var(--ocean)" },
  prophecy:       { icon: "◉",  label: "Prophezeiung",   color: "var(--gold)" },
  journey:        { icon: "⇢",  label: "Reise",          color: "var(--moss)" },
  other:          { icon: "◆",  label: "Ereignis",       color: "var(--slate)" },
};
const REL_TYPE_META: Record<string, { arrow: string; label: string }> = {
  before:   { arrow: "←", label: "zeitlich davor" },
  causes:   { arrow: "⇐", label: "verursacht durch" },
  meets:    { arrow: "↤", label: "direkt davor (nahtlos)" },
  contains: { arrow: "⊃", label: "übergeordnetes Ereignis" },
  parallel: { arrow: "∥", label: "gleichzeitig" },
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
  if (!event) return <div style={{ color: "var(--mist)", padding: "2rem" }}>Event nicht gefunden.</div>;

  const typeMeta = EVENT_TYPE_META[event.eventType ?? "other"] ?? EVENT_TYPE_META.other;
  const cycleColor = CYCLE_COLOR[event.cycle] ?? "var(--border)";
  const isLifecycle = event.eventType === "birth" || event.eventType === "death";
  const lifecycleChar = isLifecycle && event.characterId
    ? event.characters.find((c) => c.characterId === event.characterId)
    : null;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <Link href="/events" style={{ color: "var(--slate)", textDecoration: "none", fontSize: "0.85rem", fontFamily: "Cinzel, serif", letterSpacing: "0.1em" }}>
        ← Events
      </Link>

      {/* Header */}
      <div className="celtic-border" style={{ marginTop: "1.5rem", marginBottom: "2rem", padding: "2rem", background: "var(--bark)", borderLeft: `4px solid ${cycleColor}` }}>
        {/* Badges row */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "0.3rem",
            padding: "2px 10px", background: "rgba(0,0,0,0.3)",
            border: `1px solid ${typeMeta.color}`, borderRadius: "2px",
            fontSize: "0.7rem", fontFamily: "Cinzel, serif", letterSpacing: "0.1em",
            color: typeMeta.color, textTransform: "uppercase",
          }}>
            {typeMeta.icon} {typeMeta.label}
          </span>
          <span className={`badge cycle-${event.cycle}`} style={{ fontSize: "0.7rem" }}>
            {CYCLE_LABELS[event.cycle] ?? event.cycle}
          </span>
          {event.parentEventId && (
            <Link href={`/events/${event.parentEventId}`} style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              padding: "2px 10px", background: "rgba(0,0,0,0.2)",
              border: "1px solid var(--border)", borderRadius: "2px",
              fontSize: "0.7rem", fontFamily: "Cinzel, serif", color: "var(--slate)",
              textDecoration: "none",
            }}>
              ↑ Teilgeschehen von #{event.parentEventId}
            </Link>
          )}
        </div>

        <h1 style={{ fontSize: "1.6rem", margin: "0 0 0.5rem" }}>{event.name}</h1>

        {/* Lifecycle: prominent character link */}
        {lifecycleChar && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0.8rem", background: "rgba(0,0,0,0.25)", border: "1px solid var(--border)", borderRadius: "2px", marginBottom: "0.75rem" }}>
            <span style={{ color: "var(--slate)", fontSize: "0.8rem" }}>
              {event.eventType === "birth" ? "✦ Geburt von" : "✝ Tod von"}
            </span>
            <Link href={`/characters/${lifecycleChar.characterId}`} style={{ color: "var(--amber)", textDecoration: "none", fontFamily: "Cinzel, serif", fontSize: "0.95rem" }}>
              {lifecycleChar.name}
            </Link>
          </div>
        )}

        {event.approximateEra && (
          <div style={{ color: "var(--slate)", fontSize: "0.9rem", fontStyle: "italic", marginBottom: "0.5rem" }}>
            {event.approximateEra}
          </div>
        )}

        {event.description && (
          <p style={{ color: "var(--mist)", marginTop: "0.75rem", marginBottom: 0 }}>
            {event.description}
          </p>
        )}

        {event.source && (
          <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--slate)", fontStyle: "italic" }}>
            Quelle:{" "}
            {event.source.url
              ? <a href={event.source.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>{event.source.title}</a>
              : event.source.title}
            {event.source.year && ` (${event.source.year})`}
          </div>
        )}
      </div>

      {/* Sub-events (children) */}
      {event.children.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--amber)" }}>
            ⊂ Teilgeschehen ({event.children.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {event.children.map((child) => {
              const cMeta = EVENT_TYPE_META[child.eventType ?? "other"] ?? EVENT_TYPE_META.other;
              return (
                <Link key={child.id} href={`/events/${child.id}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "0.6rem 1rem", borderLeft: `2px solid ${cMeta.color}`, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ color: cMeta.color, fontSize: "0.85rem", flexShrink: 0 }}>{cMeta.icon}</span>
                    <span style={{ color: "var(--cream)", fontSize: "0.9rem" }}>{child.name}</span>
                    <span style={{ color: "var(--slate)", fontSize: "0.7rem", marginLeft: "auto", flexShrink: 0 }}>{cMeta.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Characters */}
        {event.characters.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--amber)" }}>Beteiligte Charaktere</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {event.characters.map((c) => (
                <Link key={c.characterId} href={`/characters/${c.characterId}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--cream)" }}>{c.name}</span>
                      <span style={{ color: "var(--slate)", fontSize: "0.8rem", fontStyle: "italic", textTransform: "capitalize" }}>{c.role}</span>
                    </div>
                    {c.notes && <div style={{ color: "var(--mist)", fontSize: "0.85rem", marginTop: "0.25rem" }}>{c.notes}</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Places */}
        {event.places.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--amber)" }}>Orte</h2>
            {event.places.map((p) => (
              <div key={p.placeId} className="card" style={{ padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--cream)" }}>📍 {p.name}</span>
                <span style={{ color: "var(--slate)", fontSize: "0.8rem", marginLeft: "0.5rem", textTransform: "capitalize" }}>{p.type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Before */}
        {event.relations.before.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--amber)" }}>Geht voraus</h2>
            {event.relations.before.map((rel) => {
              const conf = CONFIDENCE_STYLE[rel.confidence] ?? CONFIDENCE_STYLE.probable;
              const rMeta = REL_TYPE_META[rel.relationType] ?? REL_TYPE_META.before;
              const linkedId = rel.fromEventId === event.id ? rel.toEventId : rel.fromEventId;
              return (
                <Link key={rel.id} href={`/events/${linkedId}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "0.75rem 1rem", marginBottom: "0.5rem", borderLeft: `2px solid ${conf.color}` }}>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <span style={{ color: conf.color, fontSize: "0.85rem", flexShrink: 0 }}>{rMeta.arrow}</span>
                      <span style={{ color: "var(--cream)", fontSize: "0.9rem", flex: 1 }}>Event #{linkedId}</span>
                      <span style={{ color: "var(--slate)", fontSize: "0.7rem" }}>{rMeta.label}</span>
                    </div>
                    {rel.reason && <div style={{ color: "var(--slate)", fontSize: "0.8rem", marginTop: "0.25rem", fontStyle: "italic" }}>{rel.reason}</div>}
                    <div style={{ color: conf.color, fontSize: "0.7rem", marginTop: "0.2rem" }}>{conf.label}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* After */}
        {event.relations.after.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--amber)" }}>Folgt daraus</h2>
            {event.relations.after.map((rel) => {
              const conf = CONFIDENCE_STYLE[rel.confidence] ?? CONFIDENCE_STYLE.probable;
              const rMeta = REL_TYPE_META[rel.relationType] ?? REL_TYPE_META.before;
              const linkedId = rel.fromEventId === event.id ? rel.toEventId : rel.fromEventId;
              return (
                <Link key={rel.id} href={`/events/${linkedId}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "0.75rem 1rem", marginBottom: "0.5rem", borderLeft: `2px solid ${conf.color}` }}>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <span style={{ color: conf.color, fontSize: "0.85rem", flexShrink: 0 }}>→</span>
                      <span style={{ color: "var(--cream)", fontSize: "0.9rem", flex: 1 }}>Event #{linkedId}</span>
                      <span style={{ color: "var(--slate)", fontSize: "0.7rem" }}>{rMeta.label}</span>
                    </div>
                    {rel.reason && <div style={{ color: "var(--slate)", fontSize: "0.8rem", marginTop: "0.25rem", fontStyle: "italic" }}>{rel.reason}</div>}
                    <div style={{ color: conf.color, fontSize: "0.7rem", marginTop: "0.2rem" }}>{conf.label}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Structural (contains / parallel) */}
        {event.relations.other.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--amber)" }}>Strukturelle Beziehungen</h2>
            {event.relations.other.map((rel) => {
              const rMeta = REL_TYPE_META[rel.relationType] ?? REL_TYPE_META.before;
              const linkedId = rel.fromEventId === event.id ? rel.toEventId : rel.fromEventId;
              return (
                <Link key={rel.id} href={`/events/${linkedId}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "0.75rem 1rem", marginBottom: "0.5rem", borderLeft: "2px solid var(--border)" }}>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                      <span style={{ color: "var(--slate)", fontSize: "0.85rem", flexShrink: 0 }}>{rMeta.arrow}</span>
                      <span style={{ color: "var(--cream)", fontSize: "0.9rem", flex: 1 }}>Event #{linkedId}</span>
                      <span style={{ color: "var(--slate)", fontSize: "0.7rem" }}>{rMeta.label}</span>
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
