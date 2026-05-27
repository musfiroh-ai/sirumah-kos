// tests/testHelper.js
// Helper untuk backup dan restore data JSON sebelum/sesudah test
// supaya test tidak merusak data asli.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(__dirname, '__backup__');

const DATA_FILES = ['kos.json', 'users.json', 'favorit.json'];

function backupData() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  DATA_FILES.forEach(file => {
    const src = path.join(DATA_DIR, file);
    const dest = path.join(BACKUP_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
}

function restoreData() {
  DATA_FILES.forEach(file => {
    const src = path.join(BACKUP_DIR, file);
    const dest = path.join(DATA_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
}

module.exports = { backupData, restoreData };
