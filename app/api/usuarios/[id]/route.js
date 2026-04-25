import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(request, { params }) {
  const user = await getUser();
  if (!user || user.rol !== 'gerente') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const { id } = params;
  const { nombre, password, rol, hotel, activo } = await request.json();

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await query(
      `UPDATE usuarios SET nombre=$1, password_hash=$2, rol=$3, hotel=$4, activo=$5 WHERE id=$6`,
      [nombre, hash, rol, hotel || null, activo, id]
    );
  } else {
    await query(
      `UPDATE usuarios SET nombre=$1, rol=$2, hotel=$3, activo=$4 WHERE id=$5`,
      [nombre, rol, hotel || null, activo, id]
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const user = await getUser();
  if (!user || user.rol !== 'gerente') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 });

  const { id } = params;
  await query(`DELETE FROM usuarios WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
