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
    downloads_path: Path = Path(os.getenv("DOWNLOADS_PATH", str(media_path / "Downloads")))
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
    daily_search_limit: int = 50
    daily_download_limit: int = 20
    

    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    log_format: str = os.getenv("LOG_FORMAT", "json")
    log_enabled: bool = os.getenv("LOG_ENABLED", "true").lower() == "true"

    class Config:
        case_sensitive = False

settings = Settings()
os.makedirs(settings.config_path, exist_ok=True)

# Load overrides
import json
config_file = settings.config_path / "downloader_config.json"
if config_file.exists():
    try:
        with open(config_file, "r") as f:
            overrides = json.load(f)
            if "threads" in overrides:
                settings.threads = overrides["threads"]
            if "downloads_path" in overrides:
                from pathlib import Path
                settings.downloads_path = Path(overrides["downloads_path"])
    except Exception as e:
        print(f"Failed to load config overrides: {e}")
