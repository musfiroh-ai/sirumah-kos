const express = require('express');
const router = express.Router();
const { readData, writeData, getNextId } = require('../utils/storage');
const upload = require('../utils/upload');
const path = require('path');
const fs = require('fs');

// helper untuk ambil user dari session
function getCurrentUser(req) {
  return req.session && req.session.user ? req.session.user : null;
}

// Middleware: harus login (role apapun)
function requireLogin(req, res, next) {
  if (!getCurrentUser(req)) return res.redirect('/login');
  next();
}

// Middleware: harus admin
function requireAdmin(req, res, next) {
  const user = getCurrentUser(req);
  if (!user) return res.redirect('/login');
  if (user.role !== 'admin') {
    return res.status(403).render('error', {
      message: 'Akses ditolak. Halaman ini hanya untuk admin.',
      user
    });
  }
  next();
}

// Beranda / daftar kos + search/filter (bisa diakses tanpa login)
router.get('/', (req, res) => {
  let kosList = readData('kos.json');
  const { search, lokasi, jenis_kos, harga_max } = req.query;

  if (search) {
    const q = search.toLowerCase();
    kosList = kosList.filter(k =>
      k.nama_kos.toLowerCase().includes(q) ||
      k.alamat.toLowerCase().includes(q) ||
      k.lokasi.toLowerCase().includes(q)
    );
  }
  if (lokasi) kosList = kosList.filter(k => k.lokasi.toLowerCase() === lokasi.toLowerCase());
  if (jenis_kos) kosList = kosList.filter(k => k.jenis_kos === jenis_kos);
  if (harga_max) kosList = kosList.filter(k => k.harga <= Number(harga_max));

  const allKos = readData('kos.json');
  const daftarLokasi = [...new Set(allKos.map(k => k.lokasi))];

  res.render('index', {
    kosList,
    daftarLokasi,
    filter: { search: search || '', lokasi: lokasi || '', jenis_kos: jenis_kos || '', harga_max: harga_max || '' },
    user: getCurrentUser(req)
  });
});

// Detail kos (bisa diakses tanpa login)
router.get('/kos/:id', (req, res) => {
  const kosList = readData('kos.json');
  const kos = kosList.find(k => k.id === Number(req.params.id));

  if (!kos) {
    return res.status(404).render('error', { message: 'Kos tidak ditemukan', user: getCurrentUser(req) });
  }

  res.render('detail', { kos, user: getCurrentUser(req) });
});

// === ADMIN ONLY: tambah/edit/hapus kos ===
router.get('/tambah-kos', requireAdmin, (req, res) => {
  res.render('tambah', { user: getCurrentUser(req), error: null });
});

router.post('/tambah-kos', requireAdmin, upload.single('foto_file'), (req, res) => {
  const { nama_kos, alamat, lokasi, harga, jenis_kos, fasilitas, deskripsi, kontak, foto } = req.body;

  if (!nama_kos || !alamat || !lokasi || !harga || !jenis_kos) {
    return res.render('tambah', { user: getCurrentUser(req), error: 'Semua field wajib (kecuali foto & deskripsi) harus diisi' });
  }

  // Tentukan foto: prioritas upload file > URL > placeholder
  let fotoFinal;
  if (req.file) {
    fotoFinal = '/uploads/' + req.file.filename;
  } else if (foto && foto.trim()) {
    fotoFinal = foto.trim();
  } else {
    fotoFinal = 'https://via.placeholder.com/600x400?text=Kos';
  }

  const kosList = readData('kos.json');
  const newKos = {
    id: getNextId(kosList),
    nama_kos,
    alamat,
    lokasi,
    harga: Number(harga),
    jenis_kos,
    fasilitas: fasilitas ? fasilitas.split(',').map(s => s.trim()).filter(Boolean) : [],
    deskripsi: deskripsi || '',
    kontak: kontak || '',
    foto: fotoFinal
  };

  kosList.push(newKos);
  writeData('kos.json', kosList);
  res.redirect('/kos/' + newKos.id);
});

router.get('/edit-kos/:id', requireAdmin, (req, res) => {
  const kosList = readData('kos.json');
  const kos = kosList.find(k => k.id === Number(req.params.id));

  if (!kos) {
    return res.status(404).render('error', { message: 'Kos tidak ditemukan', user: getCurrentUser(req) });
  }

  res.render('edit', { kos, user: getCurrentUser(req), error: null });
});

