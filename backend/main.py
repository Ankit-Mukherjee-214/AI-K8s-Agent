import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

app = FastAPI(
    title="AI Kubernetes Agent API",
    description="Backend for AI-powered Kubernetes troubleshooting",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-kubernetes-agent"
    }

if __name__ == "__main__":
    logger.info("Starting AI Kubernetes Agent API...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
