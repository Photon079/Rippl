#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "  Starting Rippl: Causal Memory Layer                     "
echo "=========================================================="

# Find FalkorDB module binary
FALKOR_SO=$(find / -name "falkordb.so" 2>/dev/null | head -n 1)
if [ -z "$FALKOR_SO" ]; then
    FALKOR_SO="/usr/lib/falkordb/falkordb.so"
fi
if [ ! -f "$FALKOR_SO" ]; then
    FALKOR_SO="/var/lib/falkordb/bin/falkordb.so"
fi
echo "Using FalkorDB module: $FALKOR_SO"

echo "[1/4] Launching FalkorDB on port 6379..."
if ! redis-cli -p 6379 ping 2>/dev/null | grep -q PONG; then
    redis-server --loadmodule "$FALKOR_SO" --daemonize yes --port 6379
fi

echo "[2/4] Waiting for FalkorDB socket..."
until /app/.venv/bin/python3 -c "import socket; s = socket.create_connection(('127.0.0.1', 6379), timeout=1); s.close()" 2>/dev/null; do
    sleep 0.5
done
echo "      FalkorDB is live!"

echo "[3/4] Ingesting 113-node Northwind causal graph..."
cd /app/server && /app/.venv/bin/python3 seed.py

echo "[4/4] Starting FastAPI backend on port 8000..."
/app/.venv/bin/python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 &

echo "      Waiting for FastAPI to be ready..."
until /app/.venv/bin/python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=1)" 2>/dev/null; do
    sleep 0.5
done
echo "      FastAPI is healthy!"

TARGET_PORT="${PORT:-10000}"
echo "=========================================================="
echo "  Serving Next.js frontend on port ${TARGET_PORT}         "
echo "=========================================================="
cd /app/client && npx next start -H 0.0.0.0 -p "${TARGET_PORT}"
