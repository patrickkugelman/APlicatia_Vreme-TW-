/**
 * Mapare cod meteo OWM → clasă CSS pentru fundal animat.
 * Funcție pură — testabilă fără DOM.
 * @see https://openweathermap.org/weather-conditions
 */

export function obtineClassBackground(weatherCode) {
  if (!weatherCode || typeof weatherCode !== 'number') return 'bg-implicit';

  // Furtună (2xx)
  if (weatherCode >= 200 && weatherCode < 300) return 'bg-furtuna';

  // Ploaie măruntă / burniță (3xx)
  if (weatherCode >= 300 && weatherCode < 400) return 'bg-ploaie';

  // Ploaie (5xx) — 511 = freezing rain → ninsoare
  if (weatherCode === 511) return 'bg-ninsoare';
  if (weatherCode >= 500 && weatherCode < 600) return 'bg-ploaie';

  // Ninsoare (6xx)
  if (weatherCode >= 600 && weatherCode < 700) return 'bg-ninsoare';

  // Ceață / atmosferă (7xx)
  if (weatherCode >= 700 && weatherCode < 800) return 'bg-ceata';

  // Senin (800)
  if (weatherCode === 800) return 'bg-senin';

  // Înnorat parțial / total (80x)
  if (weatherCode > 800 && weatherCode < 900) {
    if (weatherCode === 801 || weatherCode === 802) return 'bg-partial-innorat';
    return 'bg-innorat';
  }

  return 'bg-implicit';
}

const CLASE_BG = [
  'bg-furtuna', 'bg-ploaie', 'bg-ninsoare',
  'bg-ceata', 'bg-senin', 'bg-partial-innorat', 'bg-innorat', 'bg-implicit'
];

let flashTimeout = null;

/**
 * Aplică clasa de fundal pe body.
 * Dacă e furtună, adaugă și efectul de fulger periodic.
 */
export function aplicaBackground(weatherCode) {
  const clasa = obtineClassBackground(weatherCode);

  // Elimină toate clasele de fundal vechi
  document.body.classList.remove(...CLASE_BG);
  document.body.classList.add(clasa);

  // Curăță efectul de fulger dacă exista
  clearTimeout(flashTimeout);
  document.body.classList.remove('fulger');

  if (clasa === 'bg-furtuna') {
    programeazaFulger();
  }
}

function programeazaFulger() {
  const delay = 3000 + Math.random() * 5000; // 3–8 secunde
  flashTimeout = setTimeout(() => {
    document.body.classList.add('fulger');
    setTimeout(() => {
      document.body.classList.remove('fulger');
      programeazaFulger(); // continuă ciclic cât timp e furtună
    }, 200);
  }, delay);
}
