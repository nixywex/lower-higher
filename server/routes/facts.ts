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

router.post("/submit", async (req, res) => {
  try {
    const facts = await readFacts(factsFilePath);
    const { ids }: { ids: number[] } = req.body;
    
    const rightAnswers = facts.filter(fact => ids.includes(fact.id)).sort((a, b) => a.answer - b.answer)
    const score = getScore(rightAnswers.map(fact => fact.answer), ids, 10000);

    //TODO: object for response?
    res.status(200).send({
        "rightAnswers": rightAnswers,
        "score": score
    });
  } catch (error) {
    console.error("Error submitting the results: ", error);
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

function getScore(rightAnswers: number[], userAnswers: number[], maxScore: number) {
    var score = 0;
    const maxPerAnswer = maxScore / rightAnswers.length;

    for(let i = 0; i < rightAnswers.length; i++ ) {
        var userAnswerValue = userAnswers[i];
        var rightAnswerValue = rightAnswers[i];

        if(userAnswerValue == undefined || rightAnswerValue == undefined) 
            throw Error();

        var answerScore = rightAnswerValue - userAnswerValue;

        if (maxPerAnswer - Math.abs(answerScore) > 0) {
            score += (maxPerAnswer - Math.abs(answerScore));
        }
    }

    return score;
}