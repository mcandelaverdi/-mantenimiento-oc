'use client';
import { useState, useEffect } from 'react';
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
  const
