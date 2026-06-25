import { Router } from 'express';
import { calculateScore } from '../utils/scoring';
import { getRightAnswers, getClientFacts } from '../utils/facts_handling';
import { NUMBER_OF_FACTS, MAX_POINTS_PER_FACT } from '../config';

const router = Router();

router.get('/round', async (_, res) => {
  try {
    const facts = await getClientFacts(NUMBER_OF_FACTS);

    res.status(200).json(facts);
  } catch (error) {
    console.error('Error reading facts file: ', error);
    res.status(500).json({ message: 'Unexpected exception' });
  }
});

router.post('/submit', async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'number')) {
    res.status(400).json({ message: 'ids must be an array of numbers' });
    return;
  }

  try {
    const rightAnswers = await getRightAnswers(ids);
    const score = calculateScore(rightAnswers, ids, MAX_POINTS_PER_FACT);

    res.status(200).json({ rightAnswers, score });
  } catch (error) {
    console.error('Error submitting the results: ', error);
    res.status(500).json({ message: 'Unexpected exception' });
  }
});

export default router;
