const { query } = require('../../_lib/db');
const { withGerente } = require('../../_lib/helpers');
const bcrypt = require('bcryptjs');

module.exports = withGerente(async (req, res) => {
  if (req.method === 'GET') {
    try {
      const { rows } = await query('SELECT id, nombre, email, rol, created_at FROM usuarios ORDER BY nombre');
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  }

  if (req.method === 'POST') {
    const { nombre, email, password, rol } = req.body || {};
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
    if (!email?.trim()) return res.status(400).json({ error: 'El email es requerido' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    if (!['encargado', 'gerente'].includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
    try {
      const hash = await bcrypt.hash(password, 10);
      const { rows: [u] } = await query(
        'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4) RETURNING id, nombre, email, rol, created_at',
        [nombre.trim(), email.trim().toLowerCase(), hash, rol]
      );
      return res.status(201).json(u);
    } catch (err) {
      if (err.code === '23505') return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
      return res.status(500).json({ error: 'Error al crear usuario' });
    }
  }

  res.status(405).end();
});
