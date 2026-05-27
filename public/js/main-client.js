// main-client.js
// Client-side JavaScript untuk halaman Main Screen (Beranda).
// Mendemonstrasikan penggunaan Fetch API untuk konsumsi REST API
// secara dinamis tanpa reload halaman.

(function () {
  'use strict';

  // ===== Format harga ke Rupiah =====
  function formatRupiah(angka) {
    return 'Rp ' + Number(angka).toLocaleString('id-ID');
  }

  // ===== Render kartu kos =====
  function renderKosCard(kos) {
    const jenisClass = 'badge-' + kos.jenis_kos;
    const jenisLabel = kos.jenis_kos.toUpperCase();
    const favBtn = window.__currentUserRole === 'user'
      ? `<form action="/favorit/tambah/${kos.id}" method="POST" style="display:inline">
           <button type="submit" class="btn btn-fav btn-sm">♥ Favorit</button>
         </form>`
      : '';

    return `
      <div class="card">
        <img src="${kos.foto}" alt="${escapeHtml(kos.nama_kos)}" class="card-img">
        <div class="card-body">
          <span class="badge ${jenisClass}">${jenisLabel}</span>
          <h3>${escapeHtml(kos.nama_kos)}</h3>
          <p class="card-location">📍 ${escapeHtml(kos.alamat)}, ${escapeHtml(kos.lokasi)}</p>
          <p class="card-price">${formatRupiah(kos.harga)} <span>/bulan</span></p>
          <div class="card-actions">
            <a href="/kos/${kos.id}" class="btn btn-primary btn-sm">Lihat Detail</a>
            ${favBtn}
          </div>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ===== Instant Search (debounce) =====
  let debounceTimer = null;

  function debouncedFetchKos() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchKosFromAPI, 350);
  }

  // ===== Fetch data kos dari REST API berdasarkan filter =====
  async function fetchKosFromAPI() {
    const searchEl = document.querySelector('input[name="search"]');
    const lokasiEl = document.querySelector('select[name="lokasi"]');
    const jenisEl = document.querySelector('select[name="jenis_kos"]');
    const hargaEl = document.querySelector('input[name="harga_max"]');
    const listContainer = document.querySelector('.kos-list .grid');
    const countEl = document.querySelector('.kos-list h2');

    if (!listContainer) return;

    // Bangun query string
    const params = new URLSearchParams();
    if (searchEl && searchEl.value.trim()) params.append('search', searchEl.value.trim());
    if (lokasiEl && lokasiEl.value) params.append('lokasi', lokasiEl.value);
    if (jenisEl && jenisEl.value) params.append('jenis_kos', jenisEl.value);
    if (hargaEl && hargaEl.value) params.append('harga_max', hargaEl.value);

    // Tampilkan loading
    listContainer.innerHTML = '<div class="loading">Memuat data...</div>';

    try {
      const url = '/api/kos' + (params.toString() ? '?' + params.toString() : '');
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      const result = await response.json();

      if (countEl) {
        countEl.textContent = 'Daftar Kos (' + result.total + ')';
      }

      if (!result.data || result.data.length === 0) {
        listContainer.parentNode.querySelector('.grid').outerHTML =
          '<div class="empty">Tidak ada kos yang cocok dengan pencarian Anda.</div>';
        // Set ulang reference
        const empty = document.querySelector('.empty');
        // bila empty muncul, kembalikan grid container next time
        return;
      }

      const html = result.data.map(renderKosCard).join('');
      listContainer.innerHTML = html;
    } catch (err) {
      console.error('Gagal fetch data kos:', err);
      listContainer.innerHTML = '<div class="empty">Gagal memuat data. Coba refresh halaman.</div>';
    }
  }

  // ===== Inisialisasi =====
  document.addEventListener('DOMContentLoaded', function () {
    // Format harga di card yang sudah di-render server-side (consistency check)
    document.querySelectorAll('.card-price').forEach(function (el) {
      const m = el.textContent.match(/Rp\s*([\d.,]+)/);
      if (m) {
        const num = parseInt(m[1].replace(/[.,]/g, ''), 10);
        if (!isNaN(num)) {
          // Sudah benar dari server, skip
        }
      }
    });

    // Pasang instant search di input pencarian
    const searchInput = document.querySelector('.filter-form input[name="search"]');
    if (searchInput) {
      searchInput.addEventListener('input', debouncedFetchKos);
    }

    // Pasang listener di dropdown filter (langsung trigger, tanpa debounce)
    const filterSelects = document.querySelectorAll('.filter-form select');
    filterSelects.forEach(function (sel) {
      sel.addEventListener('change', fetchKosFromAPI);
    });

    const hargaInput = document.querySelector('.filter-form input[name="harga_max"]');
    if (hargaInput) {
      hargaInput.addEventListener('input', debouncedFetchKos);
    }
  });
})();
