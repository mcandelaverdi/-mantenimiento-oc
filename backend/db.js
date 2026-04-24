const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'mantenimiento.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK(rol IN ('encargado', 'gerente')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hoteles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      activo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      activo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT UNIQUE NOT NULL,
      activo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS ordenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE NOT NULL,
      hotel TEXT NOT NULL,
      proveedor_id INTEGER,
      proveedor_nombre TEXT NOT NULL,
      fecha TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')),
      encargado_id INTEGER NOT NULL,
      encargado_nombre TEXT NOT NULL,
      firma_encargado TEXT,
      gerente_id INTEGER,
      gerente_nombre TEXT,
      firma_gerente TEXT,
      notas TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (encargado_id) REFERENCES usuarios(id),
      FOREIGN KEY (gerente_id) REFERENCES usuarios(id),
      FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
    );

    CREATE TABLE IF NOT EXISTS orden_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orden_id INTEGER NOT NULL,
      producto_nombre TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      habitacion TEXT,
      motivo TEXT,
      FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE
    );
  `);

  seedData();
}

function seedData() {
  const usuariosCount = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
  if (usuariosCount.count === 0) {
    const insertUsuario = db.prepare(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)'
    );
    insertUsuario.run(
      'Juan García',
      'encargado@hotel.com',
      bcrypt.hashSync('encargado123', 10),
      'encargado'
    );
    insertUsuario.run(
      'María López',
      'gerente@hotel.com',
      bcrypt.hashSync('gerente123', 10),
      'gerente'
    );
  }

  const hotelesCount = db.prepare('SELECT COUNT(*) as count FROM hoteles').get();
  if (hotelesCount.count === 0) {
    const insertHotel = db.prepare('INSERT INTO hoteles (nombre) VALUES (?)');
    ['VALLES', 'PRINCE', 'AMERICA', 'VIPS', 'KING'].forEach(nombre => {
      insertHotel.run(nombre);
    });
  }

  const proveedoresCount = db.prepare('SELECT COUNT(*) as count FROM proveedores').get();
  if (proveedoresCount.count === 0) {
    const insertProveedor = db.prepare('INSERT INTO proveedores (nombre) VALUES (?)');
    [
      'Distribuidor ABC',
      'Ferretería Central',
      'Suministros XYZ',
      'Materiales Plus'
    ].forEach(nombre => {
      insertProveedor.run(nombre);
    });
  }

  const productosCount = db.prepare('SELECT COUNT(*) as count FROM productos').get();
  if (productosCount.count === 0) {
    const insertProducto = db.prepare('INSERT INTO productos (nombre) VALUES (?)');
    [
      'Bombilla LED',
      'Llave de paso',
      'Pintura blanca',
      'Silicona',
      'Tornillos',
      'Cable eléctrico',
      'Filtro de agua',
      'Cerradura'
    ].forEach(nombre => {
      insertProducto.run(nombre);
    });
  }
}

module.exports = { getDb };
