"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  characters: number;
  events: number;
  sources: number;
  artifacts: number;
  places: number;
}

const CYCLES = [
  { key: "mythological", label: "Mythologischer Zyklus", color: "#e87878",
    desc: "Die sechs Landnahmen, die Tuatha Dé Danann, die Schlachten von Mag Tuired, Étaín und die Kinder Lirs.",
    ogham: "ᚋ" },
  { key: "ulster", label: "Ulster-Zyklus", color: "#78b4e8",
    desc: "Cú Chulainn, König Conchobar, Deirdre der Sorgen und der große Rinderraub von Cooley.",
    ogham: "ᚒ" },
  { key: "fenian", label: "Fenian-Zyklus", color: "#a0c878",
    desc: "Fionn mac Cumhaill und die Fianna, der Lachs der Weisheit, Diarmuid und Gráinne, Oisín in Tír na nÓg.",
    ogham: "ᚃ" },
  { key: "kings", label: "Königs-Zyklus", color: "#e0a84a",
    desc: "Conn der hundert Schlachten, der weise Cormac, Conaire Mórs Untergang und der wahnsinnige Suibhne.",
    ogham: "ᚊ" },
];

const EXPLORE = [
  { href: "/timeline",   icon: "⟶", title: "Timeline", desc: "Die Mythen als geordneter Ereignisgraph — vom Groben ins Detail zoombar, mit Charakterfokus." },
  { href: "/characters", icon: "⚔", title: "Charaktere", desc: "Götter, Helden und Könige mit Eigenschaften, Quellen und vollständigen Stammbäumen." },
  { href: "/artifacts",  icon: "◆", title: "Artefakte", desc: "Die vier Schätze, Gáe Bulg, die Harfe des Dagda — und wer sie trug." },
  { href: "/places",     icon: "◉", title: "Orte", desc: "Tara, Emain Macha, die Anderswelt: die mythische Landkarte Irlands." },
];

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/characters").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
      fetch("/api/sources").then((r) => r.json()),
      fetch("/api/artifacts").then((r) => r.json()),
      fetch("/api/places").then((r) => r.json()),
    ]).then(([chars, events, sources, artifacts, places]) => {
      setStats({
        characters: chars.length,
        events: events.length,
        sources: sources.length,
        artifacts: artifacts.length,
        places: places.length,
      });
    });
  }, []);

  return (
    <div className="page-enter">
      {/* Hero */}
      <div className="hero">
        <div style={{ fontSize: "2.6rem", marginBottom: "0.75rem", letterSpacing: "0.35em", color: "var(--gold)", textShadow: "0 0 24px rgba(224,168,74,0.4)" }}>
          ᚈ ᚐ ᚔ ᚅ
        </div>
        <h1 className="hero-title">Tain Line</h1>
        <p className="hero-sub">
          Die irisch-keltische Mythologie als lebendiger Wissensgraph: Charaktere, Ereignisse,
          Stammbäume, Artefakte und Orte — quellenbelegt und miteinander verwoben, von der
          ersten Landnahme bis zum Gespräch der Alten.
        </p>

        {/* Stats */}
        {stats && (
          <div className="stat-row">
            {[
              { label: "Charaktere", value: stats.characters, href: "/characters" },
              { label: "Ereignisse", value: stats.events, href: "/events" },
              { label: "Artefakte", value: stats.artifacts, href: "/artifacts" },
              { label: "Orte", value: stats.places, href: "/places" },
              { label: "Quellen", value: stats.sources, href: "/sources" },
            ].map((s) => (
              <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
                <div className="stat-tile card">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/timeline" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ padding: "0.8rem 2.2rem" }}>
              ⟶ Timeline erkunden
            </button>
          </Link>
          <Link href="/characters" className="btn-login" style={{ padding: "0.8rem 2.2rem", display: "inline-flex", alignItems: "center" }}>
            Charaktere entdecken
          </Link>
        </div>
      </div>

      <div className="rune-divider" style={{ maxWidth: 480, margin: "0 auto 3rem" }}>
        ✦ ᚁᚂᚃᚄᚅ ✦
      </div>

      {/* Die vier Zyklen */}
      <section style={{ marginBottom: "3.5rem" }}>
        <h2 className="section-header" style={{ fontSize: "1.1rem", letterSpacing: "0.2em", textTransform: "uppercase", justifyContent: "center" }}>
          Die vier Zyklen
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
          }}
        >
          {CYCLES.map((c) => (
            <Link key={c.key} href={`/events?cycle=${c.key}`} style={{ textDecoration: "none" }}>
              <div
                className="card"
                style={{ padding: "1.4rem 1.25rem", borderTop: `3px solid ${c.color}`, height: "100%" }}
              >
                <div style={{ fontSize: "1.6rem", color: c.color, opacity: 0.7, marginBottom: "0.5rem" }}>{c.ogham}</div>
                <h3 style={{ fontFamily: "Cinzel, serif", fontSize: "0.95rem", color: c.color, margin: "0 0 0.5rem", letterSpacing: "0.05em" }}>
                  {c.label}
                </h3>
                <p style={{ color: "var(--mist)", fontSize: "0.88rem", margin: 0, lineHeight: 1.55 }}>
                  {c.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Erkunden */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 className="section-header" style={{ fontSize: "1.1rem", letterSpacing: "0.2em", textTransform: "uppercase", justifyContent: "center" }}>
          Erkunden
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1rem" }}>
          {EXPLORE.map((e) => (
            <Link key={e.href} href={e.href} style={{ textDecoration: "none" }}>
              <div className="card celtic-border" style={{ padding: "1.25rem", height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                  <span style={{ color: "var(--gold)", fontSize: "1.1rem" }}>{e.icon}</span>
                  <span style={{ fontFamily: "Cinzel, serif", color: "var(--amber)", fontSize: "0.95rem", letterSpacing: "0.08em" }}>
                    {e.title}
                  </span>
                </div>
                <p style={{ color: "var(--mist)", fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>{e.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Mitwirken */}
      <section style={{ textAlign: "center", padding: "1.5rem 0 0.5rem" }}>
        <p style={{ color: "var(--slate)", fontSize: "0.9rem", maxWidth: 560, margin: "0 auto" }}>
          Lesen ist für alle frei. Wer beitragen möchte, braucht ein Konto mit Editor-Rechten —
          jede vorgeschlagene Information durchläuft die Review-Queue, bevor sie sichtbar wird.
        </p>
        <div style={{ marginTop: "0.75rem" }}>
          <Link href="/register" style={{ color: "var(--gold)", fontFamily: "Cinzel, serif", fontSize: "0.8rem", letterSpacing: "0.1em" }}>
            → Konto erstellen
          </Link>
        </div>
      </section>
    </div>
  );
}
