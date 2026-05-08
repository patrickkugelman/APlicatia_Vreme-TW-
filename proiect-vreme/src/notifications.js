let pragMinim = null;
let pragMaxim = null;

export async function cerePermisiuneNotificari() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const permisiune = await Notification.requestPermission();
  return permisiune === 'granted';
}

export function estePermisiuneAcordata() {
  return 'Notification' in window && Notification.permission === 'granted';
}

export function seteazaPraguri(min, max) {
  pragMinim = min != null ? parseFloat(min) : null;
  pragMaxim = max != null ? parseFloat(max) : null;
}

// Trimite notificare dacă temperatura depășește pragurile setate
export function verificaSiTrimiteNotificare(dateVreme) {
  if (!estePermisiuneAcordata()) return;
  const { name, main } = dateVreme;
  const temp = main.temp;

  if (pragMinim !== null && temp < pragMinim) {
    new Notification(`❄️ Alertă temperatură — ${name}`, {
      body: `Temperatura de ${temp.toFixed(1)}°C este sub pragul de ${pragMinim}°C.`,
      icon: 'https://openweathermap.org/img/wn/13d@2x.png'
    });
  }
  if (pragMaxim !== null && temp > pragMaxim) {
    new Notification(`🌡️ Alertă temperatură — ${name}`, {
      body: `Temperatura de ${temp.toFixed(1)}°C depășește pragul de ${pragMaxim}°C.`,
      icon: 'https://openweathermap.org/img/wn/01d@2x.png'
    });
  }
}
