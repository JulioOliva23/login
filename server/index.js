import { app } from './app.js';
import { db } from './db.js';

const PORT = process.env.PORT || 3000;

// Limpieza periódica de sesiones expiradas
setInterval(() => {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
}, 60 * 60 * 1000).unref();

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
