'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter, useParams } from 'next/navigation';

function estadoBadge(estado) {
  const cls = { 
    PENDIENTE: 'badge-pendiente', 
    APROBADA: 'badge-aprobada', 
    'RECHAZADA POR FALTA DE PRODUCTO': 'badge-rechazada' 
  };
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
  const [nroOrden, setNroOrden] = useState('');

  useEffect(() => {
    fetch(`/api/ordenes/${id}`)
      .then(r => r.json())
      .then(data => {
        setOrden(data);
        setFirmaGerente(data.firma_gerente || '');
        setNotasGerente(data.notas_gerente || '');
        setNroOrden(data.nro_orden || '');
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
      <html><head><title>Orden #${nroOrden || orden.id}</title>
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
      <h2>Orden de Compra ${nroOrden ? '#' + nroOrden : '#' + orden.id}</h2>
