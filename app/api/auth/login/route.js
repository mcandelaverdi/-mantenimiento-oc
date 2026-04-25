import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    const { usuario, password } = await request.json();

    const rows = await query(
      `SELECT id, nombre, usuario, password_hash, rol, hotel FROM usuarios WHERE usuario = $1 AND activo = true`,
      [usuario]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const token = await signToken({
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol,
      hotel: user.hotel,
    });

    const response = NextResponse.json({
      id: user.id,
      nombre: user.nombre,
      usuario: user.usuario,
      rol: user.rol,
      hotel: user.hotel,
    });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
