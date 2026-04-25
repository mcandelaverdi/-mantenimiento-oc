'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

const HOTELES = ['VALLES', 'PRINCE', 'AMERICA', 'VIPS', 'KING'];

const emptyForm = { nombre: '', usuario: '', password: '', rol: 'encargado', hotel: '', activo: true };

export default function UsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);

  if (user?.rol !== 'gerente') {
    return <div className="container"><div className="alert alert-error">Sin permiso</div></div>;
  }

  const fetchUsuarios = () => {
    fetch('/api/usuarios').then(r => r.json()).then(data => { setUsuarios(data); setLoading(false); });
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const handleEdit = (u) => {
    setForm({ nombre: u.nombre, usuario: u.usuario, password: '', rol: u.rol, hotel: u.hotel || '', activo: u.activo });
    setEditId(u.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleNew = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    setSuccess('Usuario eliminado');
    fetchUsuarios();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const body = { ...form };
    if (editId && !body.password) delete body.password;

    const res = editId
      ? await fetch(`/api/usuarios/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Error'); return; }
    setSuccess(editId ? 'Usuario actualizado' : 'Usuario creado');
    setShowForm(false);
    fetchUsuarios();
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        <button className="btn btn-primary" onClick={handleNew}>+ Nuevo Usuario</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="card">
          <h2>{editId ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input type="text" className="form-control" value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Usuario *</label>
                <input type="text" className="form-control" value={form.usuario} onChange={e => setForm(f => ({...f, usuario: e.target.value}))} required disabled={!!editId} />
              </div>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Contraseña {editId ? '(dejar vacío para no cambiar)' : '*'}</label>
                <div style={{ position:'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control"
                    value={form.password}
                    onChange={e => setForm(f => ({...f, password: e.target.value}))}
                    required={!editId}
                    style={{ paddingRight:40 }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer' }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Rol *</label>
                <select className="form-control" value={form.rol} onChange={e => setForm(f => ({...f, rol: e.target.value}))}>
                  <option value="encargado">Encargado</option>
                  <option value="gerente">Gerente</option>
                </select>
              </div>
            </div>
            <div className="input-row">
              <div className="form-group">
                <label className="form-label">Hotel</label>
                <select className="form-control" value={form.hotel} onChange={e => setForm(f => ({...f, hotel: e.target.value}))}>
                  <option value="">Sin asignar</option>
                  {HOTELES.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              {editId && (
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select className="form-control" value={form.activo ? 'true' : 'false'} onChange={e => setForm(f => ({...f, activo: e.target.value === 'true'}))}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              )}
            </div>
            <div className="actions-bar">
              <button type="submit" className="btn btn-primary">Guardar</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p style={{ textAlign:'center', color:'#777', padding:40 }}>Cargando...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Hotel</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>{u.nombre}</td>
                    <td>{u.usuario}</td>
                    <td style={{ textTransform:'capitalize' }}>{u.rol}</td>
                    <td>{u.hotel || '-'}</td>
                    <td>{u.activo ? <span style={{ color:'#2e7d32' }}>Activo</span> : <span style={{ color:'#c62828' }}>Inactivo</span>}</td>
                    <td>
                      <div className="actions-bar">
                        <button className="btn btn-warning btn-sm" onClick={() => handleEdit(u)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
