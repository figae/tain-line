# Tain Line

Ein **Mythologie-Wissensgraph** zur strukturierten Erfassung, Verwaltung und Darstellung von Informationen aus irisch-keltischen Mythen und Sagen.

## Zweck

Aus den überlieferten Sagen (Cath Maige Tuired, Táin Bó Cúailnge, Lebor Gabála Érenn u.a.) werden alle extrahierbaren Informationen strukturiert erfasst: Charaktere, Ereignisse, Relationen, Orte, Gruppen, Artefakte — jede Information verknüpft mit Quellenangabe und Originalzitat. Daraus entstehen ein Wissensgraph und eine interaktive Darstellung, die Zusammenhänge sichtbar macht, die im Fliesstext der Quellen verborgen bleiben.

Das Grundkonzept ist auf andere Mythologien erweiterbar (griechisch, nordisch, etc.).

**Kernprinzip:** Jede Information muss durch einen Menschen geprüft und freigegeben werden, bevor sie in die Datenhaltung einfliesst.

## Features

- **Timeline mit Zoom** — topologisch geordneter Ereignisgraph über alle vier Zyklen; vier Zoomstufen von „Ären" (nur grosse Wendepunkte) bis „Leben" (inkl. Geburten/Tode), plus Charakter-Fokus
- **Timeline-Graph** — ReactFlow-Ansicht mit Zyklen-Ebenen, Zoomstufen, Charakter-Swimlanes und Fokus-Dimming (Events ohne die gewählten Charaktere treten zurück)
- **Charakterprofile** — Eigenschaften, Epitheta, Gruppen, Artefakte, Quellenzitate, Vollständigkeits-Indikator
- **Stammbaum-Graph** — interaktiver Familienstammbaum pro Charakter: Blutlinie + Nebenlinien, einstellbare Generationstiefe (2–6), kreuzungsarmes Barycenter-Layout, Klick refokussiert den Baum
- **Artefakte** — legendäre Waffen, Schätze und Wunderdinge mit Besitzern/Trägern (Vier Schätze, Gáe Bulg, Harfe des Dagda …)
- **Orte** — die mythische Landkarte Irlands inkl. moderner Entsprechungen und verknüpfter Ereignisse
- **Volltextsuche** — über Charaktere, Events, Orte und Gruppen
- **Login & Rollen** — Lesen ist öffentlich; Schreiben erfordert ein Konto mit Rechten (siehe unten)
- **Review-Workflow** — Editor-Vorschläge landen in der Review-Queue und werden erst nach Freigabe sichtbar
- **KI-Extraktion** — Sagentexte einfügen, Claude schlägt strukturierte Entitäten mit Originalzitaten vor (Admin)
- **Vollständiger Datensatz** — Seeds `mythology` + `mythology-extended` + `mythology-catalog`, Geschichte für Geschichte aus den Einzelsagen erarbeitet: **495 Charaktere, 195 Events, 367 Familienrelationen, 30 Artefakte, 37 Orte, 36 Quellen** — von den Landnahme-Genealogien des Lebor Gabála über sämtliche Furtkämpfe der Táin bis zu Buile Shuibhne und der ältesten Leprechaun-Erzählung (Echtra Fergusa maic Léti). Die Namenskataloge der Überlieferung sind vollständig inventarisiert: die fünfzig Frauen der Cessair, die Häuptlinge der Milesier-Flotte, die Königsrolle (Réim Rígraide) von Éremón bis Conn Cétchathach, die Musterung aus Da Dergas Halle, die Heerschau der Táin und die Fianna-Rollen — reine Namenskatalog-Einträge sind als `speculative` gekennzeichnet (nur namentlich bezeugt)

## Authentifizierung & Rollen

| Rolle | Rechte |
|---|---|
| *anonym* | Alles lesen |
| `viewer` | Alles lesen (wie anonym) — Standardrolle nach Registrierung |
| `editor` | Daten vorschlagen; Vorschläge landen als `pending_review` in der Queue |
| `admin` | Review-Queue, Benutzerverwaltung, KI-Extraktion, direkte Schreibrechte |

- Registrierung unter `/register`, Login unter `/login` (E-Mail + Passwort, bcrypt-gehasht)
- **Das erste registrierte Konto wird automatisch Admin** (Bootstrap); alle weiteren starten als `viewer` und werden unter `/admin/users` befördert
- GitHub OAuth als optionaler zweiter Login-Weg (siehe `env.local.example`)
- Alle Schreib-Endpunkte sind doppelt geschützt (Middleware + Handler-Guard), Eingaben werden validiert, Security-Header (CSP, X-Frame-Options u.a.) sind gesetzt, Login/Registrierung sind rate-limitiert

## Lokale Entwicklung

```bash
npm install
cp env.local.example .env.local   # AUTH_SECRET setzen!
npm run db:reset -- mythology mythology-extended mythology-catalog   # kompletter Datensatz
npm run dev
```

App läuft auf [http://localhost:3000](http://localhost:3000).

### Datenbank

```bash
npm run db:migrate                                 # Schema-Migrationen ausführen
npm run db:seed                                    # verfügbare Seeds auflisten
npm run db:reset -- mythology mythology-extended mythology-catalog   # kompletter Datensatz (empfohlen)
npm run db:seed -- core                            # kleiner Basisdatensatz
npm run db:seed -- cmt-deep                        # Cath Maige Tuired Tiefendaten
```

### Tests

```bash
npm test                    # Unit Tests (Vitest)
npm run test:e2e            # End-to-End Tests (Playwright)
npm run lint                # ESLint
```

## Entwicklungsplan

Siehe [`plan.md`](./plan.md) für die vollständige Roadmap (P0–P6).

## Technologie-Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth v5 (Credentials + optional GitHub), bcryptjs |
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
- [Tochmarc Étaíne](https://celt.ucc.ie/published/T300012/)
- [Togail Bruidne Dá Derga](https://celt.ucc.ie/published/T301017/)
- Lady Gregory, *Gods and Fighting Men* (1904)
