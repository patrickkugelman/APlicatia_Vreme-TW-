import { describe, it, expect } from 'vitest';
import {
  formateazaTemperatura,
  formateazaVant,
  convertesteDirectiVant,
  urlPictograma,
  msPeSecundaInKmPeOra,
  filtreazaPrognozeZilnice
} from '../src/utils.js';

describe('formateazaTemperatura', () => {
  it('adaugă simbolul °C implicit', () => {
    expect(formateazaTemperatura(20)).toBe('20.0°C');
  });
  it('rotunjește la o zecimală', () => {
    expect(formateazaTemperatura(20.567)).toBe('20.6°C');
  });
  it('funcționează cu temperaturi negative', () => {
    expect(formateazaTemperatura(-5.3)).toBe('-5.3°C');
  });
  it('funcționează cu zero', () => {
    expect(formateazaTemperatura(0)).toBe('0.0°C');
  });
  it('convertește în °F când e specificat', () => {
    expect(formateazaTemperatura(0, 'F')).toBe('32.0°F');
  });
  it('convertește 100°C în 212°F', () => {
    expect(formateazaTemperatura(100, 'F')).toBe('212.0°F');
  });
});

describe('formateazaVant', () => {
  it('returnează km/h implicit', () => {
    expect(formateazaVant(10)).toBe('36.0 km/h');
  });
  it('returnează mph când e specificat', () => {
    expect(formateazaVant(10, 'mph')).toBe('22.4 mph');
  });
  it('funcționează cu viteza zero', () => {
    expect(formateazaVant(0)).toBe('0.0 km/h');
  });
});

describe('convertesteDirectiVant', () => {
  it('returnează N pentru 0 grade', () => {
    expect(convertesteDirectiVant(0)).toBe('N');
  });
  it('returnează E pentru 90 grade', () => {
    expect(convertesteDirectiVant(90)).toBe('E');
  });
  it('returnează S pentru 180 grade', () => {
    expect(convertesteDirectiVant(180)).toBe('S');
  });
  it('returnează V pentru 270 grade', () => {
    expect(convertesteDirectiVant(270)).toBe('V');
  });
  it('returnează NE pentru 45 grade', () => {
    expect(convertesteDirectiVant(45)).toBe('NE');
  });
});

describe('urlPictograma', () => {
  it('generează URL corect pentru cod pictogramă', () => {
    expect(urlPictograma('01d')).toBe('https://openweathermap.org/img/wn/01d@2x.png');
  });
  it('funcționează și pentru pictograme de noapte', () => {
    expect(urlPictograma('02n')).toBe('https://openweathermap.org/img/wn/02n@2x.png');
  });
});

describe('msPeSecundaInKmPeOra', () => {
  it('convertește corect 10 m/s în km/h', () => {
    expect(msPeSecundaInKmPeOra(10)).toBe('36.0');
  });
  it('convertește corect 0 m/s', () => {
    expect(msPeSecundaInKmPeOra(0)).toBe('0.0');
  });
});

describe('filtreazaPrognozeZilnice', () => {
  it('returnează maxim 5 zile', () => {
    // Generăm o listă artificială cu 40 de puncte (câte 8 pe zi × 5 zile)
    const lista = [];
    const acum = Math.floor(Date.now() / 1000);
    for (let zi = 0; zi < 6; zi++) {
      for (let ora = 0; ora < 8; ora++) {
        lista.push({
          dt: acum + zi * 86400 + ora * 10800,
          main: { temp: 20, temp_min: 15, temp_max: 25, humidity: 50 },
          weather: [{ icon: '01d', description: 'cer senin' }]
        });
      }
    }
    const rezultat = filtreazaPrognozeZilnice(lista);
    expect(rezultat.length).toBeLessThanOrEqual(5);
  });
});
