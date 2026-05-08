import {
  formateazaTemperatura,
  formateazaVant,
  formateazaData,
  convertesteDirectiVant,
  urlPictograma,
  formateazaZiSaptamana,
  filtreazaPrognozeZilnice
} from './utils.js';

// Afișează cardul cu informații meteo curente
export function randeazaVreme(date, container, setari = {}) {
  const { unitTemp = 'C', unitVant = 'kmh' } = setari;
  const { name, main, weather, wind, sys, dt } = date;
  const [descriere] = weather;

  container.innerHTML = `
    <div class="card-vreme">
      <div class="antet-card">
        <div class="antet-card-sus">
          <h2>${name}, ${sys.country}</h2>
          <span class="live-badge" id="live-badge">🟢 LIVE</span>
        </div>
        <p class="data">${formateazaData(dt)}</p>
      </div>
      <div class="corp-card">
        <img src="${urlPictograma(descriere.icon)}" alt="${descriere.description}" />
        <div>
          <p class="temperatura" data-live-temp>${formateazaTemperatura(main.temp, unitTemp)}</p>
          <p class="descriere">${descriere.description}</p>
        </div>
      </div>
      <div class="detalii-card">
        <span data-live-feels-like>Simte ca: ${formateazaTemperatura(main.feels_like, unitTemp)}</span>
        <span data-live-humidity>Umiditate: ${main.humidity}%</span>
        <span data-live-wind>Vânt: ${formateazaVant(wind.speed, unitVant)} ${convertesteDirectiVant(wind.deg)}</span>
        <span>Min/Max: ${formateazaTemperatura(main.temp_min, unitTemp)} / ${formateazaTemperatura(main.temp_max, unitTemp)}</span>
      </div>
    </div>
  `;
}

// Afișează prognoza pe 5 zile
export function randeazaPrognoza(datePrognoza, container, setari = {}) {
  const { unitTemp = 'C' } = setari;
  const zilnice = filtreazaPrognozeZilnice(datePrognoza.list);

  container.innerHTML = `
    <div class="prognoza-container">
      <h3 class="prognoza-titlu">Prognoza pe 5 zile</h3>
      <div class="prognoza-grila">
        ${zilnice.map(({ dt, weather, main }) => `
          <div class="card-zi">
            <p class="zi-saptamana">${formateazaZiSaptamana(dt)}</p>
            <img src="${urlPictograma(weather[0].icon)}" alt="${weather[0].description}" />
            <p class="temp-max">${formateazaTemperatura(main.temp_max, unitTemp)}</p>
            <p class="temp-min">${formateazaTemperatura(main.temp_min, unitTemp)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Afișează lista istoricului de căutări
export function randeazaIstoric(orase, lista) {
  lista.innerHTML = orase.length
    ? orase.map((oras) => `<li data-oras="${oras}">${oras}</li>`).join('')
    : '<li class="gol">Niciun oraș căutat încă</li>';
}

// Afișează lista de orașe favorite cu buton de ștergere
export function randeazaFavorite(favorite, lista) {
  if (!favorite.length) {
    lista.innerHTML = '<li class="gol">Niciun oraș favorit adăugat.</li>';
    return;
  }
  lista.innerHTML = favorite.map(({ id, city, note }) => `
    <li class="favorit-item">
      <span data-oras="${city}" class="favorit-oras">${city}</span>
      ${note ? `<span class="favorit-nota">${note}</span>` : ''}
      <button class="btn-sterge-favorit" data-id-favorit="${id}" data-actiune="sterge" title="Șterge din favorite">✕</button>
    </li>
  `).join('');
}

// Afișează carduri de comparație multi-oraș
export function randeazaComparatie(orase, container, setari = {}) {
  const { unitTemp = 'C', unitVant = 'kmh' } = setari;
  if (!orase.length) {
    container.innerHTML = '<p class="gol-comparatie">Caută orașe și adaugă-le la comparație (maxim 4).</p>';
    return;
  }
  container.innerHTML = orase.map(({ name, sys, main, weather, wind }) => `
    <div class="card-comparatie">
      <div class="comparatie-antet">
        <h3>${name}, ${sys.country}</h3>
        <button class="btn-scoate-comparatie" data-actiune-comparatie="sterge" data-oras="${name}" title="Scoate din comparație">✕</button>
      </div>
      <img src="${urlPictograma(weather[0].icon)}" alt="${weather[0].description}" />
      <p class="comparatie-temp">${formateazaTemperatura(main.temp, unitTemp)}</p>
      <p class="comparatie-descriere">${weather[0].description}</p>
      <div class="comparatie-detalii">
        <span>Umiditate: ${main.humidity}%</span>
        <span>Vânt: ${formateazaVant(wind.speed, unitVant)} ${convertesteDirectiVant(wind.deg)}</span>
        <span>Min/Max: ${formateazaTemperatura(main.temp_min, unitTemp)} / ${formateazaTemperatura(main.temp_max, unitTemp)}</span>
      </div>
    </div>
  `).join('');
}

// Afișează un mesaj de eroare în container
export function randeazaEroare(mesaj, container) {
  container.innerHTML = `<div class="eroare">${mesaj}</div>`;
}

// Afișează animație de încărcare în container
export function randeazaIncarcare(container) {
  container.innerHTML = '<div class="incarcare">Se încarcă...</div>';
}
