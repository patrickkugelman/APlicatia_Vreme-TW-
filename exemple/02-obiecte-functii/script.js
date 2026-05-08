// ===== OBIECTE LITERALE =====
const oras = {
  nume: 'București',
  tara: 'România',
  populatie: 2000000,
  coordonate: { lat: 44.43, lon: 26.10 },

  descrie() {
    return `${this.nume} este în ${this.tara} cu ${this.populatie.toLocaleString()} locuitori.`;
  }
};

console.log(oras.nume);
console.log(oras['tara']);         // accesare cu string — util când cheia e dinamică
console.log(oras.descrie());
console.log(oras.coordonate.lat);

// ===== FUNCȚII =====

// Declarație de funcție — disponibilă înainte de definire (hoisting)
function aduna(a, b) {
  return a + b;
}

// Expresie de funcție — nu beneficiază de hoisting
const scade = function(a, b) {
  return a - b;
};

// Arrow function — sintaxă scurtă, fără propriul `this`
const inmulteste = (a, b) => a * b;

// Parametri cu valori implicite
function saluta(nume = 'Vizitator') {
  return `Salut, ${nume}!`;
}

console.log(aduna(3, 4));
console.log(scade(10, 3));
console.log(inmulteste(5, 6));
console.log(saluta());
console.log(saluta('Maria'));

// ===== CLOSURES =====
// O funcție care "ține minte" variabilele din scopul în care a fost creată
function creeazaNumarator() {
  let contor = 0; // variabilă privată

  return {
    incrementeaza: () => ++contor,
    reseteaza: () => { contor = 0; },
    valoare: () => contor
  };
}

const numarator = creeazaNumarator();
numarator.incrementeaza();
numarator.incrementeaza();
numarator.incrementeaza();
console.log('Contor:', numarator.valoare()); // 3
numarator.reseteaza();
console.log('După reset:', numarator.valoare()); // 0

// ===== THIS =====
const termometru = {
  temperatura: 22,
  unitati: 'Celsius',

  // Metodă normală — this referă obiectul
  afiseaza() {
    console.log(`${this.temperatura}° ${this.unitati}`);
  },

  // Arrow function într-o metodă — this din contextul exterior (window)
  afiseazaArrow: () => {
    // this.temperatura ar fi undefined în strict mode
    console.log('Arrow function nu are propriul this');
  }
};

termometru.afiseaza();
termometru.afiseazaArrow();

// ===== FUNCȚII DE ORDIN SUPERIOR =====
// Funcții care primesc sau returnează alte funcții
const temperaturi = [15, 22, 8, 30, 18];

const calde = temperaturi.filter(t => t > 20);        // [22, 30]
const inFahrenheit = temperaturi.map(t => t * 9/5 + 32); // conversie
const suma = temperaturi.reduce((acc, t) => acc + t, 0); // 93

console.log('Calde:', calde);
console.log('Fahrenheit:', inFahrenheit);
console.log('Suma temperaturilor:', suma);
