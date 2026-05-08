// ===== TEMPLATE LITERALS =====
const oras = 'București';
const temperatura = 22.5;
const mesaj = `Temperatura în ${oras} este ${temperatura.toFixed(1)}°C.`;
console.log(mesaj);

// ===== DESTRUCTURING =====
// Din obiecte
const { nume, tara, coordonate: { lat, lon } } = {
  nume: 'Cluj-Napoca',
  tara: 'România',
  coordonate: { lat: 46.77, lon: 23.59 }
};
console.log(nume, tara, lat, lon);

// Din vectori
const [primul, al_doilea, ...restul] = [10, 20, 30, 40, 50];
console.log(primul, al_doilea, restul); // 10 20 [30, 40, 50]

// Destructuring în parametrii funcției
function afiseazaVreme({ oras, temp, descriere = 'N/A' }) {
  console.log(`${oras}: ${temp}°C — ${descriere}`);
}
afiseazaVreme({ oras: 'Sibiu', temp: 18, descriere: 'înnorat' });

// ===== SPREAD & REST =====
const orase1 = ['București', 'Cluj'];
const orase2 = ['Timișoara', 'Iași'];
const toateOrasele = [...orase1, ...orase2, 'Brașov'];
console.log(toateOrasele);

// Copie superficială a unui obiect cu spread
const vremeOriginala = { temp: 20, umiditate: 65 };
const vremeActualizata = { ...vremeOriginala, temp: 25 }; // suprascrie temp
console.log(vremeActualizata); // { temp: 25, umiditate: 65 }

// Rest în parametrii funcției
function sumaTemperaturi(prima, ...restTemperaturi) {
  return [prima, ...restTemperaturi].reduce((a, b) => a + b, 0);
}
console.log(sumaTemperaturi(10, 20, 30, 40)); // 100

// ===== CLASSES =====
class Senzor {
  #valoare; // câmp privat (ES2022)

  constructor(tip, unitate) {
    this.tip = tip;
    this.unitate = unitate;
    this.#valoare = 0;
  }

  seteazaValoare(v) {
    this.#valoare = v;
  }

  get citire() {
    return `${this.#valoare} ${this.unitate}`;
  }
}

class SenzorTemperatura extends Senzor {
  constructor() {
    super('Temperatură', '°C');
  }

  esteConfortabil() {
    return this.citire.startsWith('2'); // simplificat
  }
}

const senzor = new SenzorTemperatura();
senzor.seteazaValoare(22);
console.log(senzor.citire);

// ===== OPTIONAL CHAINING & NULLISH COALESCING =====
const raspunsAPI = {
  date: {
    vreme: { descriere: 'însorit' }
  }
};

// Fără optional chaining — ar crăpa dacă `vreme` nu există
const descriere = raspunsAPI?.date?.vreme?.descriere ?? 'Nedisponibil';
const vitezaVant = raspunsAPI?.date?.vant?.viteza ?? 0;
console.log(descriere, vitezaVant);

// ===== MAP & SET =====
// Map — perechi cheie/valoare (orice tip de cheie)
const cache = new Map();
cache.set('bucurești', { temp: 22 });
cache.set('cluj', { temp: 18 });
console.log(cache.get('bucurești'));
console.log(cache.has('iași')); // false

// Set — colecție de valori unice
const taguri = new Set(['vreme', 'api', 'dom', 'vreme', 'api']);
console.log([...taguri]); // ['vreme', 'api', 'dom'] — fără duplicate
