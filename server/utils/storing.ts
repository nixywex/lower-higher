import type { Fact, FactsFile } from '../types/index';
import fs from 'fs';

const factsFilePath: string = './facts.json';

let cachedFacts: Fact[] | null = null;

export async function getAllFacts(): Promise<Fact[]> {
  if (cachedFacts) return cachedFacts;

  const jsonString = await fs.promises.readFile(factsFilePath, 'utf8');
  const data: FactsFile = JSON.parse(jsonString);
  cachedFacts = data.facts;

  return cachedFacts;
}
