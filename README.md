# Lower-Higher

Lower-Higher ist ein browserbasiertes Schätz- und Sortierspiel. In jeder Runde
werden sieben zufällige Fakten angezeigt, die anhand ihres Zahlenwerts von
**MAX nach MIN** eingeordnet werden müssen.

> Dieses Projekt entstand im Rahmen des Fachs **Web Engineering**. Studierende: Urosevic Natalija, Sheludko Nikita

## Live-Demo

**[Lower-Higher online spielen](https://lower-higher-one.vercel.app)**

> [!IMPORTANT]
> Das Frontend ist auf Vercel und das Backend auf Render veröffentlicht. Nach
> längerer Inaktivität muss das Backend beim ersten Request unter Umständen erst
> hochfahren. Das kann einige Minuten dauern. Währenddessen können
> Verbindungsfehler auftreten oder das Frontend meldet, dass der Server nicht
> erreichbar ist. In diesem Fall kurz warten und anschließend
> **„Erneut versuchen“** wählen oder die Seite neu laden.

## Spielprinzip

Pro Runde wählt der Server sieben Fakten zufällig aus. Die zugehörigen
Zahlenwerte bleiben zunächst auf dem Server und werden erst nach dem Absenden
der eigenen Reihenfolge übertragen. Die Karten lassen sich per Drag-and-drop,
Mausklick oder Tastatur in die sieben Positionen zwischen `MAX` und `MIN`
einordnen.

Für jede Position sind maximal 10.000 Punkte möglich. Der Server berechnet die
Punktzahl anhand der numerischen Differenz zwischen dem dort erwarteten und dem
platzierten Fakt. Eine Runde kann damit maximal 70.000 Punkte ergeben.

## Funktionen

- Singleplayer mit beliebig vielen aufeinanderfolgenden Runden
- Multiplayer für zwei Personen über Socket.io und vierstellige Raumcodes
- Normaler Modus mit frei veränderbarer Reihenfolge
- Hardcore-Modus mit 60-Sekunden-Timer und gesperrten Platzierungen
- Automatisches Auffüllen noch leerer Felder nach Ablauf des Hardcore-Timers
- Ergebnisansicht mit richtiger Reihenfolge, Zahlenwerten und Punktevergleich
- Bedienung per Drag-and-drop, Mausklick oder Tastatur
- Serverseitige Auswertung, sodass Lösungen vor dem Absenden verborgen bleiben
- Responsive Benutzeroberfläche

## Tech-Stack

| Bereich               | Technologien                                        |
| --------------------- | --------------------------------------------------- |
| Frontend              | React, TypeScript, Vite, React Router, Tailwind CSS |
| Backend               | Bun, Express, TypeScript, CORS                      |
| Echtzeitkommunikation | Socket.io                                           |
| Datenspeicher         | Lokale JSON-Datei mit 100 Fakten                    |
| Qualitätssicherung    | Bun Test, ESLint, Prettier, Husky                   |
| Deployment            | Vercel (Frontend), Render (Backend)                 |

## Voraussetzungen

- Bun

## Lokale Installation

Abhängigkeiten für Backend und Frontend installieren:

```bash
cd server
bun install

cd ../client
bun install
```

## Entwicklung starten

Backend in einem Terminal starten:

```bash
cd server
bun run dev
```

Frontend in einem zweiten Terminal starten:

```bash
cd client
bun run dev
```

Danach sind die Anwendungen standardmäßig unter folgenden Adressen erreichbar:

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:3000>

## Wichtige Befehle

### Frontend (`client/`)

| Befehl            | Zweck                                                 |
| ----------------- | ----------------------------------------------------- |
| `bun run dev`     | Entwicklungsserver mit Hot Module Replacement starten |
| `bun run build`   | TypeScript prüfen und Produktions-Build erzeugen      |
| `bun run preview` | Produktions-Build lokal anzeigen                      |
| `bun run lint`    | Frontend mit ESLint prüfen                            |
| `bun test`        | Tests der Spiellogik ausführen                        |

### Backend (`server/`)

| Befehl          | Zweck                                             |
| --------------- | ------------------------------------------------- |
| `bun run dev`   | Server mit Hot Reload starten                     |
| `bun run start` | Server ohne Hot Reload starten                    |
| `bun test`      | API-, Raum-, Mapping- und Scoring-Tests ausführen |

## Konfiguration

Für die lokale Entwicklung sind keine `.env`-Dateien notwendig. Bei Bedarf
können folgende Umgebungsvariablen gesetzt werden:

| Variable       | Bereich  | Standardwert            | Beschreibung                     |
| -------------- | -------- | ----------------------- | -------------------------------- |
| `VITE_API_URL` | Frontend | `http://localhost:3000` | URL der REST- und Socket.io-API  |
| `PORT`         | Backend  | `3000`                  | Port des HTTP-Servers            |
| `CORS_ORIGIN`  | Backend  | `http://localhost:5173` | Erlaubter Ursprung des Frontends |

Beispiel für ein Frontend, das ein anderes Backend verwendet:

```bash
cd client
VITE_API_URL=https://example.com bun run dev
```

## API

### REST

| Methode | Endpunkt            | Beschreibung                                      |
| ------- | ------------------- | ------------------------------------------------- |
| `GET`   | `/api/facts/round`  | Liefert sieben zufällige Fakten ohne Antwortwerte |
| `POST`  | `/api/facts/submit` | Wertet eine Reihenfolge von Fakten-IDs aus        |

Die vollständige REST-Spezifikation befindet sich in
[`docs/openapi.yaml`](docs/openapi.yaml).

### Socket.io

Der Multiplayer verwendet unter anderem die Events `createRoom`, `joinRoom`,
`submitOrder`, `roomReady` und `gameResult`. Payloads und Ablauf sind in
[`docs/websocket.md`](docs/websocket.md) dokumentiert.

## Projektstruktur

```text
lower-higher/
├── client/
│   ├── public/             # Statische Dateien und Icons
│   └── src/
│       ├── components/     # Wiederverwendbare UI-Komponenten
│       ├── hooks/          # Spiel-, Eingabe- und Timer-Logik
│       ├── pages/          # Start, Singleplayer und Multiplayer
│       └── utils/          # Spiellogik und Frontend-Tests
├── server/
│   ├── routes/             # REST-Endpunkte
│   ├── socket/             # Socket.io-Eventhandler
│   ├── tests/              # Backend-Tests
│   ├── types/              # TypeScript-Typen
│   ├── utils/              # Fakten-, Raum- und Scoring-Logik
│   └── facts.json          # Faktendaten
└── docs/
    ├── openapi.yaml        # OpenAPI-Spezifikation
    └── websocket.md        # Multiplayer-Protokoll
```

Multiplayer-Räume werden im Arbeitsspeicher des Backends verwaltet und nach
Spielende oder bei einem Verbindungsabbruch entfernt. Die Faktendaten stammen
aus `server/facts.json` und werden beim ersten Zugriff in den Speicher geladen.

## Deployment

- Frontend: [lower-higher-one.vercel.app](https://lower-higher-one.vercel.app)
- Backend: [lower-higher.onrender.com](https://lower-higher.onrender.com)
- Repository: [github.com/nixywex/lower-higher](https://github.com/nixywex/lower-higher)

Für ein eigenes Deployment muss das Frontend mit der passenden
`VITE_API_URL` gebaut werden. Im Backend muss `CORS_ORIGIN` auf die URL des
veröffentlichten Frontends zeigen.
