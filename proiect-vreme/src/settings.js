// Singleton cu setările active ale aplicației (sincronizate cu backend-ul)
let setariActive = {
  unitTemp: 'C',
  unitVant: 'kmh',
  tema: 'intuneric',
  pragMin: null,
  pragMax: null
};

export function obtineSetariActive() {
  return { ...setariActive };
}

export function aplicaSetari(setariNoi) {
  setariActive = { ...setariActive, ...setariNoi };
}
