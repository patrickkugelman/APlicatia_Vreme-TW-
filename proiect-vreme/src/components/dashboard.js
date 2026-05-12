import { formateazaTemperatura, urlPictograma } from '../utils.js';
import { obtineVremeOras } from '../api.js';

/**
 * Încarcă vremea curentă pentru toate orașele favorite și randează un grid.
 * Click pe un card declanșează cautaVreme pentru acel oraș (via event delegation în main.js).
 */
export async function randeazaDashboard(favorite, containerEl, setari = {}) {
  if (!containerEl) return;

  if (!favorite.length) {
    containerEl.innerHTML = '<p class="gol-dashboard">Adaugă orașe la favorite pentru a le vedea aici.</p>';
    return;
  }

  containerEl.innerHTML = '<p class="gol-dashboard">Se încarcă...</p>';

  const { unitTemp = 'C' } = setari;

  const rezultate = await Promise.allSettled(
    favorite.map((f) => obtineVremeOras(f.city))
  );

  const carduri = rezultate.map((r, i) => {
    if (r.status === 'rejected') {
      return `
        <div class="dashboard-card dashboard-card-eroare">
          <span class="dashboard-oras">${favorite[i].city}</span>
          <span class="dashboard-indisponibil">Indisponibil</span>
        </div>`;
    }
    const { name, main, weather, sys } = r.value;
    return `
      <div class="dashboard-card" data-oras="${name}">
        <span class="dashboard-tara">${sys.country}</span>
        <span class="dashboard-oras">${name}</span>
        <img src="${urlPictograma(weather[0].icon)}" alt="${weather[0].description}" class="dashboard-icon" />
        <span class="dashboard-temp">${formateazaTemperatura(main.temp, unitTemp)}</span>
        <span class="dashboard-descriere">${weather[0].description}</span>
        <span class="dashboard-minmax">${formateazaTemperatura(main.temp_min, unitTemp)} / ${formateazaTemperatura(main.temp_max, unitTemp)}</span>
      </div>`;
  }).join('');

  containerEl.innerHTML = `<div class="dashboard-grila">${carduri}</div>`;
}
