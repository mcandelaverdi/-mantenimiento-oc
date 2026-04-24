import React, { useState, useEffect } from 'react';
import api from '../api';

function ConfigSection({ title, items, onToggle, onAdd, addPlaceholder, transformInput }) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    const name = transformInput ? transformInput(newName) : newName.trim();
    if (!name) {
      setError('El nombre no puede estar vacío');
      return;
    }
    setAdding(true);
    setError('');
    try {
      await onAdd(name);
      setNewName('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      {items.length === 0 ? (
        <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>No hay elementos registrados</p>
      ) : (
        <ul className="config-list">
          {items.map(item => (
            <li key={item.id} className="config-list-item">
              <span className={`config-item-name ${!item.activo ? 'inactive' : ''}`}>
                {item.nombre}
                {!item.activo && <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-light)' }}>(inactivo)</span>}
              </span>
              <button
                className={`btn btn-sm ${item.activo ? 'btn-secondary' : 'btn-success'}`}
                onClick={() => onToggle(item.id)}
              >
                {item.activo ? 'Desactivar' : 'Activar'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="config-add-form" style={{ marginTop: '20px' }}>
        <input
          type="text"
          className={`form-control ${error ? 'error' : ''}`}
          placeholder={addPlaceholder || 'Nombre...'}
          value={newName}
          onChange={e => { setNewName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={adding}
        >
          {adding ? 'Agregando...' : '➕ Agregar'}
        </button>
      </div>
      {error && <div className="form-error" style={{ marginTop: '6px' }}>{error}</div>}
    </div>
  );
}

function UserSection() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Formulario alta
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'encargado' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edición
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', email: '', password: '', rol: 'encargado' });
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Eliminación
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const rolLabel = { encargado: 'Encargado', gerente: 'Gerente' };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await api.get('/config/usuarios');
      setUsuarios(res.data);
    } catch (err) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/config/usuarios', form);
      setForm({ nombre: '', email: '', password: '', rol: 'encargado' });
      setShowPassword(false);
      setSuccess('Usuario creado correctamente');
      await fetchUsuarios();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setEditForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol });
    setEditError('');
    setEditShowPassword(false);
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditForm({ nombre: '', email: '', password: '', rol: 'encargado' });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);
    try {
      await api.put(`/config/usuarios/${editingUser.id}`, editForm);
      setSuccess('Usuario actualizado correctamente');
      closeEdit();
      await fetchUsuarios();
    } catch (err) {
      setEditError(err.response?.data?.error || 'Error al actualizar usuario');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/config/usuarios/${id}`);
      setSuccess('Usuario eliminado correctamente');
      setDeletingUserId(null);
      await fetchUsuarios();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar usuario');
      setDeletingUserId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {error && <div className="alert alert-error" style={{ marginBottom: '14px' }}>⚠️ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '14px' }}>✓ {success}</div>}

      {/* Tabla de usuarios */}
      {usuarios.length > 0 && (
        <div className="table-wrapper" style={{ marginBottom: '28px' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Desde</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.nombre}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.rol === 'gerente' ? 'badge-APROBADA' : 'badge-PENDIENTE'}`}>
                      {rolLabel[u.rol] || u.rol}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('es-AR') : '-'}
                  </td>
                  <td>
                    {deletingUserId === u.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 600 }}>¿Eliminar?</span>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(u.id)}
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? '...' : 'Sí, eliminar'}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setDeletingUserId(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(u)}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => { setDeletingUserId(u.id); setSuccess(''); setError(''); }}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulario alta */}
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Agregar nuevo usuario</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Nombre completo <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
              placeholder="Juan García"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="usuario@hotel.com"
            />
          </div>
        </div>
        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Contraseña <span className="required">*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px',
                  color: 'var(--text-light)', padding: '2px'
                }}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Rol <span className="required">*</span></label>
            <select
              className="form-select"
              value={form.rol}
              onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}
            >
              <option value="encargado">Encargado</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Creando...' : '➕ Crear usuario'}
        </button>
      </form>

      {/* Modal de edición */}
      {editingUser && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Usuario</h3>
              <button className="modal-close" onClick={closeEdit}>×</button>
            </div>

            {editError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {editError}</div>}

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre completo <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.nombre}
                  onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email <span className="required">*</span></label>
                <input
                  type="email"
                  className="form-control"
                  value={editForm.email}
                  onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Nueva contraseña
                  <span style={{ fontWeight: 400, color: 'var(--text-light)', marginLeft: '6px', fontSize: '13px' }}>
                    (dejar vacío para no cambiar)
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={editShowPassword ? 'text' : 'password'}
                    className="form-control"
                    value={editForm.password}
                    onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    style={{ paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditShowPassword(p => !p)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px',
                      color: 'var(--text-light)', padding: '2px'
                    }}
                    title={editShowPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {editShowPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Rol <span className="required">*</span></label>
                <select
                  className="form-select"
                  value={editForm.rol}
                  onChange={e => setEditForm(p => ({ ...p, rol: e.target.value }))}
                >
                  <option value="encargado">Encargado</option>
                  <option value="gerente">Gerente</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeEdit}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={editSubmitting}>
                  {editSubmitting ? 'Guardando...' : '💾 Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Configuration() {
  const [activeTab, setActiveTab] = useState('hoteles');
  const [hoteles, setHoteles] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [h, p, pr] = await Promise.all([
        api.get('/config/hoteles'),
        api.get('/config/proveedores'),
        api.get('/config/productos')
      ]);
      setHoteles(h.data);
      setProveedores(p.data);
      setProductos(pr.data);
    } catch (err) {
      setError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHotel = async (id) => {
    await api.put(`/config/hoteles/${id}/toggle`);
    const res = await api.get('/config/hoteles');
    setHoteles(res.data);
  };

  const handleAddHotel = async (nombre) => {
    await api.post('/config/hoteles', { nombre });
    const res = await api.get('/config/hoteles');
    setHoteles(res.data);
  };

  const handleToggleProveedor = async (id) => {
    await api.put(`/config/proveedores/${id}/toggle`);
    const res = await api.get('/config/proveedores');
    setProveedores(res.data);
  };

  const handleAddProveedor = async (nombre) => {
    await api.post('/config/proveedores', { nombre });
    const res = await api.get('/config/proveedores');
    setProveedores(res.data);
  };

  const handleToggleProducto = async (id) => {
    await api.put(`/config/productos/${id}/toggle`);
    const res = await api.get('/config/productos');
    setProductos(res.data);
  };

  const handleAddProducto = async (nombre) => {
    await api.post('/config/productos', { nombre });
    const res = await api.get('/config/productos');
    setProductos(res.data);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Configuración</h1>
          <p>Gestione hoteles, proveedores, productos y usuarios</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="tabs">
          {[
            { key: 'hoteles', label: '🏨 Hoteles' },
            { key: 'proveedores', label: '🏪 Proveedores' },
            { key: 'productos', label: '📦 Productos' },
            { key: 'usuarios', label: '👤 Usuarios' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'hoteles' && (
          <ConfigSection
            title="Hoteles"
            items={hoteles}
            onToggle={handleToggleHotel}
            onAdd={handleAddHotel}
            addPlaceholder="Nombre del hotel (ej: NUEVO)"
            transformInput={v => v.trim().toUpperCase()}
          />
        )}

        {activeTab === 'proveedores' && (
          <ConfigSection
            title="Proveedores"
            items={proveedores}
            onToggle={handleToggleProveedor}
            onAdd={handleAddProveedor}
            addPlaceholder="Nombre del proveedor"
          />
        )}

        {activeTab === 'productos' && (
          <ConfigSection
            title="Productos"
            items={productos}
            onToggle={handleToggleProducto}
            onAdd={handleAddProducto}
            addPlaceholder="Nombre del producto"
          />
        )}

        {activeTab === 'usuarios' && (
          <UserSection />
        )}
      </div>
    </div>
  );
}
