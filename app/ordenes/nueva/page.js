'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

const HOTELES = ['VALLES', 'PRINCE', 'AMERICA', 'VIPS', 'KING'];
const PRODUCTOS_SUGERIDOS = [
  'Pintura latex', 'Pincel', 'Rodillo', 'Lija', 'Masilla',
  'Ceramica', 'Adhesivo ceramico', 'Pastina', 'Sellador',
  'Cano PVC', 'Codo PVC', 'Llave de paso', 'Sifon',
  'Cable electrico', 'Llave termica', 'Tomacorriente', 'Interruptor',
  'Foco LED', 'Lampara', 'Flexo', 'Cerradura', 'Bisagra',
  'Silicona', 'Espuma expansiva', 'Cinta aisladora',
];

const emptyItem = () => ({ producto_nombre: '', cantidad: '', habitacion: '', otro_sector: '', motivo: '' });

export default function NuevaOrdenPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [hotel, setHotel] = useState(user?.hotel || '');
  const [proveedor, setProveedor] = useState('');
  const [firmaEncargado, setFirmaEncargado] = useState(user?.nombre || '');
  const [items, setItems] = useState([emptyItem()]);
  const [proveedores, setProveedores] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] =
