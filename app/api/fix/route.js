import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    await query(`ALTER TABLE ordenes DROP CONSTRAINT IF EXISTS ordenes_estado_check`);
    await query(`ALTER TABLE ordenes ALTER COLUMN estado TYPE VARCHAR(100)`);
    return NextResponse.json({ ok: true, message: 'Constraint eliminado correctamente' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
