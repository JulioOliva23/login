import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
const { app } = await import('../server/app.js');

let server;
let base;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());

function post(path, body, cookie) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
    body: JSON.stringify(body),
  });
}

function sessionCookie(res) {
  return res.headers.get('set-cookie')?.split(';')[0];
}

const user = { name: 'Ana', email: 'ana@test.com', password: 'secreto123' };

test('registro crea el usuario e inicia sesión', async () => {
  const res = await post('/register', user);
  assert.equal(res.status, 201);
  const cookie = sessionCookie(res);
  assert.match(cookie, /^sid=/);

  const me = await fetch(`${base}/me`, { headers: { Cookie: cookie } });
  assert.equal(me.status, 200);
  const { user: data } = await me.json();
  assert.equal(data.email, user.email);
  assert.equal(data.password_hash, undefined);
});

test('registro rechaza email duplicado sin importar mayúsculas', async () => {
  const res = await post('/register', { ...user, email: 'ANA@test.com' });
  assert.equal(res.status, 409);
});

test('registro valida los campos', async () => {
  assert.equal((await post('/register', { ...user, name: '' })).status, 400);
  assert.equal((await post('/register', { ...user, email: 'no-es-email' })).status, 400);
  assert.equal((await post('/register', { ...user, email: 'b@test.com', password: 'corta' })).status, 400);
});

test('login con contraseña incorrecta devuelve 401', async () => {
  const res = await post('/login', { email: user.email, password: 'incorrecta' });
  assert.equal(res.status, 401);
});

test('login con usuario inexistente devuelve 401', async () => {
  const res = await post('/login', { email: 'nadie@test.com', password: 'secreto123' });
  assert.equal(res.status, 401);
});

test('login correcto, /me y logout', async () => {
  const res = await post('/login', { email: user.email, password: user.password });
  assert.equal(res.status, 200);
  const cookie = sessionCookie(res);

  assert.equal((await fetch(`${base}/me`, { headers: { Cookie: cookie } })).status, 200);
  assert.equal((await post('/logout', {}, cookie)).status, 200);
  assert.equal((await fetch(`${base}/me`, { headers: { Cookie: cookie } })).status, 401);
});

test('/me sin sesión devuelve 401', async () => {
  assert.equal((await fetch(`${base}/me`)).status, 401);
});
