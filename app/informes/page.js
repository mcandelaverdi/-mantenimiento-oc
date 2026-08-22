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
    if (user && user.rol !== 'gerente') router.push('/ordenes');
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

  if (user?.rol !== 'gerente') return null;

  const habitaciones = [...new Set(datos.map(d => d.habitacion))];

  return (
    <div className="container">
      <div className="page-header">
