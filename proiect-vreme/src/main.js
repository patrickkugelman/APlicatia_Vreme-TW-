import {
  obtineVremeOras, obtinePrognozeOras,
  obtineVremeCoordonate, obtinePrognozeCoordonate,
  obtineFavorite, adaugaFavorit, stergeFavorit,
  adaugaInIstoricBackend, obtineIstoricBackend,
  obtineSetariBackend, actualizeazaSetariBackend,
  obtineTopOrase, obtineIstoricStats
} from './api.js';
import {
  randeazaVreme, randeazaPrognoza, randeazaIstoric,
  randeazaFavorite, randeazaComparatie,
  randeazaEroare, randeazaIncarcare
} from './ui.js';
import { randeazaGraficPrognoza } from './chart.js';
import { adaugaInComparatie, scoateDinComparatie, obtineOraseComparatie, sorteazaComparatie } from './compare.js';
import { initializeazaTema, comutaTema } from './theme.js';
import { obtineLocatieUser } from './geo.js';
import { cerePermisiuneNotificari, estePermisiuneAcordata, seteazaPraguri, verificaSiTrimiteNotificare, verificaPloaieUrmatoarele3Ore } from './notifications.js';
import { aplicaSetari, obtineSetariActive } from './settings.js';
import { protejeazaPagina } from './auth-guard.js';
import { deconecteaza, esteAdmin, obtineToken } from './auth.js';
import { obtineClassBackground, aplicaBackground } from './background.js';
import { initVoice } from './voice.js';
import { initHarta, actualizeazaMarker, schimbaLayerMeteo } from './components/map.js';
import { initParticule, actualizeazaParticule } from './components/particles.js';
import { initTimeMachine, actualizeazaTimeMachine } from './components/time-machine.js';
import { evidentiazaPunctGrafic } from './chart.js';
import { randeazaBriefing } from './components/briefing.js';
import { randeazaActivitateOptimizator } from './components/activity-optimizer.js';
import { randeazaDashboard } from './components/dashboard.js';
import { randeazaAnalytics } from './components/analytics.js';
import { formateazaTemperatura, formateazaVant, convertesteDirectiVant } from './utils.js';

// ─── SSE Live Updates — state modul ──────────────────────────────────────────

let sseConexiune = null;

function initLiveUpdates(oras) {
  if (sseConexiune) { sseConexiune.close(); sseConexiune = null; }
  const token = obtineToken();
  if (!token || !oras) return;
  sseConexiune = new EventSource(`/api/weather/live/${encodeURIComponent(oras)}?token=${token}`);
  sseConexiune.onmessage = (e) => {
    try { actualizeazaCardLive(JSON.parse(e.data)); } catch {}
  };
  sseConexiune.onerror = () => { sseConexiune?.close(); sseConexiune = null; };
}

function actualizeazaCardLive(date) {
  const setari = obtineSetariActive();

  const anima = (el) => {
    el.classList.remove('live-update');
    void el.offsetWidth; // reflow pentru restart animație
    el.classList.add('live-update');
    setTimeout(() => el.classList.remove('live-update'), 500);
  };

  const elTemp = document.querySelector('[data-live-temp]');
  if (elTemp) { elTemp.textContent = formateazaTemperatura(date.temp, setari.unitTemp); anima(elTemp); }

  const elFeels = document.querySelector('[data-live-feels-like]');
  if (elFeels) { elFeels.textContent = `Simte ca: ${formateazaTemperatura(date.feelsLike, setari.unitTemp)}`; anima(elFeels); }

  const elHumidity = document.querySelector('[data-live-humidity]');
  if (elHumidity) { elHumidity.textContent = `Umiditate: ${date.humidity}%`; anima(elHumidity); }

  const elWind = document.querySelector('[data-live-wind]');
  if (elWind && date.wind) {
    elWind.textContent = `Vânt: ${formateazaVant(date.wind.speed, setari.unitVant)} ${convertesteDirectiVant(date.wind.deg)}`;
    anima(elWind);
  }
}

// ─── Clase aplicație ──────────────────────────────────────────────────────────

