import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { initDb } from './db.js';

// ─── Încarcă .env manual (fără dotenv) ───────────────────────────────────────
try {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '../.env');
  readFileSync(envPath, 'utf8').split('\n').forEach(linie => {
    const linieTrimmed = linie.trim();
    if (!linieTrimmed || linieTrimmed.startsWith('#')) return;
    const idx = linieTrimmed.indexOf('=');
    if (idx === -1) return;
    const cheie = linieTrimmed.slice(0, idx).trim();
    const valoare = linieTrimmed.slice(idx + 1).trim();
    if (cheie && !(cheie in process.env)) process.env[cheie] = valoare;
  });
} catch {}
import authRouter from './routes/auth.js';
import favoritesRouter from './routes/favorites.js';
import historyRouter from './routes/history.js';
import settingsRouter from './routes/settings.js';
import adminRouter from './routes/admin.js';
import communityRouter from './routes/community.js';
import weatherRouter from './routes/weather.js';
import cityInfoRouter from './routes/city-info.js';

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
app.use('/api/city-info', cityInfoRouter);

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
