/**
 * Fereastra Optimă de Activitate — analizează intervalele de 3h din ziua curentă
 * și colorează un timeline 24h verde/galben/roșu în funcție de potrivirea cu activitatea aleasă.
 */

import { formateazaTemperatura, msPeSecundaInKmPeOra, urlPictograma } from '../utils.js';

// ─── Definiție activități ─────────────────────────────────────────────────────

export const ACTIVITATI = {
  alergare:   { label: '🏃 Alergare',   tempMin: 5,  tempMax: 22, windMaxKmh: 25, noPloaie: true  },
  bicicleta:  { label: '🚴 Bicicletă',  tempMin: 8,  tempMax: 28, windMaxKmh: 30, noPloaie: true  },
  gratar:     { label: '🔥 Grătar',     tempMin: 18, tempMax: 38, windMaxKmh: 20, noPloaie: true  },
  plimbare:   { label: '🚶 Plimbare',   tempMin: 3,  tempMax: 32, windMaxKmh: 40, noPloaie: false },
  fotografie: { label: '📸 Fotografie', tempMin: 0,  tempMax: 38, windMaxKmh: 50, noPloaie: false }
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

function calculeazaScor(interval, activitate) {
  const temp    = interval.main.temp;
  const windKmh = msPeSecundaInKmPeOra(interval.wind?.speed || 0);
  const pop     = interval.pop || 0;

  let scor = 100;

  // Penalizare temperatură (5 pct/grad în afara intervalului)
  if (temp < activitate.tempMin) scor -= (activitate.tempMin - temp) * 5;
  if (temp > activitate.tempMax) scor -= (temp - activitate.tempMax) * 5;

  // Penalizare vânt (2 pct/km/h peste maxim)
  if (windKmh > activitate.windMaxKmh) scor -= (windKmh - activitate.windMaxKmh) * 2;

  // Penalizare precipitații
  if (activitate.noPloaie && pop > 0.3) scor -= pop * 60;

  return Math.max(0, Math.round(scor));
}

function getClasaCuloare(scor) {
  if (scor >= 70) return 'verde';
  if (scor >= 40) return 'galben';
  return 'rosu';
}

// ─── Render ───────────────────────────────────────────────────────────────────

function buildTimelineHTML(intervale, activitate, setari) {
  const { unitTemp = 'C' } = setari;

  if (!intervale.length) {
    return '<p class="activitate-gol">Nu sunt date disponibile pentru ziua de azi.</p>';
  }

  const scoruri  = intervale.map((p) => calculeazaScor(p, activitate));
  const maxScor  = Math.max(...scoruri);
  const idxOptim = scoruri.indexOf(maxScor);

  const sloturi = intervale.map((p, i) => {
    const scor     = scoruri[i];
    const clasa    = getClasaCuloare(scor);
    const esteOptim = i === idxOptim && maxScor >= 40;
    const ora = new Date(p.dt * 1000).toLocaleTimeString('ro-RO', {
      hour: '2-digit', minute: '2-digit'
    });

    return `
      <div class="activitate-slot ${clasa}${esteOptim ? ' optim' : ''}">
        <div class="slot-ora">${ora}</div>
        <img class="slot-icon-img" src="${urlPictograma(p.weather[0].icon)}" alt="" width="28" height="28" />
        <div class="slot-temp">${formateazaTemperatura(p.main.temp, unitTemp)}</div>
        ${esteOptim ? '<div class="slot-label">✓ Optim</div>' : ''}
      </div>
    `;
  }).join('');

  const mesajOptim = maxScor >= 40
    ? `<p class="activitate-mesaj">✅ Cel mai bun interval: <strong>${new Date(intervale[idxOptim].dt * 1000).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}</strong> (scor ${maxScor}/100)</p>`
    : `<p class="activitate-mesaj alerta-mesaj">⚠️ Condiții dificile pentru ${activitate.label} azi — verifică altă zi.</p>`;

  return `${mesajOptim}<div class="activitate-timeline">${sloturi}</div>`;
}

// ─── Export public ────────────────────────────────────────────────────────────

/**
 * Randează selectorul de activitate + timeline-ul 24h în containerul dat.
 * @param {Object} datePrognoza - răspuns OWM forecast
 * @param {HTMLElement} containerEl
 * @param {Object} setari - { unitTemp, unitVant }
 */
export function randeazaActivitateOptimizator(datePrognoza, containerEl, setari = {}) {
  if (!containerEl || !datePrognoza?.list?.length) return;

  const azi = new Date();
  const intervaleleDeAzi = datePrognoza.list.filter((p) => {
    const d = new Date(p.dt * 1000);
    return d.getDate() === azi.getDate();
  });

  // Selector butoane activitate
  const selectorHTML = `
    <div class="activitate-selector">
      ${Object.entries(ACTIVITATI).map(([key, act]) =>
        `<button class="btn-activitate" data-activitate="${key}">${act.label}</button>`
      ).join('')}
    </div>
    <div class="activitate-timeline-wrap" id="activitate-timeline-wrap">
      <p class="activitate-gol">Selectează o activitate pentru a vedea fereastra optimă.</p>
    </div>
  `;

  containerEl.innerHTML = selectorHTML;

  const timelineWrap = containerEl.querySelector('#activitate-timeline-wrap');

  // Event delegation pe selector
  containerEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-activitate');
    if (!btn) return;

    const key = btn.dataset.activitate;
    const activitate = ACTIVITATI[key];
    if (!activitate) return;

    const eraActiv = btn.classList.contains('activ');
    containerEl.querySelectorAll('.btn-activitate').forEach((b) => b.classList.remove('activ'));

    if (eraActiv) {
      timelineWrap.innerHTML = '<p class="activitate-gol">Selectează o activitate pentru a vedea fereastra optimă.</p>';
      return;
    }

    btn.classList.add('activ');
    timelineWrap.innerHTML = buildTimelineHTML(intervaleleDeAzi, activitate, setari);
  });
}
