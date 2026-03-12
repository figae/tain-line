"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CharDetail {
  id: number;
  name: string;
  altNames: string[];
  gender: string;
  epithet: string | null;
  isDeity: boolean;
  isDead: boolean;
  description: string | null;
  source: { title: string; url: string | null; year: number | null } | null;
  properties: {
    id: number;
    type: string;
    value: string;
    notes: string | null;
    sourceTitle: string | null;
    sourceUrl: string | null;
  }[];
  groups: { id: number; name: string }[];
  family: {
    from: { id: number; toCharacterId: number; toName: string; relationType: string; notes: string | null }[];
    to:   { id: number; fromCharacterId: number; fromName: string; relationType: string; notes: string | null }[];
  };
  events: {
    eventId: number;
    eventName: string;
    eventType: string | null;
    parentEventId: number | null;
    cycle: string;
    role: string;
  }[];
}

interface RelationItem {
  charId: number;
  charName: string;
  label: string;
  notes: string | null;
  category: string;
  relationType: string;
}

// Display labels when someone else IS [type] OF this character (family.to)
const LABEL_TO: Record<string, { label: string; category: string }> = {
  father:       { label: "Vater",           category: "parents"  },
  mother:       { label: "Mutter",          category: "parents"  },
  foster_parent:{ label: "Ziehelternteil",  category: "parents"  },
  child:        { label: "Kind",            category: "children" },
  foster_child: { label: "Ziehkind",        category: "children" },
  sibling:      { label: "Geschwister",     category: "siblings" },
  half_sibling: { label: "Halbgeschwister", category: "siblings" },
  spouse:       { label: "Ehepartner/in",   category: "partners" },
  lover:        { label: "Liebhaber/in",    category: "partners" },
  grandparent:  { label: "Großelternteil",  category: "extended" },
  grandchild:   { label: "Enkelkind",       category: "extended" },
  uncle:        { label: "Onkel",           category: "extended" },
  aunt:         { label: "Tante",           category: "extended" },
  nephew:       { label: "Neffe",           category: "extended" },
  niece:        { label: "Nichte",          category: "extended" },
  aspect:       { label: "Aspekt",          category: "aspects"  },
  other:        { label: "Verbunden",       category: "other"    },
};

// Display labels when this character IS [type] OF someone else (family.from — inverse)
const LABEL_FROM: Record<string, { label: string; category: string }> = {
  father:       { label: "Kind",            category: "children" },
  mother:       { label: "Kind",            category: "children" },
  child:        { label: "Elternteil",      category: "parents"  },
  foster_parent:{ label: "Ziehkind",        category: "children" },
  foster_child: { label: "Ziehelternteil",  category: "parents"  },
  sibling:      { label: "Geschwister",     category: "siblings" },
  half_sibling: { label: "Halbgeschwister", category: "siblings" },
  spouse:       { label: "Ehepartner/in",   category: "partners" },
  lover:        { label: "Liebhaber/in",    category: "partners" },
  grandparent:  { label: "Enkelin/Enkel",   category: "extended" },
  grandchild:   { label: "Großelternteil",  category: "extended" },
  uncle:        { label: "Neffe/Nichte",    category: "extended" },
  aunt:         { label: "Neffe/Nichte",    category: "extended" },
  nephew:       { label: "Onkel/Tante",     category: "extended" },
  niece:        { label: "Onkel/Tante",     category: "extended" },
  aspect:       { label: "Aspekt von",      category: "aspects"  },
  other:        { label: "Verbunden",       category: "other"    },
};

const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  parents:  { label: "Eltern",           color: "var(--gold)",     icon: "↑" },
  children: { label: "Kinder",           color: "var(--sage)",     icon: "↓" },
  siblings: { label: "Geschwister",      color: "#78b4e8",         icon: "↔" },
  partners: { label: "Partner",          color: "#e87878",         icon: "♡" },
  extended: { label: "Weitere Familie",  color: "var(--mist)",     icon: "◈" },
  aspects:  { label: "Aspekte",          color: "#a87ed8",         icon: "⟳" },
  other:    { label: "Verbindungen",     color: "var(--slate)",    icon: "◆" },
};

const CATEGORY_ORDER = ["parents", "children", "siblings", "partners", "extended", "aspects", "other"];

const PROP_ICONS: Record<string, string> = {
  color:     "◈",
  animal:    "◉",
  weapon:    "⚔",
  clothing:  "◇",
  place:     "◎",
  epithet:   "◆",
  attribute: "✦",
  skill:     "⚡",
  other:     "◆",
};

const CYCLE_LABELS: Record<string, string> = {
  mythological: "Mythologisch",
  ulster:       "Ulster",
  fenian:       "Fenian",
  kings:        "Königs",
  other:        "Sonstig",
};

