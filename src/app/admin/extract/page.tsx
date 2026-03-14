"use client";

import { useState } from "react";

interface ExtractionResult {
  extracted: {
    characters?: Array<{ name: string; gender?: string; epithet?: string; description?: string; sourceQuote: string }>;
    events?: Array<{ name: string; eventType?: string; cycle?: string; description?: string; sourceQuote: string }>;
    places?: Array<{ name: string; type?: string; description?: string; sourceQuote: string }>;
    groups?: Array<{ name: string; description?: string; sourceQuote: string }>;
    relations?: Array<{ fromName: string; toName: string; relationType: string; sourceQuote: string }>;
  };
  saved: Record<string, number[]>;
}

export default function ExtractPage() {
  const [text, setText] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sourceId: sourceId ? parseInt(sourceId) : undefined }),
      });
      const data = await res.json() as ExtractionResult & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Unbekannter Fehler");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const totalSaved = result
    ? Object.values(result.saved).reduce((s, a) => s + a.length, 0)
    : 0;

  const sectionLabel: React.CSSProperties = {
    fontFamily: "Cinzel, serif",
    fontSize: "0.7rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "var(--amber)",
    marginBottom: "0.5rem",
  };

  return (
    <div>
      <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "1.5rem", color: "var(--cream)", marginBottom: "0.25rem" }}>
        KI-Extraktion
      </h1>
      <p style={{ color: "var(--slate)", fontSize: "0.85rem", marginBottom: "2rem" }}>
        Sagentext einfügen → Claude analysiert und extrahiert strukturierte Daten → Review-Queue
      </p>

      {/* Input area */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", marginBottom: "0.75rem", alignItems: "end" }}>
        <div>
          <div style={sectionLabel}>Quell-ID (optional)</div>
          <input
            type="number"
            placeholder="source_id"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px",
              background: "var(--stone)",
              border: "1px solid var(--border)",
              borderRadius: 2,
              color: "var(--mist)",
              fontSize: "0.85rem",
              fontFamily: "Cinzel, serif",
            }}
          />
        </div>
        <div />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <div style={sectionLabel}>Sagentext</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder="Füge hier den Sagentext ein (Englisch oder Irisch/Altkeltisch)…"
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "var(--stone)",
            border: "1px solid var(--border)",
            borderRadius: 2,
            color: "var(--mist)",
            fontSize: "0.85rem",
            fontFamily: "Crimson Text, serif",
            lineHeight: 1.6,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>

      <button
        onClick={handleExtract}
        disabled={loading || text.trim().length < 20}
        style={{
          padding: "8px 24px",
          background: loading ? "var(--peat)" : "rgba(200,145,58,0.2)",
          color: loading ? "var(--slate)" : "var(--amber)",
          border: "1px solid",
          borderColor: loading ? "var(--border)" : "var(--amber)",
          borderRadius: 2,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "Cinzel, serif",
          fontSize: "0.75rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        {loading ? (
          <>
            <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
            Analysiere…
          </>
        ) : (
          "◎ Extrahieren"
        )}
      </button>

      {error && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(200,100,100,0.1)", border: "1px solid #c8787844", borderRadius: 4, color: "#c87878", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ fontFamily: "Cinzel, serif", color: "var(--gold)", fontSize: "1rem", marginBottom: "1.5rem" }}>
            ✦ {totalSaved} Einträge in Review-Queue gespeichert
          </div>

          {/* Characters */}
          {result.extracted.characters?.map((c, i) => (
            <ResultCard key={`c${i}`} type="Charakter" label={c.name} meta={[c.gender, c.epithet].filter(Boolean).join(" · ")} quote={c.sourceQuote} description={c.description} />
          ))}

          {/* Events */}
          {result.extracted.events?.map((e, i) => (
            <ResultCard key={`e${i}`} type="Event" label={e.name} meta={[e.eventType, e.cycle].filter(Boolean).join(" · ")} quote={e.sourceQuote} description={e.description} />
          ))}

          {/* Places */}
          {result.extracted.places?.map((p, i) => (
            <ResultCard key={`p${i}`} type="Ort" label={p.name} meta={p.type} quote={p.sourceQuote} description={p.description} />
          ))}

          {/* Groups */}
          {result.extracted.groups?.map((g, i) => (
            <ResultCard key={`g${i}`} type="Gruppe" label={g.name} quote={g.sourceQuote} description={g.description} />
          ))}

          {/* Relations */}
          {result.extracted.relations?.map((r, i) => (
            <ResultCard key={`r${i}`} type="Relation" label={`${r.fromName} → ${r.toName}`} meta={r.relationType} quote={r.sourceQuote} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ type, label, meta, quote, description }: {
  type: string;
  label: string;
  meta?: string;
  quote: string;
  description?: string;
}) {
  return (
    <div style={{
      background: "var(--bark)",
      border: "1px solid var(--border)",
      borderRadius: 4,
      padding: "0.85rem 1.1rem",
      marginBottom: "0.6rem",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem", marginBottom: "0.25rem" }}>
        <span style={{ fontSize: "0.6rem", fontFamily: "Cinzel, serif", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--amber)", background: "rgba(200,145,58,0.1)", padding: "1px 6px", borderRadius: 10 }}>
          {type}
        </span>
        <span style={{ fontFamily: "Cinzel, serif", color: "var(--cream)", fontSize: "0.9rem" }}>{label}</span>
        {meta && <span style={{ color: "var(--slate)", fontSize: "0.75rem" }}>{meta}</span>}
      </div>
      {description && (
        <p style={{ color: "var(--mist)", fontSize: "0.78rem", margin: "0.25rem 0 0.4rem" }}>{description}</p>
      )}
      <blockquote style={{ borderLeft: "2px solid var(--amber)", paddingLeft: "0.75rem", margin: 0, color: "var(--slate)", fontSize: "0.75rem", fontStyle: "italic" }}>
        „{quote}"
      </blockquote>
    </div>
  );
}
