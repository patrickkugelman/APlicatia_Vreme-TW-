const CHEIE_TOKEN = 'vremeAuthToken';
const CHEIE_USER = 'vremeUser';

// === Token management ===

export function salveazaSesiune(token, user) {
  localStorage.setItem(CHEIE_TOKEN, token);
  localStorage.setItem(CHEIE_USER, JSON.stringify(user));
}

export function stergeSesiune() {
  localStorage.removeItem(CHEIE_TOKEN);
  localStorage.removeItem(CHEIE_USER);
}

export function obtineToken() {
  return localStorage.getItem(CHEIE_TOKEN);
}

export function obtineUserCurent() {
  const raw = localStorage.getItem(CHEIE_USER);
  return raw ? JSON.parse(raw) : null;
}

export function esteAutentificat() {
  return !!obtineToken();
}

export function esteAdmin() {
  const user = obtineUserCurent();
  return user?.role === 'admin';
}

// === API calls ===

async function cereAuth(cale, optiuni = {}) {
  const raspuns = await fetch(`/api/auth${cale}`, {
    ...optiuni,
    headers: { 'Content-Type': 'application/json', ...(optiuni.headers || {}) }
  });
  const date = await raspuns.json().catch(() => ({}));
  if (!raspuns.ok) throw new Error(date.eroare || `Eroare: ${raspuns.status}`);
  return date;
}

export async function autentifica(email, parola) {
  const { token, user } = await cereAuth('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: parola })
  });
  salveazaSesiune(token, user);
  return user;
}

export async function inregistreaza(email, parola, nume) {
  const { token, user } = await cereAuth('/register', {
    method: 'POST',
    body: JSON.stringify({ email, password: parola, name: nume })
  });
  salveazaSesiune(token, user);
  return user;
}

export function deconecteaza() {
  stergeSesiune();
  window.location.replace('/login.html');
}

// Verifică că tokenul existent e încă valid (opțional, la init)
export async function verificaSesiuneActiva() {
  if (!obtineToken()) return false;
  try {
    const token = obtineToken();
    const raspuns = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!raspuns.ok) { stergeSesiune(); return false; }
    const user = await raspuns.json();
    localStorage.setItem(CHEIE_USER, JSON.stringify(user));
    return true;
  } catch {
    return false;
  }
}
