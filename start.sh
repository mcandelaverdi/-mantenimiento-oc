#!/bin/bash

# Start both backend and frontend dev servers
echo "Iniciando Órdenes de Compra - Mantenimiento Hotelero"
echo "======================================================"
echo ""

# Start backend
echo "Iniciando backend en http://localhost:3001 ..."
cd "$(dirname "$0")/backend" && node server.js &
BACKEND_PID=$!

sleep 1

# Start frontend
echo "Iniciando frontend en http://localhost:5173 ..."
cd "$(dirname "$0")/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "======================================================"
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo ""
echo "Cuentas de demo:"
echo "  encargado@hotel.com / encargado123"
echo "  gerente@hotel.com   / gerente123"
echo ""
echo "Presiona Ctrl+C para detener los servidores"
echo "======================================================"

# Wait and handle Ctrl+C
trap "echo 'Deteniendo servidores...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
