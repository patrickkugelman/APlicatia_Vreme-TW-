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

  // Intervale de zi (06:00-22:00 ora locala), incepand de acum
  const acumSec  = Math.floor(Date.now() / 1000);
  const tzOffset = datePrognoza.city?.timezone || 0;

  let intervaleleDeAzi = datePrognoza.list.filter((p) => {
    if (p.dt < acumSec) return false;
    const oraLocala = new Date((p.dt + tzOffset) * 1000).getUTCHours();
    return oraLocala >= 6 && oraLocala <= 22;
  }).slice(0, 8);

  // Daca e dupa 22:00 si nu mai exista intervale de zi azi,
  // luam ziua de maine (urmatoarele 8 intervale de zi)
  if (!intervaleleDeAzi.length) {
    intervaleleDeAzi = datePrognoza.list.filter((p) => {
      const oraLocala = new Date((p.dt + tzOffset) * 1000).getUTCHours();
      return oraLocala >= 6 && oraLocala <= 22;
    }).slice(0, 8);
  }

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
