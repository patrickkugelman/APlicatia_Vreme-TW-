const CHEIE_TEMA = 'vreme-tema';

export function initializeazaTema(tema = null) {
  const temaInitiala = tema || localStorage.getItem(CHEIE_TEMA) || 'intuneric';
  aplicaTema(temaInitiala);
  return temaInitiala;
}

export function comutaTema() {
  const temaActuala = document.documentElement.getAttribute('data-tema') || 'intuneric';
  const temaNoua = temaActuala === 'intuneric' ? 'luminos' : 'intuneric';
  aplicaTema(temaNoua);
  localStorage.setItem(CHEIE_TEMA, temaNoua);
  return temaNoua;
}

function aplicaTema(tema) {
  document.documentElement.setAttribute('data-tema', tema);
}
