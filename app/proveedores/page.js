'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function ProveedoresPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevo, setNuevo] = useState('');
  const [editando, setEditando] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user && user.rol !== 'gerente') router.push('/ordenes');
  }, [user, router]);

  const fetchProveedores = async () => {
    setLoading(true);
    const res = await fetch('/api/proveedores');
    const data = await res.json();
    setProveedores(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchProveedores(); }, []);

  const handleAgregar = async () => {
    setError(''); setSuccess('');
    if (!nuevo.trim()) return setError('Ingresa un nombre');
    const res = await fetch('/api/proveedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nuevo.trim() })
    });
    if (res.ok) {
      setSuccess('Proveedor agregado');
      setNuevo('');
      fetchProveedores();
    } else {
      const data = await res.json();
      setError(data.error || 'Error al agregar');
    }
  };

  const handleEditar = async (id) => {
    setError(''); setSuccess('');
    if (!editNombre.trim()) return setError('Ingresa un nombre');
    const res = await fetch(`/api/proveedores/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: editNombre.trim() })
    });
    if (res.ok) {
      setSuccess('Proveedor actualizado');
      setEditando(null);
      fetchProveedores();
    } else {
      const data = await res.json();
      setError(data.error || 'Error al editar');
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar el proveedor "${nombre}"?`)) return;
    const res = await fetch(`/api/proveedores/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSuccess('Proveedor eliminado');
      fetchProveedores();
    }
  };

  if (user?.rol !== 'gerente') return null;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Gestión de Proveedores</h1>
      </div>

      <div className="card" style={{ maxWidth: 600, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Agregar proveedor</h3>
        {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>{success}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            className="form-control"
            placeholder="Nombre del proveedor..."
            value={nuevo}
            onChange={e => setNuevo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAgregar()}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={handleAgregar}>Agregar</button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <h3 style={{ marginBottom: 16 }}>Proveedores ({proveedores.length})</h3>
        {loading ? <p style={{ color: '#777' }}>Cargando...</p> : proveedores.length === 0 ? (
          <p style={{ color: '#777' }}>No hay proveedores cargados.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {proveedores.map(p => (
                  <tr key={p.id}>
                    <td>
                      {editando === p.id ? (
                        <input
                          type="text"
                          className="form-control"
                          value={editNombre}
                          onChange={e => setEditNombre(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleEditar(p.id)}
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{p.nombre}</span>
                      )}
                    </td>
                    <td>
                      <div className="actions-bar">
                        {editando === p.id ? (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleEditar(p.id)}>Guardar</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditando(null)}>Cancelar</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-outline btn-sm" onClick={() => { setEditando(p.id); setEditNombre(p.nombre); setError(''); setSuccess(''); }}>Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleEliminar(p.id, p.nombre)}>Eliminar</button>
                          </>
                        )}
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