class AplicatieVreme {
  constructor(user) {
    this.utilizatorCurent = user;

    this.formCautare = document.getElementById('form-cautare');
    this.inputOras = document.getElementById('input-oras');
    this.containerVreme = document.getElementById('container-vreme');
    this.containerGrafic = document.getElementById('container-grafic');
    this.containerPrognoza = document.getElementById('container-prognoza');
    this.listaIstoric = document.getElementById('lista-istoric');
    this.listaFavorite = document.getElementById('lista-favorite');
    this.listaComunitate = document.getElementById('lista-comunitate');
    this.containerComparatie = document.getElementById('container-comparatie');
    this.actiuniOras = document.getElementById('actiuni-oras');
    this.btnTema = document.getElementById('btn-tema');
    this.btnLocatie = document.getElementById('btn-locatie');
    this.btnSetari = document.getElementById('btn-setari');
    this.btnMicrofon = document.getElementById('btn-microfon');
    this.btnDeconecteaza = document.getElementById('btn-deconecteaza');
    this.panouSetari = document.getElementById('panou-setari');
    this.btnAdaugaFavorit = document.getElementById('btn-adauga-favorit');
    this.btnAdaugaComparatie = document.getElementById('btn-adauga-comparatie');
    this.btnPermiteNotificari = document.getElementById('btn-permite-notificari');
    this.selectUnitTemp = document.getElementById('select-unit-temp');
    this.selectUnitVant = document.getElementById('select-unit-vant');
    this.inputPragMin = document.getElementById('input-prag-min');
    this.inputPragMax = document.getElementById('input-prag-max');
    this.indicatorVoce = document.getElementById('indicator-voce');
    this.infoUser = document.getElementById('info-user');
    this.linkAdmin = document.getElementById('link-admin');
    this.btnDashboard = document.getElementById('btn-dashboard');
    this.containerDashboard = document.getElementById('container-dashboard');
    this.btnAnalytics = document.getElementById('btn-analytics');
    this.containerAnalytics = document.getElementById('container-analytics');

    this.dateVremeActuale = null;
    this.datePrognozaActuale = null;
    this.hartaAPI = null;

    this.init();
  }

  async init() {
    // Afișează info utilizator
    if (this.infoUser && this.utilizatorCurent) {
      this.infoUser.textContent = `👤 ${this.utilizatorCurent.name || this.utilizatorCurent.email}`;
    }
    if (this.linkAdmin && esteAdmin()) {
      this.linkAdmin.classList.remove('ascuns');
    }

    await this.incarcaSetari();
    await Promise.all([
      this.incarcaFavorite(),
      this.incarcaIstoric(),
      this.incarcaComunitate()
    ]);
    this.initializeazaEvenimente();
    this.actualizeazaStareNotificari();
    this.initVoiceSearch();
    this.initHartaInteractiva();
    initParticule(document.getElementById('canvas-particule'));
  }

  async incarcaSetari() {
    try {
      const setari = await obtineSetariBackend();
      aplicaSetari(setari);
    } catch {
      // Continuăm cu setările implicite dacă backend-ul nu răspunde
    }
    const setariActive = obtineSetariActive();
    initializeazaTema(setariActive.tema);
    this.actualizeazaUISetari(setariActive);
    this.actualizeazaIconaTema(setariActive.tema);
    seteazaPraguri(setariActive.pragMin, setariActive.pragMax);
  }

  actualizeazaUISetari(setari) {
    if (this.selectUnitTemp) this.selectUnitTemp.value = setari.unitTemp || 'C';
    if (this.selectUnitVant) this.selectUnitVant.value = setari.unitVant || 'kmh';
    if (this.inputPragMin && setari.pragMin != null) this.inputPragMin.value = setari.pragMin;
    if (this.inputPragMax && setari.pragMax != null) this.inputPragMax.value = setari.pragMax;
  }

  actualizeazaStareNotificari() {
    if (estePermisiuneAcordata()) {
      this.btnPermiteNotificari.textContent = 'Notificări activate ✓';
      this.btnPermiteNotificari.disabled = true;
    }
  }

