const express = require('express');
const router = express.Router();
const { readData, writeData, getNextId } = require('../utils/storage');

// GET /api/favorit/:userId - daftar favorit user
router.get('/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  const favoritList = readData('favorit.json');
  const kosList = readData('kos.json');

  const userFav = favoritList.filter(f => f.user_id === userId);
  const result = userFav.map(f => {
    const kos = kosList.find(k => k.id === f.kos_id);
    return { favorit_id: f.id, user_id: f.user_id, kos };
  }).filter(item => item.kos); // skip jika kos sudah dihapus

  res.json({ status: 'success', total: result.length, data: result });
});

// POST /api/favorit - tambah favorit
router.post('/', (req, res) => {
  const { user_id, kos_id } = req.body;

  if (!user_id || !kos_id) {
    return res.status(400).json({
      status: 'error',
      message: 'user_id dan kos_id wajib diisi'
    });
  }

  const users = readData('users.json');
  const kosList = readData('kos.json');
  const favoritList = readData('favorit.json');

  if (!users.find(u => u.id === Number(user_id))) {
    return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
  }
  if (!kosList.find(k => k.id === Number(kos_id))) {
    return res.status(404).json({ status: 'error', message: 'Kos tidak ditemukan' });
  }

  const exists = favoritList.find(
    f => f.user_id === Number(user_id) && f.kos_id === Number(kos_id)
  );
  if (exists) {
    return res.status(400).json({ status: 'error', message: 'Kos sudah ada di favorit' });
  }

  const newFav = {
    id: getNextId(favoritList),
    user_id: Number(user_id),
    kos_id: Number(kos_id),
    createdAt: new Date().toISOString()
  };

  favoritList.push(newFav);
  writeData('favorit.json', favoritList);

  res.status(201).json({
    status: 'success',
    message: 'Berhasil ditambahkan ke favorit',
    data: newFav
  });
});

// DELETE /api/favorit/:id - hapus favorit
router.delete('/:id', (req, res) => {
  const favoritList = readData('favorit.json');
  const index = favoritList.findIndex(f => f.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ status: 'error', message: 'Favorit tidak ditemukan' });
  }

  const deleted = favoritList.splice(index, 1)[0];
  writeData('favorit.json', favoritList);

  res.json({ status: 'success', message: 'Favorit berhasil dihapus', data: deleted });
});

module.exports = router;
