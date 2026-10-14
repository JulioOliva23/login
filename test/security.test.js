import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
const { app } = await import('../server/app.js');
const { db } = await import('../server/db.js');

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());

function post(path, body) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const user = { name: 'Luis', email: 'luis@test.com', password: 'secreto123' };

test('la cookie de sesión es HttpOnly y SameSite=Lax', async () => {
  const res = await post('/register', user);
  assert.equal(res.status, 201);
  const cookie = res.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
});

test('la contraseña se guarda con hash, nunca en texto plano', () => {
  const { password_hash } = db.prepare('SELECT password_hash FROM users WHERE email = ?').get(user.email);
  assert.notEqual(password_hash, user.password);
  assert.match(password_hash, /^[0-9a-f]{32}:[0-9a-f]{128}$/);
});

test('una sesión expirada devuelve 401 y se elimina de la base de datos', async () => {
  const res = await post('/login', { email: user.email, password: user.password });
  const cookie = res.headers.get('set-cookie').split(';')[0];
  const token = cookie.split('=')[1];

  db.prepare('UPDATE sessions SET expires_at = ? WHERE token = ?').run(Date.now() - 1000, token);

  const me = await fetch(`${base}/me`, { headers: { Cookie: cookie } });
  assert.equal(me.status, 401);
  assert.equal(db.prepare('SELECT 1 FROM sessions WHERE token = ?').get(token), undefined);
});

test('el registro rechaza nombres de más de 100 caracteres', async () => {
  const res = await post('/register', { ...user, email: 'largo@test.com', name: 'a'.repeat(101) });
  assert.equal(res.status, 400);
});

test('el login se bloquea con 429 tras 10 intentos fallidos', async () => {
  for (let i = 0; i < 10; i++) {
    const res = await post('/login', { email: user.email, password: 'incorrecta' });
    assert.equal(res.status, 401);
  }
  const res = await post('/login', { email: user.email, password: 'incorrecta' });
  assert.equal(res.status, 429);
});
