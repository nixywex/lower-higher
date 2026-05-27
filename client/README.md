# Lower-Higher – Client

React-Frontend für das Lower-Higher-Spiel. Zeigt Fakten an und ermöglicht das Sortieren per Drag & Drop.

## Tech Stack

| Paket                             | Status         |
| --------------------------------- | -------------- |
| React 19 + TypeScript             | ✅ installiert |
| Vite                              | ✅ installiert |
| Tailwind CSS                      | 🔧 geplant     |
| @dnd-kit/core + @dnd-kit/sortable | 🔧 geplant     |

## Spielmodi

- **Normal:** Alle 7 Fakten gleichzeitig sichtbar, frei umsortierbar bis zum Absenden
- **Hardcore** _(geplant)_: Fakten erscheinen einzeln nacheinander, jede Einordnung sofort gesperrt

## Ordnerstruktur

```
client/
├── index.html
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.tsx       # Einstiegspunkt
    ├── App.tsx        # Haupt-Komponente
    ├── App.css
    └── index.css
```

## Setup & Start

```bash
bun install

# Entwicklung (mit HMR)
bun run dev

# Produktions-Build
bun run build

# Build-Vorschau
bun run preview
```

> Der Client erwartet den Server unter `http://localhost:3000`.

## Linting

```bash
bun run lint
```
