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
