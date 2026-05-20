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

const factsFilePath: string = "./facts.json";

const router = Router();

router.get("/round", async (_, res) => {
  try {
    const facts = await readFacts(factsFilePath);

    res.status(200).send(facts);
  } catch (error) {
    console.error("Error reading facts file: ", error);

    res.status(500).send("Unexpected exception");
  }
});

async function readFacts(filePath: string): Promise<File> {
  const jsonString = await fs.promises.readFile(filePath, "utf8");
  const data: File = JSON.parse(jsonString);

  return data;
}

export default router;