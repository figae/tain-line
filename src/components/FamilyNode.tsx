"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { useRouter } from "next/navigation";

export interface FamilyNodeData extends Record<string, unknown> {
  id: number;
  name: string;
  gender: string | null;
  isDeity: boolean | null;
  generation: number;
  role: "focus" | "bloodline" | "lateral";
}

const GENDER_SYMBOL: Record<string, string> = {
  male:    "♂",
  female:  "♀",
  other:   "✦",
  unknown: "?",
};

const ROLE_STYLE: Record<FamilyNodeData["role"], React.CSSProperties> = {
  focus: {
    border: "2px solid var(--gold)",
    background: "rgba(200,145,58,0.15)",
    width: 160,
    opacity: 1,
  },
  bloodline: {
    border: "1px solid var(--border-bright)",
    background: "var(--bark)",
    width: 140,
    opacity: 1,
  },
  lateral: {
    border: "1px solid var(--border)",
    background: "var(--peat)",
    width: 124,
    opacity: 0.8,
  },
};

function FamilyNode({ data }: { data: FamilyNodeData }) {
  const router = useRouter();
  const style = ROLE_STYLE[data.role];
  const genderSym = GENDER_SYMBOL[data.gender ?? "unknown"] ?? "?";
  const isFocus = data.role === "focus";

  return (
    <>
      <Handle type="target" position={Position.Top}    id="top"    style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left}   id="left"   style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right}  id="right"  style={{ opacity: 0 }} />

      <div
        onClick={() => router.push(`/characters/${data.id}/family`)}
        style={{
          ...style,
          borderRadius: 4,
          padding: "8px 10px",
          cursor: "pointer",
          userSelect: "none",
          transition: "opacity 0.2s, border-color 0.2s",
        }}
      >
        {/* Name row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span
            style={{
              color: isFocus ? "var(--amber)" : "var(--mist)",
              fontSize: isFocus ? "0.7rem" : "0.6rem",
              flexShrink: 0,
            }}
          >
            {genderSym}
          </span>
          <span
            style={{
              fontFamily: "Cinzel, serif",
              fontSize: isFocus ? "0.85rem" : "0.75rem",
              color: isFocus ? "var(--cream)" : "var(--mist)",
              fontWeight: isFocus ? 700 : 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {data.name}
          </span>
        </div>

        {/* Badges (focus + bloodline only) */}
        {data.role !== "lateral" && (
          <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
            {data.isDeity && (
              <span
                style={{
                  fontSize: "0.6rem",
                  padding: "1px 5px",
                  background: "rgba(200,145,58,0.2)",
                  border: "1px solid rgba(200,145,58,0.5)",
                  borderRadius: 2,
                  color: "var(--amber)",
                  fontFamily: "Cinzel, serif",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Gottheit
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default memo(FamilyNode);
