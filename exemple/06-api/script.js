// API public de test: JSONPlaceholder (nu necesită autentificare)
const URL_API = 'https://jsonplaceholder.typicode.com';
const output = document.getElementById('output');

// ===== FETCH — CERERE GET =====
document.getElementById('btn-get').addEventListener('click', async () => {
  output.textContent = 'Se încarcă...';

  try {
    // fetch returnează un Promise cu obiectul Response
    const raspuns = await fetch(`${URL_API}/users?_limit=3`);

    // Verificăm că cererea a reușit (status 200-299)
    if (!raspuns.ok) {
      throw new Error(`Eroare HTTP: ${raspuns.status} ${raspuns.statusText}`);
    }

    // Parsăm JSON-ul din corp (returnează tot un Promise)
    const utilizatori = await raspuns.json();

    // Prelucrăm datele cu destructuring
    const rezultat = utilizatori.map(({ id, name, email, address }) => ({
      id,
      nume: name,
      email,
      oras: address.city
    }));

    output.textContent = JSON.stringify(rezultat, null, 2);

  } catch (eroare) {
    // Capturam atât erorile de rețea cât și cele aruncate manual
    output.textContent = `Eroare: ${eroare.message}`;
  }
});

// ===== TRATAREA ERORILOR =====
document.getElementById('btn-eroare').addEventListener('click', async () => {
  output.textContent = 'Cer o resursă inexistentă...';

  try {
    const raspuns = await fetch(`${URL_API}/resursa-inexistenta/999`);

    if (!raspuns.ok) {
      throw new Error(`Resursa nu există (status: ${raspuns.status})`);
    }

    const date = await raspuns.json();
    output.textContent = JSON.stringify(date, null, 2);

  } catch (eroare) {
    output.textContent = `Eroare capturată corect:\n${eroare.message}`;
  }
});
