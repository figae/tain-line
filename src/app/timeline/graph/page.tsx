"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { EventNode, type EventNodeData } from "@/components/EventNode";

interface TimelineEvent {
  id: number;
  name: string;
  eventType: string | null;
  cycle: string;
  parentEventId: number | null;
  position: number;
  characters: { characterId: number; name: string; role: string }[];
  relations: { eventId: number; relationType: string; direction: "before" | "after" }[];
}

interface Relation {
  fromEventId: number;
  toEventId: number;
  relationType: string;
  confidence: string;
}

interface Character {
  id: number;
  name: string;
}

const CYCLE_Y: Record<string, number> = {
  mythological: 0,
  ulster:       260,
  fenian:       520,
  kings:        780,
  other:        1040,
};

const CYCLE_LABEL: Record<string, string> = {
  mythological: "Mythologisch",
  ulster:       "Ulster",
  fenian:       "Fenian",
  kings:        "Könige",
  other:        "Sonstig",
};

const CYCLE_COLOR: Record<string, string> = {
  mythological: "#e87878",
  ulster:       "#78b4e8",
  fenian:       "#a0c878",
  kings:        "#e0a84a",
  other:        "#7a8a7a",
};

const REL_EDGE_STYLE: Record<string, { stroke: string; strokeDasharray?: string; strokeWidth: number }> = {
  before:   { stroke: "#4a5a4a", strokeWidth: 1.5 },
  causes:   { stroke: "#c89132", strokeWidth: 2.5 },
  meets:    { stroke: "#5888a8", strokeWidth: 1.5 },
  parallel: { stroke: "#5888a8", strokeDasharray: "4 4", strokeWidth: 1 },
  contains: { stroke: "#8855aa", strokeDasharray: "3 3", strokeWidth: 1 },
};

const FOCUS_COLORS = ["#c89132", "#78b4e8", "#a0c878", "#e87878"];

const nodeTypes: NodeTypes = { eventNode: EventNode as NodeTypes[string] };

const X_SPACING = 200;
const Y_JITTER = 70; // vertical spread for same-position events within a cycle

