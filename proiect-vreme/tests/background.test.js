import { describe, it, expect } from 'vitest';
import { obtineClassBackground } from '../src/background.js';

describe('obtineClassBackground', () => {
  // Valori edge
  it('returnează bg-implicit pentru cod undefined', () => {
    expect(obtineClassBackground(undefined)).toBe('bg-implicit');
  });
  it('returnează bg-implicit pentru cod null', () => {
    expect(obtineClassBackground(null)).toBe('bg-implicit');
  });
  it('returnează bg-implicit pentru cod 0', () => {
    expect(obtineClassBackground(0)).toBe('bg-implicit');
  });
  it('returnează bg-implicit pentru string', () => {
    expect(obtineClassBackground('800')).toBe('bg-implicit');
  });

  // Furtună (2xx)
  it('cod 200 → bg-furtuna', () => {
    expect(obtineClassBackground(200)).toBe('bg-furtuna');
  });
  it('cod 231 → bg-furtuna', () => {
    expect(obtineClassBackground(231)).toBe('bg-furtuna');
  });
  it('cod 299 → bg-furtuna', () => {
    expect(obtineClassBackground(299)).toBe('bg-furtuna');
  });

  // Ploaie măruntă (3xx)
  it('cod 300 → bg-ploaie', () => {
    expect(obtineClassBackground(300)).toBe('bg-ploaie');
  });
  it('cod 321 → bg-ploaie', () => {
    expect(obtineClassBackground(321)).toBe('bg-ploaie');
  });

  // Ploaie (5xx)
  it('cod 500 → bg-ploaie', () => {
    expect(obtineClassBackground(500)).toBe('bg-ploaie');
  });
  it('cod 502 → bg-ploaie', () => {
    expect(obtineClassBackground(502)).toBe('bg-ploaie');
  });
  it('cod 511 → bg-ninsoare (freezing rain)', () => {
    expect(obtineClassBackground(511)).toBe('bg-ninsoare');
  });

  // Ninsoare (6xx)
  it('cod 600 → bg-ninsoare', () => {
    expect(obtineClassBackground(600)).toBe('bg-ninsoare');
  });
  it('cod 620 → bg-ninsoare', () => {
    expect(obtineClassBackground(620)).toBe('bg-ninsoare');
  });

  // Ceață (7xx)
  it('cod 701 → bg-ceata', () => {
    expect(obtineClassBackground(701)).toBe('bg-ceata');
  });
  it('cod 741 → bg-ceata', () => {
    expect(obtineClassBackground(741)).toBe('bg-ceata');
  });
  it('cod 781 → bg-ceata (tornado)', () => {
    expect(obtineClassBackground(781)).toBe('bg-ceata');
  });

  // Senin (800)
  it('cod 800 → bg-senin', () => {
    expect(obtineClassBackground(800)).toBe('bg-senin');
  });

  // Parțial înnorat (801–802)
  it('cod 801 → bg-partial-innorat', () => {
    expect(obtineClassBackground(801)).toBe('bg-partial-innorat');
  });
  it('cod 802 → bg-partial-innorat', () => {
    expect(obtineClassBackground(802)).toBe('bg-partial-innorat');
  });

  // Înnorat (803–804)
  it('cod 803 → bg-innorat', () => {
    expect(obtineClassBackground(803)).toBe('bg-innorat');
  });
  it('cod 804 → bg-innorat', () => {
    expect(obtineClassBackground(804)).toBe('bg-innorat');
  });

  // Valori în afara intervalelor cunoscute
  it('cod 100 → bg-implicit', () => {
    expect(obtineClassBackground(100)).toBe('bg-implicit');
  });
  it('cod 900 → bg-implicit', () => {
    expect(obtineClassBackground(900)).toBe('bg-implicit');
  });
});
