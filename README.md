# AI Kubernetes Troubleshooting Agent

An on-demand system for troubleshooting Kubernetes clusters using AI.

## Project Structure

- `backend/`: FastAPI orchestrator and AI/Kubernetes logic.
- `frontend/`: Next.js dashboard.
- `docs/`: Project documentation.
- `prompts/`: AI system prompts and reasoning templates.

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Kubernetes cluster (local or remote)
- OpenRouter API Key

### Setup

1. Clone the repository.
2. Configure environment variables:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. Run the application:
   ```bash
   docker compose up --build
   ```

### Access

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend Health: [http://localhost:8000/health](http://localhost:8000/health)
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
