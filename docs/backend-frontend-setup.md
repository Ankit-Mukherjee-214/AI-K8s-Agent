# AI Kubernetes Troubleshooting Agent: Code Breakdown

This document provides a comprehensive explanation of the foundational setup for the AI Kubernetes Troubleshooting Agent.

---

## 🎯 What is the Target?
The goal is to build a **monorepo foundation** for an AI-powered system that can investigate and troubleshoot Kubernetes clusters on demand. 

At this stage, we are setting up the "skeleton":
1.  **Backend (FastAPI)**: To handle logic and AI orchestration.
2.  **Frontend (Next.js)**: A dashboard for the user to trigger investigations.
3.  **Containerization (Docker)**: To ensure the system runs the same way on every machine.

---

## 💡 Layman's Terms: What I Did
Think of this like building a new house:
-   **Backend**: I built the engine room. It doesn't do much yet, but it's ready to receive orders. I added a "heartbeat" check (`/health`) so we know the engine is running.
-   **Frontend**: I built the front door and the lobby. It has a button for the user to click, even if the "investigation" room behind the door is still being finished.
-   **Docker**: I created "instruction manuals" (Dockerfiles) so that a robot can build this entire house automatically without you needing to install Python or Node.js manually.
-   **Monorepo**: I put everything in one big folder so it's easy to manage.

---

## 📋 Prerequisites
To run this project, you need:
1.  **Docker & Docker Compose**: This is the most important part. It handles all dependencies.
2.  **An OpenRouter API Key**: (Future use) For the AI to "think."
3.  **Kubernetes Access**: A `kubeconfig` file so the agent can talk to your cluster.

---

## 🛠️ How I Did It?
1.  **Structure**: Created a directory hierarchy (`backend/`, `frontend/`, `docs/`, `prompts/`).
2.  **Backend Boilerplate**: Initialized a FastAPI app with basic security (CORS) and logging.
3.  **Frontend Boilerplate**: Set up a Next.js 14 project with Tailwind CSS for styling.
4.  **Wiring**: Used Docker Compose to link the frontend (Port 3000) and backend (Port 8000).
5.  **Debugging**: Fixed a build error by ensuring CSS tools (Tailwind) were available during the "packing" (build) phase.

---

## 🔍 Line-by-Line Breakdown

### 1. Backend: `backend/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
```
*   **Why?**: `FastAPI` is the framework. `CORSMiddleware` is a security feature that allows our Frontend (running on a different port) to talk to the Backend.

```python
app = FastAPI(title="AI Kubernetes Agent API", ...)
```
*   **Why?**: This initializes the app and gives it a name for the auto-generated documentation.

```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-kubernetes-agent"}
```
*   **Why?**: This is a "Pulse Check." If you visit `localhost:8000/health` and see this JSON, you know the backend is alive.

### 2. Frontend: `frontend/src/app/page.tsx`
```tsx
"use client";
```
*   **Why?**: In Next.js, this tells the browser that this page has interactive elements (like buttons).

```tsx
<button className="bg-blue-600 hover:bg-blue-700 ..." onClick={() => alert('...')}>
  Investigate Cluster
</button>
```
*   **Why?**: This is the primary "Call to Action." For now, it just shows an alert, but later it will trigger the AI.

### 3. Docker: `docker-compose.yml`
```yaml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
```
*   **Why?**: This tells Docker: "Go into the backend folder, follow the instructions in the Dockerfile, and map the internal port 8000 to your computer's port 8000."

### 4. Dependency Fix: `frontend/package.json`
```json
"dependencies": {
  "tailwindcss": "^3.4.1",
  "autoprefixer": "^10.4.19",
  ...
}
```
*   **Why?**: Originally, these were in `devDependencies`. In a Docker build, sometimes "dev" tools are skipped to save space. Moving them to `dependencies` ensures the CSS is always built correctly.

---

## 📤 Expected Outputs
When you run `docker compose up --build`, you should see:
1.  **Terminal**: Logs showing `Uvicorn running on http://0.0.0.0:8000` and `Next.js Ready`.
2.  **Browser (3000)**: A clean page with a blue "Investigate Cluster" button.
3.  **Browser (8000/health)**: A JSON object saying `{"status": "healthy", ...}`.
4.  **Browser (8000/docs)**: A fully interactive API documentation page (Swagger UI).

---
