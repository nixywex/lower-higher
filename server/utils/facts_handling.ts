import { mapClientFacts } from '../utils/mapping';
import { getAllFacts } from '../utils/storing';
import type { Fact, FactForClient } from '../types/index';

export async function getRightAnswers(ids: number[]): Promise<Fact[]> {
  const facts = await getAllFacts();
  return facts.filter((fact) => ids.includes(fact.id)).sort((a, b) => a.answer - b.answer);
}

export async function getClientFacts(numberOfFacts: number): Promise<FactForClient[]> {
  const facts = await getAllFacts();
  const ids = getRandomFactIds(facts.length, numberOfFacts);

  return mapClientFacts(facts.filter((fact) => ids.includes(fact.id)));
}

export function getRandomFactIds(maxId: number, numberOfIds: number): number[] {
  let ids = [];
  for (let i = 0; i < numberOfIds; i++) ids.push(Math.floor(Math.random() * maxId));

  return ids;
}
