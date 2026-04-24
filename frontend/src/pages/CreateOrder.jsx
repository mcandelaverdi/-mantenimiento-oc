import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const MAX_ITEMS = 12;

const emptyItem = () => ({
  producto_nombre: '',
  cantidad: 1,
  habitacion: '',
  motivo: ''
});

export default function CreateOrder() {
  const navigate = useNavigate();

  const [hoteles, setHoteles] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [hotel, setHotel] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [firma, setFirma] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = today.split('-').reverse().join('/');

  useEffect(() => {
    async function fetchConfig() {
      try {
        const [h, p, pr] = await Promise.all([
          api.get('/config/hoteles'),
          api.get('/config/proveedores'),
          api.get('/config/productos')
        ]);
        setHoteles(h.data.filter(x => x.activo));
        setProveedores(p.data.filter(x => x.activo));
        setProductos(pr.data.filter(x => x.activo));
      } catch (err) {
        setError('Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const addItem = () => {
    if (items.length >= MAX_ITEMS) return;
    setItems(prev => [...prev, emptyItem()]);
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!hotel) {
      setError('Debe seleccionar un hotel');
      return;
    }
    if (!proveedorId) {
      setError('Debe seleccionar un proveedor');
      return;
    }

    const validItems = items.filter(item => item.producto_nombre && item.cantidad > 0);
    if (validItems.length === 0) {
      setError('Debe agregar al menos un producto con cantidad válida');
      return;
    }
    if (!firma || firma.trim() === '') {
      setError('Debe ingresar su nombre como firma antes de guardar');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        hotel,
        proveedor_id: parseInt(proveedorId),
        firma_encargado: firma.trim(),
        items: validItems.map(item => ({
          producto_nombre: item.producto_nombre,
          cantidad: parseInt(item.cantidad),
          habitacion: item.habitacion,
          motivo: item.motivo
        }))
      });
      navigate(`/ordenes/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al crear la orden';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
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
          <h1>Nueva Orden de Compra</h1>
          <p>Complete el formulario y firme para guardar la orden</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/ordenes')}>
          Cancelar
        </button>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Header section */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 className="card-title">Información General</h2>
          <div className="form-row cols-3">
            <div className="form-group">
              <label className="form-label">
                Hotel <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={hotel}
                onChange={e => setHotel(e.target.value)}
                required
              >
                <option value="">Seleccionar hotel...</option>
                {hoteles.map(h => (
                  <option key={h.id} value={h.nombre}>{h.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Proveedor <span className="required">*</span>
              </label>
              <select
                className="form-select"
                value={proveedorId}
                onChange={e => setProveedorId(e.target.value)}
                required
              >
                <option value="">Seleccionar proveedor...</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input
                type="text"
                className="form-control"
                value={todayFormatted}
                readOnly
                disabled
              />
            </div>
          </div>
        </div>

        {/* Products table */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '600' }}>
              Productos
              <span style={{ marginLeft: '10px', fontSize: '13px', color: 'var(--text-light)', fontWeight: 400 }}>
                ({items.length}/{MAX_ITEMS} filas)
              </span>
            </h2>
            {items.length < MAX_ITEMS && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addItem}
              >
                ➕ Agregar producto
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="products-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Producto *</th>
                  <th style={{ width: '90px' }}>Cantidad *</th>
                  <th style={{ minWidth: '130px' }}>Habitación</th>
                  <th style={{ minWidth: '200px' }}>Motivo</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        list={`productos-list-${index}`}
                        value={item.producto_nombre}
                        onChange={e => updateItem(index, 'producto_nombre', e.target.value)}
                        placeholder="Escribir o elegir..."
                      />
                      <datalist id={`productos-list-${index}`}>
                        {productos.map(p => (
                          <option key={p.id} value={p.nombre} />
                        ))}
                      </datalist>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        value={item.cantidad}
                        min={1}
                        max={9999}
                        onChange={e => updateItem(index, 'cantidad', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={item.habitacion}
                        placeholder="Ej: 101"
                        onChange={e => updateItem(index, 'habitacion', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={item.motivo}
                        placeholder="Descripción del motivo"
                        onChange={e => updateItem(index, 'motivo', e.target.value)}
                      />
                    </td>
                    <td>
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeItem(index)}
                          title="Eliminar fila"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Firma como texto */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 className="card-title">
            Firma del Encargado <span className="required">*</span>
          </h2>
          <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: 0, marginBottom: '16px' }}>
            Escriba su nombre completo como firma de conformidad.
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Ej: Juan García"
              value={firma}
              onChange={e => setFirma(e.target.value)}
              style={{ fontSize: '20px', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}
            />
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/ordenes')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Guardando...' : '💾 Guardar Orden'}
          </button>
        </div>
      </form>
    </div>
  );
}
