# Tain Line

Ein **Mythologie-Wissensgraph** zur strukturierten Erfassung, Verwaltung und Darstellung von Informationen aus irisch-keltischen Mythen und Sagen.

## Zweck

Aus den überlieferten Sagen (Cath Maige Tuired, Táin Bó Cúailnge, Lebor Gabála Érenn u.a.) werden alle extrahierbaren Informationen strukturiert erfasst: Charaktere, Ereignisse, Relationen, Orte, Gruppen — jede Information verknüpft mit Quellenangabe und Originalzitat. Daraus entstehen ein Wissensgraph und eine interaktive Darstellung, die "Pseudo-Schlussfolgerungen" und Zusammenhänge sichtbar macht, die im Fliesstext der Quellen verborgen bleiben.

Das Grundkonzept ist auf andere Mythologien erweiterbar (griechisch, nordisch, etc.).

**Kernprinzip:** Jede Information muss durch einen Menschen geprüft und freigegeben werden, bevor sie in die Datenhaltung einfliesst.

## Features (aktueller Stand)

- **Charakterprofile** — mit Eigenschaften, Epitheta, Gruppen- und Quellenzugehörigkeit
- **Stammbaum-Graph** — interaktiver Familienstammbaum pro Charakter (ReactFlow)
- **Timeline-Graph** — chronologischer Ereignisgraph mit Zyklen (Mythologisch / Ulster / Fenian / Könige) und Charakter-Swimlanes
- **Events** — Schlachten, Krönungen, Reisen, Prophezeiungen u.a. mit Typisierung und Quellenverknüpfung
- **Seed-Daten** — Basisdatensatz irisch-keltische Mythologie (CMT-Deep, Core)

## Entwicklungsplan

Siehe [`plan.md`](./plan.md) für die vollständige Roadmap (P0–P6).

Kurzübersicht:
- **P0** — Authentifizierung + Approval-Workflow-Schema
- **P1** — KI-gestützte Datenerfassung mit Review-Queue
- **P2** — Datenqualität, Vollständigkeit, Duplikatserkennung
- **P3** — UI-Verfeinerung, keltisches Theme, Suche
- **P4** — Weitere Mythologien, Export, Erweiterungen
- **P5** — Server-Deployment, CI/CD, Betrieb
- **P6** — UI-Optimierung & Mobile App

## Lokale Entwicklung

```bash
npm install
npm run dev
```

App läuft auf [http://localhost:3000](http://localhost:3000).

### Datenbank

```bash
npm run db:migrate          # Schema-Migrationen ausführen
npm run db:seed core        # Basisdaten laden
npm run db:seed cmt-deep    # Cath Maige Tuired Tiefendaten laden
npm run db:reset core       # DB zurücksetzen und neu befüllen
```

### Tests

```bash
npm test                    # Unit Tests (Vitest)
npm run test:e2e            # End-to-End Tests (Playwright)
```

## Technologie-Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Datenbank | SQLite via better-sqlite3 |
| ORM | Drizzle ORM |
| Graph-Visualisierung | @xyflow/react (ReactFlow) |
| Tests | Vitest + Playwright |
| Sprache | TypeScript |

## Quellen

- [CELT — Corpus of Electronic Texts](https://celt.ucc.ie/) — Digitalisierte Primärquellen
- [Cath Maige Tuired](https://celt.ucc.ie/published/T300010/)
- [Lebor Gabála Érenn](https://celt.ucc.ie/published/T100055/)
- [Táin Bó Cúailnge](https://celt.ucc.ie/published/T301035/)
