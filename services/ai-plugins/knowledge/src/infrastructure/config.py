import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sonantica Knowledge Plugin"
    VERSION: str = "0.1.0"
    API_V1_STR: str = ""
    
    # Security
    INTERNAL_API_SECRET: str = os.getenv("INTERNAL_API_SECRET", "dev-secret-change-me")
    
    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD", None)
    
    # Ollama
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama3.1:latest")
    
    # Concurrency
    MAX_CONCURRENT_JOBS: int = int(os.getenv("MAX_CONCURRENT_JOBS", 5)) # Default to 5 for Ollama
    CONCURRENCY_COOLDOWN_SECONDS: int = int(os.getenv("CONCURRENCY_COOLDOWN_SECONDS", 60)) # LLMs take longer to cool down

    class Config:
        case_sensitive = True

settings = Settings()
