import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sonantica Brain Plugin"
    VERSION: str = "0.1.0"
    API_V1_STR: str = ""
    
    # Security
    INTERNAL_API_SECRET: str = os.getenv("INTERNAL_API_SECRET", "dev-secret-change-me")
    
    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD", None)
    
    # Postgres (for direct vector inserts if needed, though core handles it usually)
    POSTGRES_URL: Optional[str] = os.getenv("POSTGRES_URL", None)
    
    # Job Config
    MAX_CONCURRENT_JOBS: int = int(os.getenv("MAX_CONCURRENT_JOBS", 0)) # 0 = unlimited
    CONCURRENCY_COOLDOWN_SECONDS: int = int(os.getenv("CONCURRENCY_COOLDOWN_SECONDS", 30)) # Wait before allowing more if limit hit
    
    # Model Config
    # Default: laion/clap-htsat-unfused
    AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "laion/clap-htsat-unfused")
    AI_EMBEDDING_DIM: int = 512
    # Default duration for embedding in seconds. 0 = full track.
    AI_EMBEDDING_MAX_DURATION: float = float(os.getenv("AI_EMBEDDING_MAX_DURATION", 0)) 
    # Cache
    TORCH_HOME: str = os.getenv("TORCH_HOME", "/tmp/torch")
    HF_HOME: str = os.getenv("HF_HOME", "/tmp/huggingface")
    MEDIA_PATH: str = os.getenv("MEDIA_PATH", "/media")

    # Neighbor Plugins
    KNOWLEDGE_PLUGIN_URL: Optional[str] = os.getenv("KNOWLEDGE_PLUGIN_URL", "http://knowledge:8080")
    DEMUCS_PLUGIN_URL: Optional[str] = os.getenv("DEMUCS_PLUGIN_URL", "http://demucs:8080")

    class Config:
        case_sensitive = True

settings = Settings()
