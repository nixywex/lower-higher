# Lower-Higher – Server

REST-API und WebSocket-Server für das Lower-Higher-Spiel. Liefert zufällige Fakten, berechnet den Score serverseitig und verwaltet Multiplayer-Räume über Socket.io.

## Tech Stack

- **Runtime:** Bun
- **Framework:** Express 5
- **WebSockets:** Socket.io
- **Sprache:** TypeScript
- **Datenspeicher:** `facts.json`

## Ordnerstruktur

```
server/
├── index.ts              # Einstiegspunkt, Express- & Socket.io-Setup
├── config.ts             # Konfigurationswerte (Anzahl Fakten, Max-Punkte)
├── facts.json            # Faktendatenbank (flat file)
├── routes/
│   └── facts.ts          # REST-Routen /api/facts
├── socket/
│   └── gameSocket.ts     # Socket.io-Eventhandler für Multiplayer
├── utils/
│   ├── facts_handling.ts # Fakten laden & filtern
│   ├── mapping.ts        # Fakten für den Client aufbereiten (Antworten entfernen)
│   ├── rooms.ts          # In-Memory-Raumverwaltung
│   ├── scoring.ts        # Punkte berechnen
│   └── storing.ts        # facts.json einlesen & cachen
├── types/
│   └── index.ts          # Shared TypeScript-Interfaces
└── tests/
    ├── scoring.test.ts
    ├── rooms.test.ts
    ├── mapping.test.ts
    ├── facts_handling.test.ts
    └── routes.test.ts
```

## REST-API

### `GET /api/facts/round`

Gibt 7 zufällig ausgewählte Fakten zurück – **ohne** die Antwortzahlen.

**Response `200`:**

```json
[
  { "id": 3, "question": "Wie hoch ist der Eiffelturm in Metern?" },
  ...
]
```

---

### `POST /api/facts/submit`

Nimmt die vom Nutzer gewählte Reihenfolge (als ID-Array) entgegen und berechnet den Score serverseitig.

**Request Body:**

```json
{ "ids": [3, 7, 1, 5, 2, 6, 4] }
```

**Response `200`:**

```json
{
  "rightAnswers": [{ "id": 1, "question": "...", "answer": 42 }, ...],
  "score": 8450
}
```

**Response `400`** – bei ungültiger Eingabe:

```json
{ "message": "ids must be a non-empty array of numbers" }
```

```json
{ "message": "One or more ids do not exist" }
```

> ⚠️ Die Antwortzahlen verlassen den Server **ausschließlich** nach dem Submit – nie beim Laden der Runde.

---

## Socket.io-API (Multiplayer)

Verbindung unter `ws://<host>:<port>`. Alle Events sind bidirektional über Socket.io.

### Client → Server

| Event         | Payload             | Beschreibung                                      |
| ------------- | ------------------- | ------------------------------------------------- |
| `createRoom`  | –                   | Erstellt einen neuen Raum und erhält den Raumcode |
| `joinRoom`    | `{ code: string }`  | Tritt einem wartenden Raum bei                    |
| `submitOrder` | `{ ids: number[] }` | Sendet die gewählte Reihenfolge der Fakten-IDs    |

### Server → Client

| Event                | Payload                                             | Beschreibung                             |
| -------------------- | --------------------------------------------------- | ---------------------------------------- |
| `roomCode`           | `{ code: string }`                                  | Raumcode nach erfolgreichem `createRoom` |
| `roomReady`          | `{ facts: FactForClient[] }`                        | Beide Spieler verbunden – Spiel beginnt  |
| `gameResult`         | `{ rightAnswers, scores, orders, hostId, guestId }` | Ergebnis nach Abgabe beider Spieler      |
| `playerDisconnected` | –                                                   | Gegner hat die Verbindung getrennt       |
| `gameError`          | `{ message: string }`                               | Fehlermeldung bei ungültigen Aktionen    |

### Ablauf

```
Host              Server              Guest
 |  createRoom       |                  |
 |---------------->  |                  |
 |  roomCode(code)   |                  |
 |  <--------------  |                  |
 |                   |  joinRoom(code)  |
 |                   | <--------------- |
 |  roomReady        |   roomReady      |
 |  <--------------  | --------------> |
 |  submitOrder      |                  |
 |---------------->  |                  |
 |                   |  submitOrder     |
 |                   | <--------------- |
 |  gameResult       |   gameResult     |
 |  <--------------  | --------------> |
```

## Punkte-System

Pro Fakt können maximal **10.000 Punkte** erreicht werden. Der Score basiert auf der absoluten Differenz zwischen der richtigen Antwort und der vom Nutzer platzierten Antwort. Liegt die Differenz über dem Maximum, gibt es 0 Punkte für diese Position.

## Setup & Start

```bash
bun install

# Entwicklung (mit Hot Reload)
bun run dev

# Produktion
bun run start

# Tests
bun test
```
