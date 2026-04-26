'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const HOTELES = ['VALLES', 'PRINCE', 'AMERICA', 'VIPS', 'KING'];
const ESTADOS = ['PENDIENTE', 'APROBADA', 'RECHAZADA'];

function estadoBadge(estado) {
  const cls = { PENDIENTE: 'badge-pendiente', APROBADA: 'badge-aprobada', RECHAZADA: 'badge-rechazada' };
  return <span className={`badge ${cls[estado] || ''}`}>{estado}</span>;
}

export default function OrdenesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ hotel: '', proveedor: '', estado: '', producto: '', habitacion: '' });

  const fetchOrdenes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.hotel) params.set('hotel', filters.hotel);
    if (filters.proveedor) params.set('proveedor', filters.proveedor);
    if (filters.estado) params.set('estado', filters.estado);
    const res = await fetch(`/api/ordenes?${params}`);
    const data = await res.json();
    setOrdenes(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filters.hotel, filters.proveedor, filters.estado]);

  useEffect(() => { fetchOrdenes(); }, [fetchOrdenes]);

  const ordenesFiltradas = ordenes.filter(o => {
    if (filters.producto && !(o.items || []).some(it => it.producto_nombre?.toLowerCase().includes(filters.producto.toLowerCase()))) return false;
    if (filters.habitacion && !(o.items || []).some(it => it.habitacion?.toLowerCase().includes(filters.habitacion.toLowerCase()))) return false;
    return true;
  });

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta orden?')) return;
    await fetch(`/api/ordenes/${id}`, { method: 'DELETE' });
    fetchOrdenes();
  };

  const handlePrint = async (orden) => {
    const res = await fetch(`/api/ordenes/${orden.id}`);
    const data = await res.json();
    const items = data.items || [];
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Orden #${orden.id}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;font-size:13px}
        h2{color:#1a237e;margin-bottom:4px}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
        th{background:#e8eaf6}
        .info{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
        .info-item{font-size:12px} .info-item strong{display:block;color:#555}
        .firma{margin-top:20px;display:flex;gap:40px}
        .firma-box{flex:1;border-top:1px solid #333;padding-top:6px;font-size:12px}
      </style></head><body>
      <h2>Orden de Compra #${orden.id}</h2>
      <div class="info">
        <div class="info-item"><strong>Hotel</strong>${orden.hotel}</div>
        <div class="info-item"><strong>Proveedor</strong>${orden.proveedor}</div>
        <div class="info-item"><strong>Estado</strong>${orden.estado}</div>
        <div class="info-item"><strong>Encargado</strong>${orden.encargado_nombre || ''}</div>
        <div class="info-item"><strong>Fecha</strong>${new Date(orden.created_at).toLocaleDateString('es-AR')}</div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Producto</th><th>Cantidad</th><th>Habitación</th><th>Motivo</th></tr></thead>
        <tbody>${items.map((it,i) => `<tr><td>${i+1}</td><td>${it.producto_nombre}</td><td>${it.cantidad}</td><td>${it.habitacion||''}</td><td>${it.motivo||''}</td></tr>`).join('')}</tbody>
      </table>
      <div class="firma">
        <div class="firma-box">Firma Encargado<br/><em>${orden.firma_encargado || ''}</em></div>
        <div class="firma-box">Firma Gerente<br/><em>${orden.firma_gerente || ''}</em></div>
      </div>
      ${orden.notas_gerente ? `<p style="margin-top:12px;font-size:12px"><strong>Notas:</strong> ${orden.notas_gerente}</p>` : ''}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const stats = {
    total: ordenes.length,
    pendiente: ordenes.filter(o => o.estado === 'PENDIENTE').length,
    aprobada: ordenes.filter(o => o.estado === 'APROBADA').length,
    rechazada: ordenes.filter(o => o.estado === 'RECHAZADA').length,
  };

  const limpiarFiltros = () => setFilters({ hotel: '', proveedor: '', estado: '', producto: '', habitacion: '' });
  const hayFiltros = Object.values(filters).some(v => v !== '');

  return (
    <div className="container">
      <div className="page-header">
        <h1>Órdenes de Compra</h1>
        {user?.rol === 'encargado' && (
          <Link href="/ordenes/nueva" className="btn btn-primary">+ Nueva Orden</Link>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-total"><div className="stat-number">{stats.total}</div><div className="stat-label">Total</div></div>
        <div className="stat-card stat-pendiente"><div className="stat-number">{stats.pendiente}</div><div className="stat-label">Pendientes</div></div>
        <div className="stat-card stat-aprobada"><div className="stat-number">{stats.aprobada}</div><div className="stat-label">Aprobadas</div></div>
        <div className="stat-card stat-rechazada"><div className="stat-number">{stats.rechazada}</div><div className="stat-label">Rechazadas</div></div>
      </div>

      <div className="card">
        <div className="filters-bar no-print">
          <div className="form-group">
            <label className="form-label">Hotel</label>
            <select className="form-control" value={filters.hotel} onChange={e => setFilters(f => ({...f, hotel: e.target.value}))}>
              <option value="">Todos</option>
              {HOTELES.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Proveedor</label>
            <input type="text" className="form-control" placeholder="Buscar..." value={filters.proveedor} onChange={e => setFilters(f => ({...f, proveedor: e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select className="form-control" value={filters.estado} onChange={e => setFilters(f => ({...f, estado: e.target.value}))}>
              <option value="">Todos</option>
              {ESTADOS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Producto</label>
            <input type="text" className="form-control" placeholder="Buscar producto..." value={filters.producto} onChange={e => setFilters(f => ({...f, producto: e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Habitación / Sector</label>
            <input type="text" className="form-control" placeholder="Buscar habitación..." value={filters.habitacion} onChange={e => setFilters(f => ({...f, habitacion: e.target.value}))} />
          </div>
          {hayFiltros && <button className="btn btn-secondary btn-sm" onClick={limpiarFiltros}>Limpiar</button>}
        </div>

        {hayFiltros && (
          <p style={{ fontSize: 13, color: '#777', marginBottom: 12 }}>
            Mostrando <strong>{ordenesFiltradas.length}</strong> de {ordenes.length} órdenes
          </p>
        )}

        {loading ? (
          <p style={{ textAlign:'center', color:'#777', padding:'40px' }}>Cargando...</p>
        ) : ordenesFiltradas.length === 0 ? (
          <p style={{ textAlign:'center', color:'#777', padding:'40px' }}>No hay órdenes</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Hotel</th>
                  <th>Proveedor</th>
                  <th>Encargado</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenesFiltradas.map(o => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.hotel}</td>
                    <td>{o.proveedor}</td>
                    <td>{o.encargado_nombre || '-'}</td>
                    <td>{estadoBadge(o.estado)}</td>
                    <td>{new Date(o.created_at).toLocaleDateString('es-AR')}</td>
                    <td>
                      <div className="actions-bar">
                        <button className="btn btn-outline btn-sm" onClick={() => router.push(`/ordenes/${o.id}`)}>Ver</button>
                        {(user?.rol === 'gerente' || o.estado === 'APROBADA') && (
                          <button className="btn btn-secondary btn-sm no-print" onClick={() => handlePrint(o)}>🖨️</button>
                        )}
                        {user?.rol === 'gerente' && (
                          <button className="btn btn-danger btn-sm no-print" onClick={() => handleDelete(o.id)}>🗑️</button>
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
