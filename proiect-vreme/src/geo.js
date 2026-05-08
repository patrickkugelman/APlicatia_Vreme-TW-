// Obține coordonatele geografice ale utilizatorului prin API-ul browser-ului
export function obtineLocatieUser() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocația nu este suportată de acest browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pozitie) => resolve({
        lat: pozitie.coords.latitude,
        lon: pozitie.coords.longitude
      }),
      (eroare) => {
        const mesaje = {
          1: 'Accesul la locație a fost refuzat de utilizator.',
          2: 'Locația nu a putut fi determinată.',
          3: 'Cererea de locație a expirat. Încearcă din nou.'
        };
        reject(new Error(mesaje[eroare.code] || 'Eroare necunoscută la geolocație.'));
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  });
}
