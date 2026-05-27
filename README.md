# SIRUMAH KOS

Sistem Informasi Pencarian Kos berbasis Web Service.
Project Teknologi Web Service - dibangun dengan Node.js + Express + EJS.

## Fitur

- Website lengkap untuk pengguna (beranda, detail, favorit, login/register, admin)
- REST API yang bisa diuji dengan Postman
- CRUD data kos (Create, Read, Update, Delete)
- Search & filter berdasarkan lokasi, harga, jenis, dan keyword
- Register & login user (session-based untuk web)
- Favorit kos per user
- Halaman admin sederhana untuk mengelola data kos
- Data disimpan di file JSON (tidak butuh database)

## Struktur Folder

```
sirumah-kos/
├── index.js               # File utama Express server
├── package.json
├── .replit                # Konfigurasi Replit
├── data/
│   ├── kos.json           # Data kos
│   ├── users.json         # Data user
│   └── favorit.json       # Data favorit
├── routes/
│   ├── web.js             # Routes untuk halaman web
│   ├── kosApi.js          # Endpoint API CRUD kos
│   ├── authApi.js         # Endpoint API register & login
│   └── favoritApi.js      # Endpoint API favorit
├── utils/
│   └── storage.js         # Helper baca/tulis JSON
├── views/                 # Halaman EJS
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── index.ejs          # Beranda + daftar kos
│   ├── detail.ejs         # Detail kos
│   ├── tambah.ejs         # Form tambah kos
│   ├── edit.ejs           # Form edit kos
│   ├── favorit.ejs        # Daftar favorit
│   ├── login.ejs          # Halaman login
│   ├── register.ejs       # Halaman register
│   ├── admin.ejs          # Halaman admin
│   └── error.ejs
└── public/
    └── css/
        └── style.css      # Styling
```

## Menjalankan di Replit

1. Buat Replit baru, pilih template **Node.js**.
2. Upload semua file dari project ini, atau gunakan fitur **Import from GitHub** kalau sudah dipush ke repo.
3. Klik tombol **Run** di Replit. Replit akan otomatis menjalankan `npm install && npm start` (sudah diatur di file `.replit`).
4. Setelah server jalan, akan muncul window preview di Replit dengan URL publik (contoh: `https://sirumah-kos.namauser.repl.co`).
5. Buka URL itu di browser untuk melihat website-nya.
6. Untuk Postman, gunakan URL Replit yang sama + path `/api/...`.

## Menjalankan di Komputer Lokal

```bash
npm install
npm start
```

Server akan berjalan di `http://localhost:3000`.

## Halaman Web

| Halaman | URL |
|---------|-----|
| Beranda / Daftar Kos | `/` |
| Detail Kos | `/kos/:id` |
| Tambah Kos | `/tambah-kos` (perlu login) |
| Edit Kos | `/edit-kos/:id` (perlu login) |
| Favorit | `/favorit` (perlu login) |
| Login | `/login` |
| Register | `/register` |
| Admin | `/admin` (perlu login) |

## Endpoint REST API (untuk Postman)

Base URL lokal: `http://localhost:3000`

### Info API
- **GET** `/api` — informasi API & daftar endpoint

### Kos
- **GET** `/api/kos` — daftar semua kos
  - Query opsional: `search`, `lokasi`, `jenis_kos`, `harga_min`, `harga_max`
  - Contoh: `/api/kos?lokasi=Semarang&jenis_kos=putri&harga_max=1000000`
- **GET** `/api/kos/:id` — detail kos
- **POST** `/api/kos` — tambah kos
  ```json
  {
    "nama_kos": "Kos Bahagia",
    "alamat": "Jl. Bahagia No. 5",
    "lokasi": "Yogyakarta",
    "harga": 800000,
    "jenis_kos": "putra",
    "fasilitas": ["WiFi", "AC", "Kasur"],
    "deskripsi": "Kos nyaman dekat kampus",
    "kontak": "081234567890",
    "foto": "https://example.com/foto.jpg"
  }
  ```
- **PUT** `/api/kos/:id` — update kos (body sama seperti POST, partial update didukung)
- **DELETE** `/api/kos/:id` — hapus kos

### Auth
- **POST** `/api/register`
  ```json
  { "username": "andi", "email": "andi@mail.com", "password": "rahasia" }
  ```
- **POST** `/api/login`
  ```json
  { "username": "andi", "password": "rahasia" }
  ```

### Favorit
- **GET** `/api/favorit/:userId` — daftar favorit user
- **POST** `/api/favorit`
  ```json
  { "user_id": 1, "kos_id": 2 }
  ```
- **DELETE** `/api/favorit/:id` — hapus favorit (id favorit, bukan id kos)

## Contoh Pengujian di Postman

1. **GET** `http://localhost:3000/api/kos` → lihat semua kos
2. **POST** `http://localhost:3000/api/register` dengan body JSON → daftar user baru
3. **POST** `http://localhost:3000/api/login` → login
4. **POST** `http://localhost:3000/api/favorit` dengan body `{"user_id": 1, "kos_id": 1}` → tambah favorit
5. **GET** `http://localhost:3000/api/favorit/1` → lihat favorit user id 1

> Pastikan di Postman setting **Body → raw → JSON** untuk request POST/PUT.

## Catatan

- Password disimpan **plain text** untuk kesederhanaan (project akademik). Di aplikasi nyata, gunakan **bcrypt** atau library hashing lain.
- Data disimpan di file JSON, sehingga akan tetap persisten meskipun server di-restart.
- Di Replit, perubahan file JSON juga akan persisten selama Repl tidak di-reset.
