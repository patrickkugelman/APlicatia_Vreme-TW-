const output = document.getElementById('output');

// ===== CALLBACKS =====
// Funcție care primește un callback și îl apelează după un timp
function simulareRequest(url, callback) {
  setTimeout(() => {
    if (url.includes('invalid')) {
      callback(new Error('URL invalid'), null);
    } else {
      callback(null, { date: 'Răspuns de la ' + url });
    }
  }, 1000);
}

document.getElementById('btn-callback').addEventListener('click', () => {
  output.textContent = 'Se încarcă (callback)...';

  simulareRequest('https://api.exemplu.ro/date', (eroare, rezultat) => {
    if (eroare) {
      output.textContent = 'Eroare: ' + eroare.message;
      return;
    }
    output.textContent = JSON.stringify(rezultat, null, 2);
  });
});

// ===== PROMISE =====
// Promise = o promisiune că vei primi un rezultat în viitor
function simulareRequestPromise(url) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url.includes('invalid')) {
        reject(new Error('URL invalid'));
      } else {
        resolve({ date: 'Date de la ' + url });
      }
    }, 1000);
  });
}

document.getElementById('btn-promise').addEventListener('click', () => {
  output.textContent = 'Se încarcă (Promise)...';

  simulareRequestPromise('https://api.exemplu.ro/vreme')
    .then((rezultat) => {
      output.textContent = JSON.stringify(rezultat, null, 2);
    })
    .catch((eroare) => {
      output.textContent = 'Eroare: ' + eroare.message;
    });
});

// ===== ASYNC / AWAIT =====
// Sintaxă mai curată pentru lucrul cu Promise-uri
async function incarcaDate(url) {
  // await "pauzează" execuția până ce Promise-ul se rezolvă
  const rezultat = await simulareRequestPromise(url);
  return rezultat;
}

document.getElementById('btn-async').addEventListener('click', async () => {
  output.textContent = 'Se încarcă (async/await)...';

  try {
    const date = await incarcaDate('https://api.exemplu.ro/temperaturi');
    output.textContent = JSON.stringify(date, null, 2);
  } catch (eroare) {
    output.textContent = 'Eroare capturată: ' + eroare.message;
  }
});

// ===== PROMISE.ALL — CERERI PARALELE =====
// Pornește mai multe cereri simultan și așteptă toate să termine
document.getElementById('btn-paralel').addEventListener('click', async () => {
  output.textContent = 'Se încarcă 3 cereri în paralel...';

  try {
    const [bucuresti, cluj, timisoara] = await Promise.all([
      simulareRequestPromise('https://api.vreme.ro/bucuresti'),
      simulareRequestPromise('https://api.vreme.ro/cluj'),
      simulareRequestPromise('https://api.vreme.ro/timisoara')
    ]);

    output.textContent = 'Toate au terminat:\n' +
      JSON.stringify({ bucuresti, cluj, timisoara }, null, 2);
  } catch (eroare) {
    output.textContent = 'Una din cereri a eșuat: ' + eroare.message;
  }
});
