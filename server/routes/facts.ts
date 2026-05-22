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
const numberOfFacts = 7;

router.get("/round", async (_, res) => {
  try {
    const facts = await getClientFacts(numberOfFacts);
    res.status(200).send(facts);
  } catch (error) {
    console.error("Error reading facts file: ", error);
    res.status(500).send("Unexpected exception");
  }
});

router.post("/submit", async (req, res) => {
  try {
    const { ids }: { ids: number[] } = req.body;
    const rightAnswers = await getRightAnswers(ids);

    const score = getScore(
      rightAnswers.map((fact) => fact.answer),
      ids,
      10000,
    );

    //TODO: object for response?
    res.status(200).send({
      rightAnswers: rightAnswers,
      score: score,
    });
  } catch (error) {
    console.error("Error submitting the results: ", error);
    res.status(500).send("Unexpected exception");
  }
});

async function getRightAnswers(ids: number[]): Promise<Fact[]> {
      const facts = await readFacts(factsFilePath);
      return facts.filter((fact) => ids.includes(fact.id)).sort((a, b) => a.answer - b.answer);
}

async function getClientFacts(numberOfFacts: number): Promise<FactForClient[]> {
  const facts = await readFacts(factsFilePath);
  const ids = getRandomFactIds(facts.length, numberOfFacts);

  return mapClientFacts(facts, ids);
}

function mapClientFacts(facts: [Fact], ids: number[]): FactForClient[] {
  return facts
    .filter((fact) => ids.includes(fact.id))
    .map((fact) => {
      var factForClient: FactForClient = {
        id: fact.id,
        question: fact.question,
      };
      return factForClient;
    });
}

function getRandomFactIds(maxId: number, numberOfIds: number): number[] {
  let ids = [];
  for (let i = 0; i < numberOfIds; i++)
    ids.push(Math.floor(Math.random() * maxId));

  return ids;
}

async function readFacts(filePath: string): Promise<[Fact]> {
  const jsonString = await fs.promises.readFile(filePath, "utf8");
  const data: File = JSON.parse(jsonString);

  return data.facts;
}

function getScore(
  rightAnswers: number[],
  userAnswers: number[],
  maxScore: number,
) {
  var score = 0;
  const maxPerAnswer = maxScore / rightAnswers.length;

  for (let i = 0; i < rightAnswers.length; i++) {
    var userAnswerValue = userAnswers[i];
    var rightAnswerValue = rightAnswers[i];

    if (userAnswerValue == undefined || rightAnswerValue == undefined)
      throw Error();

    var answerScore = rightAnswerValue - userAnswerValue;

    if (maxPerAnswer - Math.abs(answerScore) > 0) {
      score += maxPerAnswer - Math.abs(answerScore);
    }
  }

  return score;
}

export default router;