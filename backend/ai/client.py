import httpx
import json
from loguru import logger
from core.config import settings
from typing import Dict, Any, Optional

class OpenRouterClient:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.model = settings.OPENROUTER_MODEL
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"

    async def get_diagnosis(self, prompt: str) -> Optional[Dict[str, Any]]:
        # Read from settings to ensure we get the patched value
        api_key = settings.OPENROUTER_API_KEY
        if not api_key:
            logger.error("OPENROUTER_API_KEY is not set.")
            return None

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/ai-kubernetes-agent", # Required by OpenRouter
            "X-Title": "AI Kubernetes Agent"
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a Senior Kubernetes SRE with deep expertise in troubleshooting clusters. Your goal is to analyze provided evidence and return a structured JSON diagnosis."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "diagnosis",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "root_cause": {"type": "string"},
                            "explanation": {"type": "string"},
                            "fix": {"type": "string"},
                            "kubectl_command": {"type": "string"},
                            "confidence": {"type": "integer"}
                        },
                        "required": ["root_cause", "explanation", "fix", "kubectl_command", "confidence"],
                        "additionalProperties": False
                    }
                }
            }
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.base_url, headers=headers, json=payload)
                response.raise_for_status()
                
                result = response.json()
                content = result['choices'][0]['message']['content']
                return json.loads(content)

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error from OpenRouter: {e.response.text}")
        except Exception as e:
            logger.exception(f"Error communicating with OpenRouter: {e}")
        
        return None

ai_client = OpenRouterClient()
