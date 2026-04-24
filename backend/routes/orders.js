const express = require('express');
const { getDb } = require('../db');
const { authenticate, requireGerente } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

function generateOrderNumber(db) {
  const last = db.prepare('SELECT id FROM ordenes ORDER BY id DESC LIMIT 1').get();
  const nextId = last ? last.id + 1 : 1;
  return 'OC-' + String(nextId).padStart(4, '0');
}

function getOrderWithItems(db, id) {
  const order = db.prepare('SELECT * FROM ordenes WHERE id = ?').get(id);
  if (!order) return null;
  const items = db.prepare('SELECT * FROM orden_items WHERE orden_id = ?').all(id);
  return { ...order, items };
}

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const orders = db.prepare('SELECT * FROM ordenes ORDER BY created_at DESC').all();
    const ordersWithItems = orders.map(order => {
      const items = db.prepare('SELECT * FROM orden_items WHERE orden_id = ?').all(order.id);
      return { ...order, items };
    });
    res.json(ordersWithItems);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Error al obtener las órdenes' });
  }
});

router.post('/', (req, res) => {
  const { hotel, proveedor_id, firma_encargado, items } = req.body;

  if (!hotel) {
    return res.status(400).json({ error: 'El hotel es requerido' });
  }
  if (!proveedor_id) {
    return res.status(400).json({ error: 'El proveedor es requerido' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un producto' });
  }
  if (!firma_encargado) {
    return res.status(400).json({ error: 'La firma del encargado es requerida' });
  }

  try {
    const db = getDb();

    const proveedor = db.prepare('SELECT * FROM proveedores WHERE id = ?').get(proveedor_id);
    if (!proveedor) {
      return res.status(400).json({ error: 'Proveedor no encontrado' });
    }

    const numero = generateOrderNumber(db);
    const fecha = new Date().toISOString().split('T')[0];

    const insertOrder = db.prepare(`
      INSERT INTO ordenes (numero, hotel, proveedor_id, proveedor_nombre, fecha, estado, encargado_id, encargado_nombre, firma_encargado)
      VALUES (?, ?, ?, ?, ?, 'PENDIENTE', ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO orden_items (orden_id, producto_nombre, cantidad, habitacion, motivo)
      VALUES (?, ?, ?, ?, ?)
    `);

    const createOrder = db.transaction(() => {
      const result = insertOrder.run(
        numero,
        hotel,
        proveedor_id,
        proveedor.nombre,
        fecha,
        req.user.id,
        req.user.nombre,
        firma_encargado
      );

      const orderId = result.lastInsertRowid;

      for (const item of items) {
        insertItem.run(
          orderId,
          item.producto_nombre,
          item.cantidad,
          item.habitacion || '',
          item.motivo || ''
        );
      }

      return orderId;
    });

    const orderId = createOrder();
    const order = getOrderWithItems(db, orderId);

    res.status(201).json(order);
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Error al crear la orden' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const order = getOrderWithItems(db, req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.json(order);
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
});

router.put('/:id/approve', requireGerente, (req, res) => {
  const { firma_gerente, notas } = req.body;

  if (!firma_gerente) {
    return res.status(400).json({ error: 'La firma del gerente es requerida' });
  }

  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM ordenes WHERE id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    if (order.estado !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden aprobar órdenes en estado PENDIENTE' });
    }

    db.prepare(`
      UPDATE ordenes
      SET estado = 'APROBADA', gerente_id = ?, gerente_nombre = ?, firma_gerente = ?, notas = ?
      WHERE id = ?
    `).run(req.user.id, req.user.nombre, firma_gerente, notas || null, req.params.id);

    const updatedOrder = getOrderWithItems(db, req.params.id);
    res.json(updatedOrder);
  } catch (err) {
    console.error('Approve order error:', err);
    res.status(500).json({ error: 'Error al aprobar la orden' });
  }
});

router.put('/:id/reject', requireGerente, (req, res) => {
  const { firma_gerente, notas } = req.body;

  if (!firma_gerente) {
    return res.status(400).json({ error: 'La firma del gerente es requerida' });
  }
  if (!notas || notas.trim() === '') {
    return res.status(400).json({ error: 'Las notas son requeridas para rechazar una orden' });
  }

  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM ordenes WHERE id = ?').get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    if (order.estado !== 'PENDIENTE') {
      return res.status(400).json({ error: 'Solo se pueden rechazar órdenes en estado PENDIENTE' });
    }

    db.prepare(`
      UPDATE ordenes
      SET estado = 'RECHAZADA', gerente_id = ?, gerente_nombre = ?, firma_gerente = ?, notas = ?
      WHERE id = ?
    `).run(req.user.id, req.user.nombre, firma_gerente, notas, req.params.id);

    const updatedOrder = getOrderWithItems(db, req.params.id);
    res.json(updatedOrder);
  } catch (err) {
    console.error('Reject order error:', err);
    res.status(500).json({ error: 'Error al rechazar la orden' });
  }
});

router.delete('/:id', requireGerente, (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM ordenes WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    db.prepare('DELETE FROM orden_items WHERE orden_id = ?').run(req.params.id);
    db.prepare('DELETE FROM ordenes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Orden eliminada correctamente' });
  } catch (err) {
    console.error('Delete order error:', err);
    res.status(500).json({ error: 'Error al eliminar la orden' });
  }
});

module.exports = router;
