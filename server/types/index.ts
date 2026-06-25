export interface FactsFile {
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
  submittedIds?: number[];
}

export interface Room {
  code: string;
  hostId: string;
  guestId: string | null;
  factIds: number[];
  clientFacts: FactForClient[];
  players: Record<string, Player>;
  state: 'waiting' | 'playing' | 'finished';
}
