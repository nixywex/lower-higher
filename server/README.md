# Lower-Higher – Server

Der Server liefert die Fakten für eine Runde. Er berechnet auch die Punkte. Der
Multiplayer läuft über Socket.io.

## Technik

- Bun und TypeScript
- Express
- Socket.io
- `facts.json` als Datenspeicher

## Ordnerstruktur

```text
server/
├── routes/          # REST-Endpunkte
├── socket/          # Multiplayer-Events
├── tests/           # Backend-Tests
├── types/           # Gemeinsame Typen
├── utils/           # Fakten, Räume und Punkte
├── config.ts        # Anzahl der Fakten und maximale Punkte
├── facts.json       # 100 Fakten
└── index.ts         # Start des Servers
```

## REST-API

| Methode | Route               | Aufgabe                                        |
| ------- | ------------------- | ---------------------------------------------- |
| `GET`   | `/api/facts/round`  | Liefert sieben Fakten ohne Zahlenwerte         |
| `POST`  | `/api/facts/submit` | Prüft die Reihenfolge und berechnet die Punkte |

Die richtige Reihenfolge läuft von `MAX` nach `MIN`. Die Zahlenwerte werden erst
nach dem Absenden an den Client geschickt.

Die genaue REST-Doku steht in [`../docs/openapi.yaml`](../docs/openapi.yaml).

## Multiplayer

Ein Spieler erstellt einen Raum. Der Server gibt einen vierstelligen Code
zurück. Eine zweite Person kann mit diesem Code beitreten. Beide bekommen
dieselben Fakten.

Der Hardcore-Modus des Hosts gilt für beide Personen. Das Ergebnis wird
geschickt, sobald beide ihre Reihenfolge abgegeben haben.

Alle Events stehen in [`../docs/websocket.md`](../docs/websocket.md).

## Punkte

Eine Runde hat sieben Fakten. Pro Platz sind bis zu 10.000 Punkte möglich. Die
maximale Punktzahl ist 70.000.

## Start

```bash
bun install
bun run dev
```

Der Server läuft standardmäßig unter <http://localhost:3000>.

## Befehle

| Befehl          | Aufgabe                       |
| --------------- | ----------------------------- |
| `bun run dev`   | Server mit Hot Reload starten |
| `bun run start` | Server normal starten         |
| `bun test`      | Backend-Tests starten         |

Die Variablen `PORT` und `CORS_ORIGIN` können bei Bedarf gesetzt werden.
