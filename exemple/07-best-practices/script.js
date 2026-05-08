// ===== METODE CONSOLE PENTRU DEBUGGING =====
document.getElementById('btn-console').addEventListener('click', () => {
  // Diferite niveluri de logare
  console.log('Mesaj informațional');
  console.warn('Atenție — ceva ar putea fi greșit');
  console.error('Eroare — ceva a mers prost');

  // Afișare tabelară — util pentru array de obiecte
  const date = [
    { oras: 'București', temp: 22, umiditate: 60 },
    { oras: 'Cluj', temp: 18, umiditate: 70 },
    { oras: 'Timișoara', temp: 25, umiditate: 55 }
  ];
  console.table(date);

  // Grupare mesaje
  console.group('Detalii aplicație');
  console.log('Versiune: 1.0.0');
  console.log('Autor: echipa TW');
  console.groupEnd();

  // Măsurare timp de execuție
  console.time('calcul');
  let suma = 0;
  for (let i = 0; i < 1_000_000; i++) suma += i;
  console.timeEnd('calcul');

  // Afișare stivă de apeluri
  function a() { b(); }
  function b() { c(); }
  function c() { console.trace('Traseu apeluri'); }
  a();
});

// ===== TRATARE ERORI =====
document.getElementById('btn-erori').addEventListener('click', () => {
  // Tipuri de erori încorporate
  try {
    null.proprietate; // TypeError
  } catch (e) {
    console.error(`${e.name}: ${e.message}`);
  }

  try {
    eval('cod invalid {{{'); // SyntaxError
  } catch (e) {
    console.error(`${e.name}: ${e.message}`);
  }

  // Erori personalizate
  class EroareValidare extends Error {
    constructor(camp, mesaj) {
      super(mesaj);
      this.name = 'EroareValidare';
      this.camp = camp;
    }
  }

  try {
    const temp = -300;
    if (temp < -273.15) {
      throw new EroareValidare('temperatura', 'Sub zero absolut — imposibil fizic');
    }
  } catch (e) {
    if (e instanceof EroareValidare) {
      console.warn(`Câmp invalid [${e.camp}]: ${e.message}`);
    }
  }
});

// ===== PERFORMANCE =====
document.getElementById('btn-performance').addEventListener('click', () => {
  // RĂU — creează o nouă funcție la fiecare apel de eveniment
  const elementeRau = document.querySelectorAll('button');
  elementeRau.forEach(el => {
    el.addEventListener('mouseenter', function() {}); // funcție anonimă = nu poate fi eliminată
  });

  // BUN — funcție numită, poate fi adăugată/eliminată
  function peHover() { /* logică */ }
  const elementeBun = document.querySelectorAll('button');
  elementeBun.forEach(el => {
    el.addEventListener('mouseenter', peHover);
    // el.removeEventListener('mouseenter', peHover); // poate fi eliminată
  });

  console.log('Verifică tab-ul Performance în DevTools pentru profilare detaliată.');
});
