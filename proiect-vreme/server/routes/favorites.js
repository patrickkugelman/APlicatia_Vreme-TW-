import { Router } from 'express';
import { getDb } from '../db.js';
import { verificaAuth } from '../middleware/auth.js';

const router = Router();
router.use(verificaAuth);

// GET /api/favorites
router.get('/', (req, res) => {
  const favorite = getDb()
    .prepare('SELECT id, city, note, created_at FROM favorites WHERE client_id = ? ORDER BY created_at DESC')
    .all(String(req.userId));
  res.json(favorite);
});

// POST /api/favorites
router.post('/', (req, res) => {
  const { city, note = '' } = req.body;
  if (!city || typeof city !== 'string' || city.trim().length === 0) {
    return res.status(400).json({ eroare: 'Câmpul "city" este obligatoriu.' });
  }
  const numeOras = city.trim();

  try {
    const result = getDb()
      .prepare('INSERT INTO favorites (client_id, city, note) VALUES (?, ?, ?)')
      .run(String(req.userId), numeOras, note.trim());
    const favorit = getDb()
      .prepare('SELECT id, city, note, created_at FROM favorites WHERE id = ?')
      .get(result.lastInsertRowid);
    res.status(201).json(favorit);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ eroare: `Orașul "${numeOras}" este deja în lista ta de favorite.` });
    }
    throw err;
  }
});

// PUT /api/favorites/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { note = '' } = req.body;
  if (isNaN(id)) return res.status(400).json({ eroare: 'ID invalid.' });

  const result = getDb()
    .prepare('UPDATE favorites SET note = ? WHERE id = ? AND client_id = ?')
    .run(note.trim(), id, String(req.userId));

  if (result.changes === 0) return res.status(404).json({ eroare: 'Favoritul nu a fost găsit.' });
  const favorit = getDb().prepare('SELECT id, city, note, created_at FROM favorites WHERE id = ?').get(id);
  res.json(favorit);
});

// DELETE /api/favorites/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ eroare: 'ID invalid.' });

  const result = getDb()
    .prepare('DELETE FROM favorites WHERE id = ? AND client_id = ?')
    .run(id, String(req.userId));

  if (result.changes === 0) return res.status(404).json({ eroare: 'Favoritul nu a fost găsit.' });
  res.status(204).send();
});

export default router;
