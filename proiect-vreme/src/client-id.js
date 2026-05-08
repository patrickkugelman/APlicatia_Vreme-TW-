const CHEIE_CLIENT_ID = 'vremeClientId';

// Returnează UUID-ul unic al acestui browser, generat la primul acces
export function obtineClientId() {
  let id = localStorage.getItem(CHEIE_CLIENT_ID);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CHEIE_CLIENT_ID, id);
  }
  return id;
}
