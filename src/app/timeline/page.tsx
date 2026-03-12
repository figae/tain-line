"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TimelineEvent {
  id: number;
  name: string;
  description: string | null;
  cycle: string;
  approximateEra: string | null;
  position: number;
  characters: { characterId: number; name: string; role: string }[];
  dependencies: { before: number[]; after: number[] };
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

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/timeline")
      .then((r) => r.json())
      .then((d) => { setEvents(d.timeline); setLoading(false); });
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

  const cycleGroups = events.reduce<Record<string, TimelineEvent[]>>((acc, e) => {
    const key = e.cycle ?? "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const cycleOrder = ["mythological", "ulster", "fenian", "kings", "other"];

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>Timeline</h1>
        <p style={{ color: "var(--mist)", margin: 0 }}>
          Topologisch geordnete Ereignisse — abgeleitet aus logischen Abhängigkeiten zwischen den Mythen.
          {" "}
          <span style={{ color: "var(--slate)", fontSize: "0.9rem" }}>
            ({events.length} Events)
          </span>
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {cycleOrder.filter((c) => cycleGroups[c]?.length > 0).map((c) => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: CYCLE_COLOR[c] }} />
            <span style={{ fontFamily: "Cinzel, serif", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--mist)", textTransform: "uppercase" }}>
              {CYCLE_LABEL[c]} ({cycleGroups[c].length})
            </span>
          </div>
        ))}
      </div>

      {/* The timeline */}
      <div style={{ position: "relative" }}>
        {/* Vertical line */}
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
              {/* Cycle heading */}
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

              {/* Events in this cycle */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {cycleGroups[cycle].map((e, idx) => {
                  const isSelected = selected === e.id;
                  const isRelated =
                    selected !== null &&
                    (events.find((ev) => ev.id === selected)?.dependencies.before.includes(e.id) ||
                     events.find((ev) => ev.id === selected)?.dependencies.after.includes(e.id));

                  return (
                    <div
                      key={e.id}
                      style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}
                    >
                      {/* Node dot */}
                      <div
                        style={{
                          flexShrink: 0,
                          marginLeft: "-2.4rem",
                          marginTop: "1rem",
                          width: 8,
                          height: 8,
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
                          padding: "1rem",
                          cursor: "pointer",
                          borderLeft: `3px solid ${CYCLE_COLOR[cycle]}`,
                          borderColor: isSelected
                            ? "var(--border-bright)"
                            : isRelated
                            ? `var(--border-bright)`
                            : "var(--border)",
                          background: isSelected ? "var(--peat)" : "var(--bark)",
                          opacity: selected !== null && !isSelected && !isRelated ? 0.5 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                          <div>
                            <span
                              style={{
                                fontFamily: "Cinzel, serif",
                                fontSize: "0.75rem",
                                color: "var(--slate)",
                                letterSpacing: "0.1em",
                                marginRight: "0.75rem",
                              }}
                            >
                              #{e.position + 1}
                            </span>
                            <Link
                              href={`/events/${e.id}`}
                              onClick={(ev) => ev.stopPropagation()}
                              style={{ color: "var(--cream)", textDecoration: "none", fontFamily: "Cinzel, serif", fontSize: "0.95rem" }}
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
                              verknüpft
                            </span>
                          )}
                        </div>

                        {e.approximateEra && (
                          <div style={{ color: "var(--slate)", fontSize: "0.8rem", fontStyle: "italic", marginTop: "0.25rem", marginLeft: "2rem" }}>
                            {e.approximateEra}
                          </div>
                        )}

                        {isSelected && (
                          <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                            {e.description && (
                              <p style={{ color: "var(--mist)", fontSize: "0.9rem", margin: "0 0 0.75rem" }}>
                                {e.description}
                              </p>
                            )}
                            {e.characters.length > 0 && (
                              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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
                            <div style={{ marginTop: "0.5rem" }}>
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
