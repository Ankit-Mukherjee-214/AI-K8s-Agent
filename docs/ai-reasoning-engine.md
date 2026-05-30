# AI Kubernetes Troubleshooting Agent: AI Reasoning Engine

This document explains the implementation of the AI Reasoning Engine, which transforms raw Kubernetes evidence into actionable insights.

---

## 🎯 What is the Target?
The goal is to move from **data collection** (the Investigation Layer) to **intelligent diagnosis**. The system now behaves like a **Senior Kubernetes SRE**, correlating logs, events, and pod statuses to find the root cause of failures.

---

## 💡 Layman's Terms: What I Did
Think of this as adding a **Brain** to our "Junior Doctor":
-   **The Evidence (Investigation Data)**: We take the medical tests (pods, logs, events) we collected earlier.
-   **The Expert (OpenRouter / LLM)**: We send this evidence to a super-intelligent AI (like Llama 3) with a specific set of instructions: "Act like a Senior SRE."
-   **The Diagnosis (AI Analysis)**: Instead of just reading you a list of errors, the AI tells you exactly *why* something is broken and gives you the exact `kubectl` command to fix it.

---

## 📋 Prerequisites
1.  **OpenRouter API Key**: This is now required to power the AI reasoning.
2.  **Environment Variables**: You must set `OPENROUTER_API_KEY` in your `backend/.env` file.

---

## 🛠️ How I Did It?
1.  **Configuration Management**: Created `backend/core/config.py` to safely handle environment variables.
2.  **AI Client**: Built `backend/ai/client.py` using `httpx` to communicate with OpenRouter's API.
3.  **Prompt Engineering**: Created `backend/ai/prompts.py` which builds a structured, high-context prompt that forces the AI to return a specific JSON format.
4.  **AI Service**: Built `backend/services/ai_service.py` as a bridge between the investigation data and the AI client.
5.  **API Integration**: Updated the `/investigate` endpoint in `backend/main.py` to run the investigation first, then immediately call the AI for a diagnosis.

---

## 🔍 Line-by-Line Breakdown

### 1. The Client: `backend/ai/client.py`
```python
async with httpx.AsyncClient(timeout=60.0) as client:
    response = await client.post(self.base_url, headers=headers, json=payload)
```
*   **Why?**: We use `httpx` because it supports `async`, allowing our server to handle other requests while waiting for the AI to "think." We set a long timeout (60s) because complex reasoning can take time.

### 2. The Prompt: `backend/ai/prompts.py`
```python
"response_format": { "type": "json_object" }
```
*   **Why?**: This is a powerful feature that forces the AI to output valid JSON. This makes it easy for our Frontend to display the results in a nice UI.

### 3. The Diagnosis Service: `backend/services/ai_service.py`
```python
diagnosis = await ai_client.get_diagnosis(prompt)
```
*   **Why?**: This encapsulates the AI logic. The rest of the app doesn't need to know *how* the AI works, just that it can provide a diagnosis.

### 4. The Unified Endpoint: `backend/main.py`
```python
investigation_data = investigation_service.run_full_investigation()
diagnosis = await ai_service.analyze_investigation(investigation_data)
```
*   **Why?**: This is the "Orchestration." It links the raw data (investigation) with the intelligence (AI) to provide a complete answer to the user in a single API call.

---

## 📤 Expected Outputs

When you call `POST /investigate`, the response now includes a `diagnosis` field:

```json
{
  "status": "success",
  "investigation": { ... raw data ... },
  "diagnosis": {
    "root_cause": "OOMKilled due to low memory limits",
    "explanation": "The pod 'payment-service' is crashing because it exceeded its 128Mi limit.",
    "fix": "Increase the memory limit to 256Mi in the deployment spec.",
    "kubectl_command": "kubectl patch deployment payment-service --patch '...'",
    "confidence": 95
  }
}
```

---
