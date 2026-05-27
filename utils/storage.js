const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readData(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Gagal membaca file:', filename, err.message);
    return [];
  }
}

function writeData(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Gagal menulis file:', filename, err.message);
    return false;
  }
}

function getNextId(arr) {
  if (!arr || arr.length === 0) return 1;
  return Math.max(...arr.map(item => Number(item.id) || 0)) + 1;
}

module.exports = { readData, writeData, getNextId };