  actualizeazaIconaTema(tema) {
    if (this.btnTema) this.btnTema.textContent = tema === 'luminos' ? '☀️' : '🌙';
  }

  initVoiceSearch() {
    if (!this.btnMicrofon) return;

    const cbStart = () => {
      this.indicatorVoce?.classList.remove('ascuns');
      this.btnMicrofon.classList.add('ascultare');
    };
    const cbResult = (text) => {
      this.indicatorVoce?.classList.add('ascuns');
      this.btnMicrofon.classList.remove('ascultare');
      if (text) {
        this.inputOras.value = text;
        this.cautaVreme(text);
      }
    };
    const cbError = () => {
      this.indicatorVoce?.classList.add('ascuns');
      this.btnMicrofon.classList.remove('ascultare');
    };

    const { toggle, supported } = initVoice({ onStart: cbStart, onResult: cbResult, onError: cbError });

    if (!supported) {
      this.btnMicrofon.style.display = 'none';
      return;
    }

    this.btnMicrofon.addEventListener('click', toggle);
  }

  initHartaInteractiva() {
    this.hartaAPI = initHarta('harta-vreme', async (lat, lon) => {
      // Click pe hartă → caută vreme la coordonate
      randeazaIncarcare(this.containerVreme);
      this.containerGrafic.innerHTML = '';
      this.containerPrognoza.innerHTML = '';
      try {
        const [dateVreme, datePrognoza] = await Promise.all([
          obtineVremeCoordonate(lat, lon),
          obtinePrognozeCoordonate(lat, lon)
        ]);
        this.dateVremeActuale = dateVreme;
        this.datePrognozaActuale = datePrognoza;
        this.inputOras.value = dateVreme.name;

        aplicaBackground(dateVreme.weather?.[0]?.id);
        actualizeazaParticule(dateVreme);
        actualizeazaMarker(dateVreme.coord?.lat ?? lat, dateVreme.coord?.lon ?? lon, dateVreme.name);

        const setari = obtineSetariActive();
        randeazaVreme(dateVreme, this.containerVreme, setari);
        randeazaPrognoza(datePrognoza, this.containerPrognoza, setari);
        try { randeazaGraficPrognoza(datePrognoza, this.containerGrafic, setari.unitTemp); } catch {}

        // Briefing Zilnic Inteligent
        const containerBriefingHarta = document.getElementById('container-briefing');
        if (containerBriefingHarta) {
          randeazaBriefing(datePrognoza, containerBriefingHarta.querySelector('#briefing-continut'), setari);
          containerBriefingHarta.classList.remove('ascuns');
        }

        // Time Machine
        const containerTMHarta = document.getElementById('container-time-machine');
        if (containerTMHarta) {
          initTimeMachine(containerTMHarta, datePrognoza,
            (punct) => {
              aplicaBackground(punct.weather[0].id);
              actualizeazaParticule({ ...dateVreme, weather: punct.weather, wind: punct.wind, dt: punct.dt });
              evidentiazaPunctGrafic(punct.dt);
            },
            setari,
            dateVreme.name
          );
          containerTMHarta.classList.remove('ascuns');
        }

        // Fereastra Optimă de Activitate
        const containerActHarta = document.getElementById('container-activitate');
        if (containerActHarta) {
          randeazaActivitateOptimizator(datePrognoza, containerActHarta.querySelector('#activitate-continut'), setari);
          containerActHarta.classList.remove('ascuns');
        }

        // Live SSE updates
        initLiveUpdates(dateVreme.name);

        if (this.actiuniOras) this.actiuniOras.classList.remove('ascuns');
        adaugaInIstoricBackend(dateVreme.name).catch(() => {});
        await Promise.all([this.incarcaIstoric(), this.incarcaComunitate()]);
        verificaSiTrimiteNotificare(dateVreme);
        verificaPloaieUrmatoarele3Ore(datePrognoza, dateVreme.name);
      } catch (eroare) {
        randeazaEroare(eroare.message, this.containerVreme);
      }
    });
  }

