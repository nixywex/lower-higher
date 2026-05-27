# Lower-Higher – Server

REST-API für das Lower-Higher-Spiel. Liefert zufällige Fakten und berechnet den Score serverseitig.

## Tech Stack

- **Runtime:** Bun
- **Framework:** Express 5
- **Sprache:** TypeScript
- **Datenspeicher:** `facts.json` (Phase 1)

## Ordnerstruktur

```
server/
├── index.ts              # Einstiegspunkt, Express-Setup
├── facts.json            # Faktendatenbank (flat file)
├── routes/
│   └── facts.ts          # API-Routen /api/facts
├── utils/
│   ├── facts_handling.ts # Fakten laden & filtern
│   ├── mapping.ts        # Fakten für den Client aufbereiten (Antworten entfernen)
│   ├── scoring.ts        # Punkte berechnen
│   └── storing.ts        # facts.json einlesen
└── types/
    └── index.ts          # Shared TypeScript-Interfaces
```

## API-Endpunkte

### `GET /api/facts/round`

Gibt 7 zufällig ausgewählte Fakten zurück – **ohne** die Antwortzahlen.

**Response:**

```json
[
  { "id": 3, "question": "Wie hoch ist der Eiffelturm in Metern?" },
  ...
]
```

### `POST /api/facts/submit`

Nimmt die vom Nutzer gewählte Reihenfolge (als ID-Array) entgegen und berechnet den Score serverseitig.

**Request Body:**

```json
{ "ids": [3, 7, 1, 5, 2, 6, 4] }
```

**Response:**

```json
{
  "rightAnswers": [{ "id": 1, "question": "...", "answer": 42 }, ...],
  "score": 8450
}
```

> ⚠️ Die Antwortzahlen verlassen den Server **ausschließlich** nach dem Submit – nie beim Laden der Runde.

## Punkte-System

Der Score wird serverseitig auf Basis der Positionsabweichungen berechnet. Das finale Scoring-Modell (Maximalwert) ist noch in Abstimmung.

## Setup & Start

```bash
bun install

# Entwicklung (mit Hot Reload)
bun run dev

# Produktion
bun run start
```
