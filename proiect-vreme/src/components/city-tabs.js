import { obtineToken } from '../auth.js';

// ─── Tab-uri definite ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'stiri',        label: '📰 Știri' },
  { id: 'restaurante',  label: '🍽️ Restaurante' },
  { id: 'hoteluri',     label: '🏨 Hoteluri' },
  { id: 'calitate-aer', label: '🌫️ Calitate Aer' },
  { id: 'ghid',         label: '📖 Ghid Rapid' },
  { id: 'moneda',       label: '💱 Monedă & Timp' },
];

let tabActiv = 'stiri';
let cacheTab = {};
let intervalMoneda = null;
let tzOffsetActiv = 0; // offset secunde fata de UTC (actualizat de Google TZ)

// ─── Funcție principală ───────────────────────────────────────────────────────
export function initCityTabs(containerEl, dateVreme) {
  cacheTab = {};
  tzOffsetActiv = 0;
  if (intervalMoneda) { clearInterval(intervalMoneda); intervalMoneda = null; }
  tabActiv = 'stiri';

  const navEl = containerEl.querySelector('#city-tabs-butoane');
  const contentEl = containerEl.querySelector('#city-tabs-continut');
  if (!navEl || !contentEl) return;

  // Randează butoanele de tab
  navEl.innerHTML = TABS.map(t =>
    `<button class="btn-city-tab${t.id === tabActiv ? ' activ' : ''}" data-tab="${t.id}">${t.label}</button>`
  ).join('');

  // Event listener pe container (delegare)
  navEl.replaceWith(navEl.cloneNode(true)); // elimină vechi listeners
  const navNou = containerEl.querySelector('#city-tabs-butoane');
  navNou.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-city-tab');
    if (!btn) return;
    tabActiv = btn.dataset.tab;
    navNou.querySelectorAll('.btn-city-tab').forEach(b => b.classList.remove('activ'));
    btn.classList.add('activ');
    incarcaTab(tabActiv, contentEl, dateVreme);
  });

  // Încarcă primul tab automat
  incarcaTab(tabActiv, contentEl, dateVreme);
}

// ─── Router tab-uri ───────────────────────────────────────────────────────────
async function incarcaTab(tabId, contentEl, dateVreme) {
  if (cacheTab[tabId]) {
    contentEl.innerHTML = cacheTab[tabId];
    if (tabId === 'moneda') pornesteActualizareCeas(contentEl, tzOffsetActiv);
    return;
  }

  contentEl.innerHTML = `
    <div class="city-tab-loading">
      <div class="loading-spinner-mic"></div>
      <span>Se încarcă...</span>
    </div>`;

  const { lat, lon } = dateVreme.coord || {};
  const city = dateVreme.name;
  const countryCode = dateVreme.sys?.country;

  try {
    let html = '';
    if      (tabId === 'stiri')        html = await incarcaStiri(city);
    else if (tabId === 'restaurante')  html = await incarcaRestaurante(lat, lon, city);
    else if (tabId === 'hoteluri')     html = await incarcaHoteluri(lat, lon, city);
    else if (tabId === 'calitate-aer') html = await incarcaCalitateAer(lat, lon);
    else if (tabId === 'ghid')         html = await incarcaGhid(city, countryCode);
    else if (tabId === 'moneda')       html = await incarcaMoneda(countryCode, lat, lon);

    cacheTab[tabId] = html;
    contentEl.innerHTML = html;
    if (tabId === 'moneda') pornesteActualizareCeas(contentEl, dateVreme.timezone);
  } catch (e) {
    contentEl.innerHTML = `<p class="city-tab-eroare">⚠️ Eroare la încărcare: ${e.message}</p>`;
  }
}

