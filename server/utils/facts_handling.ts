import { mapClientFacts } from './mapping';
import { getAllFacts } from './storing';
import type { Fact, FactForClient } from '../types/index';

export async function getRightAnswers(ids: number[]): Promise<Fact[]> {
  const facts = await getAllFacts();
  return facts.filter((fact) => ids.includes(fact.id)).sort((a, b) => b.answer - a.answer);
}

export async function getClientFacts(numberOfFacts: number): Promise<FactForClient[]> {
  const facts = await getAllFacts();
  const pool = [...facts];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return mapClientFacts(pool.slice(0, numberOfFacts));
}
