import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function renderFirmaEncargado(firma) {
  if (!firma) return '<em>Sin firma</em>';
  if (firma.startsWith('data:')) {
    return `<img src="${firma}" alt="Firma" style="max-height: 70px; border: 1px solid #ddd; display: block;" />`;
  }
  return `<div style="font-family: Georgia, serif; font-size: 20px; font-style: italic; padding: 8px 0; border-bottom: 1px solid #aaa; min-width: 160px;">${firma}</div>`;
}

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterEstado, setFilterEstado] = useState('');
  const [filterHotel, setFilterHotel] = useState('');
  const [filterProveedor, setFilterProveedor] = useState('');
  const [filterProducto, setFilterProducto] = useState('');
  const [filterEncargado, setFilterEncargado] = useState('');
  const [filterHabitacion, setFilterHabitacion] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch (err) {
      setError('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/orders/${id}`);
      setOrders(prev => prev.filter(o => o.id !== id));
      setDeletingOrderId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la orden');
      setDeletingOrderId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterEstado('');
    setFilterHotel('');
    setFilterProveedor('');
    setFilterProducto('');
    setFilterEncargado('');
    setFilterHabitacion('');
    setFilterFechaDesde('');
    setFilterFechaHasta('');
    setFilterSearch('');
  };

  // Opciones únicas de cada campo
  const hoteles = [...new Set(orders.map(o => o.hotel))].sort();
  const proveedores = [...new Set(orders.map(o => o.proveedor_nombre))].sort();
  const encargados = [...new Set(orders.map(o => o.encargado_nombre))].sort();
  const productos = [...new Set(orders.flatMap(o => (o.items || []).map(i => i.producto_nombre)).filter(Boolean))].sort();
  const habitaciones = [...new Set(orders.flatMap(o => (o.items || []).map(i => i.habitacion)).filter(Boolean))].sort();

  const anyFilter = filterEstado || filterHotel || filterProveedor || filterProducto ||
    filterEncargado || filterHabitacion || filterFechaDesde || filterFechaHasta || filterSearch;

  const filtered = orders.filter(order => {
    if (filterEstado && order.estado !== filterEstado) return false;
    if (filterHotel && order.hotel !== filterHotel) return false;
    if (filterProveedor && order.proveedor_nombre !== filterProveedor) return false;
    if (filterEncargado && order.encargado_nombre !== filterEncargado) return false;
    if (filterFechaDesde && order.fecha < filterFechaDesde) return false;
    if (filterFechaHasta && order.fecha > filterFechaHasta) return false;
    if (filterProducto && !(order.items || []).some(i => i.producto_nombre === filterProducto)) return false;
    if (filterHabitacion && !(order.items || []).some(i => i.habitacion === filterHabitacion)) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const enItems = (order.items || []).some(i =>
        (i.producto_nombre || '').toLowerCase().includes(q) ||
        (i.habitacion || '').toLowerCase().includes(q) ||
        (i.motivo || '').toLowerCase().includes(q)
      );
      return (
        order.numero.toLowerCase().includes(q) ||
        order.proveedor_nombre.toLowerCase().includes(q) ||
        order.encargado_nombre.toLowerCase().includes(q) ||
        order.hotel.toLowerCase().includes(q) ||
        enItems
      );
    }
    return true;
  });

  const handlePrint = (order) => {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;

    const itemsRows = (order.items || []).map(item => `
      <tr>
        <td>${item.producto_nombre}</td>
        <td>${item.cantidad}</td>
        <td>${item.habitacion || '-'}</td>
        <td>${item.motivo || '-'}</td>
      </tr>
    `).join('');

    const [y, m, d] = (order.fecha || '').split('-');
    const fechaFmt = `${d}/${m}/${y}`;

    const firmaGerente = order.firma_gerente
      ? (order.firma_gerente.startsWith('data:')
          ? `<img src="${order.firma_gerente}" alt="Firma gerente" style="max-height: 70px; border: 1px solid #ddd;" />`
          : `<div style="font-family: Georgia, serif; font-size: 20px; font-style: italic; padding: 8px 0; border-bottom: 1px solid #aaa; min-width: 160px;">${order.firma_gerente}</div>`)
      : '<em>Sin firma</em>';

    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Orden ${order.numero}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 30px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .meta { display: flex; gap: 30px; margin: 16px 0; flex-wrap: wrap; }
          .meta-item label { font-size: 11px; color: #666; text-transform: uppercase; display: block; }
          .meta-item span { font-size: 15px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #f5f5f5; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; border: 1px solid #ddd; }
          td { padding: 8px 10px; border: 1px solid #ddd; }
          .sigs { display: flex; gap: 40px; margin-top: 30px; }
          .sig-box { flex: 1; }
          .sig-box label { font-size: 11px; color: #666; text-transform: uppercase; display: block; margin-bottom: 6px; }
          .notas { margin-top: 16px; padding: 12px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 6px; }
        </style>
      </head>
      <body>
        <h1>Orden de Compra ${order.numero}</h1>
        <div class="meta">
          <div class="meta-item"><label>Hotel</label><span>${order.hotel}</span></div>
          <div class="meta-item"><label>Fecha</label><span>${fechaFmt}</span></div>
          <div class="meta-item"><label>Proveedor</label><span>${order.proveedor_nombre}</span></div>
          <div class="meta-item"><label>Estado</label><span>${order.estado}</span></div>
          <div class="meta-item"><label>Encargado</label><span>${order.encargado_nombre}</span></div>
        </div>
        <table>
          <thead>
            <tr><th>Producto</th><th>Cantidad</th><th>Habitación</th><th>Motivo</th></tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
        ${order.notas ? `<div class="notas"><strong>Notas:</strong> ${order.notas}</div>` : ''}
        <div class="sigs">
          <div class="sig-box">
            <label>Firma Encargado (${order.encargado_nombre})</label>
            ${renderFirmaEncargado(order.firma_encargado)}
          </div>
          ${order.gerente_nombre ? `
          <div class="sig-box">
            <label>Firma Gerente (${order.gerente_nombre})</label>
            ${firmaGerente}
          </div>` : ''}
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
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
          <h1>Órdenes de Compra</h1>
          <p>{filtered.length} orden{filtered.length !== 1 ? 'es' : ''} encontrada{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {user?.rol === 'encargado' && (
          <button className="btn btn-primary" onClick={() => navigate('/ordenes/nueva')}>
            ➕ Nueva Orden
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>🔍 Filtros</span>
          {anyFilter && (
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              ✕ Limpiar todos
            </button>
          )}
        </div>

        {/* Fila 1: Búsqueda + Estado + Hotel + Encargado */}
        <div className="filter-bar" style={{ marginBottom: '12px' }}>
          <div className="form-group" style={{ flex: '2', minWidth: '200px' }}>
            <label className="form-label">Buscar texto</label>
            <input
              type="text"
              className="form-control"
              placeholder="Número, motivo, cualquier campo..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ minWidth: '150px' }}>
            <label className="form-label">Estado</label>
            <select className="form-select" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="PENDIENTE">⏳ Pendiente</option>
              <option value="APROBADA">✅ Aprobada</option>
              <option value="RECHAZADA">❌ Rechazada</option>
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '140px' }}>
            <label className="form-label">Hotel</label>
            <select className="form-select" value={filterHotel} onChange={e => setFilterHotel(e.target.value)}>
              <option value="">Todos</option>
              {hoteles.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '160px' }}>
            <label className="form-label">Encargado</label>
            <select className="form-select" value={filterEncargado} onChange={e => setFilterEncargado(e.target.value)}>
              <option value="">Todos</option>
              {encargados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {/* Fila 2: Proveedor + Producto + Habitación + Fechas */}
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <div className="form-group" style={{ minWidth: '180px' }}>
            <label className="form-label">Proveedor</label>
            <select className="form-select" value={filterProveedor} onChange={e => setFilterProveedor(e.target.value)}>
              <option value="">Todos</option>
              {proveedores.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '180px' }}>
            <label className="form-label">Producto</label>
            <select className="form-select" value={filterProducto} onChange={e => setFilterProducto(e.target.value)}>
              <option value="">Todos</option>
              {productos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '140px' }}>
            <label className="form-label">Habitación</label>
            <select className="form-select" value={filterHabitacion} onChange={e => setFilterHabitacion(e.target.value)}>
              <option value="">Todas</option>
              {habitaciones.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '150px' }}>
            <label className="form-label">Fecha desde</label>
            <input
              type="date"
              className="form-control"
              value={filterFechaDesde}
              onChange={e => setFilterFechaDesde(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ minWidth: '150px' }}>
            <label className="form-label">Fecha hasta</label>
            <input
              type="date"
              className="form-control"
              value={filterFechaHasta}
              onChange={e => setFilterFechaHasta(e.target.value)}
            />
          </div>
        </div>

        {/* Resumen de filtros activos */}
        {anyFilter && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {filterEstado && <span className={`badge badge-${filterEstado}`}>{filterEstado}</span>}
            {filterHotel && <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid #bfdbfe' }}>🏨 {filterHotel}</span>}
            {filterEncargado && <span className="badge" style={{ background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>👤 {filterEncargado}</span>}
            {filterProveedor && <span className="badge" style={{ background: '#fdf4ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>🏪 {filterProveedor}</span>}
            {filterProducto && <span className="badge" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>📦 {filterProducto}</span>}
            {filterHabitacion && <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>🚪 Hab. {filterHabitacion}</span>}
            {filterFechaDesde && <span className="badge" style={{ background: '#f8fafc', color: 'var(--text)', border: '1px solid var(--border)' }}>Desde {formatDate(filterFechaDesde)}</span>}
            {filterFechaHasta && <span className="badge" style={{ background: '#f8fafc', color: 'var(--text)', border: '1px solid var(--border)' }}>Hasta {formatDate(filterFechaHasta)}</span>}
            {filterSearch && <span className="badge" style={{ background: '#f8fafc', color: 'var(--text)', border: '1px solid var(--border)' }}>🔍 "{filterSearch}"</span>}
          </div>
        )}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <p>No se encontraron órdenes con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Hotel</th>
                  <th>Proveedor</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Encargado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className={`row-${order.estado}`}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '15px' }}>
                      {order.numero}
                    </td>
                    <td>{order.hotel}</td>
                    <td>{order.proveedor_nombre}</td>
                    <td>{formatDate(order.fecha)}</td>
                    <td>
                      <span className={`badge badge-${order.estado}`}>
                        {order.estado === 'PENDIENTE' && '⏳ '}
                        {order.estado === 'APROBADA' && '✅ '}
                        {order.estado === 'RECHAZADA' && '❌ '}
                        {order.estado}
                      </span>
                    </td>
                    <td>{order.encargado_nombre}</td>
                    <td>
                      {deletingOrderId === order.id ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 600 }}>¿Eliminar?</span>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(order.id)}
                            disabled={deleteLoading}
                          >
                            {deleteLoading ? '...' : 'Sí'}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDeletingOrderId(null)}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/ordenes/${order.id}`)}
                          >
                            Ver
                          </button>
                          {(user?.rol === 'gerente' || order.estado === 'APROBADA') && (
                            <button
                              className="btn btn-secondary btn-sm no-print"
                              onClick={() => handlePrint(order)}
                              title="Imprimir"
                            >
                              🖨️
                            </button>
                          )}
                          {user?.rol === 'gerente' && (
                            <button
                              className="btn btn-danger btn-sm no-print"
                              onClick={() => { setDeletingOrderId(order.id); setError(''); }}
                              title="Eliminar orden"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      )}
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
