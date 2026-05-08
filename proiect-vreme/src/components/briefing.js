/**
 * Briefing Zilnic Inteligent — motor de recomandări smart bazat pe prognoza de azi.
 * Analizează intervalele de 3h din ziua curentă și generează sfaturi personalizate.
 */

import { formateazaTemperatura, msPeSecundaInKmPeOra } from '../utils.js';

// ─── Reguli recomandări ───────────────────────────────────────────────────────

function getRecomandareOutfit(tempMin) {
  if (tempMin < 0)  return '🧥 Palton gros, mănuși și fular — îngheață afară';
  if (tempMin < 8)  return '🧥 Geacă caldă și straturi multiple';
  if (tempMin < 15) return '🧥 Jachetă medie sau pulover';
  if (tempMin < 22) return '👕 Tricou + jachetă ușoară seara';
  return '👕 Haine ușoare de vară';
}

function getRecomandareUmbrela(popMax) {
  if (popMax > 0.7) return '☂️ Ia umbrela — ploaie foarte probabilă azi';
  if (popMax > 0.4) return '🌂 Recomandat o umbrelă la tine azi';
  if (popMax > 0.2) return '🌂 Șanse mici de ploaie — umbrelă opțional';
  return '☀️ Nu ai nevoie de umbrelă azi';
}

function getFereastraOptima(intervale) {
  for (const p of intervale) {
    const pop = p.pop || 0;
    const windKmh = msPeSecundaInKmPeOra(p.wind?.speed || 0);
    const temp = p.main.temp;
    if (pop < 0.3 && windKmh < 40 && temp >= 5 && temp <= 35) {
      const ora = new Date(p.dt * 1000).toLocaleTimeString('ro-RO', {
        hour: '2-digit', minute: '2-digit'
      });
      return `🕐 Condiții bune de ieșit în jurul orei ${ora}`;
    }
  }
  return '🏠 Condiții dificile toată ziua — zi de stat acasă';
}

// ─── Builder HTML ─────────────────────────────────────────────────────────────

function buildBriefingHTML(items) {
  const lis = items.map((item) => {
    const isAlerta = item.startsWith('⚠️');
    return `<li class="briefing-item${isAlerta ? ' alerta' : ''}">${item}</li>`;
  }).join('');
  return `<ul class="briefing-lista">${lis}</ul>`;
}

// ─── Export public ────────────────────────────────────────────────────────────

/**
 * Generează și randează briefing-ul zilnic în containerul dat.
 * @param {Object} datePrognoza - răspuns OWM forecast
 * @param {HTMLElement} containerEl - elementul în care se randează
 * @param {Object} setari - { unitTemp, unitVant }
 */
export function randeazaBriefing(datePrognoza, containerEl, setari = {}) {
  if (!containerEl || !datePrognoza?.list?.length) return;

  const azi = new Date();
  const intervaleleDeAzi = datePrognoza.list.filter((p) => {
    const d = new Date(p.dt * 1000);
    return d.getDate() === azi.getDate();
  });

  if (!intervaleleDeAzi.length) {
    containerEl.innerHTML = '';
    return;
  }

  const { unitTemp = 'C' } = setari;
  const tempMin = Math.min(...intervaleleDeAzi.map((p) => p.main.temp));
  const tempMax = Math.max(...intervaleleDeAzi.map((p) => p.main.temp));
  const popMax  = Math.max(...intervaleleDeAzi.map((p) => p.pop || 0));

  const items = [
    getRecomandareOutfit(tempMin),
    getRecomandareUmbrela(popMax),
    getFereastraOptima(intervaleleDeAzi)
  ];

  // Alertă diferență mare de temperatură
  if (tempMax - tempMin >= 10) {
    items.push(
      `⚠️ Diferență mare azi: ${formateazaTemperatura(tempMin, unitTemp)} dimineața → ${formateazaTemperatura(tempMax, unitTemp)} după-amiază`
    );
  }

  // Ora primei ploi probabile
  const ploaieInterval = intervaleleDeAzi.find((p) => (p.pop || 0) > 0.5);
  if (ploaieInterval) {
    const ora = new Date(ploaieInterval.dt * 1000).toLocaleTimeString('ro-RO', {
      hour: '2-digit', minute: '2-digit'
    });
    items.push(`🌧️ Ploaie posibilă în jurul orei ${ora}`);
  }

  containerEl.innerHTML = buildBriefingHTML(items);
}
