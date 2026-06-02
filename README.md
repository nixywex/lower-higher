# Lower-Higher

Browserbasiertes Sortierspiel: 7 zufällige Fakten per Drag & Drop aufsteigend nach ihrem numerischen Wert sortieren.

## Spielprinzip

Pro Runde werden 7 Fakten angezeigt (z. B. „Wie hoch ist der Eiffelturm in Metern?"). Der Spieler ordnet sie per Drag & Drop in die richtige aufsteigende Reihenfolge. Je genauer die Sortierung, desto mehr Punkte.

## Spielmodi

| Modus                    | Beschreibung                                                                 |
| ------------------------ | ---------------------------------------------------------------------------- |
| **Normal**               | Alle 7 Fakten gleichzeitig sichtbar, frei umsortierbar bis zum Absenden      |
| **Hardcore** _(geplant)_ | Fakten erscheinen einzeln, jede Einordnung ist sofort gesperrt – kein Zurück |

## Projektstruktur

```
lower-higher/
├── client/       # React-Frontend (Vite + TypeScript)
└── server/       # REST-API (Bun + Express)
```

## Schnellstart

```bash
# Server starten
cd server
bun install
bun run dev

# Client starten (neues Terminal)
cd client
bun install
bun run dev
```

> Server: `http://localhost:3000` · Client: `http://localhost:5173`

## Tech Stack

| Bereich       | Technologien                                                               |
| ------------- | -------------------------------------------------------------------------- |
| Frontend      | React 19, TypeScript, Vite, Tailwind CSS _(geplant)_, @dnd-kit _(geplant)_ |
| Backend       | Bun, Express, TypeScript                                                   |
| Datenspeicher | `facts.json` (Phase 1) · Datenbank _(Phase 2, geplant)_                    |
| Multiplayer   | Socket.io _(geplant)_                                                      |

Detaillierte Dokumentation folgt im `docs/`-Ordner.
