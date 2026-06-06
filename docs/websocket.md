# Multiplayer – Socket.io Verbindung

**URL:** `http://localhost:3000`  
**Library:** `socket.io-client ^4`

---

## Events

### Client → Server

| Event         | Payload             | Beschreibung                                                                               |
| ------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| `createRoom`  | –                   | Neuen Raum erstellen. Server lädt die Fakten für diese Runde.                              |
| `joinRoom`    | `{ code: string }`  | Vorhandenem Raum per Code beitreten.                                                       |
| `submitOrder` | `{ ids: number[] }` | Eigene Sortierung einreichen. IDs in aufsteigender Reihenfolge (Index 0 = kleinster Wert). |

### Server → Client

| Event                | Payload                                                                                     | Wer empfängt          | Beschreibung                                       |
| -------------------- | ------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------- |
| `roomCode`           | `{ code: string }`                                                                          | Host                  | Raum wurde erstellt.                               |
| `roomReady`          | `{ facts: FactForClient[] }`                                                                | Beide                 | Gast ist beigetreten, Spiel kann starten.          |
| `gameResult`         | `{ rightAnswers: Fact[], scores: { [socketId]: number }, hostId: string, guestId: string }` | Beide                 | Beide haben submitted, Ergebnis liegt vor.         |
| `playerDisconnected` | –                                                                                           | Verbleibender Spieler | Gegner hat die Verbindung getrennt.                |
| `error`              | `{ message: string }`                                                                       | Auslöser              | Ungültige Aktion (z.B. Raum voll, nicht gefunden). |

---

## Datentypen

```ts
type FactForClient = { id: number; question: string };

type Fact = { id: number; question: string; answer: number };
```

`scores` ist ein Objekt mit der `socket.id` als Key – jeder Spieler kann seinen eigenen Score anhand von `socket.id` herauslesen.
