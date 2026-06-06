export interface File {
  facts: [Fact];
}

export interface Fact {
  id: number;
  question: string;
  answer: number;
}

export interface FactForClient {
  id: number;
  question: string;
}

export interface Player {
  socketId: string;
  submittedIds: number[] | null;
}

export interface Room {
  code: string;
  hostId: string;
  guestId: string | null;
  factIds: number[];
  clientFacts: FactForClient[];
  players: { [socketId: string]: Player };
  state: 'waiting' | 'playing' | 'finished';
}
