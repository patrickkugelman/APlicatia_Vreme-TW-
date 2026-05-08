import { describe, it, expect, beforeEach } from 'vitest';

// ===== FUNCȚII PURE DE TESTAT =====
function aduna(a, b) { return a + b; }
function formateazaTemperatura(temp) { return `${temp.toFixed(1)}°C`; }
function valideazaOras(oras) {
  return typeof oras === 'string' && oras.length >= 2 && /^[\p{L}\s\-]+$/u.test(oras);
}

// Funcție cu stare internă (testăm că resetarea funcționează)
function creeazaCoș() {
  let produse = [];
  return {
    adauga: (p) => produse.push(p),
    total: () => produse.length,
    reseteaza: () => { produse = []; }
  };
}

// ===== TESTE =====

// describe grupează teste înrudite
describe('aduna', () => {
  it('adună două numere pozitive', () => {
    expect(aduna(2, 3)).toBe(5);
  });
  it('adună numere negative', () => {
    expect(aduna(-1, -2)).toBe(-3);
  });
  it('adună zero', () => {
    expect(aduna(5, 0)).toBe(5);
  });
});

describe('formateazaTemperatura', () => {
  it('formatează cu o zecimală și °C', () => {
    expect(formateazaTemperatura(22)).toBe('22.0°C');
  });
  it('rotunjește corect', () => {
    expect(formateazaTemperatura(22.456)).toBe('22.5°C');
  });
  it('funcționează cu valori negative', () => {
    expect(formateazaTemperatura(-10)).toBe('-10.0°C');
  });
});

describe('valideazaOras', () => {
  it('acceptă un oraș valid', () => {
    expect(valideazaOras('București')).toBe(true);
  });
  it('acceptă oraș cu cratimă', () => {
    expect(valideazaOras('Cluj-Napoca')).toBe(true);
  });
  it('respinge string gol', () => {
    expect(valideazaOras('')).toBe(false);
  });
  it('respinge HTML injectat', () => {
    expect(valideazaOras('<script>')).toBe(false);
  });
  it('respinge număr', () => {
    expect(valideazaOras(123)).toBe(false);
  });
});

describe('coș de cumpărături', () => {
  let cos;

  // beforeEach rulează înainte de fiecare test din acest bloc
  beforeEach(() => {
    cos = creeazaCoș();
  });

  it('pornește gol', () => {
    expect(cos.total()).toBe(0);
  });
  it('adaugă produse', () => {
    cos.adauga('Mere');
    cos.adauga('Pâine');
    expect(cos.total()).toBe(2);
  });
  it('resetează corect', () => {
    cos.adauga('Lapte');
    cos.reseteaza();
    expect(cos.total()).toBe(0);
  });
});
