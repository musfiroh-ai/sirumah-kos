// tests/mainScreen.test.js
// Pengujian Fungsional & Unit untuk Main Screen (Halaman Beranda)
// Menguji endpoint REST API yang men-supply data ke main screen.

const request = require('supertest');
const app = require('../index');
const { backupData, restoreData } = require('./testHelper');

beforeAll(() => {
  backupData();
});

afterAll(() => {
  restoreData();
});

// ============================================================
// PENGAMBILAN DATA KOS (Main Screen API)
// ============================================================
describe('Pengujian Main Screen - Pengambilan Data Kos', () => {

  test('TC-M01: GET /api/kos mengembalikan daftar kos', async () => {
    const res = await request(app).get('/api/kos');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(0);
    expect(res.body.total).toBe(res.body.data.length);
  });

  test('TC-M02: Setiap item kos memiliki struktur yang benar', async () => {
    const res = await request(app).get('/api/kos');
    expect(res.statusCode).toBe(200);

    if (res.body.data.length > 0) {
      const kos = res.body.data[0];
      expect(kos).toHaveProperty('id');
      expect(kos).toHaveProperty('nama_kos');
      expect(kos).toHaveProperty('alamat');
      expect(kos).toHaveProperty('lokasi');
      expect(kos).toHaveProperty('harga');
      expect(kos).toHaveProperty('jenis_kos');
      expect(kos).toHaveProperty('fasilitas');
      expect(['putra', 'putri', 'campur']).toContain(kos.jenis_kos);
      expect(typeof kos.harga).toBe('number');
    }
  });

  test('TC-M03: GET /api/kos/:id dengan ID valid mengembalikan detail', async () => {
    const all = await request(app).get('/api/kos');
    if (all.body.data.length === 0) return; // skip kalau data kosong

    const firstId = all.body.data[0].id;
    const res = await request(app).get('/api/kos/' + firstId);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.id).toBe(firstId);
  });

  test('TC-M04: GET /api/kos/:id dengan ID tidak valid mengembalikan 404', async () => {
    const res = await request(app).get('/api/kos/999999');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });
});

// ============================================================
// FILTER & SEARCH (Main Screen Filtering)
// ============================================================
describe('Pengujian Main Screen - Filter dan Pencarian', () => {

  test('TC-F01: Filter berdasarkan lokasi mengembalikan hanya kos di lokasi tersebut', async () => {
    const res = await request(app).get('/api/kos?lokasi=Jakarta');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    res.body.data.forEach(kos => {
      expect(kos.lokasi.toLowerCase()).toBe('jakarta');
    });
  });

  test('TC-F02: Filter berdasarkan jenis_kos mengembalikan jenis yang sesuai', async () => {
    const res = await request(app).get('/api/kos?jenis_kos=putri');

    expect(res.statusCode).toBe(200);
    res.body.data.forEach(kos => {
      expect(kos.jenis_kos).toBe('putri');
    });
  });

  test('TC-F03: Filter harga_max mengembalikan kos di bawah/sama dengan harga', async () => {
    const HARGA_MAX = 1000000;
    const res = await request(app).get('/api/kos?harga_max=' + HARGA_MAX);

    expect(res.statusCode).toBe(200);
    res.body.data.forEach(kos => {
      expect(kos.harga).toBeLessThanOrEqual(HARGA_MAX);
    });
  });

  test('TC-F04: Filter harga_min mengembalikan kos di atas/sama dengan harga', async () => {
    const HARGA_MIN = 1000000;
    const res = await request(app).get('/api/kos?harga_min=' + HARGA_MIN);

    expect(res.statusCode).toBe(200);
    res.body.data.forEach(kos => {
      expect(kos.harga).toBeGreaterThanOrEqual(HARGA_MIN);
    });
  });

  test('TC-F05: Search keyword "kos" harus ada hasil (semua kos punya kata "kos" di nama)', async () => {
    const res = await request(app).get('/api/kos?search=kos');

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
  });

  test('TC-F06: Search keyword yang tidak ada mengembalikan 0 hasil', async () => {
    const res = await request(app).get('/api/kos?search=xxxxNotExistxxxx_123');

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.data).toEqual([]);
  });

  test('TC-F07: Kombinasi filter lokasi + jenis_kos bekerja simultan', async () => {
    const res = await request(app).get('/api/kos?lokasi=Jakarta&jenis_kos=putri');

    expect(res.statusCode).toBe(200);
    res.body.data.forEach(kos => {
      expect(kos.lokasi.toLowerCase()).toBe('jakarta');
      expect(kos.jenis_kos).toBe('putri');
    });
  });
});

// ============================================================
// API INFO ENDPOINT
// ============================================================
describe('Pengujian Main Screen - API Info', () => {

  test('TC-A01: GET /api mengembalikan informasi endpoint', async () => {
    const res = await request(app).get('/api');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.endpoints).toBeDefined();
    expect(res.body.endpoints.kos).toBeDefined();
    expect(res.body.endpoints.auth).toBeDefined();
    expect(res.body.endpoints.favorit).toBeDefined();
  });

  test('TC-A02: Endpoint tidak dikenal mengembalikan 404', async () => {
    const res = await request(app).get('/api/endpoint-yang-tidak-ada');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
