import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const hotel = searchParams.get('hotel');
  const proveedor = searchParams.get('proveedor');
  const estado = searchParams.get('estado');

  let conditions = [];
  let params = [];
  let idx = 1;

  if (user.rol === 'encargado') {
    conditions.push(`o.encargado_id = $${idx++}`);
    params.push(user.id);
  }
  if (hotel) { conditions.push(`o.hotel = $${idx++}`); params.push(hotel); }
  if (proveedor) { conditions.push(`o.proveedor ILIKE $${idx++}`); params.push(`%${proveedor}%`); }
  if (estado) { conditions.push(`o.estado = $${idx++}`); params.push(estado); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const rows = await query(`
    SELECT o.id, o.hotel, o.proveedor, o.estado, o.firma_encargado, o.firma_gerente,
           o.notas_gerente, o.created_at, o.updated_at,
           u.nombre AS encargado_nombre
    FROM ordenes o
    LEFT JOIN usuarios u ON u.id = o.encargado_id
    ${where}
    ORDER BY o.created_at DESC
  `, params);

  return NextResponse.json(rows);
}

export async function POST(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (user.rol !== 'encargado') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const { hotel, proveedor, firma_encargado, items } = await request.json();

  if (!hotel || !proveedor || !items?.length) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
  }

  const ordenRows = await query(
    `INSERT INTO ordenes (hotel, proveedor, firma_encargado, encargado_id, estado)
     VALUES ($1, $2, $3, $4, 'PENDIENTE') RETURNING id`,
    [hotel, proveedor, firma_encargado, user.id]
  );
  const ordenId = ordenRows[0].id;

  for (const item of items) {
    if (!item.producto_nombre) continue;
    await query(
      `INSERT INTO orden_items (orden_id, producto_nombre, cantidad, habitacion, motivo)
       VALUES ($1, $2, $3, $4, $5)`,
      [ordenId, item.producto_nombre, item.cantidad || 1, item.habitacion || '', item.motivo || '']
    );
  }

  return NextResponse.json({ id: ordenId }, { status: 201 });
}