const EVENT_TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  birth:          { icon: "✦", color: "var(--sage)",  label: "Geburt"       },
  death:          { icon: "✝", color: "#c87878",      label: "Tod"          },
  meeting:        { icon: "☍", color: "#78b4e8",      label: "Begegnung"    },
  battle:         { icon: "⚔", color: "#e87878",      label: "Schlacht"     },
  reign:          { icon: "♛", color: "var(--gold)",  label: "Herrschaft"   },
  transformation: { icon: "⟳", color: "#a87ed8",      label: "Verwandlung"  },
  prophecy:       { icon: "◎", color: "#e8c878",      label: "Prophezeiung" },
  journey:        { icon: "➢", color: "var(--moss)",  label: "Reise"        },
  other:          { icon: "◆", color: "var(--slate)", label: "Ereignis"     },
};

function buildRelations(family: CharDetail["family"]): RelationItem[] {
  const items: RelationItem[] = [];

  for (const r of family.to) {
    const meta = LABEL_TO[r.relationType] ?? { label: r.relationType, category: "other" };
    items.push({
      charId: r.fromCharacterId,
      charName: r.fromName,
      label: meta.label,
      notes: r.notes,
      category: meta.category,
      relationType: r.relationType,
    });
  }

  for (const r of family.from) {
    const meta = LABEL_FROM[r.relationType] ?? { label: r.relationType, category: "other" };
    items.push({
      charId: r.toCharacterId,
      charName: r.toName,
      label: meta.label,
      notes: r.notes,
      category: meta.category,
      relationType: r.relationType,
    });
  }

  return items;
}

