import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (err) {
        setError('Error al cargar las órdenes');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const stats = {
    total: orders.length,
    pendientes: orders.filter(o => o.estado === 'PENDIENTE').length,
    aprobadas: orders.filter(o => o.estado === 'APROBADA').length,
    rechazadas: orders.filter(o => o.estado === 'RECHAZADA').length
  };

  const recentOrders = orders.slice(0, 10);

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
          <h1>Dashboard</h1>
          <p>Resumen general de órdenes de compra</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon total">📦</div>
          <div className="stat-card-info">
            <div className="stat-card-value">{stats.total}</div>
            <div className="stat-card-label">Total Órdenes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon pendiente">⏳</div>
          <div className="stat-card-info">
            <div className="stat-card-value" style={{ color: 'var(--orange)' }}>{stats.pendientes}</div>
            <div className="stat-card-label">Pendientes</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon aprobada">✅</div>
          <div className="stat-card-info">
            <div className="stat-card-value" style={{ color: 'var(--green)' }}>{stats.aprobadas}</div>
            <div className="stat-card-label">Aprobadas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon rechazada">❌</div>
          <div className="stat-card-info">
            <div className="stat-card-value" style={{ color: 'var(--red)' }}>{stats.rechazadas}</div>
            <div className="stat-card-label">Rechazadas</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Órdenes Recientes</h2>

        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No hay órdenes registradas aún</p>
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
                {recentOrders.map(order => (
                  <tr key={order.id} className={`row-${order.estado}`}>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '15px' }}>
                      {order.numero}
                    </td>
                    <td>{order.hotel}</td>
                    <td>{order.proveedor_nombre}</td>
                    <td>{formatDate(order.fecha)}</td>
                    <td>
                      <span className={`badge badge-${order.estado}`}>
                        {order.estado === 'PENDIENTE' && '⏳'}
                        {order.estado === 'APROBADA' && '✅'}
                        {order.estado === 'RECHAZADA' && '❌'}
                        {' '}{order.estado}
                      </span>
                    </td>
                    <td>{order.encargado_nombre}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/ordenes/${order.id}`)}
                      >
                        Ver
                      </button>
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
