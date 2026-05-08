// ===== TIPURI DE DATE =====
const numar = 42;
const text = 'Salut, lume!';
const boolean = true;
const nimic = null;
const nedefinit = undefined;
const obiect = { cheie: 'valoare' };
const vector = [1, 2, 3];

console.log('Tipuri:', typeof numar, typeof text, typeof boolean, typeof obiect, typeof vector);

// ===== VARIABILE =====
var vechi = 'var are scop de funcție (evitați!)';
let schimbabil = 'let poate fi reatribuit';
const constant = 'const nu poate fi reatribuit';

schimbabil = 'valoare nouă'; // OK
// constant = 'eroare'; // TypeError!

// ===== OPERATORI =====
console.log(10 + 3);   // 13 — adunare
console.log(10 - 3);   // 7  — scădere
console.log(10 * 3);   // 30 — înmulțire
console.log(10 / 3);   // 3.333... — împărțire
console.log(10 % 3);   // 1  — rest (modulo)
console.log(10 ** 3);  // 1000 — ridicare la putere

// Comparații — ÎNTOTDEAUNA folosiți === (strict), nu == (slab)
console.log(5 === 5);    // true
console.log(5 === '5');  // false — tipuri diferite
console.log(5 == '5');   // true — periculos! JS convertește tipul

// ===== CONTROL FLOW =====
const temperatura = 22;

if (temperatura > 30) {
  console.log('E cald afară');
} else if (temperatura > 15) {
  console.log('Vreme plăcută');
} else {
  console.log('E frig afară');
}

// Operator ternar — forma scurtă a if/else
const mesaj = temperatura > 15 ? 'Ieși afară!' : 'Stai în casă!';
console.log(mesaj);

// ===== BUCLE =====
// for clasic
for (let i = 0; i < 3; i++) {
  console.log(`Iterația ${i}`);
}

// for...of — pentru vectori
const orase = ['București', 'Cluj', 'Timișoara'];
for (const oras of orase) {
  console.log(oras);
}

// while
let contor = 0;
while (contor < 3) {
  console.log(`Contor: ${contor}`);
  contor++;
}

// ===== SCOPE =====
function demonstreazaScope() {
  const local = 'vizibil doar în funcție';
  console.log(local);
}
demonstreazaScope();
// console.log(local); // ReferenceError — nu există în afara funcției
