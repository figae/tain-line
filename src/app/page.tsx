"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  characters: number;
  events: number;
  sources: number;
  groups: number;
}

const CYCLES = [
  { key: "mythological", label: "Mythologischer Zyklus", color: "#e87878", desc: "Götter, Tuatha Dé Danann, Schlachten der Urzeit" },
  { key: "ulster",       label: "Ulster-Zyklus",         color: "#78b4e8", desc: "Cú Chulainn, König Conchobar, Táin Bó Cúailnge" },
  { key: "fenian",       label: "Fenian-Zyklus",         color: "#a0c878", desc: "Fionn mac Cumhaill und die Fianna" },
  { key: "kings",        label: "Königs-Zyklus",         color: "#e0a84a", desc: "Halbhistorische Könige Irlands" },
];

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const safeJson = (r: Response) => r.ok ? r.json() : Promise.resolve([]);
    Promise.all([
      fetch("/api/characters").then(safeJson).catch(() => []),
      fetch("/api/events").then(safeJson).catch(() => []),
      fetch("/api/sources").then(safeJson).catch(() => []),
      fetch("/api/groups").then(safeJson).catch(() => []),
    ]).then(([chars, events, sources, groups]) => {
      setStats({
        characters: Array.isArray(chars) ? chars.length : 0,
        events: Array.isArray(events) ? events.length : 0,
        sources: Array.isArray(sources) ? sources.length : 0,
        groups: Array.isArray(groups) ? groups.length : 0,
      });
    });
  }, []);

  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "3rem 0 2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem", letterSpacing: "0.3em", color: "var(--gold)" }}>
          ᚈ ᚐ ᚔ ᚅ
        </div>
        <h1 style={{ fontSize: "2.5rem", margin: "0 0 0.5rem", color: "var(--amber)" }}>
          Tain Line
        </h1>
        <p style={{ color: "var(--mist)", fontSize: "1.1rem", maxWidth: 520, margin: "0 auto 2rem" }}>
          Eine lebendige Wissensbank der irisch-keltischen Mythologie. Charaktere,
          Ereignisse, Stammbäume und Quellen — alles miteinander verknüpft.
        </p>

        <div className="rune-divider" style={{ maxWidth: 400, margin: "0 auto 2.5rem" }}>
          ✦ ᚁᚂᚃᚄᚅ ✦
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
            marginBottom: "3rem",
          }}
        >
          {[
            { label: "Charaktere",  value: stats.characters, href: "/characters", icon: "⚔" },
            { label: "Events",      value: stats.events,     href: "/events",     icon: "⚡" },
            { label: "Quellen",     value: stats.sources,    href: "/sources",    icon: "📜" },
            { label: "Gruppen",     value: stats.groups,     href: "/characters", icon: "🛡" },
          ].map((s) => (
            <Link
              key={s.label}
              href={s.href}
              style={{ textDecoration: "none" }}
            >
              <div
                className="card celtic-border"
                style={{ padding: "1.5rem", textAlign: "center" }}
              >
                <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{s.icon}</div>
                <div
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: "var(--amber)",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.7rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--mist)",
                    marginTop: "0.25rem",
                  }}
                >
                  {s.label}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Zyklen */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.3rem", marginBottom: "1.25rem" }}>Die vier Zyklen</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {CYCLES.map((c) => (
            <Link
              key={c.key}
              href={`/events?cycle=${c.key}`}
              style={{ textDecoration: "none" }}
            >
              <div
                className="card"
                style={{
                  padding: "1.25rem",
                  borderLeft: `3px solid ${c.color}`,
                }}
              >
                <h3
                  style={{
                    fontFamily: "Cinzel, serif",
                    fontSize: "0.9rem",
                    color: c.color,
                    margin: "0 0 0.5rem",
                    letterSpacing: "0.05em",
                  }}
                >
                  {c.label}
                </h3>
                <p style={{ color: "var(--mist)", fontSize: "0.9rem", margin: 0 }}>
                  {c.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 style={{ fontSize: "1.3rem", marginBottom: "1.25rem" }}>Erkunden</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/timeline">
            <button
              style={{
                background: "var(--gold)",
                color: "var(--stone)",
                border: "none",
                padding: "0.75rem 2rem",
                fontFamily: "Cinzel, serif",
                fontSize: "0.85rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "2px",
              }}
            >
              → Timeline ansehen
            </button>
          </Link>
          <Link href="/characters">
            <button
              style={{
                background: "transparent",
                color: "var(--amber)",
                border: "1px solid var(--border-bright)",
                padding: "0.75rem 2rem",
                fontFamily: "Cinzel, serif",
                fontSize: "0.85rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "2px",
              }}
            >
              → Charaktere
            </button>
          </Link>
          <Link href="/events">
            <button
              style={{
                background: "transparent",
                color: "var(--amber)",
                border: "1px solid var(--border-bright)",
                padding: "0.75rem 2rem",
                fontFamily: "Cinzel, serif",
                fontSize: "0.85rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "2px",
              }}
            >
              → Events
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
