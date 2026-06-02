import httpx
from loguru import logger
from core.config import settings
from typing import Dict, Any, Optional

class InsForgeService:
    def __init__(self):
        self.url = settings.INSFORGE_URL
        self.api_key = settings.INSFORGE_API_KEY

    async def create_investigation(self, user_id: str, namespace: str = "default") -> Optional[str]:
        """Creates an initial investigation record and returns its ID."""
        if not self.url or not self.api_key:
            return None

        endpoint = f"{self.url}/api/database/records/investigations"
        headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        data = {
            "user_id": user_id,
            "namespace": namespace,
            "status": "running"
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(endpoint, headers=headers, json=[data])
                response.raise_for_status()
                return response.json()[0]["id"]
        except Exception as e:
            logger.error(f"Failed to create investigation: {e}")
            return None

    async def publish_progress(self, investigation_id: str, message: str):
        """Saves a progress step to the database."""
        if not self.url or not self.api_key or not investigation_id:
            return

        # Save to database for persistence
        db_endpoint = f"{self.url}/api/database/records/investigation_progress"
        headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        db_data = {
            "investigation_id": investigation_id,
            "message": message
        }

        try:
            async with httpx.AsyncClient() as client:
                await client.post(db_endpoint, headers=headers, json=[db_data])
        except Exception as e:
            logger.error(f"Failed to publish progress: {e}")

    async def complete_investigation(self, investigation_id: str, diagnosis: Dict[str, Any]):
        """Updates the investigation record with the final diagnosis."""
        if not self.url or not self.api_key or not investigation_id:
            return

        endpoint = f"{self.url}/api/database/records/investigations"
        headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        data = {
            "root_cause": diagnosis.get("root_cause"),
            "explanation": diagnosis.get("explanation"),
            "fix": diagnosis.get("fix"),
            "kubectl_command": diagnosis.get("kubectl_command"),
            "confidence": diagnosis.get("confidence"),
            "status": "completed"
        }

        try:
            async with httpx.AsyncClient() as client:
                await client.patch(
                    f"{endpoint}?id=eq.{investigation_id}", 
                    headers=headers, 
                    json=data
                )
        except Exception as e:
            logger.error(f"Failed to complete investigation: {e}")

insforge_service = InsForgeService()
