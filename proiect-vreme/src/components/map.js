/**
 * Hartă interactivă Leaflet — centrată pe România.
 * Click pe hartă → caută vremea la coordonatele respective.
 * Marker actualizat la fiecare căutare (oraș sau coordonate).
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icons Leaflet cu Vite (bundler schimbă calea imaginilor)
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
});

let harta = null;
let marker = null;

/**
 * Inițializează harta Leaflet în containerul dat.
 * @param {string} idContainer - ID-ul elementului div pentru hartă
 * @param {Function} onClickCoordonate - callback(lat, lon) la click pe hartă
 * @returns {{ actualizeazaMarker: Function, centreazaLa: Function }}
 */
export function initHarta(idContainer, onClickCoordonate) {
  const container = document.getElementById(idContainer);
  if (!container) return null;

  // Previne inițializare dublă
  if (harta) {
    harta.remove();
    harta = null;
    marker = null;
  }

  // Centrat pe România
  harta = L.map(idContainer, {
    center: [45.9432, 24.9668],
    zoom: 6,
    zoomControl: true,
    attributionControl: true
  });

  // Tile layer — OpenStreetMap (fără API key)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(harta);

  // Click pe hartă → caută vreme la coordonate
  harta.on('click', (e) => {
    const { lat, lng } = e.latlng;
    plasheazaMarker(lat, lng);
    onClickCoordonate?.(lat, lng);
  });

  return {
    actualizeazaMarker,
    centreazaLa
  };
}

/**
 * Mută marker-ul la o nouă poziție (la fiecare căutare reușită).
 * @param {number} lat
 * @param {number} lon
 * @param {string} [numeCitat] - tooltip afișat pe marker
 */
export function actualizeazaMarker(lat, lon, numeCitat = '') {
  if (!harta) return;
  plasheazaMarker(lat, lon, numeCitat);
  harta.setView([lat, lon], Math.max(harta.getZoom(), 8), { animate: true });
}

/**
 * Centrează harta pe coordonate fără a schimba zoom-ul.
 */
export function centreazaLa(lat, lon) {
  harta?.panTo([lat, lon], { animate: true });
}

function plasheazaMarker(lat, lon, tooltip = '') {
  if (!harta) return;
  if (marker) {
    marker.setLatLng([lat, lon]);
  } else {
    marker = L.marker([lat, lon]).addTo(harta);
  }
  if (tooltip) {
    marker.bindTooltip(tooltip, { permanent: false, direction: 'top' }).openTooltip();
  }
}

// ─── Radar Meteo Live — OWM Tile Overlay ────────────────────────────────────

let layerOWMActiv = null;

/**
 * Activează / dezactivează un layer meteo OWM pe hartă.
 * @param {string|null} numeLayer - 'clouds_new'|'precipitation_new'|'temp_new'|'wind_new'|null
 * @param {string} apiKey - VITE_OPENWEATHER_API_KEY
 */
export function schimbaLayerMeteo(numeLayer, apiKey) {
  if (layerOWMActiv) {
    harta.removeLayer(layerOWMActiv);
    layerOWMActiv = null;
  }
  if (numeLayer && apiKey && harta) {
    layerOWMActiv = L.tileLayer(
      `https://tile.openweathermap.org/map/${numeLayer}/{z}/{x}/{y}.png?appid=${apiKey}`,
      { opacity: 0.65, attribution: '© OpenWeatherMap' }
    ).addTo(harta);
  }
}
