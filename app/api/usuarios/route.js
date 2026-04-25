import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const user = await getUser();
  if (!user || user.rol !== 'gerente') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const rows = await query(`SELECT id, nombre, usuario, rol, hotel, activo, created_at FROM usuarios ORDER BY created_at DESC`);
  return NextResponse.json(rows);
}

export async function POST(request) {
  const user = await getUser();
  if (!user || user.rol !== 'gerente') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const { nombre, usuario, password, rol, hotel } = await request.json();
  if (!nombre || !usuario || !password || !rol) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const rows = await query(
    `INSERT INTO usuarios (nombre, usuario, password_hash, rol, hotel) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [nombre, usuario, hash, rol, hotel || null]
  );
  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
