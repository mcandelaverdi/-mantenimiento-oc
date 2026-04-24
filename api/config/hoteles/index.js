const { query } = require('../../_lib/db');
const { withAuth, withGerente } = require('../../_lib/helpers');

module.exports = withAuth(async (req, res) => {
  if (req.method === 'GET') {
    try {
      const { rows } = await query('SELECT * FROM hoteles ORDER BY nombre');
      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: 'Error al obtener hoteles' });
    }
  }

  if (req.method === 'POST') {
    if (req.user.rol !== 'gerente') return res.status(403).json({ error: 'Solo para gerentes' });
    const { nombre } = req.body || {};
    if (!nombre || nombre.trim() === '') return res.status(400).json({ error: 'El nombre es requerido' });
    try {
      const { rows: [hotel] } = await query(
        'INSERT INTO hoteles (nombre) VALUES ($1) RETURNING *',
        [nombre.trim().toUpperCase()]
      );
      return res.status(201).json(hotel);
    } catch (err) {
      if (err.code === '23505') return res.status(400).json({ error: 'Ya existe un hotel con ese nombre' });
      return res.status(500).json({ error: 'Error al crear hotel' });
    }
  }

  res.status(405).end();
});
