# Tain Line — Entwicklungsplan

## Projektziel

Tain Line ist ein **Mythologie-Wissensgraph**: eine Anwendung zur strukturierten Erfassung, Verwaltung und Darstellung von Informationen aus irisch-keltischen Mythen und Sagen. Das Grundkonzept ist auf weitere Mythologien erweiterbar.

**Kernprinzip:** Die Informationserfassung steht im Vordergrund. Die Visualisierung dient als Motivationswerkzeug und zur Datenprüfung. Jede Information muss durch einen Menschen geprüft und freigegeben werden, bevor sie in die Datenhaltung einfliesst — inklusive Quellenangabe und Originalzitat aus der Sage.

---

## Phasenübersicht

| Phase | Schwerpunkt | Status |
|---|---|---|
| P0 | Fundament (Auth + Approval-Schema) | 🔜 Next |
| P1 | Datenerfassung (KI-Workflow + Formulare) | 🔜 Planned |
| P2 | Datenqualität | 🔜 Planned |
| P3 | UI & Darstellung | 🔜 Planned |
| P4 | Erweiterungen & Integrationen | 🔜 Planned |
| P5 | Server-Deployment | 🔜 Planned |
| P6 | UI-Optimierung & Mobile App | 🔜 Planned |

---

## 🔴 P0 — Fundament

Blockiert alle nachfolgenden Phasen.

### Authentifizierung
- Email + Passwort, JWT oder NextAuth.js Session
- Vorerst einzelner Admin-Zugang
- Erweiterbar auf Rollen: `admin` | `editor` | `reviewer` | `readonly`

### Approval-Workflow im Schema
Alle zentralen Tabellen (`characters`, `events`, `familyRelations`, `places`, `groups`, `sources`) erhalten:

```sql
status        TEXT    -- "draft" | "pending_review" | "approved" | "rejected"
source_quote  TEXT    -- exakter Satz aus der Originalquelle
proposed_by   TEXT    -- "human" | "ai"
reviewed_at   TIMESTAMP
review_notes  TEXT    -- Begründung bei Ablehnung
```

Entitäten mit `status != "approved"` sind in der öffentlichen App unsichtbar.

---

## 🟠 P1 — Datenerfassung

Das eigentliche Kernziel der ersten Phase.

### KI-gestützter Erfassungs-Workflow
- Saga-Text einfügen (Paste oder URL zur CELT-Datenbank / anderen Quellen)
- Claude analysiert den Text und schlägt strukturiert vor:
  - Charaktere mit Eigenschaften (Name, Geschlecht, Gottheit-Status, etc.)
  - Events mit Typ und zeitlicher Einordnung
  - Relationen zwischen Charakteren
  - Gruppen- und Ortszugehörigkeiten
- Für jeden Vorschlag: **exakter Originalzitat** aus dem Quelltext
- Alle Vorschläge landen als `status: "pending_review"`

### Review-Queue (`/admin/review`)
- Liste aller ausstehenden Entitäten, gruppiert nach Typ
- Vorgeschlagener Wert und Quellzitat nebeneinander sichtbar
- Aktionen: **Approve** / **Reject** (mit Begründung) / **Edit & Approve**
- Duplikatserkennung: "Bereits vorhanden → mit bestehendem Eintrag mergen"

### Manuelle Erfassungsformulare
- CRUD-Formulare für alle Entitätstypen (Charakter, Event, Relation, Ort, Gruppe)
- Pflichtfeld: Quellenangabe (`source_id`) + Zitat (`source_quote`)
- Direkt in `pending_review` gespeichert, nicht an der Queue vorbei

---

## 🟡 P2 — Datenqualität

### Vollständigkeits-Indikatoren
- Zeige auf Charakter-Profilen: welche Felder fehlen noch?
- Hat der Charakter Geburt / Tod / mindestens eine Relation / eine Quelle?
- Dient als Motivation zur weiteren Befüllung

### Konfidenz-Management (Ausbau)
- Bereits teilweise vorhanden (`confidence` auf Relations)
- Ausbauen auf alle Entitäten
- KI-Vorschläge = `speculative`, handkuratiert = `established`

### Duplikatserkennung
- Beim Erfassen: Namensvergleich inkl. Alternativnamen
- Vorschlag zum Mergen statt Neuanlage

