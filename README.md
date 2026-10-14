# Login App

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
