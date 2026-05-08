// ===== SELECTORI DOM =====
const titlu = document.querySelector('h1');
const listaOrase = document.getElementById('lista-orase');
const output = document.getElementById('output');
const orase = ['Brașov', 'Iași', 'Constanța', 'Sibiu'];
let indexOras = 0;

// ===== MANIPULARE DOM =====
document.getElementById('btn-adauga').addEventListener('click', () => {
  if (indexOras >= orase.length) {
    output.textContent = 'Toate orașele au fost adăugate!';
    return;
  }

  // Creare element nou (mai sigur decât innerHTML)
  const li = document.createElement('li');
  li.textContent = orase[indexOras];
  li.dataset.oras = orase[indexOras].toLowerCase();
  listaOrase.appendChild(li);

  output.textContent = `Adăugat: ${orase[indexOras]}`;
  indexOras++;
});

// Modificare stiluri și atribute
document.getElementById('btn-schimba-culoare').addEventListener('click', () => {
  const culori = ['#569cd6', '#4ade80', '#f59e0b', '#f472b6'];
  const culoareNoua = culori[Math.floor(Math.random() * culori.length)];
  titlu.style.color = culoareNoua;
  output.textContent = `Titlu colorat în ${culoareNoua}`;
});

// Ștergere elemente
document.getElementById('btn-sterge-toate').addEventListener('click', () => {
  listaOrase.innerHTML = '';
  indexOras = 0;
  output.textContent = 'Lista a fost ștearsă.';
});

// ===== EVENT DELEGATION =====
// Un singur listener pe lista-părinte capturează click-urile pe orice <li>
// Nu trebuie să adăugăm listener pe fiecare element în parte
listaOrase.addEventListener('click', (eveniment) => {
  // eveniment.target = elementul pe care s-a dat click efectiv
  const oras = eveniment.target.dataset.oras;
  if (oras) {
    output.textContent = `Ai selectat: ${eveniment.target.textContent} (cod: ${oras})`;

    // Evidențiere element selectat
    document.querySelectorAll('#lista-orase li').forEach(li => li.style.background = '');
    eveniment.target.style.background = '#1d4ed8';
  }
});

// ===== PROPAGAREA EVENIMENTELOR =====
// Evenimentele se propagă de la copil spre părinte (bubbling)
listaOrase.addEventListener('click', () => {
  console.log('Click captat pe lista (bubbling de la li)');
});
