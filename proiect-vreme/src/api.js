import { obtineToken } from './auth.js';

const CHEIE_API = import.meta.env.VITE_OPENWEATHER_API_KEY;
const URL_OWM = 'https://api.openweathermap.org/data/2.5';

// === OpenWeatherMap ===

async function cereOWM(url) {
  const raspuns = await fetch(url);
  if (!raspuns.ok) {
    if (raspuns.status === 404) throw new Error('Orașul nu a fost găsit. Verificați numele și încercați din nou.');
    throw new Error(`Eroare server: ${raspuns.status}. Încercați mai târziu.`);
  }
  return raspuns.json();
}

export function obtineVremeOras(oras) {
  return cereOWM(`${URL_OWM}/weather?q=${encodeURIComponent(oras)}&appid=${CHEIE_API}&units=metric&lang=ro`);
}

export function obtinePrognozeOras(oras) {
  return cereOWM(`${URL_OWM}/forecast?q=${encodeURIComponent(oras)}&appid=${CHEIE_API}&units=metric&lang=ro`);
}

export function obtineVremeCoordonate(lat, lon) {
  return cereOWM(`${URL_OWM}/weather?lat=${lat}&lon=${lon}&appid=${CHEIE_API}&units=metric&lang=ro`);
}

export function obtinePrognozeCoordonate(lat, lon) {
  return cereOWM(`${URL_OWM}/forecast?lat=${lat}&lon=${lon}&appid=${CHEIE_API}&units=metric&lang=ro`);
}

// === Backend propriu (Express + SQLite) ===

async function cereBackend(cale, optiuni = {}) {
  const token = obtineToken();
  const raspuns = await fetch(`/api${cale}`, {
    ...optiuni,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(optiuni.headers || {})
    }
  });
  if (!raspuns.ok) {
    const eroare = await raspuns.json().catch(() => ({}));
    throw new Error(eroare.eroare || `Eroare server: ${raspuns.status}`);
  }
  if (raspuns.status === 204) return null;
  return raspuns.json();
}

// Favorite
export const obtineFavorite = () => cereBackend('/favorites');
export const adaugaFavorit = (city, note = '') =>
  cereBackend('/favorites', { method: 'POST', body: JSON.stringify({ city, note }) });
export const actualizeazaNotaFavorit = (id, note) =>
  cereBackend(`/favorites/${id}`, { method: 'PUT', body: JSON.stringify({ note }) });
export const stergeFavorit = (id) =>
  cereBackend(`/favorites/${id}`, { method: 'DELETE' });

// Istoric
export const obtineIstoricBackend = (limit = 10) => cereBackend(`/history?limit=${limit}`);
export const adaugaInIstoricBackend = (city) =>
  cereBackend('/history', { method: 'POST', body: JSON.stringify({ city }) });

// Setări
export const obtineSetariBackend = () => cereBackend('/settings');
export const actualizeazaSetariBackend = (setari) =>
  cereBackend('/settings', { method: 'PUT', body: JSON.stringify(setari) });

// Comunitate
export const obtineTopOrase = () => cereBackend('/community');

// Statistici personale
export const obtineIstoricStats = () => cereBackend('/history/stats');

// Admin
export const obtineUtilizatoriAdmin = () => cereBackend('/admin/users');
export const stergeUtilizatorAdmin = (id) => cereBackend(`/admin/users/${id}`, { method: 'DELETE' });
export const obtineStatisticiAdmin = () => cereBackend('/admin/stats');
