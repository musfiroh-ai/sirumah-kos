const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const kosApi = require('./routes/kosApi');
const authApi = require('./routes/authApi');
const favoritApi = require('./routes/favoritApi');
const webRoutes = require('./routes/web');

const app = express();
const PORT = process.env.PORT || 3000;

// Deteksi logo custom (dijalankan sekali di startup)
function detectLogo() {
  const imagesDir = path.join(__dirname, 'public', 'images');
  const candidates = ['logo.png', 'logo.jpg', 'logo.jpeg', 'logo.svg', 'logo.webp'];
  for (const file of candidates) {
    if (fs.existsSync(path.join(imagesDir, file))) {
      return '/images/' + file;
    }
  }
  return null; // tidak ada logo, pakai emoji fallback
}
const logoPath = detectLogo();
console.log(logoPath ? `Logo terdeteksi: ${logoPath}` : 'Tidak ada logo custom, pakai emoji default');

// Middleware untuk menyediakan logoPath ke semua view
app.use((req, res, next) => {
  res.locals.logoPath = logoPath;
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'sirumah-kos-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 hari
    // di production (HTTPS), proxy = true biar Express percaya header dari Railway
  }
}));
app.set('trust proxy', 1); // wajib kalau di belakang reverse proxy (Railway, Render, dll)

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ===== API ROOT =====
app.get('/api', (req, res) => {
  res.json({
    status: 'success',
    message: 'Selamat datang di REST API SIRUMAH KOS',
    version: '1.0.0',
    endpoints: {
      kos: {
        'GET /api/kos': 'Daftar kos (mendukung query: search, lokasi, jenis_kos, harga_min, harga_max)',
        'GET /api/kos/:id': 'Detail kos berdasarkan id',
        'POST /api/kos': 'Tambah kos baru',
        'PUT /api/kos/:id': 'Update kos',
        'DELETE /api/kos/:id': 'Hapus kos'
      },
      auth: {
        'POST /api/register': 'Registrasi user (body: username, email, password)',
        'POST /api/login': 'Login user (body: username, password)'
      },
      favorit: {
        'GET /api/favorit/:userId': 'Daftar favorit user',
        'POST /api/favorit': 'Tambah favorit (body: user_id, kos_id)',
        'DELETE /api/favorit/:id': 'Hapus favorit'
      }
    }
  });
});

// ===== API ROUTES =====
app.use('/api/kos', kosApi);
app.use('/api', authApi);
app.use('/api/favorit', favoritApi);

// ===== WEB ROUTES =====
app.use('/', webRoutes);

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ status: 'error', message: 'Endpoint tidak ditemukan' });
  }
  res.status(404).render('error', { message: 'Halaman tidak ditemukan', user: req.session.user || null });
});

// Error handler (untuk multer dan error lain)
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const user = req.session && req.session.user ? req.session.user : null;
  let message = 'Terjadi kesalahan saat memproses permintaan.';

  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'Ukuran file terlalu besar. Maksimal 5MB.';
  } else if (err.message && err.message.includes('Hanya file gambar')) {
    message = err.message;
  }

  if (req.path.startsWith('/api')) {
    return res.status(400).json({ status: 'error', message });
  }
  res.status(400).render('error', { message, user });
});

// Jalankan server hanya jika file ini dijalankan langsung (bukan di-require oleh test)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('===========================================');
    console.log('  SIRUMAH KOS - Sistem Informasi Kos');
    console.log('===========================================');
    console.log(`  Server berjalan di: http://localhost:${PORT}`);
    console.log(`  REST API           : http://localhost:${PORT}/api`);
    console.log('===========================================');
  });
}

module.exports = app;
