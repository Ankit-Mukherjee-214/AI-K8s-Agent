# AI Kubernetes Troubleshooting Agent: Dashboard and API

This document explains the final integration phase, including the Frontend Dashboard, Authentication, and Realtime updates using InsForge.

---

## 🎯 What is the Target?
The goal is to provide a **complete user experience**. Instead of calling APIs manually, users can now:
1.  **Login** securely.
2.  **Trigger** investigations via a professional dashboard.
3.  **Watch** realtime progress as the agent scans the cluster.
4.  **Review** the diagnosis and history of previous investigations.

---

## 💡 Layman's Terms: What I Did
Think of this as the **Command Center** for our system:
-   **The Key (Authentication)**: We added a login screen. Only authorized users with a key can access the command center.
-   **The Live Screen (Realtime Updates)**: When you click "Investigate," the screen updates live. It's like a mission control monitor showing you exactly which part of the cluster is being checked.
-   **The Archive (Investigation History)**: Every time we find a problem, we save the details in a digital filing cabinet (the database) so you can look back at old reports.
-   **The Dashboard (UI)**: I built a clean, professional interface using Next.js and Tailwind CSS that makes troubleshooting feel high-tech but simple.

---

## 📋 Prerequisites
1.  **InsForge Project**: A linked InsForge project is required for Auth, Database, and Realtime.
2.  **Environment Variables**:
    -   `NEXT_PUBLIC_INSFORGE_URL`
    -   `NEXT_PUBLIC_INSFORGE_ANON_KEY`
    -   `INSFORGE_URL`
    -   `INSFORGE_API_KEY`

---

## 🛠️ How I Did It?
1.  **Database Migration**: Created two tables in InsForge:
    -   `investigations`: Stores the parent record (Status, Root Cause, Diagnosis).
    -   `investigation_progress`: Stores step-by-step updates linked to the parent.
    -   Added Row Level Security (RLS) so users only see their own data.
2.  **Auth Integration**: Implemented a login page using `insforge.auth.signInWithPassword`.
3.  **Realtime Service**: Added a `publish_progress` method in the Backend that saves to the `investigation_progress` table and sends broadcast events.
4.  **Dashboard UI**: Built the main screen with:
    -   A progress tracker that listens to the InsForge channel using `insforge.realtime.on('progress', ...)`.
    -   A diagnosis card that displays the AI's findings.
    -   A history table that fetches from the `investigations` table.
5.  **API Orchestration**: Updated the FastAPI `/investigate` endpoint to create a parent record first, then trigger progress updates and save the final result.

---

## 🔍 Line-by-Line Breakdown

### 1. Realtime Broadcast (`backend/services/insforge_service.py`)
```python
db_data = { "investigation_id": investigation_id, "message": message }
await client.post(db_endpoint, headers=headers, json=[db_data])
```
*   **Why?**: This ensures that even if a user refreshes the page, their progress history is not lost.

### 2. Realtime Listener (`frontend/src/app/page.tsx`)
```javascript
insforge.realtime.subscribe('investigation');
insforge.realtime.on('progress', (payload) => {
  if (payload.meta.channel === 'investigation') {
    setProgress((prev) => [...prev, payload.message]);
  }
});
```
*   **Why?**: This is the correct InsForge SDK syntax for subscribing to a channel and listening for custom broadcast events.

### 3. Parent-Child Relationship (`backend/main.py`)
```python
investigation_id = await insforge_service.create_investigation(user_id)
# ... checks ...
await insforge_service.publish_progress(investigation_id, "Checking Pods...")
```
*   **Why?**: We create the "ticket" (investigation) first so all "stamps" (progress steps) have a valid ID to attach to.

### 3. History Fetching (`frontend/src/app/page.tsx`)
```javascript
const { data } = await insforge.database.from('investigations').select('*').limit(5);
```
*   **Why?**: This pulls the last 5 reports from the digital filing cabinet. RLS ensures that you only see reports that *you* triggered.

### 4. Auth Protection (`frontend/src/app/page.tsx`)
```javascript
const { data: { user } } = await insforge.auth.getUser();
if (!user) router.push('/login');
```
*   **Why?**: This check makes sure that if someone tries to visit the dashboard without logging in, they are immediately sent back to the login screen.

---

## 📤 Expected Outputs

### 1. Login Page
A clean form at `/login`. After successful login, you are redirected to the dashboard.

### 2. Dashboard Interaction
- Click **Investigate Cluster**.
- Watch the **Investigation Progress** list grow as the backend works.
- See the **Diagnosis** card populate with the root cause and suggested fix.
- See the **Recent Investigations** table update with the new record.

---
