'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useParams } from 'next/navigation';

function estadoBadge(estado) {
  const cls = { PENDIENTE: 'badge-pendiente', APROBADA: 'badge-aprobada', RECHAZADA: 'badge-rechazada' };
  return <span className={`badge ${cls[estado] || ''}`}>{estado}</span>;
}

export default function OrdenDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [firmaGerente, setFirmaGerente] = useState('');
  const [notasGerente, setNotasGerente] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/ordenes/${id}`)
      .then(r => r.json())
      .then(data => {
        setOrden(data);
        setFirmaGerente(data.firma_gerente || '');
        setNotasGerente(data.notas_gerente || '');
        setLoading(false);
      })
      .catch(() => { setError('Error al cargar la orden'); setLoading(false); });
  }, [id]);

  const handleDecision = async (estado) => {
    if (!firmaGerente.trim()) { setError('Debe ingresar su firma'); return; }
    setSaving(true);
    setError('');
    const res = await fetch(`/api/ordenes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado, firma_gerente: firmaGerente, notas_gerente: notasGerente }),
    });
    if (res.ok) {
      setOrden(prev => ({ ...prev, estado, firma_gerente: firmaGerente, notas_gerente: notasGerente }));
    } else {
      const d = await res.json();
      setError(d.error || 'Error');
    }
    setSaving(false);
  };

  const handlePrint = () => {
    const items = orden.items || [];
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

  if (loading) return <div className="container" style={{ padding:40, textAlign:'center', color:'#777' }}>Cargando...</div>;
  if (!orden || orden.error) return <div className="container"><div className="alert alert-error">{orden?.error || 'Orden no encontrada'}</div></div>;

  const canPrint = user?.rol === 'gerente' || orden.estado === 'APROBADA';

  return (
    <div className="container">
      <div className="page-header">
        <h1>Orden #{orden.id} {estadoBadge(orden.estado)}</h1>
        <div className="actions-bar no-print">
          {canPrint && <button className="btn btn-secondary" onClick={handlePrint}>🖨️ Imprimir</button>}
          <button className="btn btn-outline" onClick={() => router.push('/ordenes')}>← Volver</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h2>Datos Generales</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div><strong>Hotel:</strong> {orden.hotel}</div>
          <div><strong>Proveedor:</strong> {orden.proveedor}</div>
          <div><strong>Encargado:</strong> {orden.encargado_nombre}</div>
          <div><strong>Fecha:</strong> {new Date(orden.created_at).toLocaleString('es-AR')}</div>
          <div><strong>Firma encargado:</strong> <em style={{ fontFamily:'Georgia, serif' }}>{orden.firma_encargado || '-'}</em></div>
          {orden.firma_gerente && <div><strong>Firma gerente:</strong> <em style={{ fontFamily:'Georgia, serif' }}>{orden.firma_gerente}</em></div>}
        </div>
        {orden.notas_gerente && (
          <div style={{ marginTop:12 }}>
            <strong>Notas del gerente:</strong> {orden.notas_gerente}
          </div>
        )}
      </div>

      <div className="card">
        <h2>Productos</h2>
        <div className="table-wrapper">
          <table className="items-table">
            <thead>
              <tr><th>#</th><th>Producto</th><th>Cantidad</th><th>Habitación</th><th>Motivo</th></tr>
            </thead>
            <tbody>
              {(orden.items || []).map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.producto_nombre}</td>
                  <td>{item.cantidad}</td>
                  <td>{item.habitacion || '-'}</td>
                  <td>{item.motivo || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {user?.rol === 'gerente' && orden.estado === 'PENDIENTE' && (
        <div className="card no-print">
          <h2>Decisión del Gerente</h2>
          <div className="form-group">
            <label className="form-label">Firma Gerente *</label>
            <input
              type="text"
              className="form-control"
              value={firmaGerente}
              onChange={e => setFirmaGerente(e.target.value)}
              placeholder="Escriba su nombre completo"
              style={{ fontStyle:'italic', fontFamily:'Georgia, serif', fontSize:'1rem' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notas (opcional)</label>
            <textarea
              className="form-control"
              value={notasGerente}
              onChange={e => setNotasGerente(e.target.value)}
              rows={3}
              placeholder="Observaciones..."
            />
          </div>
          <div className="actions-bar">
            <button className="btn btn-success" onClick={() => handleDecision('APROBADA')} disabled={saving}>
              ✓ Aprobar
            </button>
            <button className="btn btn-danger" onClick={() => handleDecision('RECHAZADA')} disabled={saving}>
              ✗ Rechazar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
