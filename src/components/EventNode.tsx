"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import Link from "next/link";

const CYCLE_COLOR: Record<string, string> = {
  mythological: "#e87878",
  ulster:       "#78b4e8",
  fenian:       "#a0c878",
  kings:        "#e0a84a",
  other:        "#7a8a7a",
};

const EVENT_TYPE_META: Record<string, { icon: string; color: string }> = {
  birth:          { icon: "✦", color: "var(--sage)" },
  death:          { icon: "✝", color: "#c87878" },
  meeting:        { icon: "☍", color: "#78b4e8" },
  battle:         { icon: "⚔", color: "#e87878" },
  reign:          { icon: "♛", color: "#e0a84a" },
  transformation: { icon: "⟳", color: "#a87ed8" },
  prophecy:       { icon: "◎", color: "#e8c878" },
  journey:        { icon: "➢", color: "#78c878" },
  other:          { icon: "◆", color: "#7a8a7a" },
};

// Multi-character highlight colors
const FOCUS_COLORS = ["#c89132", "#78b4e8", "#a0c878", "#e87878"];

export interface EventNodeData extends Record<string, unknown> {
  event: {
    id: number;
    name: string;
    eventType: string | null;
    cycle: string;
    parentEventId: number | null;
    characters: { characterId: number; name: string; role: string }[];
  };
  focusCharIds: number[][];  // array of selected char groups, each group one color
  dimmed: boolean;
  compact?: boolean;         // force compact pill rendering (used in swimlanes)
}

function EventNodeInner({ data }: { data: EventNodeData }) {
  const { event, focusCharIds, dimmed, compact } = data;
  const cycleColor = CYCLE_COLOR[event.cycle ?? "other"] ?? "#7a8a7a";
  const typeMeta = EVENT_TYPE_META[event.eventType ?? "other"] ?? EVENT_TYPE_META.other;
  const isLifecycle = compact || event.eventType === "birth" || event.eventType === "death";
  const isChild = event.parentEventId !== null;

  // Find which focus groups this node belongs to
  const matchedGroups = focusCharIds
    .map((group, idx) =>
      event.characters.some((c) => group.includes(c.characterId)) ? idx : -1
    )
    .filter((idx) => idx >= 0);

  const isFocused = matchedGroups.length > 0;
  const focusColor = isFocused ? FOCUS_COLORS[matchedGroups[0]] : null;

  if (isLifecycle) {
    // Compact lifecycle node
    return (
      <div
        style={{
          padding: "4px 10px",
          background: dimmed ? "rgba(20,20,20,0.3)" : "var(--stone)",
          border: `1px solid ${isFocused ? focusColor! : cycleColor + "55"}`,
          borderRadius: "20px",
          opacity: dimmed ? 0.25 : 1,
          boxShadow: isFocused ? `0 0 8px ${focusColor}88` : undefined,
          transition: "opacity 0.2s",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          cursor: "default",
          minWidth: 80,
        }}
      >
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
        <span style={{ color: typeMeta.color, fontSize: "0.7rem" }}>{typeMeta.icon}</span>
        <span
          style={{
            color: dimmed ? "var(--slate)" : isFocused ? "var(--cream)" : "var(--mist)",
            fontSize: "0.65rem",
            fontFamily: "Cinzel, serif",
            letterSpacing: "0.05em",
            maxWidth: 100,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {event.name}
        </span>
        <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      </div>
    );
  }

  // Full narrative event node
  const displayChars = event.characters.slice(0, 3);
  const extraCount = event.characters.length - 3;

  return (
    <div
      style={{
        padding: "10px 14px",
        background: dimmed
          ? "rgba(20,20,20,0.3)"
          : isFocused
          ? `rgba(30,30,20,0.95)`
          : "var(--bark)",
        border: `2px solid ${isFocused ? focusColor! : isChild ? cycleColor + "55" : cycleColor}`,
        borderStyle: isChild ? "dashed" : "solid",
        borderRadius: "4px",
        opacity: dimmed ? 0.25 : 1,
        boxShadow: isFocused ? `0 0 12px ${focusColor}66` : undefined,
        transition: "opacity 0.2s, box-shadow 0.2s",
        minWidth: 140,
        maxWidth: 200,
        cursor: "default",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
        <span style={{ color: typeMeta.color, fontSize: "0.85rem", flexShrink: 0 }}>
          {typeMeta.icon}
        </span>
        <Link
          href={`/events/${event.id}`}
          style={{
            color: dimmed ? "var(--slate)" : "var(--cream)",
            textDecoration: "none",
            fontFamily: "Cinzel, serif",
            fontSize: "0.8rem",
            lineHeight: 1.2,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {event.name}
        </Link>
      </div>

      {/* Characters */}
      {displayChars.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "3px",
          }}
        >
          {displayChars.map((c, i) => {
            const charGroupIdx = focusCharIds.findIndex((g) => g.includes(c.characterId));
            const charFocused = charGroupIdx >= 0;
            return (
              <span
                key={c.characterId}
                style={{
                  fontSize: "0.65rem",
                  color: charFocused ? FOCUS_COLORS[charGroupIdx] : "var(--slate)",
                  fontWeight: charFocused ? "bold" : undefined,
                }}
              >
                {i > 0 && <span style={{ color: "#555", margin: "0 1px" }}>·</span>}
                {c.name}
              </span>
            );
          })}
          {extraCount > 0 && (
            <span style={{ fontSize: "0.65rem", color: "var(--slate)" }}>
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* Cycle indicator */}
      <div
        style={{
          marginTop: "5px",
          width: "100%",
          height: 2,
          background: cycleColor + "44",
          borderRadius: 1,
        }}
      />

      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

export const EventNode = memo(EventNodeInner);