  initializeazaEvenimente() {
    // Deconectare
    this.btnDeconecteaza?.addEventListener('click', () => {
      if (confirm('Ești sigur că vrei să te deconectezi?')) deconecteaza();
    });

    // Căutare după oraș
    this.formCautare.addEventListener('submit', (e) => {
      e.preventDefault();
      const oras = this.inputOras.value.trim();
      if (oras) this.cautaVreme(oras);
    });

    // Geolocație
    this.btnLocatie?.addEventListener('click', () => this.cautaVremePrinGeolocatie());

    // Comutare temă
    this.btnTema?.addEventListener('click', async () => {
      const temaNoua = comutaTema();
      this.actualizeazaIconaTema(temaNoua);
      aplicaSetari({ tema: temaNoua });
      actualizeazaSetariBackend({ tema: temaNoua }).catch(() => {});
      if (this.dateVremeActuale) this.randeazaDateCurente();
    });

    // Deschide/închide panou setări
    this.btnSetari?.addEventListener('click', () => {
      this.panouSetari.classList.toggle('ascuns');
    });

    // Schimbare unitate temperatură
    this.selectUnitTemp?.addEventListener('change', (e) => {
      aplicaSetari({ unitTemp: e.target.value });
      actualizeazaSetariBackend({ unitTemp: e.target.value }).catch(() => {});
      if (this.dateVremeActuale) this.randeazaDateCurente();
    });

    // Schimbare unitate vânt
    this.selectUnitVant?.addEventListener('change', (e) => {
      aplicaSetari({ unitVant: e.target.value });
      actualizeazaSetariBackend({ unitVant: e.target.value }).catch(() => {});
      if (this.dateVremeActuale) this.randeazaDateCurente();
    });

    // Prag temperatură minim
    this.inputPragMin?.addEventListener('change', (e) => {
      const val = e.target.value !== '' ? parseFloat(e.target.value) : null;
      aplicaSetari({ pragMin: val });
      seteazaPraguri(val, obtineSetariActive().pragMax);
      actualizeazaSetariBackend({ pragMin: val }).catch(() => {});
    });

    // Prag temperatură maxim
    this.inputPragMax?.addEventListener('change', (e) => {
      const val = e.target.value !== '' ? parseFloat(e.target.value) : null;
      aplicaSetari({ pragMax: val });
      seteazaPraguri(obtineSetariActive().pragMin, val);
      actualizeazaSetariBackend({ pragMax: val }).catch(() => {});
    });

    // Activare notificări browser
    this.btnPermiteNotificari?.addEventListener('click', async () => {
      const permis = await cerePermisiuneNotificari();
      if (permis) this.actualizeazaStareNotificari();
      else alert('Notificările au fost refuzate. Activează-le din setările browser-ului.');
    });

    // Event delegation — istoricul căutărilor
    this.listaIstoric.addEventListener('click', (e) => {
      const oras = e.target.dataset.oras;
      if (oras) {
        this.inputOras.value = oras;
        this.cautaVreme(oras);
      }
    });

    // Event delegation — lista de favorite (cautare sau stergere)
    this.listaFavorite.addEventListener('click', async (e) => {
      if (e.target.dataset.actiune === 'sterge') {
        const id = parseInt(e.target.dataset.idFavorit);
        await stergeFavorit(id).catch(() => {});
        await this.incarcaFavorite();
      } else {
        const oras = e.target.dataset.oras;
        if (oras) {
          this.inputOras.value = oras;
          this.cautaVreme(oras);
        }
      }
    });

    // Event delegation — statistici comunitate (click pe un oraș)
    this.listaComunitate?.addEventListener('click', (e) => {
      const oras = e.target.closest('[data-oras]')?.dataset.oras;
      if (oras) {
        this.inputOras.value = oras;
        this.cautaVreme(oras);
      }
    });

    // Adaugă la favorite
    this.btnAdaugaFavorit?.addEventListener('click', async () => {
      if (!this.dateVremeActuale) return;
      const nota = prompt('Notă pentru acest oraș (opțional, apasă OK pentru a sări):') ?? '';
      try {
        await adaugaFavorit(this.dateVremeActuale.name, nota);
        await this.incarcaFavorite();
      } catch (e) {
        alert(e.message);
      }
    });

    // Adaugă la comparație
    this.btnAdaugaComparatie?.addEventListener('click', () => {
      if (!this.dateVremeActuale) return;
      const adaugat = adaugaInComparatie(this.dateVremeActuale);
      if (!adaugat) {
        alert('Orașul este deja în comparație sau limita de 4 orașe a fost atinsă.');
        return;
      }
      randeazaComparatie(obtineOraseComparatie(), this.containerComparatie, obtineSetariActive());
    });

    // Sortare comparație (event delegation pe div-ul cu butoane)
    document.getElementById('controale-sortare')?.addEventListener('click', (e) => {
      const criteriu = e.target.dataset.sortare;
      if (criteriu) {
        sorteazaComparatie(criteriu);
        randeazaComparatie(obtineOraseComparatie(), this.containerComparatie, obtineSetariActive());
      }
    });

    // Scoate din comparație (event delegation pe container)
    this.containerComparatie?.addEventListener('click', (e) => {
      if (e.target.dataset.actiuneComparatie === 'sterge') {
        scoateDinComparatie(e.target.dataset.oras);
        randeazaComparatie(obtineOraseComparatie(), this.containerComparatie, obtineSetariActive());
      }
    });

    // Dashboard favorite — toggle afișare
    this.btnDashboard?.addEventListener('click', async () => {
      const ascuns = this.containerDashboard.classList.contains('ascuns');
      if (ascuns) {
        this.containerDashboard.classList.remove('ascuns');
        this.btnDashboard.textContent = 'Ascunde dashboard';
        const fav = await obtineFavorite().catch(() => []);
        await randeazaDashboard(fav, this.containerDashboard, obtineSetariActive());
      } else {
        this.containerDashboard.classList.add('ascuns');
        this.btnDashboard.textContent = 'Afișează dashboard';
      }
    });

    // Click pe card din dashboard → caută orașul respectiv
    this.containerDashboard?.addEventListener('click', (e) => {
      const card = e.target.closest('[data-oras]');
      if (card) {
        const oras = card.dataset.oras;
        if (oras) { this.inputOras.value = oras; this.cautaVreme(oras); }
      }
    });

    // Analytics personale — toggle afișare
    this.btnAnalytics?.addEventListener('click', async () => {
      const ascuns = this.containerAnalytics.classList.contains('ascuns');
      if (ascuns) {
        this.containerAnalytics.classList.remove('ascuns');
        this.btnAnalytics.textContent = 'Ascunde statistici';
        try {
          const stats = await obtineIstoricStats();
          randeazaAnalytics(stats, this.containerAnalytics);
        } catch {
          this.containerAnalytics.innerHTML = '<p class="gol">Statistici indisponibile — pornește serverul.</p>';
        }
      } else {
        this.containerAnalytics.classList.add('ascuns');
        this.btnAnalytics.textContent = 'Afișează statistici';
      }
    });

    // Radar Meteo Live — toggle layer OWM pe hartă
    document.getElementById('radar-controale')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-radar');
      if (!btn) return;
      const layer = btn.dataset.layer;
      const eraActiv = btn.classList.contains('activ');
      document.querySelectorAll('.btn-radar').forEach((b) => b.classList.remove('activ'));
      schimbaLayerMeteo(eraActiv ? null : layer, import.meta.env.VITE_OPENWEATHER_API_KEY);
      if (!eraActiv) btn.classList.add('activ');
    });
  }

  async cautaVreme(oras) {
    randeazaIncarcare(this.containerVreme);
    this.containerGrafic.innerHTML = '';
    this.containerPrognoza.innerHTML = '';

    try {
      const [dateVreme, datePrognoza] = await Promise.all([
        obtineVremeOras(oras),
        obtinePrognozeOras(oras)
      ]);

      this.dateVremeActuale = dateVreme;
      this.datePrognozaActuale = datePrognoza;

      // Background animat bazat pe codul meteo
      aplicaBackground(dateVreme.weather?.[0]?.id);

      // Particule meteo animate cu fizică reală
      actualizeazaParticule(dateVreme);

      // Actualizează marker pe hartă
      if (dateVreme.coord) {
        actualizeazaMarker(dateVreme.coord.lat, dateVreme.coord.lon, dateVreme.name);
      }

      const setari = obtineSetariActive();
      randeazaVreme(dateVreme, this.containerVreme, setari);
      randeazaPrognoza(datePrognoza, this.containerPrognoza, setari);
      try {
        randeazaGraficPrognoza(datePrognoza, this.containerGrafic, setari.unitTemp);
      } catch (errGrafic) {
        console.warn('Grafic indisponibil:', errGrafic.message);
      }

      // Briefing Zilnic Inteligent
      const containerBriefing = document.getElementById('container-briefing');
      if (containerBriefing) {
        randeazaBriefing(datePrognoza, containerBriefing.querySelector('#briefing-continut'), setari);
        containerBriefing.classList.remove('ascuns');
      }

      // Time Machine — scrubber interactiv prin prognoza
      const containerTM = document.getElementById('container-time-machine');
      if (containerTM) {
        initTimeMachine(containerTM, datePrognoza,
          (punct) => {
            aplicaBackground(punct.weather[0].id);
            actualizeazaParticule({ ...dateVreme, weather: punct.weather, wind: punct.wind, dt: punct.dt });
            evidentiazaPunctGrafic(punct.dt);
          },
          setari,
          dateVreme.name
        );
        containerTM.classList.remove('ascuns');
      }

      // Fereastra Optimă de Activitate
      const containerAct = document.getElementById('container-activitate');
      if (containerAct) {
        randeazaActivitateOptimizator(datePrognoza, containerAct.querySelector('#activitate-continut'), setari);
        containerAct.classList.remove('ascuns');
      }

      // Live SSE updates
      initLiveUpdates(dateVreme.name);

      if (this.actiuniOras) this.actiuniOras.classList.remove('ascuns');
      if (obtineOraseComparatie().length > 0) {
        randeazaComparatie(obtineOraseComparatie(), this.containerComparatie, setari);
      }

      adaugaInIstoricBackend(dateVreme.name).catch(() => {});
      await Promise.all([this.incarcaIstoric(), this.incarcaComunitate()]);

      verificaSiTrimiteNotificare(dateVreme);
      verificaPloaieUrmatoarele3Ore(datePrognoza, dateVreme.name);
    } catch (eroare) {
      randeazaEroare(eroare.message, this.containerVreme);
    }
  }

  async cautaVremePrinGeolocatie() {
    randeazaIncarcare(this.containerVreme);
    this.containerGrafic.innerHTML = '';
    this.containerPrognoza.innerHTML = '';

    try {
      const { lat, lon } = await obtineLocatieUser();
      const [dateVreme, datePrognoza] = await Promise.all([
        obtineVremeCoordonate(lat, lon),
        obtinePrognozeCoordonate(lat, lon)
      ]);

      this.dateVremeActuale = dateVreme;
      this.datePrognozaActuale = datePrognoza;
      this.inputOras.value = dateVreme.name;

      aplicaBackground(dateVreme.weather?.[0]?.id);

      // Particule meteo animate cu fizică reală
      actualizeazaParticule(dateVreme);

      // Actualizează marker pe hartă
      actualizeazaMarker(lat, lon, dateVreme.name);

      const setari = obtineSetariActive();
      randeazaVreme(dateVreme, this.containerVreme, setari);
      randeazaPrognoza(datePrognoza, this.containerPrognoza, setari);
      try {
        randeazaGraficPrognoza(datePrognoza, this.containerGrafic, setari.unitTemp);
      } catch (errGrafic) {
        console.warn('Grafic indisponibil:', errGrafic.message);
      }

      // Briefing Zilnic Inteligent
      const containerBriefingGeo = document.getElementById('container-briefing');
      if (containerBriefingGeo) {
        randeazaBriefing(datePrognoza, containerBriefingGeo.querySelector('#briefing-continut'), setari);
        containerBriefingGeo.classList.remove('ascuns');
      }

      // Time Machine — scrubber interactiv prin prognoza
      const containerTMGeo = document.getElementById('container-time-machine');
      if (containerTMGeo) {
        initTimeMachine(containerTMGeo, datePrognoza,
          (punct) => {
            aplicaBackground(punct.weather[0].id);
            actualizeazaParticule({ ...dateVreme, weather: punct.weather, wind: punct.wind, dt: punct.dt });
            evidentiazaPunctGrafic(punct.dt);
          },
          setari,
          dateVreme.name
        );
        containerTMGeo.classList.remove('ascuns');
      }

      // Fereastra Optimă de Activitate
      const containerActGeo = document.getElementById('container-activitate');
      if (containerActGeo) {
        randeazaActivitateOptimizator(datePrognoza, containerActGeo.querySelector('#activitate-continut'), setari);
        containerActGeo.classList.remove('ascuns');
      }

      // Live SSE updates
      initLiveUpdates(dateVreme.name);

      if (this.actiuniOras) this.actiuniOras.classList.remove('ascuns');
      if (obtineOraseComparatie().length > 0) {
        randeazaComparatie(obtineOraseComparatie(), this.containerComparatie, setari);
      }

      adaugaInIstoricBackend(dateVreme.name).catch(() => {});
      await Promise.all([this.incarcaIstoric(), this.incarcaComunitate()]);

      verificaSiTrimiteNotificare(dateVreme);
      verificaPloaieUrmatoarele3Ore(datePrognoza, dateVreme.name);
    } catch (eroare) {
      randeazaEroare(eroare.message, this.containerVreme);
    }
  }

  randeazaDateCurente() {
    const setari = obtineSetariActive();
    randeazaVreme(this.dateVremeActuale, this.containerVreme, setari);
    try {
      randeazaGraficPrognoza(this.datePrognozaActuale, this.containerGrafic, setari.unitTemp);
    } catch (errGrafic) {
      console.warn('Grafic indisponibil:', errGrafic.message);
    }
    randeazaPrognoza(this.datePrognozaActuale, this.containerPrognoza, setari);
    if (obtineOraseComparatie().length > 0) {
      randeazaComparatie(obtineOraseComparatie(), this.containerComparatie, setari);
    }
  }

  async incarcaFavorite() {
    try {
      const favorite = await obtineFavorite();
      randeazaFavorite(favorite, this.listaFavorite);
    } catch {
      this.listaFavorite.innerHTML = '<li class="gol">Backend-ul nu este pornit. Rulați npm run dev:server.</li>';
    }
  }

  async incarcaIstoric() {
    try {
      const istoric = await obtineIstoricBackend();
      randeazaIstoric(istoric.map((i) => i.city), this.listaIstoric);
    } catch {
      randeazaIstoric([], this.listaIstoric);
    }
  }

  async incarcaComunitate() {
    if (!this.listaComunitate) return;
    try {
      const topOrase = await obtineTopOrase();
      if (!topOrase || topOrase.length === 0) {
        this.listaComunitate.innerHTML = '<li class="gol">Nicio căutare înregistrată încă.</li>';
        return;
      }
      const maxCount = topOrase[0].search_count || 1;
      this.listaComunitate.innerHTML = topOrase.map((item, idx) => {
        const procent = Math.round((item.search_count / maxCount) * 100);
        const medalii = ['🥇', '🥈', '🥉'];
        const prefix = medalii[idx] || `${idx + 1}.`;
        return `
          <li class="item-comunitate" data-oras="${item.city}">
            <span class="comunitate-rank">${prefix}</span>
            <span class="comunitate-oras">${item.city}</span>
            <div class="comunitate-bara-wrap">
              <div class="comunitate-bara" style="width: ${procent}%"></div>
            </div>
            <span class="comunitate-count">${item.search_count} căutări</span>
          </li>`;
      }).join('');
    } catch {
      this.listaComunitate.innerHTML = '<li class="gol">Statistici indisponibile.</li>';
    }
  }
}

// Pornire aplicație cu auth guard
document.addEventListener('DOMContentLoaded', async () => {
  const user = await protejeazaPagina();
  if (user) new AplicatieVreme(user);
});
