import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const isEncargado = user.rol === 'encargado';

  const proveedores = await query(
    `SELECT DISTINCT proveedor FROM ordenes ${isEncargado ? 'WHERE encargado_id = $1' : ''} ORDER BY proveedor`,
    isEncargado ? [user.id] : []
  );

  const itemsJoin = isEncargado
    ? 'JOIN ordenes o ON o.id = oi.orden_id WHERE o.encargado_id = $1 AND'
    : 'WHERE';

  const productos = await query(
    `SELECT DISTINCT oi.producto_nombre FROM orden_items oi ${itemsJoin} oi.producto_nombre != '' ORDER BY oi.producto_nombre`,
    isEncargado ? [user.id] : []
  );

  const habitaciones = await query(
    `SELECT DISTINCT oi.habitacion FROM orden_items oi ${itemsJoin} oi.habitacion != '' ORDER BY oi.habitacion`,
    isEncargado ? [user.id] : []
  );

  return NextResponse.json({
    proveedores: proveedores.map(r => r.proveedor),
    productos: productos.map(r => r.producto_nombre),
    habitaciones: habitaciones.map(r => r.habitacion),
  });
}
