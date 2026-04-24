const { query } = require('../../../_lib/db');
const { withGerente } = require('../../../_lib/helpers');

module.exports = withGerente(async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).end();
  const { id } = req.query;
  try {
    const { rows: [hotel] } = await query('SELECT * FROM hoteles WHERE id = $1', [id]);
    if (!hotel) return res.status(404).json({ error: 'Hotel no encontrado' });
    const { rows: [updated] } = await query(
      'UPDATE hoteles SET activo = $1 WHERE id = $2 RETURNING *',
      [hotel.activo ? 0 : 1, id]
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar hotel' });
  }
});
