const form = document.getElementById('auth-form');
const title = document.getElementById('title');
const submit = document.getElementById('submit');
const errorEl = document.getElementById('error');
const nameField = document.querySelector('.register-only');
const passwordInput = form.elements.password;
let mode = 'login';

// Si ya hay sesión, ir directo al panel
fetch('/api/me').then((res) => { if (res.ok) location.replace('/dashboard.html'); });

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
});

function setMode(next) {
  mode = next;
  const isRegister = mode === 'register';
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === mode));
  nameField.hidden = !isRegister;
  title.textContent = isRegister ? 'Crear cuenta' : 'Iniciar sesión';
  submit.textContent = isRegister ? 'Registrarme' : 'Entrar';
  passwordInput.autocomplete = isRegister ? 'new-password' : 'current-password';
  showError('');
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');

  const data = Object.fromEntries(new FormData(form));
  if (mode === 'login') delete data.name;

  submit.disabled = true;
  try {
    const res = await fetch(`/api/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return location.replace('/dashboard.html');
    const body = await res.json().catch(() => ({}));
    showError(body.error || 'Algo salió mal');
  } catch {
    showError('No se pudo conectar con el servidor');
  } finally {
    submit.disabled = false;
  }
});
