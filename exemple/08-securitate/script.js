const input = document.getElementById('input-utilizator');
const outputRau = document.getElementById('output-rau');
const outputBun = document.getElementById('output-bun');

// ===== XSS — Cross-Site Scripting =====

// VULNERABIL: innerHTML interpretează HTML și JavaScript din input
document.getElementById('btn-rau').addEventListener('click', () => {
  // Dacă utilizatorul introduce: <img src=x onerror="alert('XSS!')">
  // browserul va executa codul JavaScript!
  outputRau.innerHTML = input.value; // PERICULOS
});

// SIGUR: textContent tratează inputul ca text simplu, nu ca HTML
document.getElementById('btn-bun').addEventListener('click', () => {
  outputBun.textContent = input.value; // SIGUR — nu interpretează HTML
});

// ===== SANITIZARE INPUT =====
function sanitizeazaText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Dacă TREBUIE să folosești innerHTML, sanitizează primul:
function afiseazaSigurCuHTML(text, container) {
  container.innerHTML = sanitizeazaText(text);
}

// ===== VALIDARE INPUT LA NIVEL DE APLICAȚIE =====
function valideazaNumeOras(oras) {
  if (!oras || typeof oras !== 'string') return false;
  if (oras.length < 2 || oras.length > 100) return false;
  // Permite litere (inclusiv cu diacritice), spații, cratime
  return /^[\p{L}\s\-]+$/u.test(oras);
}

console.log(valideazaNumeOras('București'));        // true
console.log(valideazaNumeOras('Cluj-Napoca'));      // true
console.log(valideazaNumeOras('<script>alert()'));  // false
console.log(valideazaNumeOras(''));                 // false

// ===== STOCARE SIGURĂ =====
// localStorage stochează doar date publice — NICIODATĂ parole sau tokene sensibile
// Pentru date sensibile, folosiți cookie-uri HttpOnly (setate de server)
localStorage.setItem('istoricCautari', JSON.stringify(['București', 'Cluj']));
const istoric = JSON.parse(localStorage.getItem('istoricCautari') ?? '[]');
console.log('Istoric salvat sigur:', istoric);
