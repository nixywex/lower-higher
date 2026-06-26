import { Router } from 'express';
import { calculateScore } from '../utils/scoring';
import { getRightAnswers, getClientFacts } from '../utils/facts_handling';
import { NUMBER_OF_FACTS, MAX_POINTS_PER_FACT } from '../config';

const router = Router();

router.get('/round', async (_, res) => {
  try {
    const facts = await getClientFacts(NUMBER_OF_FACTS);
    console.log(`fetched ${facts.length} facts for a new round`);
    res.status(200).json(facts);
  } catch (error) {
    console.error('failed to fetch facts for round:', error);
    res.status(500).json({ message: 'Unexpected exception' });
  }
});

router.post('/submit', async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== 'number')) {
    console.warn('submit came in with bad ids:', ids);
    res.status(400).json({ message: 'ids must be a non-empty array of numbers' });
    return;
  }

  try {
    const rightAnswers = await getRightAnswers(ids);

    if (rightAnswers.length !== ids.length) {
      console.warn(`submit had ${ids.length} ids but only ${rightAnswers.length} matched`);
      res.status(400).json({ message: 'One or more ids do not exist' });
      return;
    }

    const score = calculateScore(rightAnswers, ids, MAX_POINTS_PER_FACT);
    console.log(`submit done — ${ids.length} facts, score: ${score}`);
    res.status(200).json({ rightAnswers, score });
  } catch (error) {
    console.error('failed to process submit:', error);
    res.status(500).json({ message: 'Unexpected exception' });
  }
});

export default router;
