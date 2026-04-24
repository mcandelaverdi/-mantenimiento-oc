import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

const firmaTextStyle = {
  padding: '14px 18px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontFamily: 'Georgia, serif',
  fontSize: '22px',
  fontStyle: 'italic',
  color: 'var(--text)',
  background: '#fafafa',
  borderBottom: '2px solid var(--text)'
};

function FirmaDisplay({ firma }) {
  if (!firma) {
    return <div style={{ color: 'var(--text-light)', fontStyle: 'italic', padding: '12px 0' }}>Sin firma</div>;
  }
  if (firma.startsWith('data:')) {
    return (
      <div className="signature-display">
        <img src={firma} alt="Firma" />
      </div>
    );
  }
  return <div style={firmaTextStyle}>{firma}</div>;
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Approval/rejection form
  const [actionMode, setActionMode] = useState(null); // 'approve' | 'reject'
  const [gerenteFirma, setGerenteFirma] = useState('');
  const [notas, setNotas] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (err) {
        setError('Error al cargar la orden');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const handleAction = async () => {
    setActionError('');

    if (!gerenteFirma || gerenteFirma.trim() === '') {
      setActionError('Debe escribir su nombre como firma');
      return;
    }
    if (actionMode === 'reject' && (!notas || notas.trim() === '')) {
      setActionError('Debe ingresar un motivo de rechazo en las notas');
      return;
    }

    setActionLoading(true);
    try {
      const endpoint = actionMode === 'approve' ? `/orders/${id}/approve` : `/orders/${id}/reject`;
      const res = await api.put(endpoint, {
        firma_gerente: gerenteFirma.trim(),
        notas: notas || null
      });
      setOrder(res.data);
      setActionMode(null);
      setGerenteFirma('');
      setNotas('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al procesar la acción';
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/orders/${id}`);
      navigate('/ordenes');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la orden');
      setShowDeleteConfirm(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePrint = () => {
    if (!order) return;
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

    const firmaEncargadoHtml = (() => {
      if (!order.firma_encargado) return '<em>Sin firma</em>';
      if (order.firma_encargado.startsWith('data:')) {
        return `<img src="${order.firma_encargado}" alt="Firma" style="max-height: 70px; border: 1px solid #ddd; display: block;" />`;
      }
      return `<div style="font-family: Georgia, serif; font-size: 20px; font-style: italic; padding: 8px 0; border-bottom: 1px solid #aaa; min-width: 160px;">${order.firma_encargado}</div>`;
    })();

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
          <div class="meta-item"><label>Fecha</label><span>${formatDate(order.fecha)}</span></div>
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
        ${order.notas ? `<div class="notas"><strong>Notas / Motivo:</strong> ${order.notas}</div>` : ''}
        <div class="sigs">
          <div class="sig-box">
            <label>Firma Encargado — ${order.encargado_nombre}</label>
            ${firmaEncargadoHtml}
          </div>
          ${order.gerente_nombre ? `
          <div class="sig-box">
            <label>Firma Gerente — ${order.gerente_nombre}</label>
            ${order.firma_gerente
              ? (order.firma_gerente.startsWith('data:')
                  ? `<img src="${order.firma_gerente}" alt="Firma gerente" style="max-height: 80px; border: 1px solid #ddd; display: block;" />`
                  : `<div style="font-family: Georgia, serif; font-size: 20px; font-style: italic; padding: 8px 0; border-bottom: 1px solid #aaa; min-width: 160px;">${order.firma_gerente}</div>`)
              : '<em>Sin firma</em>'}
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

  if (error || !order) {
    return (
      <div>
        <div className="page-header">
          <h1>Orden de Compra</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/ordenes')}>Volver</button>
        </div>
        <div className="alert alert-error">{error || 'Orden no encontrada'}</div>
      </div>
    );
  }

  const canAct = user?.rol === 'gerente' && order.estado === 'PENDIENTE';

  return (
    <div>
      <div className="page-header no-print">
        <div>
          <h1>Detalle de Orden</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary no-print" onClick={() => navigate('/ordenes')}>
            ← Volver
          </button>
          {(user?.rol === 'gerente' || order?.estado === 'APROBADA') && (
            <button className="btn btn-secondary btn-print no-print" onClick={handlePrint}>
              🖨️ Imprimir
            </button>
          )}
          {user?.rol === 'gerente' && (
            <button
              className="btn btn-danger no-print"
              onClick={() => setShowDeleteConfirm(true)}
            >
              🗑️ Eliminar Orden
            </button>
          )}
        </div>
      </div>

      {/* Confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Eliminar Orden</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <p style={{ fontSize: '16px', color: 'var(--text)', margin: '0 0 8px' }}>
              ¿Está seguro que desea eliminar la orden <strong>{order.numero}</strong>?
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-light)', margin: 0 }}>
              Esta acción no se puede deshacer. La orden y todos sus productos serán eliminados permanentemente.
            </p>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Header */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="order-detail-header">
          <div className="order-number">{order.numero}</div>
          <span className={`badge badge-${order.estado}`} style={{ fontSize: '15px', padding: '6px 16px' }}>
            {order.estado === 'PENDIENTE' && '⏳ '}
            {order.estado === 'APROBADA' && '✅ '}
            {order.estado === 'RECHAZADA' && '❌ '}
            {order.estado}
          </span>
        </div>

        <div className="order-meta" style={{ marginTop: '20px' }}>
          <div className="order-meta-item">
            <label>Hotel</label>
            <span>{order.hotel}</span>
          </div>
          <div className="order-meta-item">
            <label>Fecha</label>
            <span>{formatDate(order.fecha)}</span>
          </div>
          <div className="order-meta-item">
            <label>Proveedor</label>
            <span>{order.proveedor_nombre}</span>
          </div>
          <div className="order-meta-item">
            <label>Encargado</label>
            <span>{order.encargado_nombre}</span>
          </div>
          {order.gerente_nombre && (
            <div className="order-meta-item">
              <label>Gerente</label>
              <span>{order.gerente_nombre}</span>
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 className="card-title">Productos</h2>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Habitación</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, i) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-light)', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.producto_nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.habitacion || '-'}</td>
                    <td>{item.motivo || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)' }}>Sin productos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signatures */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 className="card-title">Firmas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div>
            <div className="form-label" style={{ marginBottom: '10px' }}>
              Firma del Encargado — {order.encargado_nombre}
            </div>
            <FirmaDisplay firma={order.firma_encargado} />
          </div>

          {order.gerente_nombre && (
            <div>
              <div className="form-label" style={{ marginBottom: '10px' }}>
                Firma del Gerente — {order.gerente_nombre}
              </div>
              <FirmaDisplay firma={order.firma_gerente} />
            </div>
          )}
        </div>

        {order.notas && (
          <div style={{ marginTop: '20px' }}>
            <div className="form-label">Notas / Motivo</div>
            <div style={{
              background: order.estado === 'RECHAZADA' ? 'var(--red-bg)' : 'var(--bg)',
              border: `1px solid ${order.estado === 'RECHAZADA' ? 'var(--red-border)' : 'var(--border)'}`,
              borderRadius: '8px',
              padding: '14px 16px',
              fontSize: '15px',
              color: 'var(--text)'
            }}>
              {order.notas}
            </div>
          </div>
        )}
      </div>

      {/* Approve / Reject actions for gerente */}
      {canAct && (
        <div className="card no-print">
          <h2 className="card-title">Acción del Gerente</h2>

          {!actionMode && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-success"
                onClick={() => setActionMode('approve')}
              >
                ✅ Aprobar Orden
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setActionMode('reject')}
              >
                ❌ Rechazar Orden
              </button>
            </div>
          )}

          {actionMode && (
            <div className={`action-section ${actionMode === 'approve' ? 'approve' : 'reject'}`}>
              <h3 style={{ margin: '0 0 16px', fontSize: '17px', color: actionMode === 'approve' ? 'var(--green)' : 'var(--red)' }}>
                {actionMode === 'approve' ? '✅ Aprobar Orden' : '❌ Rechazar Orden'}
              </h3>

              {actionError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {actionError}</div>}

              <div className="form-group">
                <label className="form-label">
                  Notas {actionMode === 'reject' && <span className="required">* (requerido para rechazo)</span>}
                </label>
                <textarea
                  className="form-control"
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder={actionMode === 'reject' ? 'Indique el motivo del rechazo...' : 'Observaciones opcionales...'}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Nombre del Gerente (firma) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Escriba su nombre completo"
                  value={gerenteFirma}
                  onChange={e => setGerenteFirma(e.target.value)}
                  style={{ fontSize: '20px', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setActionMode(null);
                    setGerenteFirma('');
                    setNotas('');
                    setActionError('');
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={`btn ${actionMode === 'approve' ? 'btn-success' : 'btn-danger'}`}
                  onClick={handleAction}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? 'Procesando...'
                    : actionMode === 'approve'
                    ? 'Confirmar Aprobación'
                    : 'Confirmar Rechazo'
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
