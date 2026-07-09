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
      method:
