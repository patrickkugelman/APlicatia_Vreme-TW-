// Formatează temperatura — suportă °C (implicit) și °F
export function formateazaTemperatura(temp, unitTemp = 'C') {
  if (unitTemp === 'F') return `${((temp * 9) / 5 + 32).toFixed(1)}°F`;
  return `${temp.toFixed(1)}°C`;
}

// Formatează viteza vântului — suportă km/h (implicit) și mph
export function formateazaVant(vitezaMs, unitVant = 'kmh') {
  if (unitVant === 'mph') return `${(vitezaMs * 2.237).toFixed(1)} mph`;
  return `${(vitezaMs * 3.6).toFixed(1)} km/h`;
}

// Formatează un timestamp Unix în dată lizibilă în română
export function formateazaData(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString('ro-RO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Convertește direcția vântului din grade în punct cardinal
export function convertesteDirectiVant(grade) {
  const directii = ['N', 'NE', 'E', 'SE', 'S', 'SV', 'V', 'NV'];
  return directii[Math.round(grade / 45) % 8];
}

// Construiește URL-ul pentru pictograma meteo
export function urlPictograma(cod) {
  return `https://openweathermap.org/img/wn/${cod}@2x.png`;
}

// Convertește viteza vântului din m/s în km/h (backward compat)
export function msPeSecundaInKmPeOra(viteza) {
  return (viteza * 3.6).toFixed(1);
}

// Formatează data scurtă (Lun, Mar...) din timestamp Unix
export function formateazaZiSaptamana(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString('ro-RO', { weekday: 'short' });
}

// Returnează eticheta de confort termic și clasa CSS corespunzătoare
export function calculeazaConfort(feelsLike, humidity) {
  if (feelsLike <= -25) return { label: 'Frig extrem',  clasa: 'confort-pericol' };
  if (feelsLike <= -10) return { label: 'Frig sever',   clasa: 'confort-rau' };
  if (feelsLike <= 0)   return { label: 'Frig',         clasa: 'confort-rece' };
  if (feelsLike <= 10)  return { label: 'Răcoros',      clasa: 'confort-racoros' };
  if (feelsLike <= 18)  return { label: 'Plăcut',       clasa: 'confort-bun' };
  if (feelsLike <= 24)  return { label: 'Confortabil',  clasa: 'confort-bun' };
  if (feelsLike <= 28)  return { label: 'Cald',         clasa: 'confort-cald' };
  if (feelsLike <= 35 && humidity > 65) return { label: 'Sufocant', clasa: 'confort-rau' };
  if (feelsLike <= 35)  return { label: 'Călduros',     clasa: 'confort-cald' };
  return { label: 'Caniculă', clasa: 'confort-pericol' };
}

// Extrage câte o înregistrare pe zi din lista de prognoza (cea mai apropiată de ora 12:00)
export function filtreazaPrognozeZilnice(lista) {
  const peZi = {};
  for (const intrare of lista) {
    const data = new Date(intrare.dt * 1000);
    const cheie = data.toISOString().slice(0, 10);
    const ora = data.getHours();
    if (!peZi[cheie] || Math.abs(ora - 12) < Math.abs(new Date(peZi[cheie].dt * 1000).getHours() - 12)) {
      peZi[cheie] = intrare;
    }
  }
  return Object.values(peZi).slice(1, 6);
}
