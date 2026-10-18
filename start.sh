#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  Starting Rippl: Causal Memory Layer on Hugging Face     "
echo "=========================================================="

echo "[1/4] Launching FalkorDB GraphBLAS on port 6379..."
redis-server --loadmodule /usr/lib/falkordb/falkordb.so --daemonize yes --port 6379

echo "[2/4] Waiting for FalkorDB socket..."
until /app/.venv/bin/python3 -c "import socket; s = socket.create_connection(('127.0.0.1', 6379), timeout=1); s.close()" 2>/dev/null; do
    sleep 0.5
done
echo "      FalkorDB is live!"

echo "[3/4] Ingesting 113-node Northwind causal graph..."
cd /app/server && /app/.venv/bin/python3 seed.py

echo "[4/4] Starting FastAPI backend on port 8000..."
/app/.venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &

echo "      Waiting for FastAPI to be ready..."
until /app/.venv/bin/python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=1)" 2>/dev/null; do
    sleep 0.5
done
echo "      FastAPI is healthy!"

echo "=========================================================="
echo "  Serving Next.js frontend on port ${PORT:-7860}          "
echo "=========================================================="
cd /app/client && npx next start -H 0.0.0.0 -p ${PORT:-7860}
