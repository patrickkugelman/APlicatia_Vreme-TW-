// Menține starea orașelor adăugate pentru comparație (maxim 4)
let orasePentruComparatie = [];

export function adaugaInComparatie(dateVreme) {
  const existent = orasePentruComparatie.find(
    (o) => o.name.toLowerCase() === dateVreme.name.toLowerCase()
  );
  if (existent) return false;
  if (orasePentruComparatie.length >= 4) return false;
  orasePentruComparatie.push(dateVreme);
  return true;
}

export function scoateDinComparatie(numeOras) {
  orasePentruComparatie = orasePentruComparatie.filter((o) => o.name !== numeOras);
}

export function obtineOraseComparatie() {
  return [...orasePentruComparatie];
}

export function sorteazaComparatie(criteriu) {
  const ordonare = {
    temp: (a, b) => b.main.temp - a.main.temp,
    umiditate: (a, b) => b.main.humidity - a.main.humidity,
    vant: (a, b) => b.wind.speed - a.wind.speed
  };
  const fn = ordonare[criteriu];
  if (fn) orasePentruComparatie.sort(fn);
}
