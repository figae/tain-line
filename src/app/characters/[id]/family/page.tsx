"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
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
} from "@xyflow/react";

type FamilyFlowNode = Node<FamilyNodeData, "familyNode">;
import "@xyflow/react/dist/style.css";

import FamilyNode, { type FamilyNodeData } from "@/components/FamilyNode";

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiNode {
  id: number;
  name: string;
  gender: string | null;
  isDeity: boolean | null;
  generation: number;
  role: "focus" | "bloodline" | "lateral";
}

interface ApiEdge {
  fromId: number;
  toId: number;
  relationType: string;
}

// ── Edge colours by relation type ────────────────────────────────────────────

const EDGE_COLOR: Record<string, string> = {
  father:        "#c8913a",
  mother:        "#c8913a",
  child:         "#c8913a",
  grandparent:   "#c8913a",
  grandchild:    "#c8913a",
  foster_parent: "#78c878",
  foster_child:  "#78c878",
  sibling:       "#78b4e8",
  half_sibling:  "#78b4e8",
  spouse:        "#e878a0",
  lover:         "#e878a0",
  uncle:         "#8a8a8a",
  aunt:          "#8a8a8a",
  nephew:        "#8a8a8a",
  niece:         "#8a8a8a",
  aspect:        "#a87ed8",
  other:         "#6a7a6a",
};

const REL_LABEL: Record<string, string> = {
  father: "Vater", mother: "Mutter", child: "Kind",
  grandparent: "Großelternteil", grandchild: "Enkelkind",
  foster_parent: "Pflegeelternteil", foster_child: "Pflegekind",
  sibling: "Geschwister", half_sibling: "Halbgeschwister",
  spouse: "Partner·in", lover: "Geliebte·r",
  uncle: "Onkel", aunt: "Tante", nephew: "Neffe", niece: "Nichte",
  aspect: "Aspekt", other: "Beziehung",
};

// ── Layout ───────────────────────────────────────────────────────────────────

const NODE_W   = 160;
const NODE_H   = 70;
const GEN_GAP  = 220; // vertical gap between generations
const NODE_GAP = 200; // horizontal gap between nodes in same generation

function buildLayout(
  apiNodes: ApiNode[],
  showLateral: boolean
): FamilyFlowNode[] {
  const visible = showLateral
    ? apiNodes
    : apiNodes.filter((n) => n.role !== "lateral");

  // Group by generation
  const byGen = new Map<number, ApiNode[]>();
  for (const n of visible) {
    if (!byGen.has(n.generation)) byGen.set(n.generation, []);
    byGen.get(n.generation)!.push(n);
  }

  const result: FamilyFlowNode[] = [];

  for (const [gen, nodes] of byGen) {
    // Within each generation: bloodline/focus nodes first (centre), then lateral
    const sorted = [
      ...nodes.filter((n) => n.role === "focus"),
      ...nodes.filter((n) => n.role === "bloodline"),
      ...nodes.filter((n) => n.role === "lateral"),
    ];
    const total = sorted.length;
    const totalW = (total - 1) * NODE_GAP;

    sorted.forEach((n, i) => {
      result.push({
        id:   String(n.id),
        type: "familyNode" as const,
        position: {
          x: i * NODE_GAP - totalW / 2,
          y: gen * GEN_GAP,
        },
        data: {
          id:         n.id,
          name:       n.name,
          gender:     n.gender,
          isDeity:    n.isDeity,
          generation: n.generation,
          role:       n.role,
        },
      });
    });
  }

  return result;
}

// ── Node types registry ───────────────────────────────────────────────────────

const NODE_TYPES = { familyNode: FamilyNode };

// ── Page component ────────────────────────────────────────────────────────────