### Seed-Daten ausbauen
- `cmt-deep` und `core` Seeds mit bedeutsamen Narrativ-Events anreichern:
  - Schlachten (battle)
  - Krönungen / Herrschaftswechsel (reign)
  - Ankünfte von Gruppen in Irland (journey)
  - Konstruktionen, Zerstörungen, Transformationen
  - Prophezeiungen

---

## 🟢 P3 — UI & Darstellung

### Keltisches Theme
- Keltische Ornamente / Knotenmuster als dekorative Elemente
- Konsistente Farbpalette verfeinern
- Schriftartkombination optimieren (Cinzel bereits vorhanden)
- Ladezustände verbessern

### Such- und Filterfunktionen
- Volltext-Suche über alle Entitäten (Charaktere, Events, Orte, Gruppen)
- Aktuell nur rudimentär vorhanden

### Charakterprofil ausbauen
- Alle Events, Gruppen-Zugehörigkeit, Quellenaussagen direkt auf dem Profil
- Verwandte Charaktere als Vorschau

### Timeline & Graph Verfeinerung
- Seed-Daten anreichern → dichterer Hauptstrang sichtbar
- Swimlane-Darstellung weiter verfeinern

---

## 🔵 P4 — Erweiterungen & Integrationen

- **Weitere Mythologien** — Schema ist bereits generisch gehalten (griechisch, nordisch, etc.)
- **Export** — JSON-LD / RDF für Semantic-Web-Kompatibilität
- **Öffentliche Ansicht** — Read-Only ohne Login vs. Admin-Bearbeitung
- **Erweiterte Relationen** — geographische Karten, Zeitleisten pro Ort
- **KI-Bildgenerierung** — Charakterbilder basierend auf gesammelten Beschreibungen (vorbereiten)
- **Spiele / andere Anwendungsfälle** — auf Basis des Wissensgraphen (vorbereiten)

---

## 🟣 P5 — Server-Deployment

### Infrastruktur
- Hosting-Entscheid: VPS (z.B. Hetzner, DigitalOcean) oder PaaS (Railway, Fly.io, Render)
- Datenbank-Migration: SQLite → PostgreSQL (oder SQLite mit Litestream-Backup)
- Environment-Verwaltung: `.env.production`, Secrets-Management

### CI/CD
- GitHub Actions Pipeline:
  - `push to main` → Lint + Type-Check + Tests → Build → Deploy
  - Branch-Previews für Feature-Entwicklung
- Automatische Datenbank-Migrationen beim Deploy

### Betrieb
- Monitoring & Error-Tracking (z.B. Sentry)
- Backup-Strategie für die Datenbank
- SSL / Custom Domain

---

## ⚪ P6 — UI-Optimierung & Mobile App

### Web-UI Optimierung
- Performance-Optimierung (Lazy Loading, Code Splitting)
- Accessibility (ARIA, Keyboard-Navigation)
- Responsive Design für Tablets
- Dark/Light Theme Toggle (Celtic Varianten)

### Mobile App
- Entscheid: React Native (Code-Sharing mit Web) vs. Progressive Web App (PWA)
- PWA als erster Schritt: Offline-Fähigkeit, App-Installation auf Homescreen
- Fokus mobile: Lesen und einfache Datenerfassung (Notizen aus dem Feld)
- Vollständige App-Funktionalität in Phase 2 der Mobile-Entwicklung

---

## Technologie-Stack (aktuell)

| Bereich | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Datenbank | SQLite via better-sqlite3 |
| ORM | Drizzle ORM |
| Graph-Visualisierung | @xyflow/react (ReactFlow) |
| Styling | CSS Variables + Tailwind |
| Tests | Vitest + Playwright |
| Sprache | TypeScript |

---

## Referenzen & Quellen

- [CELT — Corpus of Electronic Texts](https://celt.ucc.ie/) — Primärquellen irischer Mythen
- [Cath Maige Tuired](https://celt.ucc.ie/published/T300010/) — Zweite Schlacht von Mag Tuired
- [Lebor Gabála Érenn](https://celt.ucc.ie/published/T100055/) — Buch der Invasionen
- [Táin Bó Cúailnge](https://celt.ucc.ie/published/T301035/) — Der Rinderraub von Cooley
