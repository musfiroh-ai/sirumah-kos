// tests/auth.test.js
// Pengujian Fungsional & Unit untuk fitur Login dan Register
// Menggunakan Jest + Supertest

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
// FITUR REGISTER
// ============================================================
describe('Pengujian Fitur Register', () => {

  test('TC-R01: Register dengan data valid harus berhasil', async () => {
    const newUser = {
      username: 'testuser_' + Date.now(),
      email: 'test' + Date.now() + '@mail.com',
      password: 'rahasia123'
    };
    const res = await request(app)
      .post('/api/register')
      .send(newUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.username).toBe(newUser.username);
    expect(res.body.data.email).toBe(newUser.email);
    expect(res.body.data.role).toBe('user');
    expect(res.body.data.password).toBeUndefined(); // password tidak boleh dikembalikan
  });

  test('TC-R02: Register tanpa username harus gagal', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'noUsername@mail.com', password: 'rahasia' });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/wajib diisi/i);
  });

  test('TC-R03: Register tanpa email harus gagal', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'noemail_' + Date.now(), password: 'rahasia' });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });

  test('TC-R04: Register tanpa password harus gagal', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'nopass_' + Date.now(), email: 'nopass@mail.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
  });

  test('TC-R05: Register dengan username duplikat harus gagal', async () => {
    const dupUsername = 'duptest_' + Date.now();
    const userData = {
      username: dupUsername,
      email: 'first' + Date.now() + '@mail.com',
      password: 'rahasia'
    };
    // register pertama (sukses)
    await request(app).post('/api/register').send(userData);

    // register kedua dengan username sama (harus gagal)
    const res = await request(app)
      .post('/api/register')
      .send({
        username: dupUsername,
        email: 'second' + Date.now() + '@mail.com',
        password: 'rahasia'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/sudah terdaftar/i);
  });
});

// ============================================================
// FITUR LOGIN
// ============================================================
describe('Pengujian Fitur Login', () => {

  let testCredentials;

  beforeAll(async () => {
    // Buat user untuk dipakai testing login
    testCredentials = {
      username: 'loginuser_' + Date.now(),
      email: 'loginuser' + Date.now() + '@mail.com',
      password: 'passwordku'
    };
    await request(app).post('/api/register').send(testCredentials);
  });

  test('TC-L01: Login dengan username & password benar harus berhasil', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: testCredentials.username,
        password: testCredentials.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.username).toBe(testCredentials.username);
    expect(res.body.data.password).toBeUndefined();
  });

  test('TC-L02: Login pakai email juga harus berhasil', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: testCredentials.email, // pakai email di field username
        password: testCredentials.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
  });

  test('TC-L03: Login dengan password salah harus gagal', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: testCredentials.username,
        password: 'passwordSalah'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/salah/i);
  });

  test('TC-L04: Login dengan username yang tidak terdaftar harus gagal', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'userTidakAda_' + Date.now(),
        password: 'apapun'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });

  test('TC-L05: Login tanpa password harus gagal', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: testCredentials.username });

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/wajib diisi/i);
  });

  test('TC-L06: Login admin default harus berhasil', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.role).toBe('admin');
  });
});
