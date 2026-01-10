"""
Infrastructure Layer: Configuration
Centralized settings management using Pydantic
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application configuration.
    Follows Single Responsibility Principle - Only configuration.
    """
    
    # Redis Configuration
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_password: str = "sonantica"
    
    # Paths
    media_path: Path = Path("/media")
    output_path: Path = Path("/stems")
    torch_home: Path = Path("/model_cache/torch")
    hf_home: Path = Path("/model_cache/huggingface")
    
    # Security
    internal_api_secret: str = "generate-secure-token-here"
    
    # Job Configuration
    max_concurrent_jobs: int = 2
    job_timeout_seconds: int = 600
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"
    log_enabled: bool = True
    
    # Model Configuration
    default_model: str = "htdemucs"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def redis_url(self) -> str:
        """Construct Redis connection URL"""
        return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Override from environment variables
        self.redis_host = os.getenv("REDIS_HOST", self.redis_host)
        self.redis_port = int(os.getenv("REDIS_PORT", str(self.redis_port)))
        self.redis_password = os.getenv("REDIS_PASSWORD", self.redis_password)
        
        self.media_path = Path(os.getenv("MEDIA_PATH", str(self.media_path)))
        self.output_path = Path(os.getenv("OUTPUT_PATH", str(self.output_path)))
        self.torch_home = Path(os.getenv("TORCH_HOME", str(self.torch_home)))
        self.hf_home = Path(os.getenv("HF_HOME", str(self.hf_home)))
        
        self.internal_api_secret = os.getenv("INTERNAL_API_SECRET", self.internal_api_secret)
        
        self.max_concurrent_jobs = int(os.getenv("MAX_CONCURRENT_JOBS", str(self.max_concurrent_jobs)))
        self.job_timeout_seconds = int(os.getenv("JOB_TIMEOUT_SECONDS", str(self.job_timeout_seconds)))
        
        self.log_level = os.getenv("LOG_LEVEL", self.log_level)
        self.log_format = os.getenv("LOG_FORMAT", self.log_format)
        self.log_enabled = os.getenv("LOG_ENABLED", str(self.log_enabled)).lower() == "true"


# Global settings instance
settings = Settings()
