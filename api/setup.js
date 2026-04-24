const { query } = require('./_lib/db');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        rol TEXT NOT NULL CHECK(rol IN ('encargado','gerente')),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS hoteles (
        id SERIAL PRIMARY KEY,
        nombre TEXT UNIQUE NOT NULL,
        activo INTEGER DEFAULT 1
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS proveedores (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        activo INTEGER DEFAULT 1
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        activo INTEGER DEFAULT 1
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ordenes (
        id SERIAL PRIMARY KEY,
        numero TEXT UNIQUE NOT NULL,
        hotel TEXT NOT NULL,
        proveedor_id INTEGER,
        proveedor_nombre TEXT NOT NULL,
        fecha TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE','APROBADA','RECHAZADA')),
        encargado_id INTEGER NOT NULL,
        encargado_nombre TEXT NOT NULL,
        firma_encargado TEXT,
        gerente_id INTEGER,
        gerente_nombre TEXT,
        firma_gerente TEXT,
        notas TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS orden_items (
        id SERIAL PRIMARY KEY,
        orden_id INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
        producto_nombre TEXT NOT NULL,
        cantidad INTEGER NOT NULL DEFAULT 1,
        habitacion TEXT,
        motivo TEXT
      )
    `);

    // Seed solo si está vacío
    const { rows: [{ count: uc }] } = await query('SELECT COUNT(*) as count FROM usuarios');
    if (parseInt(uc) === 0) {
      const h1 = await bcrypt.hash('encargado123', 10);
      const h2 = await bcrypt.hash('gerente123', 10);
      await query('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4)',
        ['Juan García', 'encargado@hotel.com', h1, 'encargado']);
      await query('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4)',
        ['María López', 'gerente@hotel.com', h2, 'gerente']);
    }

    const { rows: [{ count: hc }] } = await query('SELECT COUNT(*) as count FROM hoteles');
    if (parseInt(hc) === 0) {
      for (const n of ['VALLES', 'PRINCE', 'AMERICA', 'VIPS', 'KING']) {
        await query('INSERT INTO hoteles (nombre) VALUES ($1)', [n]);
      }
    }

    const { rows: [{ count: pc }] } = await query('SELECT COUNT(*) as count FROM proveedores');
    if (parseInt(pc) === 0) {
      for (const n of ['Distribuidor ABC', 'Ferretería Central', 'Suministros XYZ', 'Materiales Plus']) {
        await query('INSERT INTO proveedores (nombre) VALUES ($1)', [n]);
      }
    }

    const { rows: [{ count: prc }] } = await query('SELECT COUNT(*) as count FROM productos');
    if (parseInt(prc) === 0) {
      for (const n of ['Bombilla LED', 'Llave de paso', 'Pintura blanca', 'Silicona', 'Tornillos', 'Cable eléctrico', 'Filtro de agua', 'Cerradura']) {
        await query('INSERT INTO productos (nombre) VALUES ($1)', [n]);
      }
    }

    res.json({ ok: true, message: 'Base de datos inicializada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
