import type { Fact, File } from '../types/index';
import fs from 'fs';

const factsFilePath: string = '../facts.json';

export async function getAllFacts(): Promise<Fact[]> {
  const jsonString = await fs.promises.readFile(factsFilePath, 'utf8');
  const data: File = JSON.parse(jsonString);

  return data.facts;
}

export async function getFactsByIds(ids: number[]): Promise<Fact[]> {
  const allFacts = await getAllFacts();
  return allFacts.filter((fact) => ids.includes(fact.id));
}

module.exports = { getAllFacts, getFactsByIds };
