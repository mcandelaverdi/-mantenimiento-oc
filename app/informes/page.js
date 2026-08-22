'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

const HOTELES = ['VALLES', 'PRINCE', 'AMERICA', 'VIPS', 'KING'];

export default function InformesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hotel, setHotel] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [buscado, setBuscado] = useState(false);

  useEffect(() => {
    if (user && user.usuario !== 'gisela') router.push('/ordenes');
  }, [user, router]);

  const buscar = async () => {
    setLoading(true);
    setBuscado(true);
    const params = new URLSearchParams();
    if (hotel) params.set('hotel', hotel);
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    const res = await fetch(`/api/informes?${params}`);
    const data = await res.json();
    setDatos(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handlePrint = () => window.print();

  if (user?.usuario !== 'gisela') return null;

  const habitaciones = [...new Set(datos.map(d => d.habitacion))];

  return (
    <div className="container">
      <div className="page-header">
        <h1>Informe de Arreglos por Habitacion</h1>
        {buscado && datos.length > 0 && (
          <button className="btn btn-secondary no-print" onClick={handlePrint}>Imprimir</button>
        )}
      </div>

      <div className="card no-print">
        <h2>Filtros</h2>
        <div className="input-row">
          <div className="form-group">
            <label className="form-label">Hotel</label>
            <select className="form-control" value={hotel} onChange={e => setHotel(e.target.value)}>
              <option value="">Todos</option>
              {HOTELES.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Desde</label>
            <input type="date" className="form-control" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Hasta</label>
            <input type="date" className="form-control" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={buscar} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {buscado && !loading && (
        <>
          {datos.length === 0 ? (
            <div className="card"><p style={{ color: '#777', textAlign: 'center' }}>No hay resultados para los filtros seleccionados.</p></div>
          ) : (
            <>
              <div style={{ marginBottom: 16, fontSize: 14, color: '#555' }}>
                <strong>{habitaciones.length}</strong> habitaciones con arreglos · <strong>{datos.length}</strong> productos distintos
              </div>
              {habitaciones.map(hab => {
                const items = datos.filter(d => d.habitacion === hab);
                return (
                  <div key={hab} className="card" style={{ marginBottom: 16 }}>
                    <h2 style={{ marginBottom: 12 }}>
                      Habitacion {hab}
                      {items[0]?.hotel && <span style={{ fontSize: 13, color: '#777', fontWeight: 400, marginLeft: 8 }}>— {items[0].hotel}</span>}
                    </h2>
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad total</th>
                            <th>Ordenes</th>
                            <th>Ultima compra</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, i) => (
                            <tr key={i}>
                              <td>{item.producto_nombre}</td>
                              <td>{item.total_cantidad}</td>
                              <td>{item.total_ordenes}</td>
                              <td>{new Date(item.ultima_fecha).toLocaleDateString('es-AR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}
