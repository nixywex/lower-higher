import { Router } from "express";
import fs from "fs";

interface File {
  facts: [Fact];
}

interface Fact {
  id: number;
  question: string;
  answer: number;
}

interface FactForClient {
    id: number;
    question: string;
}

const factsFilePath: string = "./facts.json";

const router = Router();

router.get("/round", async (_, res) => {
  try {
    const facts = await getClientFacts();
    res.status(200).send(facts);
  } catch (error) {
    console.error("Error reading facts file: ", error);
    res.status(500).send("Unexpected exception");
  }
});

async function getClientFacts(): Promise<FactForClient[]> {
    const facts = await readFacts(factsFilePath);

    //TODO: get 7 random of them

    const factsForClient = facts.map(fact => {
        var factForClient: FactForClient = {
            id: fact.id,
            question: fact.question
        }
        return factForClient;
    })

    return factsForClient;
}

async function readFacts(filePath: string): Promise<[Fact]> {
  const jsonString = await fs.promises.readFile(filePath, "utf8");
  const data: File = JSON.parse(jsonString);

  return data.facts;
}

export default router;