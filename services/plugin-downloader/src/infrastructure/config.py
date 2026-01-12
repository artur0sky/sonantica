"""
Infrastructure Layer: Configuration
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    project_name: str = "Sonántica Downloader Plugin"
    version: str = "0.2.0"
    
    # Redis Configuration
    redis_host: str = os.getenv("REDIS_HOST", "redis")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))
    redis_password: str = os.getenv("REDIS_PASSWORD", "sonantica")
    
    # Paths
    media_path: Path = Path(os.getenv("MEDIA_PATH", "/media"))
    config_path: Path = Path("/app/config")
    
    # Security
    internal_api_secret: str = os.getenv("INTERNAL_API_SECRET", "generate-secure-token-here")
    
    # External URLs
    core_internal_url: str = os.getenv("CORE_INTERNAL_URL", "http://stream-core:8080")
    
    # Spotify
    spotify_client_id: str = os.getenv("SPOTIFY_CLIENT_ID", "")
    spotify_client_secret: str = os.getenv("SPOTIFY_CLIENT_SECRET", "")
    
    # Job Configuration
    threads: int = 4
    
    class Config:
        case_sensitive = False

settings = Settings()
os.makedirs(settings.config_path, exist_ok=True)
