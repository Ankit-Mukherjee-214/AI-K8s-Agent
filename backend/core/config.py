from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Get the path to the .env file relative to this file's location
# backend/core/config.py -> backend/.env
env_path = Path(__file__).parent.parent / ".env"

# Explicitly load .env before Settings class is instantiated
# Use override=True because docker-compose might have initialized them with empty strings
if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
else:
    # Fallback to local .env if not found in parent
    load_dotenv(override=True)

class Settings(BaseSettings):
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "meta-llama/llama-3-70b-instruct"
    KUBECONFIG_PATH: Optional[str] = "~/.kube/config"
    HTTP_REFERER: str = "https://github.com/ai-kubernetes-agent"
    
    # InsForge
    INSFORGE_URL: Optional[str] = None
    INSFORGE_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()
