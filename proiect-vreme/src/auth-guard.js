import { esteAutentificat, verificaSesiuneActiva, obtineUserCurent } from './auth.js';

// Protejează o pagină privată — redirecționează la login dacă nu ești autentificat
export async function protejeazaPagina() {
  const overlay = document.getElementById('loading-overlay');

  const valid = esteAutentificat() && await verificaSesiuneActiva();
  if (overlay) overlay.style.display = 'none';

  if (!valid) {
    window.location.replace('/login.html');
    return null;
  }
  return obtineUserCurent();
}

// Dacă ești deja logat pe pagina de login, redirecționează la app
export async function redirectDacaLogat() {
  const overlay = document.getElementById('loading-overlay');
  if (esteAutentificat()) {
    const valid = await verificaSesiuneActiva();
    if (valid) {
      window.location.replace('/index.html');
      return true;
    }
  }
  if (overlay) overlay.style.display = 'none';
  return false;
}

// Protejează pagina de admin
export async function protejeazaAdmin() {
  const user = await protejeazaPagina();
  if (!user) return null;
  if (user.role !== 'admin') {
    window.location.replace('/index.html');
    return null;
  }
  return user;
}