export default function CharacterDetail() {
  const params = useParams();
  const [char, setChar] = useState<CharDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/characters/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setChar(d); setLoading(false); });
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
      </div>
    );
  }

  if (!char) {
    return <div style={{ color: "var(--mist)", padding: "2rem" }}>Charakter nicht gefunden.</div>;
  }

  const propGroups = char.properties.reduce<Record<string, typeof char.properties>>(
    (acc, p) => {
      if (!acc[p.type]) acc[p.type] = [];
      acc[p.type].push(p);
      return acc;
    },
    {}
  );

  const relations = buildRelations(char.family);
  const relByCategory = relations.reduce<Record<string, RelationItem[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  // Separate lifecycle (birth/death) from other events
  const lifecycleEvents = char.events.filter(
    (e) => e.eventType === "birth" || e.eventType === "death"
  );
  const narrativeEvents = char.events.filter(
    (e) => e.eventType !== "birth" && e.eventType !== "death"
  );

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <Link
        href="/characters"
        style={{ color: "var(--slate)", textDecoration: "none", fontSize: "0.85rem", fontFamily: "Cinzel, serif", letterSpacing: "0.1em" }}
      >
        ← Charaktere
      </Link>

      {/* Header */}
      <div
        className="celtic-border"
        style={{
          marginTop: "1.5rem",
          marginBottom: "2rem",
          padding: "2rem",
          background: "var(--bark)",
          borderLeft: char.isDeity ? "4px solid var(--gold)" : "4px solid var(--moss)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", margin: "0 0 0.25rem" }}>{char.name}</h1>
            {char.epithet && (
              <div style={{ color: "var(--amber)", fontStyle: "italic", fontSize: "1.1rem" }}>
                {char.epithet}
              </div>
            )}
            {char.altNames.length > 0 && (
              <div style={{ color: "var(--slate)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                Auch bekannt als: {char.altNames.join(", ")}
              </div>
            )}

            {/* Lifecycle quick info */}
            {lifecycleEvents.length > 0 && (
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                {lifecycleEvents.map((e) => {
                  const meta = EVENT_TYPE_META[e.eventType ?? "other"];
                  return (
                    <Link
                      key={e.eventId}
                      href={`/events/${e.eventId}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "2px 10px",
                        background: `${meta.color}22`,
                        border: `1px solid ${meta.color}55`,
                        borderRadius: "2px",
                        color: meta.color,
                        fontSize: "0.8rem",
                        textDecoration: "none",
                        fontFamily: "Cinzel, serif",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {meta.icon} {e.eventName}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", alignItems: "flex-end" }}>
            {char.groups.map((g) => (
              <span key={g.id} className="badge" style={{ background: "rgba(61,74,46,0.3)", color: "var(--sage)", border: "1px solid rgba(61,74,46,0.6)", fontSize: "0.7rem" }}>
                {g.name}
              </span>
            ))}
            {char.isDeity && (
              <span className="badge" style={{ background: "rgba(200,145,58,0.15)", color: "var(--amber)", border: "1px solid rgba(200,145,58,0.4)", fontSize: "0.7rem" }}>
                Gottheit
              </span>
            )}
            {char.isDead && (
              <span className="badge" style={{ background: "rgba(122,32,32,0.2)", color: "#e87878", border: "1px solid rgba(122,32,32,0.4)", fontSize: "0.7rem" }}>
                Verstorben
              </span>
            )}
            <span className="badge" style={{ background: "var(--peat)", color: "var(--slate)", border: "1px solid var(--border)", fontSize: "0.7rem", textTransform: "capitalize" }}>
              {char.gender}
            </span>
          </div>
        </div>

        {char.description && (
          <p style={{ color: "var(--mist)", marginTop: "1rem", marginBottom: 0, fontSize: "1rem" }}>
            {char.description}
          </p>
        )}

        {char.source && (
          <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--slate)", fontStyle: "italic" }}>
            Quelle:{" "}
            {char.source.url ? (
              <a href={char.source.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>
                {char.source.title}
              </a>
            ) : (
              char.source.title
            )}
            {char.source.year && ` (${char.source.year})`}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Left column: Properties */}
        <div>
          {Object.keys(propGroups).length > 0 && (
            <>
              <h2 style={{ fontSize: "0.85rem", marginBottom: "0.75rem", color: "var(--amber)", fontFamily: "Cinzel, serif", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Eigenschaften
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {Object.entries(propGroups).map(([type, props]) => (
                  <div key={type} className="card" style={{ padding: "0.75rem 1rem" }}>
                    <div
                      style={{
                        fontFamily: "Cinzel, serif",
                        fontSize: "0.7rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--slate)",
                        marginBottom: "0.4rem",
                      }}
                    >
                      {PROP_ICONS[type]} {type}
                    </div>
                    {props.map((p) => (
                      <div key={p.id} style={{ marginBottom: "0.35rem" }}>
                        <span style={{ color: "var(--cream)" }}>{p.value}</span>
                        {p.notes && (
                          <span style={{ color: "var(--slate)", fontSize: "0.85rem", marginLeft: "0.5rem", fontStyle: "italic" }}>
                            — {p.notes}
                          </span>
                        )}
                        {p.sourceTitle && (
                          <div style={{ fontSize: "0.75rem", color: "var(--slate)" }}>
                            ◎{" "}
                            {p.sourceUrl ? (
                              <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>
                                {p.sourceTitle}
                              </a>
                            ) : (
                              p.sourceTitle
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right column: Family + Events */}
        <div>
          {/* Family relations by category */}
          {relations.length > 0 && (
            <>
              <h2 style={{ fontSize: "0.85rem", marginBottom: "0.75rem", color: "var(--amber)", fontFamily: "Cinzel, serif", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Familie & Beziehungen
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {CATEGORY_ORDER.filter((cat) => relByCategory[cat]?.length > 0).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const items = relByCategory[cat];
                  return (
                    <div key={cat} className="card" style={{ padding: "0.75rem 1rem", borderLeft: `3px solid ${meta.color}55` }}>
                      <div
                        style={{
                          fontFamily: "Cinzel, serif",
                          fontSize: "0.7rem",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: meta.color,
                          marginBottom: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        {items.map((r, i) => (
                          <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "baseline", flexWrap: "wrap" }}>
                            <span style={{ color: "var(--slate)", fontSize: "0.8rem", minWidth: "5rem" }}>
                              {r.label}:
                            </span>
                            <Link
                              href={`/characters/${r.charId}`}
                              style={{ color: "var(--cream)", textDecoration: "none", fontSize: "0.9rem" }}
                            >
                              {r.charName}
                            </Link>
                            {r.notes && (
                              <span style={{ color: "var(--slate)", fontSize: "0.75rem", fontStyle: "italic" }}>
                                ({r.notes})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Narrative events (non-lifecycle) */}
          {narrativeEvents.length > 0 && (
            <>
              <h2 style={{ fontSize: "0.85rem", marginBottom: "0.75rem", color: "var(--amber)", fontFamily: "Cinzel, serif", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Beteiligte Events
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {narrativeEvents.map((e) => {
                  const typeMeta = EVENT_TYPE_META[e.eventType ?? "other"] ?? EVENT_TYPE_META.other;
                  return (
                    <Link key={e.eventId} href={`/events/${e.eventId}`} style={{ textDecoration: "none" }}>
                      <div className="card" style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{ color: typeMeta.color, fontSize: "0.8rem" }} title={typeMeta.label}>
                              {typeMeta.icon}
                            </span>
                            <span style={{ color: "var(--cream)", fontSize: "0.9rem" }}>{e.eventName}</span>
                          </div>
                          <span className={`badge cycle-${e.cycle}`} style={{ flexShrink: 0, fontSize: "0.6rem" }}>
                            {CYCLE_LABELS[e.cycle] ?? e.cycle}
                          </span>
                        </div>
                        <div style={{ color: "var(--slate)", fontSize: "0.75rem", marginTop: "0.2rem", textTransform: "capitalize", paddingLeft: "1.3rem" }}>
                          {e.role}
                          {e.parentEventId && (
                            <span style={{ marginLeft: "0.4rem", color: "var(--slate)", fontStyle: "italic" }}>
                              · Teilereignis
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
