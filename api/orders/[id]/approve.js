const { query } = require('../../_lib/db');
const { withGerente } = require('../../_lib/helpers');

async function getOrderWithItems(id) {
  const { rows: [order] } = await query('SELECT * FROM ordenes WHERE id = $1', [id]);
  if (!order) return null;
  const { rows: items } = await query('SELECT * FROM orden_items WHERE orden_id = $1 ORDER BY id', [id]);
  return { ...order, items };
}

module.exports = withGerente(async (req, res) => {
  if (req.method !== 'PUT') return res.status(405).end();

  const { id } = req.query;
  const { firma_gerente, notas } = req.body || {};

  if (!firma_gerente || firma_gerente.trim() === '') {
    return res.status(400).json({ error: 'La firma del gerente es requerida' });
  }

  try {
    const { rows: [order] } = await query('SELECT * FROM ordenes WHERE id = $1', [id]);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (order.estado !== 'PENDIENTE') return res.status(400).json({ error: 'Solo se pueden aprobar órdenes en estado PENDIENTE' });

    await query(
      `UPDATE ordenes SET estado='APROBADA', gerente_id=$1, gerente_nombre=$2, firma_gerente=$3, notas=$4 WHERE id=$5`,
      [req.user.id, req.user.nombre, firma_gerente.trim(), notas || null, id]
    );

    const updated = await getOrderWithItems(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al aprobar la orden' });
  }
});
