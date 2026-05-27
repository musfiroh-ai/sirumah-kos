const express = require('express');
const router = express.Router();
const { readData, writeData, getNextId } = require('../utils/storage');
const upload = require('../utils/upload');

// GET /api/kos - daftar semua kos + filter & search
router.get('/', (req, res) => {
  let kosList = readData('kos.json');
  const { search, lokasi, jenis_kos, harga_min, harga_max } = req.query;

  if (search) {
    const q = search.toLowerCase();
    kosList = kosList.filter(k =>
      k.nama_kos.toLowerCase().includes(q) ||
      k.alamat.toLowerCase().includes(q) ||
      k.lokasi.toLowerCase().includes(q)
    );
  }
  if (lokasi) {
    kosList = kosList.filter(k => k.lokasi.toLowerCase() === lokasi.toLowerCase());
  }
  if (jenis_kos) {
    kosList = kosList.filter(k => k.jenis_kos.toLowerCase() === jenis_kos.toLowerCase());
  }
  if (harga_min) {
    kosList = kosList.filter(k => k.harga >= Number(harga_min));
  }
  if (harga_max) {
    kosList = kosList.filter(k => k.harga <= Number(harga_max));
  }

  res.json({
    status: 'success',
    total: kosList.length,
    data: kosList
  });
});

// GET /api/kos/:id - detail kos
router.get('/:id', (req, res) => {
  const kosList = readData('kos.json');
  const kos = kosList.find(k => k.id === Number(req.params.id));

  if (!kos) {
    return res.status(404).json({ status: 'error', message: 'Kos tidak ditemukan' });
  }

  res.json({ status: 'success', data: kos });
});

// POST /api/kos - tambah kos (support JSON body atau form-data dengan upload file)
router.post('/', upload.single('foto_file'), (req, res) => {
  const { nama_kos, alamat, lokasi, harga, jenis_kos, fasilitas, deskripsi, kontak, foto } = req.body;

  if (!nama_kos || !alamat || !lokasi || !harga || !jenis_kos) {
    return res.status(400).json({
      status: 'error',
      message: 'Field nama_kos, alamat, lokasi, harga, dan jenis_kos wajib diisi'
    });
  }

  // Tentukan foto: upload > URL > placeholder
  let fotoFinal;
  if (req.file) {
    fotoFinal = '/uploads/' + req.file.filename;
  } else if (foto) {
    fotoFinal = foto;
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
    fasilitas: Array.isArray(fasilitas)
      ? fasilitas
      : (typeof fasilitas === 'string' ? fasilitas.split(',').map(s => s.trim()).filter(Boolean) : []),
    deskripsi: deskripsi || '',
    kontak: kontak || '',
    foto: fotoFinal
  };

  kosList.push(newKos);
  writeData('kos.json', kosList);

  res.status(201).json({ status: 'success', message: 'Kos berhasil ditambahkan', data: newKos });
});

// PUT /api/kos/:id - update kos
router.put('/:id', (req, res) => {
  const kosList = readData('kos.json');
  const index = kosList.findIndex(k => k.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ status: 'error', message: 'Kos tidak ditemukan' });
  }

  const { nama_kos, alamat, lokasi, harga, jenis_kos, fasilitas, deskripsi, kontak, foto } = req.body;
  const updated = { ...kosList[index] };

  if (nama_kos !== undefined) updated.nama_kos = nama_kos;
  if (alamat !== undefined) updated.alamat = alamat;
  if (lokasi !== undefined) updated.lokasi = lokasi;
  if (harga !== undefined) updated.harga = Number(harga);
  if (jenis_kos !== undefined) updated.jenis_kos = jenis_kos;
  if (fasilitas !== undefined) {
    updated.fasilitas = Array.isArray(fasilitas)
      ? fasilitas
      : (typeof fasilitas === 'string' ? fasilitas.split(',').map(s => s.trim()).filter(Boolean) : []);
  }
  if (deskripsi !== undefined) updated.deskripsi = deskripsi;
  if (kontak !== undefined) updated.kontak = kontak;
  if (foto !== undefined) updated.foto = foto;

  kosList[index] = updated;
  writeData('kos.json', kosList);

  res.json({ status: 'success', message: 'Kos berhasil diupdate', data: updated });
});

// DELETE /api/kos/:id - hapus kos
router.delete('/:id', (req, res) => {
  const kosList = readData('kos.json');
  const index = kosList.findIndex(k => k.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ status: 'error', message: 'Kos tidak ditemukan' });
  }

  const deleted = kosList.splice(index, 1)[0];
  writeData('kos.json', kosList);

  // Bersihkan juga dari favorit
  const favoritList = readData('favorit.json');
  const newFavorit = favoritList.filter(f => f.kos_id !== deleted.id);
  writeData('favorit.json', newFavorit);

  res.json({ status: 'success', message: 'Kos berhasil dihapus', data: deleted });
});

module.exports = router;
