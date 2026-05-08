import { autentifica, inregistreaza } from '../auth.js';
import { redirectDacaLogat } from '../auth-guard.js';

// Dacă ești deja logat, mergi la aplicație
redirectDacaLogat();

// === Elemente DOM ===
const tabs = document.querySelectorAll('.tab');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const eroareLogin = document.getElementById('eroare-login');
const eroareRegister = document.getElementById('eroare-register');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

// === Comutare tab-uri ===
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('activ'));
    tab.classList.add('activ');

    const which = tab.dataset.tab;
    if (which === 'login') {
      formLogin.classList.remove('ascuns');
      formRegister.classList.add('ascuns');
    } else {
      formLogin.classList.add('ascuns');
      formRegister.classList.remove('ascuns');
    }
    eroareLogin.classList.add('ascuns');
    eroareRegister.classList.add('ascuns');
  });
});

// === Toggle vizibilitate parolă ===
document.querySelectorAll('.btn-toggle-parola').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁' : '🙈';
  });
});

// === Helpers ===
function setLoading(btn, loading) {
  const text = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.btn-spinner');
  btn.disabled = loading;
  text?.classList.toggle('ascuns', loading);
  spinner?.classList.toggle('ascuns', !loading);
}

function afiseazaEroare(el, mesaj) {
  el.textContent = mesaj;
  el.classList.remove('ascuns');
}

function mesajEroareFirebase(err) {
  const cod = err.message || '';
  if (cod.includes('Email sau parolă incorectă') || cod.includes('401')) return 'Email sau parolă incorectă.';
  if (cod.includes('Email deja înregistrat') || cod.includes('409')) return 'Există deja un cont cu acest email.';
  if (cod.includes('Failed to fetch')) return 'Serverul nu răspunde. Asigură-te că rulează.';
  return cod || 'A apărut o eroare. Încearcă din nou.';
}

// === Login ===
formLogin?.addEventListener('submit', async (e) => {
  e.preventDefault();
  eroareLogin.classList.add('ascuns');
  const email = document.getElementById('login-email').value.trim();
  const parola = document.getElementById('login-parola').value;

  if (!email || !parola) {
    afiseazaEroare(eroareLogin, 'Completează toate câmpurile.');
    return;
  }

  setLoading(btnLogin, true);
  try {
    await autentifica(email, parola);
    window.location.replace('/index.html');
  } catch (err) {
    afiseazaEroare(eroareLogin, mesajEroareFirebase(err));
    setLoading(btnLogin, false);
  }
});

// === Înregistrare ===
formRegister?.addEventListener('submit', async (e) => {
  e.preventDefault();
  eroareRegister.classList.add('ascuns');
  const nume = document.getElementById('reg-nume').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const parola = document.getElementById('reg-parola').value;
  const parola2 = document.getElementById('reg-parola2').value;

  if (!nume || !email || !parola || !parola2) {
    afiseazaEroare(eroareRegister, 'Completează toate câmpurile.');
    return;
  }
  if (parola.length < 6) {
    afiseazaEroare(eroareRegister, 'Parola trebuie să aibă cel puțin 6 caractere.');
    return;
  }
  if (parola !== parola2) {
    afiseazaEroare(eroareRegister, 'Parolele nu coincid.');
    return;
  }

  setLoading(btnRegister, true);
  try {
    await inregistreaza(email, parola, nume);
    window.location.replace('/index.html');
  } catch (err) {
    afiseazaEroare(eroareRegister, mesajEroareFirebase(err));
    setLoading(btnRegister, false);
  }
});
