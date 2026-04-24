const { query } = require('../../_lib/db');
const { withAuth, withGerente } = require('../../_lib/helpers');

async function getOrderWithItems(id) {
  const { rows: [order] } = await query('SELECT * FROM ordenes WHERE id = $1', [id]);
  if (!order) return null;
  const { rows: items } = await query('SELECT * FROM orden_items WHERE orden_id = $1 ORDER BY id', [id]);
  return { ...order, items };
}

module.exports = withAuth(async (req, res) => {
  const { id } = req.query;

  // GET /api/orders/:id
  if (req.method === 'GET') {
    try {
      const order = await getOrderWithItems(id);
      if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
      return res.json(order);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener la orden' });
    }
  }

  // DELETE /api/orders/:id — solo gerente
  if (req.method === 'DELETE') {
    if (req.user.rol !== 'gerente') return res.status(403).json({ error: 'Solo para gerentes' });
    try {
      const { rows } = await query('SELECT id FROM ordenes WHERE id = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada' });
      await query('DELETE FROM orden_items WHERE orden_id = $1', [id]);
      await query('DELETE FROM ordenes WHERE id = $1', [id]);
      return res.json({ message: 'Orden eliminada correctamente' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al eliminar la orden' });
    }
  }

  res.status(405).end();
});
