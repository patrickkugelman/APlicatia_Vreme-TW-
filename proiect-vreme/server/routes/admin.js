import { Router } from 'express';
import { getDb } from '../db.js';
import { verificaAuth, verificaAdmin } from '../middleware/auth.js';

const router = Router();
router.use(verificaAuth, verificaAdmin);

// GET /api/admin/users — lista tuturor utilizatorilor
router.get('/users', (req, res) => {
  const users = getDb()
    .prepare(`
      SELECT u.id, u.email, u.name, u.role, u.created_at,
        (SELECT COUNT(*) FROM history WHERE CAST(client_id AS TEXT) = CAST(u.id AS TEXT)) +
        (SELECT COUNT(*) FROM history WHERE client_id = CAST(u.id AS TEXT)) as search_count,
        (SELECT COUNT(*) FROM favorites WHERE client_id = CAST(u.id AS TEXT)) as favorites_count
      FROM users u
      ORDER BY u.created_at DESC
    `)
    .all();
  res.json(users);
});

// DELETE /api/admin/users/:id — șterge un utilizator (nu pe sine)
router.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ eroare: 'ID invalid.' });
  if (id === req.userId) return res.status(400).json({ eroare: 'Nu te poți șterge pe tine însuți.' });

  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ eroare: 'Utilizatorul nu există.' });

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.status(204).send();
});

// GET /api/admin/stats — statistici globale
router.get('/stats', (req, res) => {
  const db = getDb();
  res.json({
    totalUseri: db.prepare('SELECT COUNT(*) as n FROM users').get().n,
    totalCautari: db.prepare('SELECT COUNT(*) as n FROM history').get().n,
    totalFavorite: db.prepare('SELECT COUNT(*) as n FROM favorites').get().n,
    uniqueOrase: db.prepare('SELECT COUNT(*) as n FROM community_searches').get().n,
    topOrase: db.prepare(
      'SELECT city, search_count FROM community_searches ORDER BY search_count DESC LIMIT 10'
    ).all()
  });
});

export default router;
