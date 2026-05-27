// auth-client.js
// Client-side validation untuk halaman Login dan Register
// Jalan di browser pengguna (bukan di server)

(function () {
  'use strict';

  // ===== Helper: tampilkan/hapus error inline =====
  function showError(inputEl, message) {
    clearError(inputEl);
    const err = document.createElement('div');
    err.className = 'inline-error';
    err.textContent = message;
    inputEl.parentNode.insertBefore(err, inputEl.nextSibling);
    inputEl.classList.add('input-invalid');
  }

  function clearError(inputEl) {
    const next = inputEl.nextSibling;
    if (next && next.classList && next.classList.contains('inline-error')) {
      next.remove();
    }
    inputEl.classList.remove('input-invalid');
  }

  // ===== Helper: validasi email =====
  function isValidEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  }

  // ===== Form Login =====
  const loginForm = document.querySelector('form[action="/login"]');
  if (loginForm) {
    const usernameInput = loginForm.querySelector('input[name="username"]');
    const passwordInput = loginForm.querySelector('input[name="password"]');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    loginForm.addEventListener('submit', function (e) {
      let valid = true;
      clearError(usernameInput);
      clearError(passwordInput);

      if (!usernameInput.value.trim()) {
        showError(usernameInput, 'Username atau email wajib diisi');
        valid = false;
      }
      if (!passwordInput.value) {
        showError(passwordInput, 'Password wajib diisi');
        valid = false;
      } else if (passwordInput.value.length < 3) {
        showError(passwordInput, 'Password minimal 3 karakter');
        valid = false;
      }

      if (!valid) {
        e.preventDefault();
        return false;
      }

      // Loading indicator
      if (submitBtn) {
        submitBtn.textContent = 'Memproses...';
        submitBtn.disabled = true;
      }
    });
  }

  // ===== Form Register =====
  const registerForm = document.querySelector('form[action="/register"]');
  if (registerForm) {
    const usernameInput = registerForm.querySelector('input[name="username"]');
    const emailInput = registerForm.querySelector('input[name="email"]');
    const passwordInput = registerForm.querySelector('input[name="password"]');
    const submitBtn = registerForm.querySelector('button[type="submit"]');

    // Validasi real-time (saat user mengetik)
    if (emailInput) {
      emailInput.addEventListener('blur', function () {
        if (emailInput.value && !isValidEmail(emailInput.value)) {
          showError(emailInput, 'Format email tidak valid');
        } else {
          clearError(emailInput);
        }
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener('input', function () {
        if (passwordInput.value && passwordInput.value.length < 4) {
          showError(passwordInput, 'Password minimal 4 karakter');
        } else {
          clearError(passwordInput);
        }
      });
    }

    if (usernameInput) {
      usernameInput.addEventListener('blur', function () {
        const val = usernameInput.value.trim();
        if (val && val.length < 3) {
          showError(usernameInput, 'Username minimal 3 karakter');
        } else if (val && !/^[a-zA-Z0-9_]+$/.test(val)) {
          showError(usernameInput, 'Username hanya boleh huruf, angka, atau underscore');
        } else {
          clearError(usernameInput);
        }
      });
    }

    registerForm.addEventListener('submit', function (e) {
      let valid = true;
      clearError(usernameInput);
      clearError(emailInput);
      clearError(passwordInput);

      const username = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!username) {
        showError(usernameInput, 'Username wajib diisi');
        valid = false;
      } else if (username.length < 3) {
        showError(usernameInput, 'Username minimal 3 karakter');
        valid = false;
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showError(usernameInput, 'Username hanya boleh huruf, angka, atau underscore');
        valid = false;
      }

      if (!email) {
        showError(emailInput, 'Email wajib diisi');
        valid = false;
      } else if (!isValidEmail(email)) {
        showError(emailInput, 'Format email tidak valid');
        valid = false;
      }

      if (!password) {
        showError(passwordInput, 'Password wajib diisi');
        valid = false;
      } else if (password.length < 4) {
        showError(passwordInput, 'Password minimal 4 karakter');
        valid = false;
      }

      if (!valid) {
        e.preventDefault();
        return false;
      }

      if (submitBtn) {
        submitBtn.textContent = 'Memproses...';
        submitBtn.disabled = true;
      }
    });
  }
})();
