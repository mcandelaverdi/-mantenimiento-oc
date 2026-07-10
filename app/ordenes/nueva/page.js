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
