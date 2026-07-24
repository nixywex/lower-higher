# Multiplayer mit Socket.io

Der Client verbindet sich mit derselben URL wie die REST-API. Lokal ist das
`http://localhost:3000`.

Ein Raum hat zwei Personen. Der Host erstellt den Raum und teilt den Code. Das
Spiel startet, sobald die zweite Person beigetreten ist.

## Events

### Client → Server

| Event         | Payload                  | Beschreibung                            |
| ------------- | ------------------------ | --------------------------------------- |
| `createRoom`  | `{ hardcore?: boolean }` | Erstellt einen Raum und lädt die Fakten |
| `joinRoom`    | `{ code: string }`       | Tritt einem Raum bei                    |
| `submitOrder` | `{ ids: number[] }`      | Schickt die eigene Reihenfolge          |

Bei `submitOrder` steht die größte Zahl an Position 0. Die Reihenfolge läuft von
`MAX` nach `MIN`.

### Server → Client

| Event                | Payload                                             | Beschreibung                               |
| -------------------- | --------------------------------------------------- | ------------------------------------------ |
| `roomCode`           | `{ code: string }`                                  | Gibt dem Host den Raumcode                 |
| `roomReady`          | `{ facts: FactForClient[], hardcore: boolean }`     | Startet das Spiel für beide Personen       |
| `gameResult`         | `{ rightAnswers, scores, orders, hostId, guestId }` | Enthält Reihenfolgen und Punkte            |
| `playerDisconnected` | –                                                   | Die andere Person hat den Raum verlassen   |
| `gameError`          | `{ message: string }`                               | Eine Aktion konnte nicht ausgeführt werden |

## Datentypen

```ts
type FactForClient = { id: number; question: string };
type Fact = { id: number; question: string; answer: number };
```

In `scores` und `orders` ist die Socket-ID der Schlüssel. So kann der Client die
eigenen Daten und die Daten der anderen Person unterscheiden.
