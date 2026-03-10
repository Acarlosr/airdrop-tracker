#!/bin/bash
# start.sh — Sobe backend + frontend juntos
# Uso: ./start.sh

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Iniciando Airdrop Tracker..."
echo ""

# Mata processos antigos nas portas 3000 e 5173
lsof -ti :3000 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null
sleep 1

# Backend
echo "▶ Backend  → http://localhost:3000"
cd "$ROOT/backend" && node src/index.js &
BACKEND_PID=$!

# Aguarda o backend subir
sleep 3

# Frontend
echo "▶ Frontend → http://localhost:5173"
cd "$ROOT/frontend" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Servidores rodando!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para parar tudo."

# Mata os dois ao sair
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '🛑 Servidores parados.'" EXIT

wait
