// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

// Recreăm schema în memorie pentru fiecare test (fără a atinge fișierul real data.db)
let db;

const schema = `
  CREATE TABLE favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    city TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, city)
  );
  CREATE TABLE history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    city TEXT NOT NULL,
    searched_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX idx_history_client ON history(client_id, searched_at DESC);
`;

beforeEach(() => {
  db = new Database(':memory:');
  db.exec(schema);
});

afterEach(() => {
  db.close();
});

const CLIENT_TEST = '550e8400-e29b-41d4-a716-446655440000';

describe('operații CRUD pe tabelul favorites', () => {
  it('adaugă un oraș la favorite', () => {
    const result = db.prepare(
      'INSERT INTO favorites (client_id, city, note) VALUES (?, ?, ?)'
    ).run(CLIENT_TEST, 'București', 'Acasă');
    expect(result.lastInsertRowid).toBeGreaterThan(0);
  });

  it('previne duplicatele pentru același client', () => {
    const stmt = db.prepare('INSERT OR IGNORE INTO favorites (client_id, city) VALUES (?, ?)');
    stmt.run(CLIENT_TEST, 'Cluj');
    stmt.run(CLIENT_TEST, 'Cluj');
    const { n } = db.prepare('SELECT COUNT(*) as n FROM favorites WHERE client_id = ?').get(CLIENT_TEST);
    expect(n).toBe(1);
  });

  it('permite același oraș pentru clienți diferiți', () => {
    db.prepare('INSERT INTO favorites (client_id, city) VALUES (?, ?)').run(CLIENT_TEST, 'Iași');
    db.prepare('INSERT INTO favorites (client_id, city) VALUES (?, ?)').run('alt-client-uuid-1234567890', 'Iași');
    const total = db.prepare('SELECT COUNT(*) as n FROM favorites WHERE city = ?').get('Iași');
    expect(total.n).toBe(2);
  });

  it('returnează toate favoritele unui client', () => {
    db.prepare('INSERT INTO favorites (client_id, city) VALUES (?, ?)').run(CLIENT_TEST, 'Iași');
    db.prepare('INSERT INTO favorites (client_id, city) VALUES (?, ?)').run(CLIENT_TEST, 'Timișoara');
    const favorite = db.prepare('SELECT * FROM favorites WHERE client_id = ?').all(CLIENT_TEST);
    expect(favorite).toHaveLength(2);
  });

  it('actualizează nota unui favorit', () => {
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO favorites (client_id, city) VALUES (?, ?)'
    ).run(CLIENT_TEST, 'Oradea');
    db.prepare('UPDATE favorites SET note = ? WHERE id = ? AND client_id = ?')
      .run('De vizitat vara', lastInsertRowid, CLIENT_TEST);
    const fav = db.prepare('SELECT * FROM favorites WHERE id = ?').get(lastInsertRowid);
    expect(fav.note).toBe('De vizitat vara');
  });

  it('șterge un favorit după id', () => {
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO favorites (client_id, city) VALUES (?, ?)'
    ).run(CLIENT_TEST, 'Brașov');
    db.prepare('DELETE FROM favorites WHERE id = ? AND client_id = ?')
      .run(lastInsertRowid, CLIENT_TEST);
    const favorite = db.prepare('SELECT * FROM favorites WHERE client_id = ?').all(CLIENT_TEST);
    expect(favorite).toHaveLength(0);
  });

  it('nu șterge favoritele altui client', () => {
    const altClient = 'alt-client-uuid-9876543210';
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO favorites (client_id, city) VALUES (?, ?)'
    ).run(CLIENT_TEST, 'Sibiu');
    const result = db.prepare('DELETE FROM favorites WHERE id = ? AND client_id = ?')
      .run(lastInsertRowid, altClient);
    expect(result.changes).toBe(0);
  });
});

describe('operații pe tabelul history', () => {
  it('înregistrează o căutare', () => {
    db.prepare('INSERT INTO history (client_id, city) VALUES (?, ?)').run(CLIENT_TEST, 'Paris');
    const istoric = db.prepare('SELECT * FROM history WHERE client_id = ?').all(CLIENT_TEST);
    expect(istoric).toHaveLength(1);
    expect(istoric[0].city).toBe('Paris');
  });

  it('permite căutări repetate ale aceluiași oraș', () => {
    db.prepare('INSERT INTO history (client_id, city) VALUES (?, ?)').run(CLIENT_TEST, 'Roma');
    db.prepare('INSERT INTO history (client_id, city) VALUES (?, ?)').run(CLIENT_TEST, 'Roma');
    const count = db.prepare('SELECT COUNT(*) as n FROM history WHERE client_id = ?').get(CLIENT_TEST);
    expect(count.n).toBe(2);
  });
});
