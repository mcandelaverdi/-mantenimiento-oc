import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function PATCH(request, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (user.rol !== 'gerente') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  const { nombre } = await request.json();
  if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
  const rows = await query(
    'UPDATE proveedores SET nombre = $1 WHERE id = $2 RETURNING *',
    [nombre.trim(), params.id]
  );
  if (!rows.length) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(request, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (user.rol !== 'gerente') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  await query('DELETE FROM proveedores WHERE id = $1', [params.id]);
  return NextResponse.json({ ok: true });
}
