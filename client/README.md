# Lower-Higher – Client

Das Frontend zeigt das Spiel an. Die Fakten werden von `MAX` nach `MIN`
sortiert. Es gibt Singleplayer, Multiplayer und einen Hardcore-Modus.

## Technik

- React und TypeScript
- Vite
- React Router
- Tailwind CSS
- Socket.io Client

## Spielmodi

- **Normal:** Karten können bis zum Absenden neu sortiert werden.
- **Hardcore:** Platzierte Karten sind gesperrt. Für die Runde gibt es 60
  Sekunden. Leere Plätze werden nach Ablauf der Zeit zufällig gefüllt.
- **Multiplayer:** Zwei Personen spielen dieselbe Runde über einen Raumcode.

## Ordnerstruktur

```text
client/
├── index.html
├── public/
└── src/
    ├── components/    # Teile der Spieloberfläche
    ├── hooks/         # Spiel-, Timer- und Eingabelogik
    ├── pages/         # Start, Singleplayer und Multiplayer
    ├── styles/        # Gemeinsame Farben und Fokus-Stile
    ├── utils/         # Spiellogik
    ├── App.tsx        # Routen
    └── main.tsx       # Einstiegspunkt
```

## Start

```bash
bun install
bun run dev
```

Das Frontend läuft dann unter <http://localhost:5173>. Das Backend wird ohne
weitere Einstellung unter <http://localhost:3000> erwartet.

Für eine andere Backend-URL kann `VITE_API_URL` gesetzt werden:

```bash
VITE_API_URL=https://example.com bun run dev
```

## Befehle

| Befehl            | Aufgabe                      |
| ----------------- | ---------------------------- |
| `bun run dev`     | Entwicklungsserver starten   |
| `bun run build`   | Produktions-Build erstellen  |
| `bun run preview` | Build lokal ansehen          |
| `bun run lint`    | Code mit ESLint prüfen       |
| `bun test`        | Tests der Spiellogik starten |

## Bedienung

Die Karten können gezogen oder angeklickt werden. Mit den Tasten `1` bis `7`
wird eine Karte auf einen Platz gelegt. Die fertige Runde wird mit `Enter`
abgeschickt.
