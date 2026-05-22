import type { Fact, FactForClient } from "../types/index";

export function mapClientFacts(facts: Fact[]): FactForClient[] {
  return facts.map((fact) => {
    var factForClient: FactForClient = {
      id: fact.id,
      question: fact.question,
    };
    return factForClient;
  });
}

module.exports = { mapClientFacts };
