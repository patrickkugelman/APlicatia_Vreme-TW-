import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Teste pentru modulul auth.js (frontend).
 * localStorage este mockat prin jsdom (environment: jsdom în vite.config.js).
 */

// Mock fetch global
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Importăm după mock-ul fetch
const { default: authModule } = await import('../src/auth.js').then(m => ({ default: m }));
import {
  salveazaSesiune,
  stergeSesiune,
  obtineToken,
  obtineUserCurent,
  esteAutentificat,
  esteAdmin,
  autentifica,
  inregistreaza,
  verificaSesiuneActiva
} from '../src/auth.js';

const TOKEN_KEY = 'vremeAuthToken';
const USER_KEY = 'vremeUser';

const userAdmin = { id: 1, email: 'admin@test.com', name: 'Admin', role: 'admin' };
const userNormal = { id: 2, email: 'user@test.com', name: 'User', role: 'user' };
const TOKEN_VALID = 'token.valid.jwt';

beforeEach(() => {
  localStorage.clear();
  mockFetch.mockReset();
});

// ── salveazaSesiune & obtine ──
describe('salveazaSesiune', () => {
  it('stochează token și user în localStorage', () => {
    salveazaSesiune(TOKEN_VALID, userAdmin);
    expect(localStorage.getItem(TOKEN_KEY)).toBe(TOKEN_VALID);
    expect(JSON.parse(localStorage.getItem(USER_KEY))).toEqual(userAdmin);
  });
});

describe('obtineToken', () => {
  it('returnează null dacă nu există token', () => {
    expect(obtineToken()).toBeNull();
  });
  it('returnează token-ul salvat', () => {
    localStorage.setItem(TOKEN_KEY, TOKEN_VALID);
    expect(obtineToken()).toBe(TOKEN_VALID);
  });
});

describe('obtineUserCurent', () => {
  it('returnează null dacă nu există user', () => {
    expect(obtineUserCurent()).toBeNull();
  });
  it('returnează obiectul user deserializat', () => {
    localStorage.setItem(USER_KEY, JSON.stringify(userNormal));
    expect(obtineUserCurent()).toEqual(userNormal);
  });
});

// ── esteAutentificat ──
describe('esteAutentificat', () => {
  it('returnează false când nu există token', () => {
    expect(esteAutentificat()).toBe(false);
  });
  it('returnează true când există token', () => {
    localStorage.setItem(TOKEN_KEY, TOKEN_VALID);
    expect(esteAutentificat()).toBe(true);
  });
});

// ── esteAdmin ──
describe('esteAdmin', () => {
  it('returnează false când nu există user', () => {
    expect(esteAdmin()).toBe(false);
  });
  it('returnează false pentru user cu rol "user"', () => {
    localStorage.setItem(USER_KEY, JSON.stringify(userNormal));
    expect(esteAdmin()).toBe(false);
  });
  it('returnează true pentru user cu rol "admin"', () => {
    localStorage.setItem(USER_KEY, JSON.stringify(userAdmin));
    expect(esteAdmin()).toBe(true);
  });
});

// ── stergeSesiune ──
describe('stergeSesiune', () => {
  it('elimină token și user din localStorage', () => {
    salveazaSesiune(TOKEN_VALID, userAdmin);
    stergeSesiune();
    expect(obtineToken()).toBeNull();
    expect(obtineUserCurent()).toBeNull();
  });
});

// ── autentifica ──
describe('autentifica', () => {
  it('apelează POST /api/auth/login și salvează sesiunea', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: TOKEN_VALID, user: userNormal })
    });

    const result = await autentifica('user@test.com', 'parola123');
    expect(result).toEqual(userNormal);
    expect(obtineToken()).toBe(TOKEN_VALID);
    expect(obtineUserCurent()).toEqual(userNormal);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/auth/login');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.email).toBe('user@test.com');
    expect(body.password).toBe('parola123');
  });

  it('aruncă eroare când server returnează 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ eroare: 'Email sau parolă incorectă' })
    });

    await expect(autentifica('bad@test.com', 'gresit')).rejects.toThrow('Email sau parolă incorectă');
    expect(obtineToken()).toBeNull();
  });
});

// ── inregistreaza ──
describe('inregistreaza', () => {
  it('apelează POST /api/auth/register și salvează sesiunea', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: TOKEN_VALID, user: userNormal })
    });

    const result = await inregistreaza('user@test.com', 'parola123', 'User');
    expect(result).toEqual(userNormal);
    expect(obtineToken()).toBe(TOKEN_VALID);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/auth/register');
    const body = JSON.parse(opts.body);
    expect(body.name).toBe('User');
  });

  it('aruncă eroare când email e deja înregistrat', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ eroare: 'Email deja înregistrat' })
    });

    await expect(inregistreaza('dup@test.com', 'pass', 'Test')).rejects.toThrow('Email deja înregistrat');
  });
});

// ── verificaSesiuneActiva ──
describe('verificaSesiuneActiva', () => {
  it('returnează false dacă nu există token', async () => {
    expect(await verificaSesiuneActiva()).toBe(false);
  });

  it('returnează true și actualizează user-ul când /me răspunde OK', async () => {
    localStorage.setItem(TOKEN_KEY, TOKEN_VALID);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => userAdmin
    });

    const result = await verificaSesiuneActiva();
    expect(result).toBe(true);
    expect(obtineUserCurent()).toEqual(userAdmin);

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers['Authorization']).toBe(`Bearer ${TOKEN_VALID}`);
  });

  it('returnează false și șterge sesiunea când /me returnează 401', async () => {
    localStorage.setItem(TOKEN_KEY, TOKEN_VALID);
    localStorage.setItem(USER_KEY, JSON.stringify(userAdmin));
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    const result = await verificaSesiuneActiva();
    expect(result).toBe(false);
    expect(obtineToken()).toBeNull();
  });

  it('returnează false când fetch aruncă excepție (offline)', async () => {
    localStorage.setItem(TOKEN_KEY, TOKEN_VALID);
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await verificaSesiuneActiva();
    expect(result).toBe(false);
  });
});
