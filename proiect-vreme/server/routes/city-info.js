import express from 'express';
import { verificaAuth } from '../middleware/auth.js';

const router = express.Router();

// ─── GNews — știri în timp real ───────────────────────────────────────────────
router.get('/news/:city', verificaAuth, async (req, res) => {
  const KEY = process.env.GNEWS_API_KEY;
  if (!KEY) return res.json({ status: 'no-key', articles: [] });

  try {
    const q = encodeURIComponent(req.params.city);
    const r = await fetch(
      `https://gnews.io/api/v4/search?q=${q}&lang=en&max=6&sortby=publishedAt&apikey=${KEY}`
    );
    const data = await r.json();
    // Normalizează răspunsul GNews la același format ca NewsAPI
    res.json({
      status: 'ok',
      articles: (data.articles || []).map(a => ({
        title:       a.title,
        description: a.description,
        url:         a.url,
        urlToImage:  a.image,
        publishedAt: a.publishedAt,
        source:      { name: a.source?.name || 'GNews' }
      }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message, articles: [] });
  }
});

// ─── Google Places API (New) — restaurante și hoteluri ───────────────────────
router.get('/places', verificaAuth, async (req, res) => {
  const KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!KEY) return res.json({ status: 'no-key', results: [] });

  const { lat, lon, tip, limit = 12 } = req.query;
  if (!lat || !lon || !tip) return res.status(400).json({ error: 'lat, lon, tip sunt necesare' });

  // Places API (New) — tipuri pentru căutare Nearby
  const tipuriHotel = ['hotel', 'motel', 'lodging', 'guest_house'];
  const tipuriRestaurant = {
    toate:    ['restaurant', 'cafe', 'bar', 'meal_takeaway'],
    chinez:   ['chinese_restaurant'],
    italian:  ['italian_restaurant'],
    pizza:    ['pizza_restaurant'],
    burger:   ['hamburger_restaurant'],
    sushi:    ['sushi_restaurant'],
    mexican:  ['mexican_restaurant'],
    japonez:  ['japanese_restaurant'],
    fast:     ['fast_food_restaurant'],
    cafenea:  ['cafe', 'coffee_shop'],
  };

  const { subtip = 'toate' } = req.query;
  const includedTypes = tip === 'hotel'
    ? tipuriHotel
    : (tipuriRestaurant[subtip] || tipuriRestaurant.toate);

  try {
    const r = await fetch(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.websiteUri'
        },
        body: JSON.stringify({
          includedTypes,
          maxResultCount: Number(limit),
          locationRestriction: {
            circle: {
              center: { latitude: parseFloat(lat), longitude: parseFloat(lon) },
              radius: 3000.0
            }
          }
        })
      }
    );
    const data = await r.json();

    if (data.error) {
      console.error('[Places API] Eroare Google:', JSON.stringify(data.error));
      return res.json({ status: 'REQUEST_DENIED', message: data.error.message, results: [] });
    }

    res.json({
      status: 'OK',
      results: (data.places || []).map(p => ({
        name:        p.displayName?.text || '',
        vicinity:    p.formattedAddress || '',
        rating:      p.rating,
        totalRatings: p.userRatingCount,
        priceLevel:  p.priceLevel,
        placeId:     p.id,
        types:       p.types,
        website:     p.websiteUri || null
      }))
    });
  } catch (e) {
    res.status(500).json({ error: e.message, results: [] });
  }
});

// ─── Google Air Quality API ───────────────────────────────────────────────────
router.get('/air/:lat/:lon', verificaAuth, async (req, res) => {
  const KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!KEY) return res.json({ status: 'no-key' });

  try {
    const { lat, lon } = req.params;
    const r = await fetch(
      `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: { latitude: parseFloat(lat), longitude: parseFloat(lon) },
          extraComputations: ['POLLUTANT_CONCENTRATION'],
          languageCode: 'en'
        })
      }
    );
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Google Time Zone API ─────────────────────────────────────────────────────
router.get('/timezone/:lat/:lon', verificaAuth, async (req, res) => {
  const KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!KEY) return res.json({ status: 'no-key' });

  try {
    const { lat, lon } = req.params;
    const timestamp = Math.floor(Date.now() / 1000);
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${timestamp}&key=${KEY}`
    );
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
