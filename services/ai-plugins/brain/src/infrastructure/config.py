import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sonantica Brain Plugin"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    INTERNAL_API_SECRET: str = os.getenv("INTERNAL_API_SECRET", "dev-secret-change-me")
    
    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD", None)
    
    # Postgres (for direct vector inserts if needed, though core handles it usually)
    POSTGRES_URL: Optional[str] = os.getenv("POSTGRES_URL", None)
    
    # Model Config
    # Default: laion/clap-htsat-unfused
    AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "laion/clap-htsat-unfused")
    AI_EMBEDDING_DIM: int = 512
    # Cache
    TORCH_HOME: str = os.getenv("TORCH_HOME", "/tmp/torch")
    HF_HOME: str = os.getenv("HF_HOME", "/tmp/huggingface")

    class Config:
        case_sensitive = True

settings = Settings()
