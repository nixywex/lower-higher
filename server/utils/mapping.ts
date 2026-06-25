import type { Fact, FactForClient } from '../types/index';

export function mapClientFacts(facts: Fact[]): FactForClient[] {
  return facts.map(({ id, question }) => ({ id, question }));
}
