const CHEIE_ISTORIC = 'vremeIstoricCautari';
const MAX_INTRARI = 5;

// Returnează lista istoricului de căutări din localStorage
export function obtineIstoric() {
  const date = localStorage.getItem(CHEIE_ISTORIC);
  return date ? JSON.parse(date) : [];
}

// Adaugă un oraș în istoric (fără duplicate, maxim MAX_INTRARI)
export function adaugaInIstoric(oras) {
  const istoricFiltrat = obtineIstoric().filter(
    (o) => o.toLowerCase() !== oras.toLowerCase()
  );
  const istoricActualizat = [oras, ...istoricFiltrat].slice(0, MAX_INTRARI);
  localStorage.setItem(CHEIE_ISTORIC, JSON.stringify(istoricActualizat));
  return istoricActualizat;
}

// Șterge tot istoricul din localStorage
export function stergeIstoric() {
  localStorage.removeItem(CHEIE_ISTORIC);
}
