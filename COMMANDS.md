# Tain Line — Befehlsreferenz

---

## Entwicklung

```bash
npm run dev
```
Startet den Next.js-Entwicklungsserver auf http://localhost:3000.
Hot-Reload aktiv — Änderungen an Code sind sofort sichtbar.

```bash
npm run build
```
Erstellt einen produktionsreifen Build. Deckt TypeScript-Fehler und
fehlende Importe auf. Vor dem Deployen ausführen.

```bash
npm run start
```
Startet den Produktionsserver (erfordert vorher `npm run build`).

---

## Datenbank

```bash
npm run db:migrate
```
Wendet ausstehende Schema-Migrationen auf die SQLite-Datenbank an.
Ausführen nach Änderungen an `src/db/schema.ts`.

```bash
npm run db:seed
```
Listet alle verfügbaren Seeds mit Beschreibung auf.

```bash
npm run db:seed -- core
```
Lädt den `core`-Seed in die bestehende Datenbank (additiv, kein Reset).

```bash
npm run db:seed -- core cmt-deep
```
Mehrere Seeds nacheinander einspielen (Reihenfolge beachten).

```bash
npm run db:reset
```
Löscht die Datenbank komplett und erstellt das Schema neu — ohne Daten.

```bash
npm run db:reset -- core
```
Kompletter Reset + sofortiges Seed mit `core`. Standardfall beim Neustart.

```bash
npm run db:reset -- core cmt-deep
```
Reset mit mehreren Seeds in einem Schritt.

> **Seeds im Überblick**
> | Slug       | Inhalt                                      |
> |------------|---------------------------------------------|
> | `core`     | Grunddaten: Quellen, Charaktere, Basisevents |
> | `cmt-deep` | Erweitertes keltisches Mythologie-Dataset    |

---

## Tests

```bash
npm test
```
Führt alle Unit- und Komponenten-Tests einmalig aus (Vitest).

```bash
npm run test:watch
```
Tests im Watch-Modus — läuft nach jeder Dateiänderung neu.
Ideal während der Entwicklung.

```bash
npm run test:e2e
```
Führt alle Playwright-E2E-Tests headless aus.
Startet automatisch den Dev-Server falls keiner läuft.

```bash
npm run test:e2e:ui
```
Playwright mit interaktiver UI — Tests einzeln ausführen, Schritte
inspizieren, Screenshots ansehen.

```bash
npm run test:e2e:install
```
Installiert den Chromium-Browser für Playwright (einmalig pro Umgebung,
ca. 100 MB). Im Devcontainer einmalig nach `onCreateCommand` ausführen.

---

## Code-Qualität

```bash
npm run lint
```
ESLint über den gesamten Code. Zeigt Warnungen und Fehler.

```bash
npx tsc --noEmit
```
TypeScript-Check ohne Build-Output — prüft Typen in allen Dateien.

---

## Git-Workflow

```bash
git status
```
Zeigt geänderte und ungetrackte Dateien.

```bash
git diff
```
Zeigt unstaged Änderungen im Detail.

```bash
git add <datei>
git commit -m "Beschreibung"
```
Einzelne Datei stagen und committen.

```bash
git push -u origin <branch>
```
Branch auf GitHub pushen und Tracking setzen.
Aktueller Feature-Branch: `claude/celtic-mythology-database-qeONH`

```bash
git log --oneline -10
```
Letzte 10 Commits kompakt anzeigen.

---

## Nützliche Kombinationen

```bash
# Frisch starten mit vollem Datensatz
npm run db:reset -- core cmt-deep && npm run dev

# Vor einem Commit: Typen + Tests prüfen
npx tsc --noEmit && npm test

# E2E-Tests das erste Mal einrichten und ausführen
npm run test:e2e:install && npm run test:e2e
```
