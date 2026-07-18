# Stage 1: Build frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/. ./frontend
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Python runtime
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*
COPY backend/ ./backend
COPY data/ ./data
COPY --from=builder /app/frontend/dist ./frontend/dist
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
