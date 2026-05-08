/**
 * Sistem de particule meteo — Canvas API cu fizică reală.
 * Unghiul ploii urmează vântul din API, densitatea urmează codul meteo.
 * Particulele se feresc de cursorul mouse-ului.
 */

let canvas = null;
let ctx = null;
let particule = [];
let config = null;
let animFrameId = null;
let mouseX = -999;
let mouseY = -999;
let rezolutie = { w: 0, h: 0 };
let fulgerTimeout = null;
let fulgerActiv = false;
let transitionAlpha = 0; // 0=invizibil, 1=vizibil (fade in/out)
let transitionDirectie = 1; // 1=fade in, -1=fade out
let pendingConfig = null;

// ─── Mapare cod meteo → tip particule ───────────────────────────────────────

function mapTip(weatherId, esteNoapte) {
  if (!weatherId) return 'senin';
  if (weatherId >= 200 && weatherId < 300) return 'furtuna';
  if (weatherId >= 300 && weatherId < 400) return 'burnita';
  if (weatherId >= 500 && weatherId < 600) {
    if (weatherId >= 502) return 'ploaie_torentiala';
    return 'ploaie';
  }
  if (weatherId >= 600 && weatherId < 700) return 'ninsoare';
  if (weatherId >= 700 && weatherId < 800) return 'ceata';
  if (weatherId === 800) return esteNoapte ? 'noapte' : 'senin';
  return esteNoapte ? 'noapte' : 'nori';
}

function calcDensitate(tip) {
  const densitati = {
    furtuna: 180,
    ploaie_torentiala: 160,
    ploaie: 100,
    burnita: 60,
    ninsoare: 80,
    ceata: 25,
    noapte: 60,
    nori: 8,
    senin: 0
  };
  return densitati[tip] ?? 0;
}

// Convertește wind.deg (meteorologic) → offset X al particulelor
// Vântul meteorologic: 0°=din N (merge spre S), 90°=din E, 270°=din V
function calcOffsetXVant(windDeg, viteza) {
  // wind.deg = direcția DIN CARE bate vântul
  // Transformăm în direcția SPRE care merg particulele
  const radiani = ((windDeg + 180) % 360) * (Math.PI / 180);
  return Math.sin(radiani) * Math.min(viteza * 0.6, 4);
}

// ─── Creare particule ────────────────────────────────────────────────────────

function creeazaParticula(tip, cfg) {
  const w = rezolutie.w;
  const h = rezolutie.h;

  switch (tip) {
    case 'ploaie':
    case 'ploaie_torentiala':
    case 'furtuna':
    case 'burnita': {
      const lungime = tip === 'burnita' ? 3 : tip === 'ploaie_torentiala' || tip === 'furtuna' ? 18 : 12;
      return {
        x: Math.random() * (w + 200) - 100,
        y: Math.random() * h - h,
        vx: cfg.offsetX + (Math.random() - 0.5) * 0.5,
        vy: cfg.viteza * (0.8 + Math.random() * 0.4),
        alpha: 0.4 + Math.random() * 0.4,
        lungime,
        tip
      };
    }
    case 'ninsoare': {
      return {
        x: Math.random() * w,
        y: Math.random() * h - h,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 0.5 + Math.random() * 1.5,
        alpha: 0.6 + Math.random() * 0.4,
        raza: 2 + Math.random() * 3,
        faza: Math.random() * Math.PI * 2, // fază pentru mișcare ondulată
        tip
      };
    }
    case 'ceata': {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: 0.2 + Math.random() * 0.4,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: 0.02 + Math.random() * 0.05,
        raza: 60 + Math.random() * 80,
        tip
      };
    }
    case 'noapte': {
      return {
        x: Math.random() * w,
        y: Math.random() * h * 0.7,
        vx: 0,
        vy: 0,
        alpha: Math.random(),
        alphaMax: 0.3 + Math.random() * 0.6,
        puls: 0.005 + Math.random() * 0.01,
        directiePuls: Math.random() > 0.5 ? 1 : -1,
        raza: 0.5 + Math.random() * 1.5,
        tip
      };
    }
    default:
      return null;
  }
}

// ─── Render loop ─────────────────────────────────────────────────────────────

