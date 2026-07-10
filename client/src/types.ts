export interface FactSummary {
  id: number;
  question: string;
}

export interface Fact extends FactSummary {
  answer: number;
}
