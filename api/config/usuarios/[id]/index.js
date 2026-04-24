const { query } = require('../../../_lib/db');
const { withGerente } = require('../../../_lib/helpers');
const bcrypt = require('bcryptjs');

module.exports = withGerente(async (req, res) => {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { nombre, email, password, rol } = req.body || {};
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });
    if (!email?.trim()) return res.status(400).json({ error: 'El email es requerido' });
    if (!['encargado', 'gerente'].includes(rol)) return res.status(400).json({ error: 'Rol inválido' });
    if (password && password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    try {
      const { rows } = await query('SELECT id FROM usuarios WHERE id = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

      let updated;
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        const { rows: [u] } = await query(
          'UPDATE usuarios SET nombre=$1, email=$2, password_hash=$3, rol=$4 WHERE id=$5 RETURNING id, nombre, email, rol, created_at',
          [nombre.trim(), email.trim().toLowerCase(), hash, rol, id]
        );
        updated = u;
      } else {
        const { rows: [u] } = await query(
          'UPDATE usuarios SET nombre=$1, email=$2, rol=$3 WHERE id=$4 RETURNING id, nombre, email, rol, created_at',
          [nombre.trim(), email.trim().toLowerCase(), rol, id]
        );
        updated = u;
      }
      return res.json(updated);
    } catch (err) {
      if (err.code === '23505') return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
      return res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }

  if (req.method === 'DELETE') {
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'No puede eliminar su propio usuario' });
    try {
      const { rows } = await query('SELECT id FROM usuarios WHERE id = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
      await query('DELETE FROM usuarios WHERE id = $1', [id]);
      return res.json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
      return res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }

  res.status(405).end();
});