function renderLoop() {
  if (!ctx || !config) {
    animFrameId = requestAnimationFrame(renderLoop);
    return;
  }

  const w = rezolutie.w;
  const h = rezolutie.h;

  ctx.clearRect(0, 0, w, h);

  // Gestionare tranziție (fade in/out)
  if (transitionDirectie === -1) {
    transitionAlpha -= 0.04;
    if (transitionAlpha <= 0) {
      transitionAlpha = 0;
      if (pendingConfig) {
        config = pendingConfig;
        pendingConfig = null;
        particule = [];
        transitionDirectie = 1;
      }
    }
  } else if (transitionAlpha < 1) {
    transitionAlpha = Math.min(1, transitionAlpha + 0.04);
  }

  // Populează particule până la densitate
  const densitate = calcDensitate(config.tip);
  while (particule.length < densitate) {
    const p = creeazaParticula(config.tip, config);
    if (p) particule.push(p);
    else break;
  }

  ctx.save();
  ctx.globalAlpha = transitionAlpha;

  // Render fiecare particulă
  for (let i = particule.length - 1; i >= 0; i--) {
    const p = particule[i];
    actualizeazaSiDeseneazaParticula(p, w, h);
    if (p.elimina) particule.splice(i, 1);
  }

  // Flash fulger pentru furtună
  if (config.tip === 'furtuna' && fulgerActiv) {
    ctx.fillStyle = `rgba(200, 220, 255, ${0.08 * transitionAlpha})`;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();

  animFrameId = requestAnimationFrame(renderLoop);
}

function actualizeazaSiDeseneazaParticula(p, w, h) {
  const RAZA_MOUSE = 80;
  const dx = p.x - mouseX;
  const dy = p.y - mouseY;
  const distMouse = Math.sqrt(dx * dx + dy * dy);

  switch (p.tip) {
    case 'ploaie':
    case 'ploaie_torentiala':
    case 'furtuna':
    case 'burnita': {
      // Respingere mouse
      let extraVx = 0;
      if (distMouse < RAZA_MOUSE) {
        const forta = (1 - distMouse / RAZA_MOUSE) * 2;
        extraVx = (dx / distMouse) * forta;
      }

      p.x += p.vx + extraVx;
      p.y += p.vy;

      if (p.y > h + 20 || p.x < -120 || p.x > w + 120) {
        p.x = Math.random() * (w + 200) - 100;
        p.y = -20;
      }

      const culoare = p.tip === 'burnita' ? '160, 200, 255' : '120, 170, 255';
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${culoare}, ${p.alpha})`;
      ctx.lineWidth = p.tip === 'burnita' ? 0.8 : p.tip === 'ploaie_torentiala' || p.tip === 'furtuna' ? 1.2 : 1;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * (p.lungime / p.vy), p.y + p.lungime);
      ctx.stroke();
      break;
    }

    case 'ninsoare': {
      p.faza += 0.02;
      p.x += p.vx + Math.sin(p.faza) * 0.4;
      p.y += p.vy;

      // Respingere mouse
      if (distMouse < RAZA_MOUSE) {
        const forta = (1 - distMouse / RAZA_MOUSE) * 1.5;
        p.x += (dx / distMouse) * forta * 0.5;
        p.y -= forta * 0.3;
      }

      if (p.y > h + 10) {
        p.y = -10;
        p.x = Math.random() * w;
      }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.raza, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 235, 255, ${p.alpha})`;
      ctx.fill();
      break;
    }

    case 'ceata': {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x > w + p.raza) p.x = -p.raza;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.raza);
      grad.addColorStop(0, `rgba(180, 200, 220, ${p.alpha})`);
      grad.addColorStop(1, 'rgba(180, 200, 220, 0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.raza, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      break;
    }

    case 'noapte': {
      // Stele care pulsează
      p.alpha += p.puls * p.directiePuls;
      if (p.alpha >= p.alphaMax) { p.alpha = p.alphaMax; p.directiePuls = -1; }
      if (p.alpha <= 0.05) { p.alpha = 0.05; p.directiePuls = 1; }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.raza, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 240, ${p.alpha})`;
      ctx.fill();
      break;
    }
  }
}

// ─── API public ──────────────────────────────────────────────────────────────

/**
 * Inițializează sistemul de particule pe canvas-ul dat.
 * @param {HTMLCanvasElement} canvasEl
 */
export function initParticule(canvasEl) {
  if (!canvasEl) return;
  canvas = canvasEl;
  ctx = canvas.getContext('2d');

  function resize() {
    rezolutie.w = window.innerWidth;
    rezolutie.h = window.innerHeight;
    canvas.width = rezolutie.w;
    canvas.height = rezolutie.h;
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouseX = -999;
    mouseY = -999;
  });

  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(renderLoop);
}

/**
 * Actualizează tipul și intensitatea particulelor pe baza datelor meteo.
 * @param {Object} weatherData - răspuns OWM weather
 */
export function actualizeazaParticule(weatherData) {
  if (!canvas) return;

  const { weather, wind, dt, sys } = weatherData;
  if (!weather || !weather[0]) return;

  const esteNoapte = sys && dt && (dt < sys.sunrise || dt > sys.sunset);
  const tip = mapTip(weather[0].id, esteNoapte);
  const viteza = wind ? Math.max(2, Math.min(wind.speed * 0.8, 6)) : 3;
  const offsetX = wind ? calcOffsetXVant(wind.deg || 0, viteza) : 0;

  const nouConfig = { tip, viteza, offsetX, esteNoapte };

  if (!config) {
    config = nouConfig;
    transitionAlpha = 0;
    transitionDirectie = 1;
  } else if (config.tip !== nouConfig.tip) {
    // Fade out → swap config → fade in
    pendingConfig = nouConfig;
    transitionDirectie = -1;
  } else {
    // Aceeași vreme, actualizăm doar viteza/unghiul
    config.viteza = nouConfig.viteza;
    config.offsetX = nouConfig.offsetX;
  }

  // Fulger periodic pentru furtună
  clearTimeout(fulgerTimeout);
  fulgerActiv = false;
  if (tip === 'furtuna') {
    programeazaFulger();
  }
}

function programeazaFulger() {
  const delay = 3000 + Math.random() * 6000;
  fulgerTimeout = setTimeout(() => {
    fulgerActiv = true;
    setTimeout(() => {
      fulgerActiv = false;
      if (config?.tip === 'furtuna') programeazaFulger();
    }, 150);
  }, delay);
}

/**
 * Oprește și curăță sistemul de particule.
 */
export function distrugeParticule() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  clearTimeout(fulgerTimeout);
  particule = [];
  config = null;
  if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
}
