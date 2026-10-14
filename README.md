# Login App

[![Tests](https://github.com/JulioOliva23/login/actions/workflows/tests.yml/badge.svg)](https://github.com/JulioOliva23/login/actions/workflows/tests.yml)

Login con frontend, backend y base de datos.

- **Frontend:** HTML, CSS y JavaScript (`public/`)
- **Backend:** Node.js + Express (`server/`)
- **Base de datos:** SQLite con el módulo nativo `node:sqlite` (se crea en `data/app.db`)

## Requisitos

Node.js 22.13 o superior.

## Uso

```bash
npm install
npm start        # o: npm run dev (se reinicia al guardar)
```

Abre http://localhost:3000

## API

| Método | Ruta            | Descripción                        |
|--------|-----------------|------------------------------------|
| POST   | `/api/register` | `{ name, email, password }`        |
| POST   | `/api/login`    | `{ email, password }`              |
| POST   | `/api/logout`   | Cierra la sesión actual            |
| GET    | `/api/me`       | Devuelve el usuario autenticado    |

## Seguridad

- Contraseñas con hash `scrypt` y salt aleatorio.
- Sesiones guardadas en la BD, enviadas en una cookie `httpOnly` y `SameSite=Lax` (`Secure` con `NODE_ENV=production`).
- Límite de 10 intentos de login por IP cada 15 minutos.

## Tests y hooks

```bash
npm test
```

Los tests están en `test/` y usan `node:test`, sin dependencias extra.

**Hooks de Claude Code** (`.claude/settings.json`):

- **Stop**: al terminar cada respuesta, Claude ejecuta `npm test`. Si algún test falla, no puede terminar: recibe el error y debe arreglar el código. Tiene un máximo de 5 intentos para no quedarse en bucle.
- **PreToolUse en `git push`**: antes de cualquier push que haga Claude se ejecutan los tests. Si fallan, el push se bloquea hasta que estén arreglados.

**Git hook** (`.githooks/pre-push`): cuando haces push tú mismo, también se ejecutan los tests y el push se cancela si fallan. `npm install` lo activa automáticamente mediante el script `prepare`.

**GitHub Actions** (`.github/workflows/tests.yml`): los tests se ejecutan en cada push y en cada pull request, con Node 22 y 24. En el resumen de cada ejecución hay una tabla con los tests aprobados ✅ y fallidos ❌, junto con el error de cada fallo. Los fallos también se marcan como anotaciones en la línea del test.
