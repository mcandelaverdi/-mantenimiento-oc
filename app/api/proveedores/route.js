import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const rows = await query('SELECT * FROM proveedores ORDER BY nombre ASC');
  return NextResponse.json(rows);
}

export async function POST(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (user.rol !== 'gerente') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  const { nombre } = await request.json();
  if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  const rows = await query(
    'INSERT INTO proveedores (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING RETURNING *',
    [nombre.trim()]
  );
  return NextResponse.json(rows[0] || { error: 'Ya existe' }, { status: 201 });
}
