# Multi-stage build for Rippl on Hugging Face Spaces (Port 7860)

# Stage 1: Build Next.js Production Bundle
FROM node:20-slim AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Unified Runtime Container (FalkorDB + FastAPI + Next.js)
FROM falkordb/falkordb:latest

USER root

# Install Python 3.11, Node.js 20, and utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Setup Python Virtual Environment and Dependencies
COPY server/requirements.txt ./server/
RUN python3 -m venv /app/.venv && \
    /app/.venv/bin/pip install --no-cache-dir -r ./server/requirements.txt

COPY server/ ./server/

# Setup Frontend Application
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci --omit=dev
COPY --from=frontend-builder /app/client/.next ./.next
COPY --from=frontend-builder /app/client/public ./public
COPY client/next.config.ts ./
WORKDIR /app

# Global Environment Configuration
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    FALKORDB_HOST=127.0.0.1 \
    FALKORDB_PORT=6379 \
    PORT=7860 \
    INTERNAL_BACKEND_URL=http://127.0.0.1:8000

# Setup Permissions and Startup Script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh && \
    chmod -R 777 /app 2>/dev/null || true

EXPOSE 7860

CMD ["/app/start.sh"]
