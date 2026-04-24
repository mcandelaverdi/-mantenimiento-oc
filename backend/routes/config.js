const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { authenticate, requireGerente } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// ============ HOTELES ============

router.get('/hoteles', (req, res) => {
  try {
    const db = getDb();
    const hoteles = db.prepare('SELECT * FROM hoteles ORDER BY nombre').all();
    res.json(hoteles);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener hoteles' });
  }
});

router.post('/hoteles', requireGerente, (req, res) => {
  const { nombre } = req.body;
  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre del hotel es requerido' });
  }
  try {
    const db = getDb();
    const result = db.prepare('INSERT INTO hoteles (nombre) VALUES (?)').run(nombre.trim().toUpperCase());
    const hotel = db.prepare('SELECT * FROM hoteles WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(hotel);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ya existe un hotel con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear hotel' });
  }
});

router.put('/hoteles/:id/toggle', requireGerente, (req, res) => {
  try {
    const db = getDb();
    const hotel = db.prepare('SELECT * FROM hoteles WHERE id = ?').get(req.params.id);
    if (!hotel) return res.status(404).json({ error: 'Hotel no encontrado' });
    db.prepare('UPDATE hoteles SET activo = ? WHERE id = ?').run(hotel.activo ? 0 : 1, req.params.id);
    const updated = db.prepare('SELECT * FROM hoteles WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar hotel' });
  }
});

// ============ PROVEEDORES ============

router.get('/proveedores', (req, res) => {
  try {
    const db = getDb();
    const proveedores = db.prepare('SELECT * FROM proveedores ORDER BY nombre').all();
    res.json(proveedores);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

router.post('/proveedores', requireGerente, (req, res) => {
  const { nombre } = req.body;
  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre del proveedor es requerido' });
  }
  try {
    const db = getDb();
    const result = db.prepare('INSERT INTO proveedores (nombre) VALUES (?)').run(nombre.trim());
    const proveedor = db.prepare('SELECT * FROM proveedores WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(proveedor);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ya existe un proveedor con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

router.put('/proveedores/:id/toggle', requireGerente, (req, res) => {
  try {
    const db = getDb();
    const proveedor = db.prepare('SELECT * FROM proveedores WHERE id = ?').get(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    db.prepare('UPDATE proveedores SET activo = ? WHERE id = ?').run(proveedor.activo ? 0 : 1, req.params.id);
    const updated = db.prepare('SELECT * FROM proveedores WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
});

// ============ PRODUCTOS ============

router.get('/productos', (req, res) => {
  try {
    const db = getDb();
    const productos = db.prepare('SELECT * FROM productos ORDER BY nombre').all();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.post('/productos', requireGerente, (req, res) => {
  const { nombre } = req.body;
  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre del producto es requerido' });
  }
  try {
    const db = getDb();
    const result = db.prepare('INSERT INTO productos (nombre) VALUES (?)').run(nombre.trim());
    const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(producto);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ya existe un producto con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

router.put('/productos/:id/toggle', requireGerente, (req, res) => {
  try {
    const db = getDb();
    const producto = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    db.prepare('UPDATE productos SET activo = ? WHERE id = ?').run(producto.activo ? 0 : 1, req.params.id);
    const updated = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// ============ USUARIOS ============

router.get('/usuarios', requireGerente, (req, res) => {
  try {
    const db = getDb();
    const usuarios = db.prepare('SELECT id, nombre, email, rol, created_at FROM usuarios ORDER BY nombre').all();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.post('/usuarios', requireGerente, async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }
  if (!email || email.trim() === '') {
    return res.status(400).json({ error: 'El email es requerido' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  if (!rol || !['encargado', 'gerente'].includes(rol)) {
    return res.status(400).json({ error: 'El rol debe ser encargado o gerente' });
  }

  try {
    const db = getDb();
    const password_hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)'
    ).run(nombre.trim(), email.trim().toLowerCase(), password_hash, rol);

    const usuario = db.prepare('SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(usuario);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/usuarios/:id', requireGerente, async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  const id = req.params.id;

  if (!nombre || nombre.trim() === '') return res.status(400).json({ error: 'El nombre es requerido' });
  if (!email || email.trim() === '') return res.status(400).json({ error: 'El email es requerido' });
  if (!rol || !['encargado', 'gerente'].includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
  if (password && password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      db.prepare('UPDATE usuarios SET nombre = ?, email = ?, password_hash = ?, rol = ? WHERE id = ?')
        .run(nombre.trim(), email.trim().toLowerCase(), hash, rol, id);
    } else {
      db.prepare('UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?')
        .run(nombre.trim(), email.trim().toLowerCase(), rol, id);
    }

    const updated = db.prepare('SELECT id, nombre, email, rol, created_at FROM usuarios WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.delete('/usuarios/:id', requireGerente, (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.user.id) {
    return res.status(400).json({ error: 'No puede eliminar su propio usuario' });
  }
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
