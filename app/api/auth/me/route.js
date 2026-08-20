import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    await query(`UPDATE ordenes SET proveedor = 'IACONO' WHERE proveedor = 'IACONO PINTURERIAS'`);
    return NextResponse.json({ ok: true, message: 'Proveedor actualizado correctamente' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
