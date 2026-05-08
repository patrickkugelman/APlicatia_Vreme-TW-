import { Router } from 'express';
import { getDb } from '../db.js';
import { verificaAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/community — top 10 orașe căutate în comunitate
router.get('/', verificaAuth, (req, res) => {
  const orase = getDb()
    .prepare('SELECT city, search_count, last_searched_at FROM community_searches ORDER BY search_count DESC LIMIT 10')
    .all();
  res.json(orase);
});

export default router;
