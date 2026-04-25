import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(request, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = params;

  const rows = await query(`
    SELECT o.*, u.nombre AS encargado_nombre
    FROM ordenes o
    LEFT JOIN usuarios u ON u.id = o.encargado_id
    WHERE o.id = $1
  `, [id]);

  if (!rows.length) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const orden = rows[0];
  if (user.rol === 'encargado' && orden.encargado_id !== user.id) {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });
  }

  const items = await query(
    `SELECT * FROM orden_items WHERE orden_id = $1 ORDER BY id`,
    [id]
  );

  return NextResponse.json({ ...orden, items });
}

export async function PATCH(request, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (user.rol !== 'gerente') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const { id } = params;
  const { estado, firma_gerente, notas_gerente } = await request.json();

  if (!['APROBADA', 'RECHAZADA'].includes(estado)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  await query(
    `UPDATE ordenes SET estado = $1, firma_gerente = $2, notas_gerente = $3, gerente_id = $4, updated_at = NOW()
     WHERE id = $5`,
    [estado, firma_gerente || '', notas_gerente || '', user.id, id]
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (user.rol !== 'gerente') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const { id } = params;
  await query(`DELETE FROM ordenes WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
