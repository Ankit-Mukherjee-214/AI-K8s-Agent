# AI Kubernetes Troubleshooting Agent: Full Code Breakdown

This document provides a detailed explanation of the entire system built so far, covering both the **Project Foundation** and the **Kubernetes Investigation Layer**.

---

## 🎯 What is the Target?
The goal is to create an **AI-powered Troubleshooting Agent** that can:
1.  Connect to a Kubernetes cluster.
2.  Gather evidence (logs, status, events) like a human engineer would.
3.  Eventually use an LLM (AI) to diagnose root causes and suggest fixes.

Currently, we have built the **Foundation** (FastAPI + Next.js + Docker) and the **Investigation Engine** (the tools used to collect evidence).

---

## 💡 Layman's Terms: What I Did
Think of this project as a **Medical Clinic for Kubernetes**:
-   **The Building (Monorepo)**: I set up a single folder that contains both the "Patient Records" (Backend) and the "Reception Desk" (Frontend).
-   **The Lab Equipment (Kubectl Executor)**: I built a specialized tool that allows our app to "talk" to the Kubernetes cluster to run tests.
-   **The Junior Doctor (Investigation Layer)**: I created a set of automated scripts that act like a junior doctor. Instead of just saying "it's broken," this layer checks the "Heart Rate" (Pods), "Medical History" (Logs), and "Injury Reports" (Events).
-   **The Reception Desk (Frontend)**: A simple website where you can click a button to start the "Checkup."

---

## 📋 Prerequisites
To run this project, you need:
1.  **Docker & Docker Compose**: The "Container" system that lets us run the app anywhere.
2.  **Kubectl**: The command-line tool for Kubernetes must be installed (this is what our Backend uses).
3.  **Kubeconfig**: A file (usually at `~/.kube/config`) that gives our app permission to access your cluster.
4.  **OpenRouter API Key**: (Reserved for the next phase) To let the AI "think."

---

## 🛠️ How I Did It? (Step-by-Step)
1.  **Folder Architecture**: Created a monorepo structure so the Frontend and Backend live together but stay organized.
2.  **Backend Setup**: Built a FastAPI server in Python because it's fast and handles data very efficiently.
3.  **Frontend Setup**: Built a Next.js 14 dashboard using TypeScript and Tailwind CSS for a professional look.
4.  **The "Executor"**: Wrote a Python utility that uses `subprocess` to run real `kubectl` commands.
5.  **The "Inspectors"**: Created 5 specialized modules to scan different parts of Kubernetes (Pods, Logs, Events, Deployments, Networking).
6.  **The Orchestrator**: Built a service that runs all these scans in the correct order and bundles the results into one report.
7.  **Containerization**: Wrote Dockerfiles for everything and installed the `kubectl` binary in the backend image so it can execute cluster commands.
8.  **Import Debugging**: Fixed a `ModuleNotFoundError` by ensuring all backend services use correct absolute paths for imports.

---

## 🔍 Code Line-by-Line Breakdown

### 1. The Engine: `backend/kubernetes/executor.py`
```python
result = subprocess.run(full_cmd, capture_output=True, text=True, check=False)
```
*   **Why?**: This is how Python "talks" to your computer's terminal. 
*   **`capture_output=True`**: Saves the result of the command so we can read it.
*   **`text=True`**: Makes sure the output is readable text, not raw computer bytes.
*   **`check=False`**: Prevents the app from crashing if `kubectl` returns an error (like if a pod doesn't exist).

### 2. The Scanner: `backend/kubernetes/pod_inspector.py`
```python
UNHEALTHY_STATUSES = ["CrashLoopBackOff", "ImagePullBackOff", "OOMKilled", ...]
```
*   **Why?**: This is our "Red Flag" list. We look at every pod in your cluster and check if its status matches anything in this list.

### 3. The Orchestrator: `backend/services/investigation_service.py`
```python
def run_full_investigation(self):
    pods_info = pod_inspector.inspect()
    if not pods_info["healthy"]:
        logs_info = logs_collector.collect_for_unhealthy(pods_info["problematic_pods"])
```
*   **Logic**: It's smart! It only fetches logs if the Pod Inspector actually finds a problem. This saves time and avoids overloading the system with unnecessary data.

### 4. The API: `backend/main.py`
```python
@app.post("/investigate")
async def investigate():
    investigation_data = investigation_service.run_full_investigation()
    return {"status": "success", "investigation": investigation_data}
```
*   **Why?**: This is the "Bridge." When the Frontend sends a request to this address, the Backend starts the full Kubernetes checkup and sends back the results as JSON.

### 5. The Container: `docker-compose.yml`
```yaml
volumes:
  - ./backend:/app
```
*   **Why?**: This is a "Live Sync." It means if you change a file on your computer, the code inside the running Docker container updates immediately without needing a restart.

---

## 📤 Expected Outputs

### 1. Terminal Output
When you run `docker compose up`, you should see:
```text
backend-1   | INFO: Executing: kubectl get pods -A -o json
backend-1   | INFO: Investigation complete.
frontend-1  | ✓ Ready in 510ms
```

### 2. JSON Response (from `/investigate`)
The data our app collects looks like this:
```json
{
  "status": "success",
  "investigation": {
    "pods": { "healthy": false, "problematic_pods": [...] },
    "logs": [ { "pod": "api-pod", "logs": "Error: Database connection failed..." } ],
    "events": { "critical_events": [...] }
  }
}
```

---

## 🛠️ Troubleshooting: Common Fixes

### 1. The "WSL Credential" Fix
**Problem**: Docker was trying to use a "Password Vault" on Windows that it couldn't reach from inside Linux (WSL).
**Fix**: I removed the line `"credsStore": "desktop.exe"` from the `~/.docker/config.json` file.

### 2. `ModuleNotFoundError: No module named 'services.pod_inspector'`
**Problem**: Incorrect relative imports in the backend code.
**Fix**: Changed imports to use the full package path: `from kubernetes.pod_inspector import pod_inspector`.

### 3. `[Errno 2] No such file or directory: 'kubectl'`
**Problem**: The `kubectl` tool was missing from the backend Docker container.
**Fix**: Added an installation step in the `backend/Dockerfile` to download and install the `kubectl` binary.

---
