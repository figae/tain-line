"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TimelineEvent {
  id: number;
  name: string;
  description: string | null;
  cycle: string;
  eventType: string | null;
  parentEventId: number | null;
  approximateEra: string | null;
  position: number;
  characters: { characterId: number; name: string; role: string }[];
  relations: {
    eventId: number;
    relationType: string;
    direction: "before" | "after";
    derived?: boolean;
    reason?: string | null;
  }[];
}

const CYCLE_COLOR: Record<string, string> = {
  mythological: "#e87878",
  ulster:       "#78b4e8",
  fenian:       "#a0c878",
  kings:        "#e0a84a",
  other:        "#7a8a7a",
};

const CYCLE_LABEL: Record<string, string> = {
  mythological: "Mythologisch",
  ulster:       "Ulster",
  fenian:       "Fenian",
  kings:        "Könige",
  other:        "Sonstig",
};

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

const REL_TYPE_LABEL: Record<string, string> = {
  before:   "vor",
  causes:   "verursacht",
  contains: "enthält",
  parallel: "parallel",
  meets:    "gefolgt von",
};

// ── Zoom levels: from coarse era view down to full lifecycle detail ─────
const ZOOM_LEVELS = [
  { key: 1, label: "Ären",       hint: "Nur die großen Wendepunkte: Schlachten, Herrschaften, Landnahmen" },
  { key: 2, label: "Ereignisse", hint: "Alle Hauptereignisse ohne Teilereignisse" },
  { key: 3, label: "Details",    hint: "Alle Ereignisse inklusive Teilereignissen" },
  { key: 4, label: "Leben",      hint: "Zusätzlich Geburten und Tode" },
] as const;

const MAJOR_TYPES = new Set(["battle", "reign", "journey"]);

