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

// GET /api/history/stats — agregări personale
router.get('/stats', (req, res) => {
  const db = getDb();
  const userId = String(req.userId);

  const { total } = db
    .prepare('SELECT COUNT(*) as total FROM history WHERE client_id = ?')
    .get(userId);

  const topOrase = db
    .prepare(
      `SELECT city, COUNT(*) as count
       FROM history WHERE client_id = ?
       GROUP BY city ORDER BY count DESC LIMIT 5`
    )
    .all(userId);

  const perZi = db
    .prepare(
      `SELECT DATE(searched_at) as zi, COUNT(*) as count
       FROM history WHERE client_id = ?
         AND searched_at >= datetime('now', '-7 days')
       GROUP BY DATE(searched_at)
       ORDER BY zi ASC`
    )
    .all(userId);

  res.json({ total, topOrase, perZi });
});

export default router;