// ─── Helper fetch cu auth ─────────────────────────────────────────────────────
async function fetchCuAuth(url) {
  const token = obtineToken();
  const r = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ─── Tab 1: Știri ─────────────────────────────────────────────────────────────
async function incarcaStiri(city) {
  const data = await fetchCuAuth(`/api/city-info/news/${encodeURIComponent(city)}`);

  if (data.status === 'no-key') {
    return `<p class="city-tab-info">ℹ️ Configurează <code>GNEWS_API_KEY</code> în <code>.env</code> pentru a vedea știrile. Înregistrare gratuită la <a href="https://gnews.io" target="_blank">gnews.io</a>.</p>`;
  }

  const articles = (data.articles || []).filter(a => a.title && a.title !== '[Removed]');
  if (articles.length === 0) {
    return `<p class="city-tab-info">Nu s-au găsit știri recente pentru <strong>${city}</strong>.</p>`;
  }

  return `<div class="stiri-lista">${articles.map(a => `
    <div class="stire-card">
      ${a.urlToImage
        ? `<img class="stire-img" src="${a.urlToImage}" alt="" loading="lazy" onerror="this.style.display='none'" />`
        : `<div class="stire-img-placeholder">📰</div>`}
      <div class="stire-body">
        <p class="stire-sursa">${a.source?.name || 'Sursă necunoscută'} · ${new Date(a.publishedAt).toLocaleDateString('ro-RO')}</p>
        <h3 class="stire-titlu">${a.title}</h3>
        ${a.description ? `<p class="stire-desc">${a.description.slice(0, 120)}${a.description.length > 120 ? '...' : ''}</p>` : ''}
        <a class="stire-link" href="${a.url}" target="_blank" rel="noopener noreferrer">Citește articolul →</a>
      </div>
    </div>
  `).join('')}</div>`;
}

// ─── Tab 2: Restaurante (Google Places + filtre bucatarie) ───────────────────
const FILTRE_BUCATARIE = [
  { key: 'toate',   label: '🍽️ Toate' },
  { key: 'pizza',   label: '🍕 Pizza' },
  { key: 'burger',  label: '🍔 Burger' },
  { key: 'chinez',  label: '🥡 Chinezesc' },
  { key: 'italian', label: '🍝 Italian' },
  { key: 'sushi',   label: '🍣 Sushi' },
  { key: 'mexican', label: '🌮 Mexican' },
  { key: 'japonez', label: '🍜 Japonez' },
  { key: 'cafenea', label: '☕ Cafenea' },
  { key: 'fast',    label: '🍟 Fast Food' },
];

async function incarcaRestaurante(lat, lon, city) {
  // Wrapper cu filtre — randează butoanele + lista initiala
  const filtruActiv = { key: 'toate' };

  async function fetchSiRandeaza(containerLista, subtip) {
    containerLista.innerHTML = `<div class="city-tab-loading"><div class="loading-spinner-mic"></div><span>Se încarcă...</span></div>`;
    const data = await fetchCuAuth(`/api/city-info/places?lat=${lat}&lon=${lon}&tip=restaurant&subtip=${subtip}&limit=12`);
    containerLista.innerHTML = await randeazaListaLocuri(data, 'restaurant', '🍽️', city);
  }

  const wrapperHTML = `
    <div class="filtre-bucatarie">
      ${FILTRE_BUCATARIE.map(f =>
        `<button class="btn-filtru-bucatarie${f.key === 'toate' ? ' activ' : ''}" data-subtip="${f.key}">${f.label}</button>`
      ).join('')}
    </div>
    <div id="lista-restaurante"></div>`;

  // Returnam HTML-ul cu placeholder, incarcat dinamic dupa mount
  // Folosim un ID unic pentru a putea accesa containerul dupa randare
  const uid = 'rest-' + Date.now();
  setTimeout(async () => {
    const wrapper = document.querySelector(`[data-rest-uid="${uid}"]`);
    if (!wrapper) return;
    const containerLista = wrapper.querySelector('#lista-restaurante');
    const navFiltre = wrapper.querySelector('.filtre-bucatarie');

    // Incarca lista initiala
    await fetchSiRandeaza(containerLista, 'toate');

    // Event listener pe filtre
    navFiltre.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-filtru-bucatarie');
      if (!btn) return;
      navFiltre.querySelectorAll('.btn-filtru-bucatarie').forEach(b => b.classList.remove('activ'));
      btn.classList.add('activ');
      await fetchSiRandeaza(containerLista, btn.dataset.subtip);
    });
  }, 50);

  return `<div data-rest-uid="${uid}">${wrapperHTML}</div>`;
}

