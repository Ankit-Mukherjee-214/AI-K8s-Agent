from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from typing import Optional
from services.investigation_service import investigation_service
from services.ai_service import ai_service
from services.insforge_service import insforge_service
from kubernetes.executor import executor

app = FastAPI(
    title="AI Kubernetes Agent API",
    description="Backend for AI-powered Kubernetes troubleshooting",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/clusters")
async def list_clusters():
    try:
        contexts = executor.list_contexts()
        return {"status": "success", "clusters": contexts}
    except Exception as e:
        logger.exception(f"Failed to list clusters: {e}")
        return {"status": "error", "error": str(e)}

@app.post("/investigate")
async def investigate(background_tasks: BackgroundTasks, payload: dict = None):
    try:
        context = payload.get("cluster") if payload else None
        user_id = payload.get("user_id") if payload else None
        
        logger.info(f"Investigation request received. User: {user_id}, Cluster: {context}")
        
        if not user_id:
            logger.warning("No user_id provided in payload, falling back to default")
            user_id = "00000000-0000-0000-0000-000000000001" 

        # 1. Create Investigation Record
        investigation_id = await insforge_service.create_investigation(user_id, namespace=context or "default")
        if not investigation_id:
            logger.error("Failed to create investigation record in InsForge")
            raise HTTPException(status_code=500, detail="Failed to create investigation record")

        logger.info(f"Created investigation record: {investigation_id}")

        # 2. Run investigation in the background to prevent timeout
        background_tasks.add_task(run_investigation_task, investigation_id, context)
        
        return {
            "status": "success",
            "investigation_id": investigation_id,
            "message": "Investigation started in background"
        }
    except Exception as e:
        logger.exception(f"Investigation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def run_investigation_task(investigation_id: str, context: Optional[str]):
    try:
        # 2. Collect Kubernetes Evidence (with persistent progress)
        investigation_data = await investigation_service.run_full_investigation(investigation_id, context=context)
        
        if "error" in investigation_data:
            await insforge_service.publish_progress(investigation_id, f"Error: {investigation_data['error']}")
            return

        # 3. Send to AI Agent for diagnosis
        await insforge_service.publish_progress(investigation_id, "AI Reasoning...")
        diagnosis = await ai_service.analyze_investigation(investigation_data)
        
        # 4. Finalize Investigation Record (Status: Completed)
        await insforge_service.publish_progress(investigation_id, "Finalizing...")
        if diagnosis:
            await insforge_service.complete_investigation(investigation_id, diagnosis)
        
        await insforge_service.publish_progress(investigation_id, "Root Cause Found.")
    except Exception as e:
        logger.error(f"Background investigation task failed: {e}")
        await insforge_service.publish_progress(investigation_id, f"Critical Error: {str(e)}")


if __name__ == "__main__":
    logger.info("Starting AI Kubernetes Agent API...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
