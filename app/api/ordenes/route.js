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
  const habitacion = searchParams.get('habitacion');
  const producto = searchParams.get('producto');
  let conditions = [];
  let params = [];
  let idx = 1;
  if (user.rol === 'encargado') {
    conditions.push(`o.encargado_id = $${idx++}`);
    params.push(user.id);
  }
  if (hotel) { conditions.push(`o.hotel = $${idx++}`); params.push(hotel); }
  if (proveedor) { conditions.push(`o.proveedor = $${idx++}`); params.push(proveedor); }
  if (estado) { conditions.push(`o.estado = $${idx++}`); params.push(estado); }
  if (habitacion) {
    conditions.push(`EXISTS (SELECT 1 FROM orden_items oi WHERE oi.orden_id = o.id AND oi.habitacion = $${idx++})`);
    params.push(habitacion);
  }
  if (producto) {
    conditions.push(`EXISTS (SELECT 1 FROM orden_items oi WHERE oi.orden_id = o.id AND oi.producto_nombre = $${idx++})`);
    params.push(producto);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` :
