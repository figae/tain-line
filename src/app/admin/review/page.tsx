"use client";

import { useState, useEffect, useCallback } from "react";

type EntityType = "character" | "event" | "place" | "group" | "relation";

interface ReviewItem {
  id: number;
  name?: string;
  description?: string;
  status: string;
  sourceQuote?: string;
  proposedBy?: string;
  reviewNotes?: string;
  // extra fields per type
  [key: string]: unknown;
}

interface ReviewData {
  characters: ReviewItem[];
  events: ReviewItem[];
  places: ReviewItem[];
  groups: ReviewItem[];
  relations: ReviewItem[];
}

const TYPE_LABELS: Record<EntityType, string> = {
  character: "Charaktere",
  event: "Events",
  place: "Orte",
  group: "Gruppen",
  relation: "Relationen",
};

const ENTITY_TYPES: EntityType[] = ["character", "event", "place", "group", "relation"];

export default function ReviewPage() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<EntityType>("character");
  const [processing, setProcessing] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<{ type: EntityType; id: number } | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/review");
    const d = await res.json() as ReviewData;
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getItems = (type: EntityType): ReviewItem[] => {
    if (!data) return [];
    const map: Record<EntityType, ReviewItem[]> = {
      character: data.characters,
      event: data.events,
      place: data.places,
      group: data.groups,
      relation: data.relations,
    };
    return map[type];
  };

  const totalCount = data ? Object.values(data).reduce((s, a) => s + a.length, 0) : 0;

  const handleAction = async (type: EntityType, id: number, action: "approve" | "reject", notes?: string) => {
    setProcessing(id);
    await fetch("/api/admin/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType: type, id, action, reviewNotes: notes }),
    });
    setProcessing(null);
    setRejectId(null);
    setRejectNotes("");
    await load();
  };

  const getItemLabel = (type: EntityType, item: ReviewItem): string => {
    if (type === "relation") {
      return `${item.fromName ?? "?"} → ${item.toName ?? "?"} (${item.relationType ?? "?"})`;
    }
    return String(item.name ?? item.id);
  };

  const btnStyle = (variant: "approve" | "reject" | "secondary"): React.CSSProperties => ({
    padding: "4px 14px",
    border: "1px solid",
    borderRadius: 2,
    cursor: "pointer",
    fontFamily: "Cinzel, serif",
    fontSize: "0.65rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    background: variant === "approve" ? "rgba(100,180,100,0.15)" : variant === "reject" ? "rgba(200,100,100,0.15)" : "var(--peat)",
    color: variant === "approve" ? "#78c878" : variant === "reject" ? "#c87878" : "var(--slate)",
    borderColor: variant === "approve" ? "#78c87844" : variant === "reject" ? "#c8787844" : "var(--border)",
  });

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 0" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 0" }}>
        <div style={{ fontSize: "2rem", marginBottom: "1rem", color: "var(--amber)" }}>✦</div>
        <p style={{ fontFamily: "Cinzel, serif", color: "var(--mist)" }}>Keine ausstehenden Einträge</p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "1.5rem", color: "var(--cream)", marginBottom: "0.25rem" }}>
        Review-Queue
      </h1>
      <p style={{ color: "var(--slate)", fontSize: "0.85rem", marginBottom: "2rem" }}>
        {totalCount} Einträge warten auf Freigabe
      </p>

      {/* Type tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
        {ENTITY_TYPES.map((type) => {
          const count = getItems(type).length;
          const active = activeType === type;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              style={{
                padding: "4px 14px",
                background: active ? "var(--gold)" : "var(--peat)",
                color: active ? "var(--stone)" : "var(--slate)",
                border: "1px solid",
                borderColor: active ? "var(--gold)" : "var(--border)",
                borderRadius: 2,
                cursor: "pointer",
                fontFamily: "Cinzel, serif",
                fontSize: "0.65rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {TYPE_LABELS[type]}
              {count > 0 && (
                <span style={{
                  background: active ? "var(--stone)" : "var(--amber)",
                  color: active ? "var(--gold)" : "var(--stone)",
                  borderRadius: 10,
                  padding: "0 6px",
                  fontSize: "0.6rem",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {getItems(activeType).length === 0 ? (
          <p style={{ color: "var(--slate)", fontFamily: "Cinzel, serif", fontSize: "0.8rem" }}>
            Keine Einträge in dieser Kategorie
          </p>
        ) : (
          getItems(activeType).map((item) => (
            <div
              key={item.id}
              style={{
                background: "var(--bark)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Cinzel, serif", color: "var(--cream)", fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                    {getItemLabel(activeType, item)}
                  </div>
                  {item.description && (
                    <div style={{ color: "var(--mist)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                      {item.description}
                    </div>
                  )}
                  {item.sourceQuote && (
                    <blockquote style={{
                      borderLeft: "2px solid var(--amber)",
                      paddingLeft: "0.75rem",
                      margin: 0,
                      color: "var(--slate)",
                      fontSize: "0.78rem",
                      fontStyle: "italic",
                    }}>
                      „{item.sourceQuote}"
                    </blockquote>
                  )}
                  <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    {item.proposedBy && (
                      <span style={{ fontSize: "0.65rem", color: item.proposedBy === "ai" ? "#a87ed8" : "var(--slate)", fontFamily: "Cinzel, serif", letterSpacing: "0.05em" }}>
                        {item.proposedBy === "ai" ? "◎ KI-Vorschlag" : "✦ Manuell"}
                      </span>
                    )}
                    {(item.eventType as string | undefined) && (
                      <span style={{ fontSize: "0.65rem", color: "var(--slate)" }}>{item.eventType as string}</span>
                    )}
                    {(item.cycle as string | undefined) && (
                      <span style={{ fontSize: "0.65rem", color: "var(--slate)" }}>{item.cycle as string}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    onClick={() => handleAction(activeType, item.id, "approve")}
                    disabled={processing === item.id}
                    style={btnStyle("approve")}
                  >
                    Freigeben
                  </button>
                  <button
                    onClick={() => setRejectId({ type: activeType, id: item.id })}
                    disabled={processing === item.id}
                    style={btnStyle("reject")}
                  >
                    Ablehnen
                  </button>
                </div>
              </div>

              {/* Reject form (inline) */}
              {rejectId?.id === item.id && rejectId.type === activeType && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <input
                    type="text"
                    placeholder="Begründung (optional)"
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "5px 10px",
                      background: "var(--stone)",
                      border: "1px solid var(--border)",
                      borderRadius: 2,
                      color: "var(--mist)",
                      fontSize: "0.8rem",
                      fontFamily: "Cinzel, serif",
                    }}
                  />
                  <button
                    onClick={() => handleAction(activeType, item.id, "reject", rejectNotes)}
                    style={btnStyle("reject")}
                  >
                    Bestätigen
                  </button>
                  <button
                    onClick={() => { setRejectId(null); setRejectNotes(""); }}
                    style={btnStyle("secondary")}
                  >
                    Abbrechen
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
