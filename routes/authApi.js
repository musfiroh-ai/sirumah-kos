const express = require('express');
const router = express.Router();
const { readData, writeData, getNextId } = require('../utils/storage');

// POST /api/register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Username, email, dan password wajib diisi'
    });
  }

  const users = readData('users.json');

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ status: 'error', message: 'Username sudah terdaftar' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar' });
  }

  const newUser = {
    id: getNextId(users),
    username,
    email,
    password, // catatan: di project nyata, password harus di-hash (bcrypt)
    role: 'user',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeData('users.json', users);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({
    status: 'success',
    message: 'Registrasi berhasil',
    data: safeUser
  });
});

// POST /api/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Username dan password wajib diisi'
    });
  }

  const users = readData('users.json');
  const user = users.find(u =>
    (u.username === username || u.email === username) && u.password === password
  );

  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Username atau password salah' });
  }

  const { password: _, ...safeUser } = user;
  res.json({
    status: 'success',
    message: 'Login berhasil',
    data: safeUser
  });
});

module.exports = router;
