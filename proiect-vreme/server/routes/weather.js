/**
 * SSE endpoint — trimite actualizări meteo live la fiecare 60 secunde.
 * Client se conectează prin EventSource (token JWT în query param, nu header).
 */

import express from 'express';
import { verificaAuth } from '../middleware/auth.js';

const router = express.Router();
const OWM_KEY = process.env.VITE_OPENWEATHER_API_KEY;

router.get('/live/:city', verificaAuth, async (req, res) => {
  // Setează headere SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // dezactivează buffering Nginx
  res.flushHeaders();

  const trimiteDate = async () => {
    try {
      const r = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(req.params.city)}&appid=${OWM_KEY}&units=metric&lang=ro`
      );
      if (!r.ok) return;
      const json = await r.json();

      const payload = {
        temp:      json.main.temp,
        feelsLike: json.main.feels_like,
        humidity:  json.main.humidity,
        tempMin:   json.main.temp_min,
        tempMax:   json.main.temp_max,
        wind:      json.wind,
        weather:   json.weather,
        dt:        json.dt
      };
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch {
      // Ignorăm erori de rețea — vom reîncerca la intervalul următor
    }
  };

  await trimiteDate();                            // primul update imediat
  const interval = setInterval(trimiteDate, 60000); // update la fiecare 60s

  // Curăță la deconectare client
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

export default router;
