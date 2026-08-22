import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (user.rol !== 'gerente') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const hotel = searchParams.get('hotel');
  const desde = searchParams.get('desde');
  const hasta = searchParams.get('hasta');

  let conditions = ["oi.habitacion != ''", "oi.habitacion IS NOT NULL"];
  let params = [];
  let idx = 1;

  if (hotel) { conditions.push(`o.hotel = $${idx++}`); params.push(hotel); }
  if (desde) { conditions.push(`o.created_at >= $${idx++}`); params.push(desde); }
  if (hasta) { conditions.push(`o.created_at <= $${idx++}`); params.push(hasta + ' 23:59:59'); }

  const where = 'WHERE ' + conditions.join(' AND ');

  const rows = await query(`
    SELECT 
      oi.habitacion,
      oi.producto_nombre,
      SUM(oi.cantidad::numeric) as total_cantidad,
      COUNT(DISTINCT o.id) as total_ordenes,
      o.hotel,
      MAX(o.created_at) as ultima_fecha
    FROM orden_items oi
    JOIN ordenes o ON o.id = oi.orden_id
    ${where}
    GROUP BY oi.habitacion, oi.producto_nombre, o.hotel
    ORDER BY oi.habitacion ASC, total_ordenes DESC
  `, params);

  return NextResponse.json(rows);
}