export default function TimelineGraphPage() {
  const [allEvents, setAllEvents] = useState<TimelineEvent[]>([]);
  const [allRelations, setAllRelations] = useState<Relation[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLifecycle, setShowLifecycle] = useState(false);
  const [focusCharGroups, setFocusCharGroups] = useState<number[][]>([]);
  const [charSearch, setCharSearch] = useState<string[]>(["", "", ""]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Load data
  useEffect(() => {
    Promise.all([
      fetch("/api/timeline").then((r) => r.json()),
      fetch("/api/characters").then((r) => r.json()),
    ]).then(([timelineData, charData]) => {
      setAllEvents(timelineData.timeline ?? []);
      setAllRelations(timelineData.relations ?? []);
      setCharacters(charData ?? []);
      setLoading(false);
    });
  }, []);

  // Build focused character groups from search selections
  const resolvedFocusGroups = useMemo(() => {
    return focusCharGroups.filter((g) => g.length > 0);
  }, [focusCharGroups]);

  // Determine if each event is focused/dimmed
  const focusedEventIds = useMemo(() => {
    if (resolvedFocusGroups.length === 0) return null;
    const allFocusIds = resolvedFocusGroups.flat();
    return new Set(
      allEvents
        .filter((e) => e.characters.some((c) => allFocusIds.includes(c.characterId)))
        .map((e) => e.id)
    );
  }, [allEvents, resolvedFocusGroups]);

  // Build graph
  useEffect(() => {
    if (loading) return;

    const visibleEvents = showLifecycle
      ? allEvents
      : allEvents.filter((e) => e.eventType !== "birth" && e.eventType !== "death");

    const visibleIds = new Set(visibleEvents.map((e) => e.id));

    // Track how many events are at each (cycle, position) to offset Y
    const posCount: Record<string, number> = {};

    const newNodes: Node[] = visibleEvents.map((e) => {
      const cycleY = CYCLE_Y[e.cycle ?? "other"] ?? 0;
      const posKey = `${e.cycle}-${e.position}`;
      const slot = posCount[posKey] ?? 0;
      posCount[posKey] = slot + 1;

      const x = e.position * X_SPACING;
      const y = cycleY + slot * Y_JITTER;

      const dimmed =
        focusedEventIds !== null && !focusedEventIds.has(e.id);

      return {
        id: String(e.id),
        type: "eventNode",
        position: { x, y },
        data: {
          event: e,
          focusCharIds: resolvedFocusGroups,
          dimmed,
        } as EventNodeData,
      };
    });

    const newEdges: Edge[] = allRelations
      .filter((r) => visibleIds.has(r.fromEventId) && visibleIds.has(r.toEventId))
      .map((r) => {
        const style = REL_EDGE_STYLE[r.relationType] ?? REL_EDGE_STYLE.before;
        const speculative = r.confidence === "speculative";
        const fromFocused =
          focusedEventIds === null ||
          (focusedEventIds.has(r.fromEventId) && focusedEventIds.has(r.toEventId));

        return {
          id: `${r.fromEventId}-${r.toEventId}-${r.relationType}`,
          source: String(r.fromEventId),
          target: String(r.toEventId),
          style: {
            ...style,
            strokeDasharray: speculative ? "3 5" : style.strokeDasharray,
            opacity: fromFocused ? (speculative ? 0.4 : 0.8) : 0.1,
          },
          animated: r.relationType === "causes",
        };
      });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [allEvents, allRelations, showLifecycle, focusedEventIds, resolvedFocusGroups, loading, setNodes, setEdges]);

  // Character search + select
  const handleCharSelect = useCallback((slotIdx: number, charId: number) => {
    setFocusCharGroups((prev) => {
      const next = [...prev];
      while (next.length <= slotIdx) next.push([]);
      // Toggle: if already selected, remove; otherwise set
      if (next[slotIdx].includes(charId)) {
        next[slotIdx] = next[slotIdx].filter((id) => id !== charId);
      } else {
        next[slotIdx] = [charId];
      }
      return next;
    });
  }, []);

  const clearSlot = useCallback((slotIdx: number) => {
    setFocusCharGroups((prev) => {
      const next = [...prev];
      if (next[slotIdx]) next[slotIdx] = [];
      return next;
    });
    setCharSearch((prev) => {
      const next = [...prev];
      next[slotIdx] = "";
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
        <div style={{ color: "var(--slate)", marginTop: "1rem", fontFamily: "Cinzel, serif", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
          LADE GRAPH …
        </div>
      </div>
    );
  }

  const usedCycles = Array.from(new Set(allEvents.map((e) => e.cycle)));
  const cycleOrder = ["mythological", "ulster", "fenian", "kings", "other"].filter((c) =>
    usedCycles.includes(c)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      {/* Header / Controls */}
      <div style={{ marginBottom: "1rem", flexShrink: 0 }}>
        {/* Tab bar */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
          <Link
            href="/timeline"
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
            Liste
          </Link>
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
            Graph
          </div>

          <div style={{ flex: 1 }} />

          {/* Lifecycle toggle */}
          <button
            onClick={() => setShowLifecycle((v) => !v)}
            style={{
              padding: "5px 14px",
              background: showLifecycle ? "rgba(200,145,58,0.2)" : "var(--peat)",
              color: showLifecycle ? "var(--amber)" : "var(--slate)",
              border: `1px solid ${showLifecycle ? "var(--amber)" : "var(--border)"}`,
              borderRadius: "2px",
              cursor: "pointer",
              fontFamily: "Cinzel, serif",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
            }}
          >
            ✦✝ Lebensdaten
          </button>
        </div>

        {/* Character focus slots */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          {[0, 1, 2].map((slotIdx) => {
            const selectedId = focusCharGroups[slotIdx]?.[0];
            const selectedChar = characters.find((c) => c.id === selectedId);
            const color = FOCUS_COLORS[slotIdx];
            const search = charSearch[slotIdx] ?? "";
            const filtered = search.length > 0
              ? characters.filter((c) =>
                  c.name.toLowerCase().includes(search.toLowerCase())
                )
              : [];

            return (
              <div key={slotIdx} style={{ position: "relative", minWidth: 180 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: `1px solid ${selectedChar ? color : "var(--border)"}`,
                    borderRadius: "2px",
                    background: "var(--peat)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      alignSelf: "stretch",
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  {selectedChar ? (
                    <div style={{ display: "flex", alignItems: "center", flex: 1, padding: "5px 8px", gap: "0.4rem" }}>
                      <span style={{ color, fontSize: "0.8rem", flex: 1, fontFamily: "Cinzel, serif" }}>
                        {selectedChar.name}
                      </span>
                      <button
                        onClick={() => clearSlot(slotIdx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--slate)",
                          cursor: "pointer",
                          padding: "0 4px",
                          fontSize: "0.75rem",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder={`Charakter ${slotIdx + 1} filtern…`}
                      value={search}
                      onChange={(e) =>
                        setCharSearch((prev) => {
                          const next = [...prev];
                          next[slotIdx] = e.target.value;
                          return next;
                        })
                      }
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "var(--mist)",
                        fontSize: "0.8rem",
                        padding: "5px 8px",
                        fontFamily: "inherit",
                      }}
                    />
                  )}
                </div>

                {/* Autocomplete dropdown */}
                {filtered.length > 0 && !selectedChar && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "var(--stone)",
                      border: "1px solid var(--border)",
                      borderRadius: "2px",
                      zIndex: 100,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {filtered.slice(0, 10).map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          handleCharSelect(slotIdx, c.id);
                          setCharSearch((prev) => {
                            const next = [...prev];
                            next[slotIdx] = "";
                            return next;
                          });
                        }}
                        style={{
                          padding: "6px 10px",
                          cursor: "pointer",
                          color: "var(--mist)",
                          fontSize: "0.85rem",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--peat)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {resolvedFocusGroups.length > 0 && (
            <button
              onClick={() => {
                setFocusCharGroups([]);
                setCharSearch(["", "", ""]);
              }}
              style={{
                padding: "5px 12px",
                background: "var(--peat)",
                color: "var(--slate)",
                border: "1px solid var(--border)",
                borderRadius: "2px",
                cursor: "pointer",
                fontSize: "0.75rem",
              }}
            >
              Filter löschen
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem", flexShrink: 0 }}>
        {/* Relation types */}
        {Object.entries(REL_EDGE_STYLE).map(([key, style]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <div
              style={{
                width: 24,
                height: 2,
                background: style.stroke,
                opacity: 0.8,
                borderTop: style.strokeDasharray ? `2px dashed ${style.stroke}` : undefined,
              }}
            />
            <span style={{ fontSize: "0.65rem", color: "var(--slate)", fontFamily: "Cinzel, serif", letterSpacing: "0.08em", textTransform: "capitalize" }}>
              {key}
            </span>
          </div>
        ))}
        <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "1rem", display: "flex", gap: "0.75rem" }}>
          {cycleOrder.map((c) => (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: CYCLE_COLOR[c] }} />
              <span style={{ fontSize: "0.65rem", color: "var(--mist)", fontFamily: "Cinzel, serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {CYCLE_LABEL[c]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Graph canvas */}
      <div style={{ flex: 1, background: "var(--stone)", borderRadius: "4px", border: "1px solid var(--border)", overflow: "hidden" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          style={{ background: "var(--stone)" }}
        >
          <Background color="var(--border)" gap={24} />
          <Controls
            style={{
              background: "var(--bark)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
            }}
          />
          <MiniMap
            style={{
              background: "var(--bark)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
            }}
            nodeColor={(node) => {
              const data = node.data as EventNodeData;
              return CYCLE_COLOR[data.event.cycle ?? "other"] ?? "#7a8a7a";
            }}
            maskColor="rgba(10,14,10,0.7)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
