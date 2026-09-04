import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (user.rol !== 'gerente') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const rows = await query(`
    SELECT 
      oi.habitacion,
      oi.producto_nombre,
      o.hotel,
      COUNT(DISTINCT o.id) as total_ordenes
    FROM orden_items oi
    JOIN ordenes o ON o.id = oi.orden_id
    WHERE 
      oi.habitacion != '' 
      AND oi.habitacion IS NOT NULL
      AND o.created_at >= NOW() - INTERVAL '3 months'
      AND o.estado != 'RECHAZADA POR FALTA DE PRODUCTO'
    GROUP BY oi.habitacion, oi.producto_nombre, o.hotel
    HAVING COUNT(DISTINCT o.id) > 1
    ORDER BY total_ordenes DESC, oi.habitacion ASC
  `);

  return NextResponse.json(rows);
}