// ─── Tab 3: Hoteluri (Google Places) ─────────────────────────────────────────
async function incarcaHoteluri(lat, lon, city) {
  return incarcaLocuriGoogle(lat, lon, 'hotel', '🏨', city);
}

// ─── Google Places API (proxy server) ────────────────────────────────────────
async function incarcaLocuriGoogle(lat, lon, tip, icon, city) {
  const data = await fetchCuAuth(`/api/city-info/places?lat=${lat}&lon=${lon}&tip=${tip}&subtip=toate&limit=12`);

  return randeazaListaLocuri(data, tip, icon, city);
}

// ─── Randare carduri locuri (refolosita si de filtrele de bucatarie) ──────────
function randeazaListaLocuri(data, tip, icon, city) {
  if (!data || data.status === 'no-key') {
    return `<p class="city-tab-info">ℹ️ Adaugă <code>GOOGLE_MAPS_API_KEY</code> în <code>.env</code>.</p>`;
  }
  if (data.status === 'REQUEST_DENIED') {
    return `<p class="city-tab-info">⚠️ Google Places API eroare: <em>${data.message || 'REQUEST_DENIED'}</em><br>Verifică că <strong>Places API (New)</strong> este activat în Google Cloud Console.</p>`;
  }
  if (!data.results || data.results.length === 0) {
    return `<p class="city-tab-info">Nu s-au găsit rezultate în această zonă pentru filtrul selectat.</p>`;
  }

  const pretMap = {
    PRICE_LEVEL_FREE: '', PRICE_LEVEL_INEXPENSIVE: '💰',
    PRICE_LEVEL_MODERATE: '💰💰', PRICE_LEVEL_EXPENSIVE: '💰💰💰',
    PRICE_LEVEL_VERY_EXPENSIVE: '💰💰💰💰'
  };
  const ignorate = ['establishment','point_of_interest','food','lodging','premise'];

  return `<div class="locuri-grid">${data.results.map(p => {
    const stele   = pretMap[p.priceLevel] || '';
    const rating  = p.rating
      ? `<span class="loc-rating">⭐ ${p.rating.toFixed(1)} <small>(${p.totalRatings || 0})</small></span>`
      : '';
    const tipLoc  = (p.types || []).find(t => !ignorate.includes(t))?.replace(/_/g, ' ') || tip;
    const mapsLink = `https://www.google.com/maps/place/?q=place_id:${p.placeId}`;
    const linkExtern = tip === 'hotel'
      ? `https://www.booking.com/search.html?ss=${encodeURIComponent(p.name + ' ' + city)}`
      : mapsLink;
    const labelLink = tip === 'hotel' ? '🏨 Booking.com →' : '📍 Google Maps →';

    return `
      <div class="loc-card">
        <span class="loc-icon">${icon}</span>
        <div class="loc-info">
          <p class="loc-nume">${p.name}</p>
          <p class="loc-tip">${tipLoc} ${stele}</p>
          ${p.vicinity ? `<span class="loc-dist">📍 ${p.vicinity}</span>` : ''}
          ${rating}
          <a class="loc-link" href="${linkExtern}" target="_blank" rel="noopener noreferrer">${labelLink}</a>
        </div>
      </div>`;
  }).join('')}</div>`;
}

// ─── Tab 4: Calitate Aer (Google Air Quality API) ────────────────────────────
async function incarcaCalitateAer(lat, lon) {
  const data = await fetchCuAuth(`/api/city-info/air/${lat}/${lon}`);

  if (!data || data.status === 'no-key') {
    return `<p class="city-tab-info">ℹ️ Adaugă <code>GOOGLE_MAPS_API_KEY</code> în <code>.env</code>.</p>`;
  }
  if (data.error?.code) {
    return `<p class="city-tab-info">⚠️ Eroare Google Air Quality: ${data.error.message}</p>`;
  }

  // Google returnează mai mulți indici — preferăm UAQI (Universal AQI)
  const indexes = data.indexes || [];
  const idx = indexes.find(i => i.code === 'uaqi') || indexes[0];
  if (!idx) {
    return `<p class="city-tab-info">Nu s-au putut obține date despre calitatea aerului.</p>`;
  }

  const aqi = idx.aqi;
  const categorie = idx.category || '';
  const dominantPollutant = idx.dominantPollutant || '';

  function clasificaAqi(val) {
    if (val <= 50)  return { cls: 'aqi-excelent', label: 'Bun 😊' };
    if (val <= 100) return { cls: 'aqi-bun',      label: 'Moderat 🙂' };
    if (val <= 150) return { cls: 'aqi-moderat',  label: 'Nesănătos (sensibili) 😐' };
    if (val <= 200) return { cls: 'aqi-slab',     label: 'Nesănătos 😷' };
    if (val <= 300) return { cls: 'aqi-periculos',label: 'Foarte nesănătos 🤢' };
    return                 { cls: 'aqi-periculos',label: 'Periculos ☠️' };
  }
  const { cls, label } = clasificaAqi(aqi);

  // Poluanți din răspuns
  const poluanti = (data.pollutants || []).map(p => ({
    label: p.displayName || p.code.toUpperCase(),
    val:   p.concentration?.value,
    unit:  p.concentration?.units === 'MICROGRAMS_PER_CUBIC_METER' ? 'μg/m³' : p.concentration?.units || ''
  })).filter(p => p.val != null);

  return `
    <div class="aqi-container">
      <div class="aqi-principal">
        <div class="aqi-cerc ${cls}">
          <span class="aqi-valoare">${aqi}</span>
          <span class="aqi-din-5">AQI</span>
        </div>
        <div class="aqi-text">
          <span class="aqi-eticheta ${cls}">${label}</span>
          <span class="aqi-subtitlu">${categorie || 'Universal Air Quality Index'}</span>
          ${dominantPollutant ? `<span class="aqi-statie">⚠️ Poluant dominant: ${dominantPollutant.toUpperCase()}</span>` : ''}
        </div>
      </div>
      ${poluanti.length > 0 ? `
      <div class="aqi-componente">
        ${poluanti.map(p => `
          <div class="aqi-comp-item">
            <span class="aqi-comp-label">${p.label}</span>
            <strong class="aqi-comp-val">${typeof p.val === 'number' ? p.val.toFixed(1) : p.val}</strong>
            <span class="aqi-comp-unit">${p.unit}</span>
          </div>
        `).join('')}
      </div>` : ''}
    </div>`;
}

// ─── Tab 5: Ghid Rapid Wikipedia ──────────────────────────────────────────────
async function incarcaGhid(city, countryCode) {
  // Încearcă Wikipedia EN; fallback mesaj
  const r = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`
  );

  if (!r.ok || r.status === 404) {
    return `<p class="city-tab-info">Nu s-au găsit informații Wikipedia pentru <strong>${city}</strong>.</p>`;
  }

  const wiki = await r.json();
  if (wiki.type === 'disambiguation') {
    return `<p class="city-tab-info">Există mai multe locuri cu numele "${city}". Încearcă un nume mai specific.</p>`;
  }

  // Info țară din restcountries (opțional)
  let extraHTML = '';
  try {
    const rc = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,capital,population,area`);
    if (rc.ok) {
      const tara = await rc.json();
      const pop = tara.population ? `<span class="ghid-badge">👥 ${(tara.population / 1_000_000).toFixed(1)}M locuitori</span>` : '';
      const capital = tara.capital?.[0] ? `<span class="ghid-badge">🏛️ Capitală: ${tara.capital[0]}</span>` : '';
      const area = tara.area ? `<span class="ghid-badge">📐 ${tara.area.toLocaleString()} km²</span>` : '';
      if (pop || capital || area) {
        extraHTML = `<div class="ghid-badges">${pop}${capital}${area}</div>`;
      }
    }
  } catch {}

  return `
    <div class="ghid-container">
      ${wiki.thumbnail?.source
        ? `<img class="ghid-img" src="${wiki.thumbnail.source}" alt="${wiki.title}" loading="lazy" />`
        : ''}
      <div class="ghid-continut">
        <h3 class="ghid-titlu">${wiki.title}</h3>
        ${extraHTML}
        <p class="ghid-desc">${wiki.extract || ''}</p>
        <a class="ghid-link" href="${wiki.content_urls?.desktop?.page || '#'}" target="_blank" rel="noopener noreferrer">
          📖 Citește mai mult pe Wikipedia →
        </a>
      </div>
    </div>`;
}

// ─── Tab 6: Monedă & Fus Orar (Google Time Zone + ExchangeRate) ──────────────
async function incarcaMoneda(countryCode, lat, lon) {
  // 1. Google Time Zone API — fus orar exact
  let tzId = '', tzName = '', offsetTotal = 0;
  try {
    const tz = await fetchCuAuth(`/api/city-info/timezone/${lat}/${lon}`);
    if (tz && tz.status === 'OK') {
      tzId   = tz.timeZoneId   || '';
      tzName = tz.timeZoneName || '';
      offsetTotal = (tz.rawOffset || 0) + (tz.dstOffset || 0); // secunde față de UTC
      tzOffsetActiv = offsetTotal; // salvat pentru ceas
    }
  } catch {}

  // Fallback la offset OWM dacă Google eșuează
  // (offsetTotal rămâne 0 dacă ambele eșuează)

  // 2. Monedă din restcountries (gratuit, fără cheie)
  let currencyCode = '', currencyName = '', currencySymbol = '';
  try {
    const rc = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}?fields=currencies`);
    if (rc.ok) {
      const tara = await rc.json();
      const intrari = Object.entries(tara.currencies || {});
      if (intrari.length > 0) {
        [currencyCode, { name: currencyName, symbol: currencySymbol = '' }] = intrari[0];
      }
    }
  } catch {}

  // 3. Cursuri valutare (open.er-api.com — gratuit, fără cheie)
  let rateRON = null, rateEUR = null;
  if (currencyCode) {
    try {
      const re = await fetch(`https://open.er-api.com/v6/latest/${currencyCode}`);
      if (re.ok) {
        const rates = (await re.json()).rates || {};
        rateRON = rates.RON ?? null;
        rateEUR = rates.EUR ?? null;
      }
    } catch {}
  }

  // Calcul oră locală
  const localNow = new Date(Date.now() + offsetTotal * 1000);
  const oraStr = localNow.toISOString().slice(11, 16);
  const semn = offsetTotal >= 0 ? '+' : '-';
  const absH = String(Math.floor(Math.abs(offsetTotal) / 3600)).padStart(2, '0');
  const absM = String(Math.floor((Math.abs(offsetTotal) % 3600) / 60)).padStart(2, '0');

  const cursRON = (rateRON && currencyCode !== 'RON')
    ? `<div class="moneda-curs"><span>1 ${currencyCode}</span><strong>= ${rateRON.toFixed(4)} RON</strong></div>`
    : '';
  const cursEUR = (rateEUR && currencyCode !== 'EUR')
    ? `<div class="moneda-curs"><span>1 ${currencyCode}</span><strong>= ${rateEUR.toFixed(4)} EUR</strong></div>`
    : '';

  return `
    <div class="moneda-container">
      <div class="moneda-ora-bloc">
        <span class="moneda-ora-valoare" id="ora-locala-display">${oraStr}</span>
        <span class="moneda-ora-label">Ora locală (UTC${semn}${absH}:${absM})</span>
        ${tzName ? `<span class="moneda-tz-nume">${tzName}</span>` : ''}
        ${tzId   ? `<span class="moneda-tz-id">🌍 ${tzId}</span>` : ''}
      </div>
      <div class="moneda-detalii">
        ${currencyCode ? `
          <div class="moneda-item">
            <span class="moneda-cod">${currencyCode} <span class="moneda-simbol">${currencySymbol}</span></span>
            <span class="moneda-nume">${currencyName}</span>
          </div>
          ${cursEUR}
          ${cursRON}
        ` : `<p class="city-tab-info">Nu s-au putut obține informații despre monedă.</p>`}
      </div>
    </div>`;
}

// ─── Actualizare ceas în timp real ────────────────────────────────────────────
function pornesteActualizareCeas(contentEl, offsetTotal) {
  if (intervalMoneda) clearInterval(intervalMoneda);
  const offset = offsetTotal || 0;
  intervalMoneda = setInterval(() => {
    const el = contentEl.querySelector('#ora-locala-display');
    if (!el) { clearInterval(intervalMoneda); return; }
    const localNow = new Date(Date.now() + offset * 1000);
    el.textContent = localNow.toISOString().slice(11, 16);
  }, 30000);
}
