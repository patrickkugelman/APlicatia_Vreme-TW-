/**
 * Weather Time Machine — Scrubber interactiv prin prognoza pe 5 zile.
 * Utilizatorul trage un slider → card-ul + background-ul + particulele se actualizează live.
 */

import { formateazaTemperatura, formateazaVant, convertesteDirectiVant, urlPictograma } from '../utils.js';

let listaPrognoze = [];
let containerEl = null;
let onSchimbareCb = null;
let indexCurent = 0;
let numeOras = '';

// ─── Formatare timp ──────────────────────────────────────────────────────────

function formateazaOraLocala(timestamp) {
  const d = new Date(timestamp * 1000);
  const zi = d.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' });
  const ora = d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  return { zi, ora };
}

function calculeazaRelativ(timestamp) {
  const acum = Date.now() / 1000;
  const diff = timestamp - acum;
  if (diff < 0) return 'trecut';
  const ore = Math.round(diff / 3600);
  if (ore < 1) return 'în curând';
  if (ore < 24) return `peste ${ore}h`;
  const zile = Math.round(ore / 24);
  return `peste ${zile} ${zile === 1 ? 'zi' : 'zile'}`;
}

// ─── Render card mini-prognoză ───────────────────────────────────────────────

function randeazaMiniCard(punct, setari = {}) {
  const { unitTemp = 'C', unitVant = 'kmh' } = setari;
  const { weather, main, wind, dt, pop } = punct;
  const { zi, ora } = formateazaOraLocala(dt);
  const relativ = calculeazaRelativ(dt);
  const probabilitatePloaie = Math.round((pop || 0) * 100);

  const culoareBg = getCuloarePerioadaZi(dt);

  return `
    <div class="tm-card" style="background: ${culoareBg}">
      <div class="tm-card-stanga">
        <img src="${urlPictograma(weather[0].icon)}" alt="${weather[0].description}" class="tm-icon" />
        <div class="tm-temp-wrap">
          <span class="tm-temp">${formateazaTemperatura(main.temp, unitTemp)}</span>
          <span class="tm-descriere">${weather[0].description}</span>
        </div>
      </div>
      <div class="tm-card-dreapta">
        <div class="tm-detaliu">💨 ${formateazaVant(wind.speed, unitVant)} ${convertesteDirectiVant(wind.deg)}</div>
        <div class="tm-detaliu">💧 ${probabilitatePloaie}% precipitații</div>
        <div class="tm-detaliu">🌡️ ${formateazaTemperatura(main.temp_min, unitTemp)} / ${formateazaTemperatura(main.temp_max, unitTemp)}</div>
      </div>
    </div>
  `;
}

function getCuloarePerioadaZi(timestamp) {
  const ora = new Date(timestamp * 1000).getHours();
  if (ora >= 5 && ora < 8)   return 'linear-gradient(135deg, rgba(255,140,50,0.15), rgba(20,30,60,0.3))';
  if (ora >= 8 && ora < 18)  return 'linear-gradient(135deg, rgba(30,80,160,0.12), rgba(10,20,40,0.2))';
  if (ora >= 18 && ora < 21) return 'linear-gradient(135deg, rgba(200,80,30,0.15), rgba(10,20,40,0.3))';
  return 'linear-gradient(135deg, rgba(5,10,30,0.3), rgba(20,30,80,0.2))'; // noapte
}

// ─── Render complet Time Machine ─────────────────────────────────────────────

function randeazaTimeMachine(setari) {
  if (!containerEl || !listaPrognoze.length) return;

  const total = listaPrognoze.length;
  const { zi: ziPrima } = formateazaOraLocala(listaPrognoze[0].dt);
  const { zi: ziUltima } = formateazaOraLocala(listaPrognoze[total - 1].dt);

  containerEl.innerHTML = `
    <div class="time-machine-wrap">
      <div class="tm-header">
        <span class="tm-titlu">⏱️ Mașina Timpului</span>
        <span class="tm-subtitlu">${numeOras} — Prognoza pe 5 zile, intervale de 3h</span>
      </div>

      <div class="tm-slider-wrap">
        <span class="tm-cap">${ziPrima}</span>
        <input
          type="range"
          id="tm-slider"
          class="tm-slider"
          min="0"
          max="${total - 1}"
          value="${indexCurent}"
          step="1"
        />
        <span class="tm-cap">${ziUltima}</span>
      </div>

      <div class="tm-timp-label" id="tm-timp-label"></div>

      <div id="tm-mini-card"></div>
    </div>
  `;

  actualizeazaAfisaj(setari);

  const slider = containerEl.querySelector('#tm-slider');
  slider.addEventListener('input', (e) => {
    indexCurent = parseInt(e.target.value);
    actualizeazaAfisaj(setari);
    if (onSchimbareCb) onSchimbareCb(listaPrognoze[indexCurent]);
  });

  // Actualizare gradient slider CSS
  actualizeazaGradientSlider(slider, indexCurent, total);
}

function actualizeazaAfisaj(setari) {
  if (!containerEl || !listaPrognoze[indexCurent]) return;
  const punct = listaPrognoze[indexCurent];
  const { zi, ora } = formateazaOraLocala(punct.dt);
  const relativ = calculeazaRelativ(punct.dt);

  const labelEl = containerEl.querySelector('#tm-timp-label');
  if (labelEl) {
    labelEl.innerHTML = `
      <span class="tm-zi">${zi}</span>
      <span class="tm-ora">${ora}</span>
      <span class="tm-relativ">${relativ}</span>
    `;
  }

  const cardEl = containerEl.querySelector('#tm-mini-card');
  if (cardEl) cardEl.innerHTML = randeazaMiniCard(punct, setari);

  // Actualizare gradient slider
  const slider = containerEl.querySelector('#tm-slider');
  if (slider) actualizeazaGradientSlider(slider, indexCurent, listaPrognoze.length);
}

function actualizeazaGradientSlider(slider, index, total) {
  const procent = total > 1 ? (index / (total - 1)) * 100 : 0;
  slider.style.setProperty('--val', `${procent}%`);
}

// ─── API public ──────────────────────────────────────────────────────────────

/**
 * Inițializează Time Machine.
 * @param {HTMLElement} container
 * @param {Object} datePrognoza - răspuns OWM forecast ({list, city})
 * @param {Function} onSchimbare - callback(punct) la mișcarea slider-ului
 * @param {Object} setari - { unitTemp, unitVant }
 * @param {string} numeOrasParam
 */
export function initTimeMachine(container, datePrognoza, onSchimbare, setari = {}, numeOrasParam = '') {
  containerEl = container;
  listaPrognoze = datePrognoza?.list || [];
  onSchimbareCb = onSchimbare;
  indexCurent = 0;
  numeOras = numeOrasParam;

  if (!listaPrognoze.length) return;

  randeazaTimeMachine(setari);
}

/**
 * Actualizează datele când se caută un alt oraș (fără a re-crea DOM-ul).
 */
export function actualizeazaTimeMachine(datePrognoza, setari = {}, numeOrasNou = '') {
  listaPrognoze = datePrognoza?.list || [];
  indexCurent = 0;
  numeOras = numeOrasNou;
  randeazaTimeMachine(setari);
}

/**
 * Curăță Time Machine (la logout).
 */
export function distrugeTimeMachine() {
  if (containerEl) containerEl.innerHTML = '';
  containerEl = null;
  listaPrognoze = [];
  onSchimbareCb = null;
  indexCurent = 0;
}
