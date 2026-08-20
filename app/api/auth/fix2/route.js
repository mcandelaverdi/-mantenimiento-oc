import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      `UPDATE ordenes SET proveedor = 'FERRETERIA LA ESTRELLA' WHERE proveedor = 'LA ESTRELLA'`
    );
    return NextResponse.json({ ok: true, message: 'Proveedores actualizados correctamente' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
