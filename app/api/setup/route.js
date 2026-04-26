import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        usuario VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        rol VARCHAR(20) NOT NULL CHECK (rol IN ('encargado', 'gerente')),
        hotel VARCHAR(50),
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS ordenes (
        id SERIAL PRIMARY KEY,
        hotel VARCHAR(50) NOT NULL,
        proveedor VARCHAR(100) NOT NULL,
        estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA')),
        firma_encargado VARCHAR(100),
        firma_gerente VARCHAR(100),
        notas_gerente TEXT,
        encargado_id INTEGER REFERENCES usuarios(id),
        gerente_id INTEGER REFERENCES usuarios(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS orden_items (
        id SERIAL PRIMARY KEY,
        orden_id INTEGER REFERENCES ordenes(id) ON DELETE CASCADE,
        producto_nombre VARCHAR(200) NOT NULL,
        cantidad INTEGER NOT NULL DEFAULT 1,
        habitacion VARCHAR(50),
        motivo TEXT
      )
    `);

    const { searchParams } = new URL(request.url);
    const reset = searchParams.get('reset') === '1';

    const existing = await query(`SELECT id FROM usuarios WHERE usuario = 'gerente'`);

    if (existing.length === 0 || reset) {
      const gerenteHash = await bcrypt.hash('gerente123', 10);
      const enc1Hash = await bcrypt.hash('encargado123', 10);
      const enc2Hash = await bcrypt.hash('encargado123', 10);

      if (reset && existing.length > 0) {
        await query(`UPDATE usuarios SET password_hash = $1 WHERE usuario = 'gerente'`, [gerenteHash]);
        await query(`UPDATE usuarios SET password_hash = $1 WHERE usuario = 'encargado1'`, [enc1Hash]);
        await query(`UPDATE usuarios SET password_hash = $1 WHERE usuario = 'encargado2'`, [enc2Hash]);
      } else {
        await query(
          `INSERT INTO usuarios (nombre, usuario, password_hash, rol, hotel) VALUES ($1,$2,$3,$4,$5)`,
          ['Gerente General', 'gerente', gerenteHash, 'gerente', null]
        );
        await query(
          `INSERT INTO usuarios (nombre, usuario, password_hash, rol, hotel) VALUES ($1,$2,$3,$4,$5)`,
          ['Encargado Valles', 'encargado1', enc1Hash, 'encargado', 'VALLES']
        );
        await query(
          `INSERT INTO usuarios (nombre, usuario, password_hash, rol, hotel) VALUES ($1,$2,$3,$4,$5)`,
          ['Encargado Prince', 'encargado2', enc2Hash, 'encargado', 'PRINCE']
        );
      }
    }

    const users = await query(`SELECT id, nombre, usuario, rol, hotel, activo FROM usuarios ORDER BY id`);

    return NextResponse.json({
      ok: true,
      message: 'Base de datos lista',
      usuarios: users,
      credenciales_por_defecto: [
        { usuario: 'gerente', password: 'gerente123', rol: 'gerente' },
        { usuario: 'encargado1', password: 'encargado123', rol: 'encargado', hotel: 'VALLES' },
        { usuario: 'encargado2', password: 'encargado123', rol: 'encargado', hotel: 'PRINCE' },
      ]
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
