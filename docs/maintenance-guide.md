# Project Maintenance Guide

Use these commands to ensure your environment stays clean and matches the latest code.

## 🧹 Complete Reset (Recommended after major changes)
If you see "old" pages or weird errors, run this. It stops everything and wipes temporary data.
```bash
docker compose down -v
docker compose up -d --build
```

## 🏗️ Force Fresh Build (No Cache)
Use this if you think Docker is using old versions of your code layers.
```bash
docker compose build --no-cache
docker compose up -d
```

## 📋 Useful Health Checks

### Check Container Status
```bash
docker compose ps
```

### View Live Logs
```bash
docker compose logs -f
```

### Test API directly
```bash
curl http://localhost:8000/health
```

---
**Current Progress Summary:**
- [x] Monorepo Setup (FastAPI + Next.js)
- [x] Kubernetes Investigation Engine (Junior DevOps Layer)
- [x] AI Reasoning Engine (Senior SRE Layer via OpenRouter)
- [x] Dashboard UI (Auth + Realtime + History via InsForge)
