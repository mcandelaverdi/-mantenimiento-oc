const { query } = require('../_lib/db');
const { withAuth } = require('../_lib/helpers');

async function generateOrderNumber() {
  const { rows } = await query('SELECT id FROM ordenes ORDER BY id DESC LIMIT 1');
  const nextId = rows.length > 0 ? rows[0].id + 1 : 1;
  return 'OC-' + String(nextId).padStart(4, '0');
}

async function getOrderWithItems(id) {
  const { rows: [order] } = await query('SELECT * FROM ordenes WHERE id = $1', [id]);
  if (!order) return null;
  const { rows: items } = await query('SELECT * FROM orden_items WHERE orden_id = $1 ORDER BY id', [id]);
  return { ...order, items };
}

module.exports = withAuth(async (req, res) => {
  // GET /api/orders
  if (req.method === 'GET') {
    try {
      const { rows: orders } = await query('SELECT * FROM ordenes ORDER BY created_at DESC');
      const ordersWithItems = await Promise.all(orders.map(async o => {
        const { rows: items } = await query('SELECT * FROM orden_items WHERE orden_id = $1 ORDER BY id', [o.id]);
        return { ...o, items };
      }));
      return res.json(ordersWithItems);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener las órdenes' });
    }
  }

  // POST /api/orders
  if (req.method === 'POST') {
    const { hotel, proveedor_id, firma_encargado, items } = req.body || {};

    if (!hotel) return res.status(400).json({ error: 'El hotel es requerido' });
    if (!proveedor_id) return res.status(400).json({ error: 'El proveedor es requerido' });
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Se requiere al menos un producto' });
    if (!firma_encargado) return res.status(400).json({ error: 'La firma del encargado es requerida' });

    try {
      const { rows: [proveedor] } = await query('SELECT * FROM proveedores WHERE id = $1', [proveedor_id]);
      if (!proveedor) return res.status(400).json({ error: 'Proveedor no encontrado' });

      const numero = await generateOrderNumber();
      const fecha = new Date().toISOString().split('T')[0];

      const { rows: [newOrder] } = await query(
        `INSERT INTO ordenes (numero, hotel, proveedor_id, proveedor_nombre, fecha, estado, encargado_id, encargado_nombre, firma_encargado)
         VALUES ($1,$2,$3,$4,$5,'PENDIENTE',$6,$7,$8) RETURNING id`,
        [numero, hotel, proveedor_id, proveedor.nombre, fecha, req.user.id, req.user.nombre, firma_encargado]
      );

      const orderId = newOrder.id;
      for (const item of items) {
        await query(
          'INSERT INTO orden_items (orden_id, producto_nombre, cantidad, habitacion, motivo) VALUES ($1,$2,$3,$4,$5)',
          [orderId, item.producto_nombre, item.cantidad, item.habitacion || '', item.motivo || '']
        );
      }

      const order = await getOrderWithItems(orderId);
      return res.status(201).json(order);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al crear la orden' });
    }
  }

  res.status(405).end();
});