export default function FamilyTreePage() {
  const { id } = useParams<{ id: string }>();
  const [apiNodes, setApiNodes] = useState<ApiNode[]>([]);
  const [apiEdges, setApiEdges] = useState<ApiEdge[]>([]);
  const [focalName, setFocalName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLateral, setShowLateral] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<FamilyFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Fetch family tree data
  useEffect(() => {
    setLoading(true);
    fetch(`/api/characters/${id}/family-tree`)
      .then((r) => r.json())
      .then((d) => {
        setFocalName(d.focal?.name ?? "");
        setApiNodes(d.nodes ?? []);
        setApiEdges(d.edges ?? []);
        setLoading(false);
      });
  }, [id]);

  // Rebuild React Flow nodes + edges whenever data or toggle changes
  const visibleIds = useMemo(() => {
    const visible = showLateral
      ? apiNodes
      : apiNodes.filter((n) => n.role !== "lateral");
    return new Set(visible.map((n) => n.id));
  }, [apiNodes, showLateral]);

  useEffect(() => {
    const layoutNodes = buildLayout(apiNodes, showLateral);
    setNodes(layoutNodes);

    const flowEdges: Edge[] = apiEdges
      .filter((e) => visibleIds.has(e.fromId) && visibleIds.has(e.toId))
      .map((e) => ({
        id:           `${e.fromId}-${e.toId}-${e.relationType}`,
        source:       String(e.fromId),
        target:       String(e.toId),
        label:        REL_LABEL[e.relationType] ?? e.relationType,
        labelStyle:   { fontSize: 9, fill: "var(--slate)", fontFamily: "Cinzel, serif" },
        labelBgStyle: { fill: "var(--peat)", fillOpacity: 0.85 },
        style:        { stroke: EDGE_COLOR[e.relationType] ?? "#6a7a6a", strokeWidth: 1.5 },
        type:         "smoothstep",
      }));
    setEdges(flowEdges);
  }, [apiNodes, apiEdges, showLateral, visibleIds, setNodes, setEdges]);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
        <div style={{ color: "var(--slate)", marginTop: "1rem", fontFamily: "Cinzel, serif", fontSize: "0.85rem", letterSpacing: "0.1em" }}>
          LADE STAMMBAUM …
        </div>
      </div>
    );
  }

  const bloodlineCount = apiNodes.filter((n) => n.role !== "lateral").length;
  const lateralCount   = apiNodes.filter((n) => n.role === "lateral").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>

      {/* Header bar */}
      <div style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", flexShrink: 0 }}>
        <Link
          href={`/characters/${id}`}
          style={{ color: "var(--slate)", textDecoration: "none", fontFamily: "Cinzel, serif", fontSize: "0.7rem", letterSpacing: "0.1em" }}
        >
          ← {focalName}
        </Link>

        <div style={{ height: 16, width: 1, background: "var(--border)" }} />

        <span style={{ fontFamily: "Cinzel, serif", fontSize: "0.9rem", color: "var(--cream)" }}>
          Stammbaum
        </span>

        <span style={{ color: "var(--slate)", fontSize: "0.75rem" }}>
          {bloodlineCount} Blutlinie · {lateralCount} Nebenlinien
        </span>

        <div style={{ flex: 1 }} />

        {/* Legend */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {[
            { label: "Blutlinie",  color: "#c8913a" },
            { label: "Partner·in", color: "#e878a0" },
            { label: "Geschwister",color: "#78b4e8" },
            { label: "Adoptiv",    color: "#78c878" },
            { label: "Aspekt",     color: "#a87ed8" },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <div style={{ width: 20, height: 2, background: color }} />
              <span style={{ fontFamily: "Cinzel, serif", fontSize: "0.6rem", color: "var(--slate)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Lateral toggle */}
        <button
          onClick={() => setShowLateral((v) => !v)}
          style={{
            padding: "4px 12px",
            background: showLateral ? "rgba(200,145,58,0.15)" : "var(--peat)",
            color:      showLateral ? "var(--amber)" : "var(--slate)",
            border:     `1px solid ${showLateral ? "var(--amber)" : "var(--border)"}`,
            borderRadius: 2,
            cursor: "pointer",
            fontFamily: "Cinzel, serif",
            fontSize: "0.65rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {showLateral ? "Nebenlinien ausblenden" : "Nebenlinien einblenden"}
        </button>
      </div>

      {/* React Flow canvas */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
          minZoom={0.1}
          maxZoom={2}
          style={{ background: "var(--stone)" }}
        >
          <Background color="var(--border)" gap={24} size={1} />
          <Controls
            style={{ background: "var(--bark)", border: "1px solid var(--border)" }}
          />
          <MiniMap
            style={{ background: "var(--bark)", border: "1px solid var(--border)" }}
            nodeColor={(n) => {
              const role = (n as FamilyFlowNode).data.role;
              return role === "focus" ? "var(--gold)" : role === "bloodline" ? "var(--slate)" : "var(--peat)";
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
