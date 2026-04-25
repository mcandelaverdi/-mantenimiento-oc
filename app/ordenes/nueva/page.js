'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

const HOTELES = ['VALLES', 'PRINCE', 'AMERICA', 'VIPS', 'KING'];
const PRODUCTOS_SUGERIDOS = [
  'Pintura látex', 'Pincel', 'Rodillo', 'Lija', 'Masilla',
  'Cerámica', 'Adhesivo cerámico', 'Pastina', 'Sellador',
  'Caño PVC', 'Codo PVC', 'Llave de paso', 'Sifón',
  'Cable eléctrico', 'Llave térmica', 'Tomacorriente', 'Interruptor',
  'Foco LED', 'Lámpara', 'Flexo', 'Cerradura', 'Bisagra',
  'Silicona', 'Espuma expansiva', 'Cinta aisladora',
];

const emptyItem = () => ({ producto_nombre: '', cantidad: 1, habitacion: '', motivo: '' });

export default function NuevaOrdenPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [hotel, setHotel] = useState(user?.hotel || '');
  const [proveedor, setProveedor] = useState('');
  const [firmaEncargado, setFirmaEncargado] = useState(user?.nombre || '');
  const [items, setItems] = useState([emptyItem()]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user?.rol !== 'encargado') {
    return <div className="container"><div className="alert alert-error">Sin permiso</div></div>;
  }

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const addItem = () => {
    if (items.length < 12) setItems(prev => [...prev, emptyItem()]);
  };

  const removeItem = (idx) => {
    if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validItems = items.filter(it => it.producto_nombre.trim());
    if (!validItems.length) { setError('Debe ingresar al menos un producto'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotel, proveedor, firma_encargado: firmaEncargado, items: validItems }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear orden');
      router.push('/ordenes');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Nueva Orden de Compra</h1>
        <button className="btn btn-secondary" onClick={() => router.push('/ordenes')}>← Volver</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2>Datos Generales</h2>
          <div className="input-row">
            <div className="form-group">
              <label className="form-label">Hotel *</label>
              <select className="form-control" value={hotel} onChange={e => setHotel(e.target.value)} required>
                <option value="">Seleccionar...</option>
                {HOTELES.map(h => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Proveedor *</label>
              <input type="text" className="form-control" value={proveedor} onChange={e => setProveedor(e.target.value)} required placeholder="Nombre del proveedor" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Firma Encargado</label>
            <input
              type="text"
              className="form-control"
              value={firmaEncargado}
              onChange={e => setFirmaEncargado(e.target.value)}
              placeholder="Nombre completo"
              style={{ fontStyle: 'italic', fontFamily: 'Georgia, serif', fontSize: '1rem' }}
            />
          </div>
        </div>

        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h2>Productos ({items.length}/12)</h2>
            {items.length < 12 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>+ Agregar fila</button>
            )}
          </div>
          <div className="table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto *</th>
                  <th>Cantidad</th>
                  <th>Habitación</th>
                  <th>Motivo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        list={`prod-list-${idx}`}
                        value={item.producto_nombre}
                        onChange={e => updateItem(idx, 'producto_nombre', e.target.value)}
                        placeholder="Escribir o elegir..."
                      />
                      <datalist id={`prod-list-${idx}`}>
                        {PRODUCTOS_SUGERIDOS.map(p => <option key={p} value={p} />)}
                      </datalist>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={item.cantidad}
                        onChange={e => updateItem(idx, 'cantidad', parseInt(e.target.value) || 1)}
                        style={{ width: 80 }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={item.habitacion}
                        onChange={e => updateItem(idx, 'habitacion', e.target.value)}
                        placeholder="Ej: 101"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={item.motivo}
                        onChange={e => updateItem(idx, 'motivo', e.target.value)}
                        placeholder="Motivo..."
                      />
                    </td>
                    <td>
                      {items.length > 1 && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display:'flex', gap:12 }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : '💾 Guardar Orden'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => router.push('/ordenes')}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
