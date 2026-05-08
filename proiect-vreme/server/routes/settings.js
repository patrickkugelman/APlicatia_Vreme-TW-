import { Router } from 'express';
import { getDb } from '../db.js';
import { verificaAuth } from '../middleware/auth.js';

const router = Router();
router.use(verificaAuth);

function randeazaSetari(row) {
  if (!row) return { tema: 'intuneric', unitTemp: 'C', unitVant: 'kmh', pragMin: null, pragMax: null };
  return {
    tema: row.theme,
    unitTemp: row.unit_temp,
    unitVant: row.unit_wind,
    pragMin: row.alert_temp_min,
    pragMax: row.alert_temp_max
  };
}

router.get('/', (req, res) => {
  const row = getDb().prepare('SELECT * FROM settings WHERE client_id = ?').get(String(req.userId));
  res.json(randeazaSetari(row));
});

router.put('/', (req, res) => {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO settings (client_id) VALUES (?)').run(String(req.userId));

  const mapare = {
    tema: 'theme', unitTemp: 'unit_temp', unitVant: 'unit_wind',
    pragMin: 'alert_temp_min', pragMax: 'alert_temp_max'
  };
  for (const [cheieJS, coloana] of Object.entries(mapare)) {
    if (req.body[cheieJS] !== undefined) {
      db.prepare(`UPDATE settings SET ${coloana} = ? WHERE client_id = ?`)
        .run(req.body[cheieJS], String(req.userId));
    }
  }
  const row = db.prepare('SELECT * FROM settings WHERE client_id = ?').get(String(req.userId));
  res.json(randeazaSetari(row));
});

export default router;
