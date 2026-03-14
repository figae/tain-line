"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { EventNode, type EventNodeData } from "@/components/EventNode";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TimelineEvent {
  id: number;
  name: string;
  eventType: string | null;
  cycle: string;
  parentEventId: number | null;
  position: number;
  characters: { characterId: number; name: string; role: string }[];
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
  gender: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

const SWIMLANE_COLORS = ["#c89132", "#78b4e8", "#a0c878", "#e87878", "#a87ed8", "#78c8a0"];

const GENDER_SYMBOL: Record<string, string> = {
  male: "♂", female: "♀", other: "✦", unknown: "?",
};

const X_SPACING        = 200;
const Y_JITTER         = 70;
const SWIMLANE_Y_START = 1340;
const SWIMLANE_HEIGHT  = 160;
const LABEL_X          = -300;

// ── Custom node components ────────────────────────────────────────────────────

interface SwimlaneLabelData extends Record<string, unknown> {
  name: string;
  charId: number;
  gender: string | null;
  color: string;
  onRemove: (charId: number) => void;
}

const SwimlaneLabelNode = memo(function SwimlaneLabelNode({ data }: { data: SwimlaneLabelData }) {
  const sym = GENDER_SYMBOL[data.gender ?? "unknown"] ?? "?";
  return (
    <>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <div
        style={{
          display: "flex", alignItems: "center", gap: "0.4rem",
          padding: "6px 10px",
          background: "var(--peat)",
          border: `1px solid ${data.color}66`,
          borderRadius: 4,
          minWidth: 130,
          maxWidth: 180,
        }}
      >
        <span style={{ color: data.color, fontSize: "0.7rem", flexShrink: 0 }}>{sym}</span>
        <span style={{
          color: data.color,
          fontFamily: "Cinzel, serif",
          fontSize: "0.78rem",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {data.name}
        </span>
        <button
          onClick={() => data.onRemove(data.charId)}
          style={{
            background: "none", border: "none",
            color: "var(--slate)", cursor: "pointer",
            fontSize: "0.85rem", padding: "0 2px", flexShrink: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </>
  );
});

interface SeparatorData extends Record<string, unknown> { width: number }

const SeparatorNode = memo(function SeparatorNode({ data }: { data: SeparatorData }) {
  return (
    <div style={{
      width: data.width,
      height: 1,
      background: "var(--border)",
      opacity: 0.5,
      pointerEvents: "none",
    }} />
  );
});

interface CycleLabelData extends Record<string, unknown> { label: string; color: string }

const CycleLabelNode = memo(function CycleLabelNode({ data }: { data: CycleLabelData }) {
  return (
    <div style={{
      padding: "3px 8px",
      color: data.color,
      fontFamily: "Cinzel, serif",
      fontSize: "0.7rem",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      opacity: 0.75,
      pointerEvents: "none",
      whiteSpace: "nowrap",
    }}>
      {data.label}
    </div>
  );
});

const nodeTypes: NodeTypes = {
  eventNode:     EventNode      as NodeTypes[string],
  swimlaneLabel: SwimlaneLabelNode as NodeTypes[string],
  separator:     SeparatorNode  as NodeTypes[string],
  cycleLabel:    CycleLabelNode as NodeTypes[string],
};

// ── Page component ────────────────────────────────────────────────────────────

export default function TimelineGraphPage() {
  const [allEvents, setAllEvents]     = useState<TimelineEvent[]>([]);
  const [allRelations, setAllRelations] = useState<Relation[]>([]);
  const [characters, setCharacters]   = useState<Character[]>([]);
  const [loading, setLoading]         = useState(true);

  const [swimlaneCharIds, setSwimlaneCharIds] = useState<number[]>([]);
  const [charSearch, setCharSearch]           = useState("");

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

  const removeChar = useCallback((charId: number) => {
    setSwimlaneCharIds((prev) => prev.filter((id) => id !== charId));
  }, []);

  const addChar = useCallback((charId: number) => {
    setSwimlaneCharIds((prev) => prev.includes(charId) ? prev : [...prev, charId]);
    setCharSearch("");
  }, []);

  const searchResults = useMemo(() => {
    if (charSearch.length < 1) return [];
    const q = charSearch.toLowerCase();
    return characters
      .filter((c) => c.name.toLowerCase().includes(q) && !swimlaneCharIds.includes(c.id))
      .slice(0, 8);
  }, [characters, charSearch, swimlaneCharIds]);

  // Build graph
  useEffect(() => {
    if (loading) return;

    // Main timeline: narrative events only (no birth/death)
    const mainEvents = allEvents.filter(
      (e) => e.eventType !== "birth" && e.eventType !== "death"
    );
    const mainIds = new Set(mainEvents.map((e) => e.id));

    const posCount: Record<string, number> = {};
    let maxX = 0;

    const mainNodes: Node[] = mainEvents.map((e) => {
      const cycleY  = CYCLE_Y[e.cycle ?? "other"] ?? 0;
      const posKey  = `${e.cycle}-${e.position}`;
      const slot    = posCount[posKey] ?? 0;
      posCount[posKey] = slot + 1;
      const x = e.position * X_SPACING;
      const y = cycleY + slot * Y_JITTER;
      if (x > maxX) maxX = x;
      return {
        id:   String(e.id),
        type: "eventNode",
        position: { x, y },
        data: { event: e, focusCharIds: [], dimmed: false } as EventNodeData,
      };
    });

    // Cycle label nodes (left side)
    const usedCycles = Array.from(new Set(mainEvents.map((e) => e.cycle)));
    const cycleLabels: Node[] = usedCycles.map((cycle) => ({
      id:       `cycle-label-${cycle}`,
      type:     "cycleLabel",
      position: { x: LABEL_X, y: (CYCLE_Y[cycle] ?? 0) },
      data:     { label: CYCLE_LABEL[cycle] ?? cycle, color: CYCLE_COLOR[cycle] ?? "#7a8a7a" },
      draggable:  false,
      selectable: false,
      focusable:  false,
    }));

    // Main timeline edges
    const mainEdges: Edge[] = allRelations
      .filter((r) => mainIds.has(r.fromEventId) && mainIds.has(r.toEventId))
      .map((r) => {
        const style      = REL_EDGE_STYLE[r.relationType] ?? REL_EDGE_STYLE.before;
        const speculative = r.confidence === "speculative";
        return {
          id:     `${r.fromEventId}-${r.toEventId}-${r.relationType}`,
          source: String(r.fromEventId),
          target: String(r.toEventId),
          style:  {
            ...style,
            strokeDasharray: speculative ? "3 5" : style.strokeDasharray,
            opacity: speculative ? 0.4 : 0.8,
          },
          animated: r.relationType === "causes",
        };
      });

    // Swimlane nodes + edges
    const swimNodes: Node[] = [];
    const swimEdges: Edge[] = [];

    if (swimlaneCharIds.length > 0) {
      // Separator between main timeline and swimlanes
      swimNodes.push({
        id:       "separator",
        type:     "separator",
        position: { x: LABEL_X, y: SWIMLANE_Y_START - 50 },
        data:     { width: maxX - LABEL_X + 400 } as SeparatorData,
        draggable:  false,
        selectable: false,
        focusable:  false,
      });
    }

    const charMap = new Map(characters.map((c) => [c.id, c]));

    swimlaneCharIds.forEach((charId, idx) => {
      const charInfo = charMap.get(charId);
      if (!charInfo) return;

      const color  = SWIMLANE_COLORS[idx % SWIMLANE_COLORS.length];
      const swimY  = SWIMLANE_Y_START + idx * SWIMLANE_HEIGHT;

      // All events this character participates in (narrative + lifecycle)
      const charEvents = allEvents
        .filter((e) => e.characters.some((c) => c.characterId === charId))
        .sort((a, b) => a.position - b.position);

      // Label node
      swimNodes.push({
        id:       `swim-label-${charId}`,
        type:     "swimlaneLabel",
        position: { x: LABEL_X, y: swimY - 4 },
        data: {
          name:     charInfo.name,
          charId,
          gender:   charInfo.gender,
          color,
          onRemove: removeChar,
        } as SwimlaneLabelData,
        draggable:  false,
        selectable: false,
        focusable:  false,
      });

      // Event nodes
      charEvents.forEach((e) => {
        swimNodes.push({
          id:   `swim-${charId}-${e.id}`,
          type: "eventNode",
          position: { x: e.position * X_SPACING, y: swimY },
          data: {
            event: e,
            focusCharIds: [],
            dimmed: false,
            compact: true,
          } as EventNodeData,
        });
      });

      // Spine: dashed line connecting consecutive events
      for (let i = 0; i < charEvents.length - 1; i++) {
        swimEdges.push({
          id:     `spine-${charId}-${charEvents[i].id}-${charEvents[i + 1].id}`,
          source: `swim-${charId}-${charEvents[i].id}`,
          target: `swim-${charId}-${charEvents[i + 1].id}`,
          type:   "straight",
          style:  { stroke: color + "55", strokeWidth: 1, strokeDasharray: "4 6" },
        });
      }
    });

    setNodes([...mainNodes, ...cycleLabels, ...swimNodes]);
    setEdges([...mainEdges, ...swimEdges]);
  }, [allEvents, allRelations, characters, swimlaneCharIds, loading, removeChar, setNodes, setEdges]);

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

  const swimlaneCharMap = new Map(characters.map((c) => [c.id, c]));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>

      {/* Header */}
      <div style={{ marginBottom: "0.75rem", flexShrink: 0 }}>

        {/* Tab bar + character search */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <Link
            href="/timeline"
            style={{
              padding: "6px 16px", background: "var(--peat)", color: "var(--slate)",
              border: "1px solid var(--border)", borderRadius: "2px",
              textDecoration: "none", fontFamily: "Cinzel, serif",
              fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase",
            }}
          >
            Liste
          </Link>
          <div style={{
            padding: "6px 16px", background: "rgba(200,145,58,0.15)", color: "var(--amber)",
            border: "1px solid rgba(200,145,58,0.5)", borderRadius: "2px",
            fontFamily: "Cinzel, serif", fontSize: "0.75rem",
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            Graph
          </div>

          <div style={{ flex: 1 }} />

          {/* Active swimlane chips */}
          {swimlaneCharIds.map((charId, idx) => {
            const c = swimlaneCharMap.get(charId);
            if (!c) return null;
            const color = SWIMLANE_COLORS[idx % SWIMLANE_COLORS.length];
            return (
              <div key={charId} style={{
                display: "flex", alignItems: "center", gap: "0.3rem",
                padding: "4px 8px 4px 10px",
                background: color + "18",
                border: `1px solid ${color}55`,
                borderRadius: 2,
                fontFamily: "Cinzel, serif", fontSize: "0.75rem",
              }}>
                <span style={{ color }}>{c.name}</span>
                <button
                  onClick={() => removeChar(charId)}
                  style={{
                    background: "none", border: "none", color: "var(--slate)",
                    cursor: "pointer", fontSize: "0.85rem", padding: "0 2px", lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}

          {/* Character search */}
          <div style={{ position: "relative" }}>
            <div style={{
              display: "flex", alignItems: "center",
              border: "1px solid var(--border)", borderRadius: 2,
              background: "var(--peat)", overflow: "visible",
            }}>
              <input
                type="text"
                placeholder="+ Charakter hinzufügen …"
                value={charSearch}
                onChange={(e) => setCharSearch(e.target.value)}
                style={{
                  background: "transparent", border: "none", outline: "none",
                  color: "var(--mist)", fontSize: "0.8rem",
                  padding: "5px 10px", width: 200,
                  fontFamily: "inherit",
                }}
              />
            </div>
            {searchResults.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0,
                background: "var(--stone)", border: "1px solid var(--border)",
                borderRadius: 2, zIndex: 100,
                maxHeight: 220, overflowY: "auto",
              }}>
                {searchResults.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => addChar(c.id)}
                    style={{
                      padding: "6px 10px", cursor: "pointer",
                      color: "var(--mist)", fontSize: "0.85rem",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--peat)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          {Object.entries(REL_EDGE_STYLE).map(([key, style]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <div style={{
                width: 24, height: 2, background: style.stroke, opacity: 0.8,
                borderTop: style.strokeDasharray ? `2px dashed ${style.stroke}` : undefined,
              }} />
              <span style={{
                fontSize: "0.65rem", color: "var(--slate)",
                fontFamily: "Cinzel, serif", letterSpacing: "0.08em", textTransform: "capitalize",
              }}>
                {key}
              </span>
            </div>
          ))}
          <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "1rem", display: "flex", gap: "0.75rem" }}>
            {cycleOrder.map((c) => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: CYCLE_COLOR[c] }} />
                <span style={{
                  fontSize: "0.65rem", color: "var(--mist)",
                  fontFamily: "Cinzel, serif", letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  {CYCLE_LABEL[c]}
                </span>
              </div>
            ))}
          </div>
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
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.05}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          style={{ background: "var(--stone)" }}
        >
          <Background color="var(--border)" gap={24} />
          <Controls style={{ background: "var(--bark)", border: "1px solid var(--border)", borderRadius: "4px" }} />
          <MiniMap
            style={{ background: "var(--bark)", border: "1px solid var(--border)", borderRadius: "4px" }}
            nodeColor={(node) => {
              if (node.type === "eventNode") {
                const d = node.data as EventNodeData;
                return CYCLE_COLOR[d.event?.cycle ?? "other"] ?? "#7a8a7a";
              }
              if (node.type === "swimlaneLabel") {
                return (node.data as SwimlaneLabelData).color;
              }
              return "var(--border)";
            }}
            maskColor="rgba(10,14,10,0.7)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
