interface ResultCardProps {
  type: string;
  label: string;
  meta?: string;
  quote: string;
  description?: string;
}

export default function ResultCard({ type, label, meta, quote, description }: ResultCardProps) {
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
