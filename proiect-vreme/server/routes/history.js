import { Router } from 'express';
import { getDb } from '../db.js';
import { verificaAuth } from '../middleware/auth.js';

const router = Router();
router.use(verificaAuth);

// GET /api/history?limit=10
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const istoric = getDb()
    .prepare(
      `SELECT DISTINCT city, MAX(searched_at) as searched_at
       FROM history WHERE client_id = ?
       GROUP BY city ORDER BY searched_at DESC LIMIT ?`
    )
    .all(String(req.userId), limit);
  res.json(istoric);
});

// POST /api/history — înregistrează o căutare + actualizează statistici comunitate
router.post('/', (req, res) => {
  const { city } = req.body;
  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    return res.status(400).json({ eroare: 'Câmpul "city" este obligatoriu.' });
  }
  const numeOras = city.trim();
  const db = getDb();

  db.prepare('INSERT INTO history (client_id, city) VALUES (?, ?)').run(String(req.userId), numeOras);

  // Incrementare statistici comunitate (INSERT OR UPDATE)
  db.prepare(`
    INSERT INTO community_searches (city, search_count, last_searched_at)
    VALUES (?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(city) DO UPDATE SET
      search_count = search_count + 1,
      last_searched_at = CURRENT_TIMESTAMP
  `).run(numeOras);

  res.status(201).send();
});

export default router;
