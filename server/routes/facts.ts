import { Router } from "express";
import { calculateScore } from "../utils/scoring";
import { getRightAnswers, getClientFacts } from "../utils/facts_handling";

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

    const score = calculateScore(
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

export default router;
