import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';
import { semneazaToken, verificaAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ eroare: 'Email, parolă și nume sunt obligatorii.' });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ eroare: 'Email invalid.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ eroare: 'Parola trebuie să aibă cel puțin 6 caractere.' });
  }

  const db = getDb();
  const existent = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existent) {
    return res.status(409).json({ eroare: 'Există deja un cont cu acest email.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Primul utilizator înregistrat devine automat admin
  const numarUseri = db.prepare('SELECT COUNT(*) as n FROM users').get().n;
  const role = numarUseri === 0 ? 'admin' : 'user';

  const result = db.prepare(
    'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
  ).run(email.toLowerCase(), passwordHash, name.trim(), role);

  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid);

  const token = semneazaToken({ id: user.id, role: user.role });
  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ eroare: 'Email și parolă sunt obligatorii.' });
  }

  const user = getDb()
    .prepare('SELECT id, email, name, role, password_hash FROM users WHERE email = ?')
    .get(email.toLowerCase());

  if (!user) {
    return res.status(401).json({ eroare: 'Email sau parolă incorectă.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ eroare: 'Email sau parolă incorectă.' });
  }

  const token = semneazaToken({ id: user.id, role: user.role });
  const { password_hash: _, ...userFaraParola } = user;
  res.json({ token, user: userFaraParola });
});

// GET /api/auth/me — returnează datele utilizatorului curent
router.get('/me', verificaAuth, (req, res) => {
  const user = getDb()
    .prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?')
    .get(req.userId);
  if (!user) return res.status(404).json({ eroare: 'Utilizatorul nu a fost găsit.' });
  res.json(user);
});

export default router;
