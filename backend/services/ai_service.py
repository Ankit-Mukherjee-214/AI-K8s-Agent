from typing import Dict, Any, Optional
from loguru import logger
from ai.client import ai_client
from ai.prompts import prompt_builder

class AIService:
    async def analyze_investigation(self, investigation_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        logger.info("Starting AI analysis of Kubernetes investigation...")
        
        # Build prompt
        prompt = prompt_builder.build_troubleshooting_prompt(investigation_data)
        
        # Get diagnosis from LLM
        diagnosis = await ai_client.get_diagnosis(prompt)
        
        if diagnosis:
            logger.info("AI diagnosis complete.")
        else:
            logger.warning("AI diagnosis failed or returned no result.")
            
        return diagnosis

ai_service = AIService()
