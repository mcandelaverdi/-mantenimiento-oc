const { query } = require('../../_lib/db');
const { withAuth } = require('../../_lib/helpers');

module.exports = withAuth(async (req, res) => {
  if (req.method === 'GET') {
    try {
      const { rows } = await query('SELECT * FROM productos ORDER BY nombre');
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
  }

  if (req.method === 'POST') {
    if (req.user.rol !== 'gerente') return res.status(403).json({ error: 'Solo para gerentes' });
    const { nombre } = req.body || {};
    if (!nombre || nombre.trim() === '') return res.status(400).json({ error: 'El nombre es requerido' });
    try {
      const { rows: [p] } = await query(
        'INSERT INTO productos (nombre) VALUES ($1) RETURNING *',
        [nombre.trim()]
      );
      return res.status(201).json(p);
    } catch (err) {
      return res.status(500).json({ error: 'Error al crear producto' });
    }
  }

  res.status(405).end();
});