router.post('/edit-kos/:id', requireAdmin, upload.single('foto_file'), (req, res) => {
  const kosList = readData('kos.json');
  const index = kosList.findIndex(k => k.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).render('error', { message: 'Kos tidak ditemukan', user: getCurrentUser(req) });
  }

  const { nama_kos, alamat, lokasi, harga, jenis_kos, fasilitas, deskripsi, kontak, foto } = req.body;
  const oldFoto = kosList[index].foto;

  // Tentukan foto: kalau upload baru → pakai upload, kalau URL diisi → pakai URL, kalau kosong → pertahankan lama
  let fotoFinal;
  if (req.file) {
    fotoFinal = '/uploads/' + req.file.filename;
    // Hapus foto lama kalau itu hasil upload (bukan URL eksternal)
    if (oldFoto && oldFoto.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', 'public', oldFoto);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { /* abaikan kalau gagal */ }
      }
    }
  } else if (foto && foto.trim()) {
    fotoFinal = foto.trim();
  } else {
    fotoFinal = oldFoto;
  }

  kosList[index] = {
    ...kosList[index],
    nama_kos,
    alamat,
    lokasi,
    harga: Number(harga),
    jenis_kos,
    fasilitas: fasilitas ? fasilitas.split(',').map(s => s.trim()).filter(Boolean) : [],
    deskripsi: deskripsi || '',
    kontak: kontak || '',
    foto: fotoFinal
  };

  writeData('kos.json', kosList);
  res.redirect('/kos/' + req.params.id);
});

router.post('/hapus-kos/:id', requireAdmin, (req, res) => {
  const kosList = readData('kos.json');
  const newList = kosList.filter(k => k.id !== Number(req.params.id));
  writeData('kos.json', newList);

  const favoritList = readData('favorit.json');
  const newFav = favoritList.filter(f => f.kos_id !== Number(req.params.id));
  writeData('favorit.json', newFav);

  res.redirect('/admin');
});

// === USER (login dengan role apapun): favorit ===
router.get('/favorit', requireLogin, (req, res) => {
  const user = getCurrentUser(req);
  const favoritList = readData('favorit.json');
  const kosList = readData('kos.json');

  const userFav = favoritList
    .filter(f => f.user_id === user.id)
    .map(f => {
      const kos = kosList.find(k => k.id === f.kos_id);
      return kos ? { favorit_id: f.id, kos } : null;
    })
    .filter(Boolean);

  res.render('favorit', { favoritList: userFav, user });
});

router.post('/favorit/tambah/:kosId', requireLogin, (req, res) => {
  const user = getCurrentUser(req);
  const favoritList = readData('favorit.json');
  const kosId = Number(req.params.kosId);

  const exists = favoritList.find(f => f.user_id === user.id && f.kos_id === kosId);
  if (!exists) {
    favoritList.push({
      id: getNextId(favoritList),
      user_id: user.id,
      kos_id: kosId,
      createdAt: new Date().toISOString()
    });
    writeData('favorit.json', favoritList);
  }

  // redirect ke referer atau ke beranda
  res.redirect(req.get('Referrer') || '/');
});

router.post('/favorit/hapus/:id', requireLogin, (req, res) => {
  const favoritList = readData('favorit.json');
  const newList = favoritList.filter(f => f.id !== Number(req.params.id));
  writeData('favorit.json', newList);
  res.redirect('/favorit');
});

// === LOGIN ===
router.get('/login', (req, res) => {
  res.render('login', { error: null, user: getCurrentUser(req) });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readData('users.json');
  const user = users.find(u =>
    (u.username === username || u.email === username) && u.password === password
  );

  if (!user) {
    return res.render('login', { error: 'Username atau password salah', user: null });
  }

  const { password: _, ...safeUser } = user;
  req.session.user = safeUser;

  // Redirect admin ke /admin, user biasa ke beranda
  if (safeUser.role === 'admin') {
    res.redirect('/admin');
  } else {
    res.redirect('/');
  }
});

// === REGISTER (hanya untuk user biasa) ===
router.get('/register', (req, res) => {
  res.render('register', { error: null, user: getCurrentUser(req) });
});

router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.render('register', { error: 'Semua field wajib diisi', user: null });
  }

  const users = readData('users.json');
  if (users.find(u => u.username === username)) {
    return res.render('register', { error: 'Username sudah terdaftar', user: null });
  }
  if (users.find(u => u.email === email)) {
    return res.render('register', { error: 'Email sudah terdaftar', user: null });
  }

  // Register publik selalu jadi user biasa, bukan admin
  const newUser = {
    id: getNextId(users),
    username,
    email,
    password,
    role: 'user',
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  writeData('users.json', users);

  const { password: _, ...safeUser } = newUser;
  req.session.user = safeUser;
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// === HALAMAN ADMIN (admin only) ===
router.get('/admin', requireAdmin, (req, res) => {
  const kosList = readData('kos.json');
  const users = readData('users.json').map(({ password, ...u }) => u);
  res.render('admin', { kosList, users, user: getCurrentUser(req) });
});

module.exports = router;
