from pydantic_settings import BaseSettings
from typing import Optional

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