function visibleAtZoom(e: TimelineEvent, zoom: number): boolean {
  const isLifecycle = e.eventType === "birth" || e.eventType === "death";
  switch (zoom) {
    case 1: return !isLifecycle && e.parentEventId === null && MAJOR_TYPES.has(e.eventType ?? "");
    case 2: return !isLifecycle && e.parentEventId === null;
    case 3: return !isLifecycle;
    default: return true;
  }
}

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number>(2);
  const [focusChar, setFocusChar] = useState<number | null>(null);
  const [charSearch, setCharSearch] = useState("");
  const [constraintStats, setConstraintStats] = useState<{ explicit: number; derived: number } | null>(null);

  useEffect(() => {
    fetch("/api/timeline")
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.timeline);
        setConstraintStats({
          explicit: d.explicitConstraints ?? 0,
          derived: d.derivedConstraints ?? 0,
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
        <div style={{ color: "var(--slate)", marginTop: "1rem", fontFamily: "Cinzel, serif", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
          BERECHNE TIMELINE …
        </div>
      </div>
    );
  }

  // All characters appearing in the timeline (for the focus picker)
  const charCounts = new Map<number, { name: string; count: number }>();
  for (const e of events) {
    for (const c of e.characters) {
      const entry = charCounts.get(c.characterId) ?? { name: c.name, count: 0 };
      entry.count += 1;
      charCounts.set(c.characterId, entry);
    }
  }
  const focusCharName = focusChar !== null ? charCounts.get(focusChar)?.name : null;
  const searchResults = charSearch.length > 0
    ? Array.from(charCounts.entries())
        .filter(([, v]) => v.name.toLowerCase().includes(charSearch.toLowerCase()))
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 8)
    : [];

  // Character focus overrides zoom: show that character's full story,
  // including birth and death, regardless of the current zoom level.
  const visibleEvents = focusChar !== null
    ? events.filter((e) => e.characters.some((c) => c.characterId === focusChar))
    : events.filter((e) => visibleAtZoom(e, zoom));

  const cycleGroups = visibleEvents.reduce<Record<string, TimelineEvent[]>>((acc, e) => {
    const key = e.cycle ?? "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const cycleOrder = ["mythological", "ulster", "fenian", "kings", "other"];

  const selectedEvent = selected !== null ? events.find((e) => e.id === selected) : null;
  const relatedIds = new Set(selectedEvent?.relations.map((r) => r.eventId) ?? []);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <div
            style={{
              padding: "6px 16px",
              background: "rgba(200,145,58,0.15)",
              color: "var(--amber)",
              border: "1px solid rgba(200,145,58,0.5)",
              borderRadius: "2px",
              fontFamily: "Cinzel, serif",
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Liste
          </div>
          <Link
            href="/timeline/graph"
            style={{
              padding: "6px 16px",
              background: "var(--peat)",
              color: "var(--slate)",
              border: "1px solid var(--border)",
              borderRadius: "2px",
              textDecoration: "none",
              fontFamily: "Cinzel, serif",
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Graph
          </Link>
        </div>

        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Timeline</h1>
        <p style={{ color: "var(--mist)", margin: "0 0 0.35rem" }}>
          Topologisch geordnete Ereignisse — abgeleitet aus logischen Abhängigkeiten zwischen den Mythen.
          {" "}
          <span style={{ color: "var(--slate)", fontSize: "0.9rem" }}>
            ({visibleEvents.length} von {events.length} Events)
          </span>
        </p>
        {constraintStats && (
          <p style={{ color: "var(--slate)", fontSize: "0.8rem", margin: "0 0 1rem" }}>
            {constraintStats.explicit} Relationen aus den Quellen ·{" "}
            <span style={{ color: "var(--sage)" }}>
              ⚙ {constraintStats.derived} automatisch abgeleitet
            </span>{" "}
            (Geburt&nbsp;→ Beteiligung&nbsp;→ Tod, Eltern vor Kindern)
          </p>
        )}

        {/* Controls */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Zoom: coarse → detailed */}
          <div className="zoom-control" role="group" aria-label="Detailgrad">
            {ZOOM_LEVELS.map((z) => (
              <button
                key={z.key}
                title={z.hint}
                onClick={() => { setZoom(z.key); setFocusChar(null); }}
                className={`zoom-step${zoom === z.key && focusChar === null ? " zoom-step-active" : ""}`}
              >
                {z.label}
              </button>
            ))}
          </div>

          {/* Character focus */}
          <div style={{ position: "relative" }}>
            {focusChar !== null ? (
              <button
                onClick={() => setFocusChar(null)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "5px 12px",
                  background: "rgba(200,145,58,0.2)", color: "var(--amber)",
                  border: "1px solid var(--amber)", borderRadius: "2px",
                  cursor: "pointer", fontFamily: "Cinzel, serif",
                  fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase",
                }}
              >
                ◉ Fokus: {focusCharName} ✕
              </button>
            ) : (
              <input
                type="text"
                placeholder="◉ Charakter fokussieren …"
                value={charSearch}
                onChange={(e) => setCharSearch(e.target.value)}
                style={{
                  background: "var(--peat)", border: "1px solid var(--border)",
                  borderRadius: 2, color: "var(--mist)", fontSize: "0.85rem",
                  padding: "5px 12px", width: 220,
                }}
              />
            )}
            {searchResults.length > 0 && focusChar === null && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: "var(--stone)", border: "1px solid var(--border-bright)",
                borderRadius: 2, zIndex: 100, maxHeight: 240, overflowY: "auto",
              }}>
                {searchResults.map(([id, v]) => (
                  <button
                    key={id}
                    onClick={() => { setFocusChar(id); setCharSearch(""); }}
                    style={{
                      display: "flex", justifyContent: "space-between", width: "100%",
                      padding: "6px 10px", cursor: "pointer", background: "none",
                      border: "none", color: "var(--mist)", fontSize: "0.85rem", textAlign: "left",
                    }}
                  >
                    <span>{v.name}</span>
                    <span style={{ color: "var(--slate)", fontSize: "0.75rem" }}>{v.count} Events</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cycle legend */}
          {cycleOrder.filter((c) => cycleGroups[c]?.length > 0).map((c) => (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: CYCLE_COLOR[c] }} />
              <span style={{ fontFamily: "Cinzel, serif", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--mist)", textTransform: "uppercase" }}>
                {CYCLE_LABEL[c]} ({cycleGroups[c].length})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Event type legend */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {Object.entries(EVENT_TYPE_META)
          .filter(([key]) => visibleEvents.some((e) => (e.eventType ?? "other") === key))
          .map(([key, meta]) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "2px 8px",
                background: "var(--peat)",
                border: `1px solid ${meta.color}44`,
                borderRadius: "2px",
                fontSize: "0.7rem",
                color: meta.color,
              }}
            >
              <span>{meta.icon}</span>
              <span style={{ fontFamily: "Cinzel, serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {meta.label}
              </span>
            </div>
          ))}
      </div>

      {/* The timeline */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 0,
            bottom: 0,
            width: 2,
            background: "linear-gradient(to bottom, var(--gold), var(--moss), transparent)",
          }}
        />

        <div style={{ paddingLeft: "3rem" }}>
          {cycleOrder.filter((c) => cycleGroups[c]?.length > 0).map((cycle) => (
            <div key={cycle} style={{ marginBottom: "2.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                  marginLeft: "-2.5rem",
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: CYCLE_COLOR[cycle],
                    border: "2px solid var(--stone)",
                    flexShrink: 0,
                    zIndex: 1,
                  }}
                />
                <h2
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.85rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: CYCLE_COLOR[cycle],
                    margin: 0,
                  }}
                >
                  {CYCLE_LABEL[cycle]}
                </h2>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${CYCLE_COLOR[cycle]}44, transparent)` }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {cycleGroups[cycle].map((e) => {
                  const isSelected = selected === e.id;
                  const isRelated = selected !== null && relatedIds.has(e.id);
                  const dimmed = selected !== null && !isSelected && !isRelated;
                  const typeMeta = EVENT_TYPE_META[e.eventType ?? "other"] ?? EVENT_TYPE_META.other;
                  const isChild = e.parentEventId !== null;

                  return (
                    <div
                      key={e.id}
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "flex-start",
                        paddingLeft: isChild ? "1.5rem" : 0,
                      }}
                    >
                      <div
                        style={{
                          flexShrink: 0,
                          marginLeft: isChild ? "-3.6rem" : "-2.4rem",
                          marginTop: "1rem",
                          width: isChild ? 6 : 8,
                          height: isChild ? 6 : 8,
                          borderRadius: "50%",
                          background: isSelected ? "var(--amber)" : CYCLE_COLOR[cycle] + "88",
                          border: `1px solid ${CYCLE_COLOR[cycle]}`,
                          zIndex: 1,
                          transition: "all 0.2s",
                        }}
                      />

                      <div
                        onClick={() => setSelected(isSelected ? null : e.id)}
                        className="card"
                        style={{
                          flex: 1,
                          padding: "0.75rem 1rem",
                          cursor: "pointer",
                          borderLeft: `3px solid ${isSelected ? "var(--border-bright)" : isRelated ? "var(--amber)" : CYCLE_COLOR[cycle] + "88"}`,
                          background: isSelected ? "var(--peat)" : "var(--bark)",
                          opacity: dimmed ? 0.4 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            {/* Event type icon */}
                            <span
                              title={typeMeta.label}
                              style={{
                                color: typeMeta.color,
                                fontSize: "0.85rem",
                                flexShrink: 0,
                              }}
                            >
                              {typeMeta.icon}
                            </span>

                            <span
                              style={{
                                fontFamily: "Cinzel, serif",
                                fontSize: "0.7rem",
                                color: "var(--slate)",
                                letterSpacing: "0.1em",
                              }}
                            >
                              #{e.position + 1}
                            </span>

                            <Link
                              href={`/events/${e.id}`}
                              onClick={(ev) => ev.stopPropagation()}
                              style={{
                                color: "var(--cream)",
                                textDecoration: "none",
                                fontFamily: "Cinzel, serif",
                                fontSize: "0.9rem",
                              }}
                            >
                              {e.name}
                            </Link>
                          </div>

                          {isRelated && (
                            <span
                              style={{
                                flexShrink: 0,
                                fontSize: "0.65rem",
                                fontFamily: "Cinzel, serif",
                                letterSpacing: "0.1em",
                                color: "var(--amber)",
                              }}
                            >
                              {(() => {
                                const rel = selectedEvent?.relations.find((r) => r.eventId === e.id);
                                if (!rel) return "verknüpft";
                                const label = REL_TYPE_LABEL[rel.relationType] ?? rel.relationType;
                                const gear = rel.derived ? "⚙ " : "";
                                return rel.direction === "before"
                                  ? `← ${gear}${label}`
                                  : `${gear}${label} →`;
                              })()}
                            </span>
                          )}
                        </div>

                        {e.approximateEra && (
                          <div style={{ color: "var(--slate)", fontSize: "0.75rem", fontStyle: "italic", marginTop: "0.2rem", paddingLeft: "1.5rem" }}>
                            {e.approximateEra}
                          </div>
                        )}

                        {isSelected && (
                          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                            {/* Type badge */}
                            <div style={{ marginBottom: "0.5rem" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  padding: "2px 8px",
                                  background: `${typeMeta.color}22`,
                                  border: `1px solid ${typeMeta.color}66`,
                                  borderRadius: "2px",
                                  fontSize: "0.7rem",
                                  color: typeMeta.color,
                                  fontFamily: "Cinzel, serif",
                                  letterSpacing: "0.08em",
                                }}
                              >
                                {typeMeta.icon} {typeMeta.label}
                              </span>
                            </div>

                            {e.description && (
                              <p style={{ color: "var(--mist)", fontSize: "0.9rem", margin: "0 0 0.75rem" }}>
                                {e.description}
                              </p>
                            )}

                            {e.characters.length > 0 && (
                              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                                {e.characters.map((c) => (
                                  <Link
                                    key={c.characterId}
                                    href={`/characters/${c.characterId}`}
                                    onClick={(ev) => ev.stopPropagation()}
                                    style={{
                                      textDecoration: "none",
                                      padding: "2px 8px",
                                      background: "var(--peat)",
                                      border: "1px solid var(--border)",
                                      borderRadius: "2px",
                                      color: "var(--mist)",
                                      fontSize: "0.8rem",
                                    }}
                                  >
                                    {c.name}
                                    <span style={{ color: "var(--slate)", marginLeft: "0.3rem", fontSize: "0.7rem" }}>
                                      ({c.role})
                                    </span>
                                  </Link>
                                ))}
                              </div>
                            )}

                            {/* Show related events */}
                            {e.relations.length > 0 && (
                              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                                {e.relations.slice(0, 6).map((r, ri) => {
                                  const relEvent = events.find((ev) => ev.id === r.eventId);
                                  if (!relEvent) return null;
                                  return (
                                    <span
                                      key={`${r.eventId}-${ri}`}
                                      title={r.derived ? `Automatisch abgeleitet: ${r.reason ?? ""}` : r.reason ?? undefined}
                                      style={{
                                        fontSize: "0.7rem",
                                        color: r.derived ? "var(--sage)" : "var(--slate)",
                                        fontStyle: "italic",
                                      }}
                                    >
                                      {r.direction === "before" ? "← " : "→ "}
                                      {r.derived ? "⚙ " : ""}
                                      {REL_TYPE_LABEL[r.relationType] ?? r.relationType}: {relEvent.name}
                                    </span>
                                  );
                                })}
                                {e.relations.some((r) => r.derived) && (
                                  <span style={{ fontSize: "0.65rem", color: "var(--sage)", fontFamily: "Cinzel, serif", letterSpacing: "0.05em" }}>
                                    ⚙ = automatisch abgeleitet
                                  </span>
                                )}
                              </div>
                            )}

                            <Link
                              href={`/events/${e.id}`}
                              onClick={(ev) => ev.stopPropagation()}
                              style={{
                                color: "var(--gold)",
                                fontSize: "0.8rem",
                                fontFamily: "Cinzel, serif",
                                letterSpacing: "0.1em",
                                textDecoration: "none",
                              }}
                            >
                              Details →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
