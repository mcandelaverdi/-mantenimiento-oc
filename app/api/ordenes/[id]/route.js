'use client';
import { useState, useEffect, useCallback } from 'react';
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

  const fetchOrden = useCallback(async () => {
    try {
      const res = await fetch(`/api/ordenes/${id}`);
      const data = await res.json();
      setOrden(data);
      setFirmaGerente(data.firma_gerente || '');
      setNotasGerente(data.notas_gerente || '');
      setNroOrden(data.nro_orden || '');
    } catch (e) {
      setError('Error al cargar la orden');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrden(); }, [fetchOrden]);

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
      await fetchOrden();
    } else {
      const d = await res.json();
      setError(d.error || 'Error');
    }
    setSaving(false);
  };

  const handlePrint = () => {
    const items = orden.items || [];
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Orden</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;font-size:13px}
        h2{color:#1a237e;margin-bottom:4px}
        table{width:100%;border-collapse:collapse;margin-top:12px}
