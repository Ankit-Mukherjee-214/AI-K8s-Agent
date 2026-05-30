import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from services.investigation_service import investigation_service
from services.ai_service import ai_service
from services.insforge_service import insforge_service

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

@app.post("/investigate")
async def investigate():
    try:
        # Mock user_id (In a real app, extract from Auth header / JWT)
        user_id = "00000000-0000-0000-0000-000000000000" 

        # 1. Create Investigation Record (Status: Running)
        investigation_id = await insforge_service.create_investigation(user_id)
        if not investigation_id:
            raise HTTPException(status_code=500, detail="Failed to create investigation record")

        # 2. Collect Kubernetes Evidence (with persistent progress)
        investigation_data = await investigation_service.run_full_investigation(investigation_id)
        
        # 3. Send to AI Agent for diagnosis
        await insforge_service.publish_progress(investigation_id, "AI Reasoning...")
        diagnosis = await ai_service.analyze_investigation(investigation_data)
        
        # 4. Finalize Investigation Record (Status: Completed)
        await insforge_service.publish_progress(investigation_id, "Finalizing...")
        if diagnosis:
            await insforge_service.complete_investigation(investigation_id, diagnosis)
        
        await insforge_service.publish_progress(investigation_id, "Root Cause Found.")
        
        return {
            "status": "success",
            "investigation_id": investigation_id,
            "investigation": investigation_data,
            "diagnosis": diagnosis
        }
    except Exception as e:
        logger.exception(f"Investigation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    logger.info("Starting AI Kubernetes Agent API...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
