import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';
import { initDb } from './db.js';
import authRouter from './routes/auth.js';
import favoritesRouter from './routes/favorites.js';
import historyRouter from './routes/history.js';
import settingsRouter from './routes/settings.js';
import adminRouter from './routes/admin.js';
import communityRouter from './routes/community.js';
import weatherRouter from './routes/weather.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

initDb();

// Rute API
app.use('/api/auth', authRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/history', historyRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/community', communityRouter);
app.use('/api/weather', weatherRouter);

// Endpoint temporar pentru salvat screenshot-uri prezentare
app.post('/api/dev/save-img', (req, res) => {
  try {
    const { name, data } = req.body;
    const buf = Buffer.from(data, 'base64');
    writeFileSync(`D:/proiect_TW/prezentare/screenshots/${name}.jpg`, buf);
    res.json({ ok: true, size: buf.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Servește frontend-ul construit (producție)
const distDir = join(__dirname, '../dist');
app.use(express.static(distDir));
app.get('*', (req, res) => {
  res.sendFile(join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server pornit pe portul ${PORT}`);
});

export default app;
